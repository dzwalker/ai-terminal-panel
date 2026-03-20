import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PtyManager } from './PtyManager';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Terminal: XTermHeadless } = require('@xterm/headless');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { SerializeAddon } = require('@xterm/addon-serialize');

const DEFAULT_COLS = 120;
const DEFAULT_ROWS = 40;

interface ViewerSettings {
    lang: string;
    cols: number;
    rows: number;
    tuiWhitelist: string[];
}

const DEFAULT_SETTINGS: ViewerSettings = {
    lang: 'zh',
    cols: DEFAULT_COLS,
    rows: DEFAULT_ROWS,
    tuiWhitelist: ['claude', 'codex', 'agent', 'htop', 'top', 'vim', 'vi', 'nano', 'less', 'man', 'cursor'],
};

const TUI_ENTER_RE = /\x1b\[\?(?:1049|47|1047)h/;
const TUI_EXIT_RE  = /\x1b\[\?(?:1049|47|1047)l/;

/**
 * TerminalPanel
 *
 * Data flow:
 *   Webview textfield -> extension 'execute' message
 *     -> PtyManager (node-pty) spawns a PTY subprocess
 *     -> PTY output -> xterm-headless state machine
 *     -> SerializeAddon.serialize() exports current screen snapshot (with ANSI colors)
 *     -> postMessage 'snapshot' to Webview (full replace, no append)
 *     -> simultaneously mirrored to a VSCode Terminal (Pseudoterminal)
 */
export class TerminalPanel {
    private static _instances: Set<TerminalPanel> = new Set();
    private static _counter = 0;
    private static readonly viewType = 'aiTerminalPanel';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _ptyManager: PtyManager;
    private readonly _extensionPath: string;
    private readonly _context: vscode.ExtensionContext;
    private _disposables: vscode.Disposable[] = [];

    private _currentSessionId: string | undefined;
    private _vscodeTerminal: vscode.Terminal | undefined;
    private _writeEmitter: vscode.EventEmitter<string> | undefined;
    private _cwd: string;

    private _xterm: ReturnType<typeof XTermHeadless> | undefined;
    private _serializeAddon: ReturnType<typeof SerializeAddon> | undefined;
    private _snapshotTimer: ReturnType<typeof setTimeout> | undefined;
    private _tuiMode = false;
    private _pwdMarker: string | undefined;
    private _capturedCwd: string | undefined;

    private _settings: ViewerSettings;

    private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
        this._panel = panel;
        this._ptyManager = new PtyManager();
        this._extensionPath = context.extensionPath;
        this._context = context;
        this._cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
            || process.env.HOME
            || '/';

        this._settings = {
            ...DEFAULT_SETTINGS,
            ...this._context.globalState.get<Partial<ViewerSettings>>('ai-terminal-panel-settings'),
        };

        this._panel.webview.html = this._buildHtml();

        this._panel.webview.onDidReceiveMessage(
            (msg) => this._handleMessage(msg),
            null,
            this._disposables
        );

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._createMirrorTerminal();

        // Delay to ensure webview JS has initialized before restoring persisted settings
        setTimeout(() => {
            const savedColors = this._context.globalState.get<Record<string, string>>('ai-terminal-panel-colors', {});
            if (Object.keys(savedColors).length > 0) {
                this._panel.webview.postMessage({ type: 'loadColors', overrides: savedColors });
            }
            this._panel.webview.postMessage({ type: 'loadSettings', settings: this._settings });
        }, 300);

        this._ptyManager.on('data', (sessionId: string, data: string) => {
            if (sessionId !== this._currentSessionId) return;

            if (this._pwdMarker && data.includes(this._pwdMarker)) {
                const markerIdx = data.indexOf(this._pwdMarker);
                const afterMarker = data.substring(markerIdx + this._pwdMarker.length);
                const newlineIdx = afterMarker.indexOf('\n');
                const cwdLine = (newlineIdx >= 0 ? afterMarker.substring(0, newlineIdx) : afterMarker).trim();
                if (cwdLine && fs.existsSync(cwdLine)) {
                    this._capturedCwd = cwdLine;
                }
                const markerLineStart = data.lastIndexOf('\n', markerIdx);
                const markerLineEnd = data.indexOf('\n', markerIdx);
                data = data.substring(0, markerLineStart >= 0 ? markerLineStart : markerIdx)
                     + (markerLineEnd >= 0 ? data.substring(markerLineEnd + 1) : '');
            }

            this._writeEmitter?.fire(data);

            if (!this._tuiMode && TUI_ENTER_RE.test(data)) {
                this._tuiMode = true;
                this._createXterm(this._settings.cols, this._settings.rows);
                this._panel.webview.postMessage({ type: 'tuiDetected' });
            } else if (this._tuiMode && TUI_EXIT_RE.test(data)) {
                this._tuiMode = false;
                this._createXterm(this._settings.cols, 200);
                this._panel.webview.postMessage({ type: 'tuiExited' });
            }

            if (this._xterm) {
                this._xterm.write(data, () => {
                    this._scheduleSnapshot();
                });
            }
        });

        this._ptyManager.on('exit', (sessionId: string, exitCode: number) => {
            if (sessionId !== this._currentSessionId) return;
            this._currentSessionId = undefined;
            this._pwdMarker = undefined;

            if (this._capturedCwd) {
                this._cwd = this._capturedCwd;
                this._capturedCwd = undefined;
            }

            const sendExit = () => {
                this._flushSnapshot();
                this._panel.webview.postMessage({ type: 'exit', exitCode, cwd: this._cwd });
            };

            // Flush with an empty write to ensure all pending data is rendered before sending exit
            if (this._xterm) {
                this._xterm.write('', () => sendExit());
            } else {
                sendExit();
            }
        });
    }

    /**
     * Create a new viewer panel. Each call opens a separate window
     * with its own PTY process and mirror terminal.
     */
    public static create(context: vscode.ExtensionContext): TerminalPanel {
        const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;
        TerminalPanel._counter++;
        const label = TerminalPanel._counter === 1
            ? 'AI Terminal Panel'
            : `AI Terminal Panel #${TerminalPanel._counter}`;

        const panel = vscode.window.createWebviewPanel(
            TerminalPanel.viewType,
            label,
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [],
            }
        );

        const instance = new TerminalPanel(panel, context);
        TerminalPanel._instances.add(instance);
        return instance;
    }

    public static disposeAll(): void {
        for (const inst of TerminalPanel._instances) {
            inst.dispose();
        }
    }

    private _createXterm(cols = this._settings.cols, rows = 200): void {
        this._xterm = new XTermHeadless({
            cols,
            rows,
            allowProposedApi: true,
            scrollback: 5000,
        });
        this._serializeAddon = new SerializeAddon();
        this._xterm.loadAddon(this._serializeAddon);
    }

    private _scheduleSnapshot(): void {
        if (this._snapshotTimer) clearTimeout(this._snapshotTimer);
        this._snapshotTimer = setTimeout(() => {
            this._flushSnapshot();
        }, 30); // ~30ms debounce
    }

    private _flushSnapshot(): void {
        if (this._snapshotTimer) {
            clearTimeout(this._snapshotTimer);
            this._snapshotTimer = undefined;
        }
        if (!this._xterm || !this._serializeAddon) return;

        // Export current screen content (with ANSI color sequences)
        const snapshot = this._serializeAddon.serialize();
        this._panel.webview.postMessage({ type: 'snapshot', data: snapshot });
    }

    private _createMirrorTerminal(): void {
        this._writeEmitter = new vscode.EventEmitter<string>();

        const pty: vscode.Pseudoterminal = {
            onDidWrite: this._writeEmitter.event,
            open: () => {
                this._writeEmitter?.fire('\x1b[1;32mAI Terminal Panel Mirror\x1b[0m\r\n');
                this._writeEmitter?.fire('\x1b[90mInput happens in the Webview panel; this is the output mirror\x1b[0m\r\n\r\n');
            },
            close: () => {},
            handleInput: (data: string) => {
                if (this._currentSessionId) {
                    this._ptyManager.write(this._currentSessionId, data);
                }
            },
        };

        this._vscodeTerminal = vscode.window.createTerminal({
            name: `📺 ${this._panel.title}`,
            pty,
        });
    }

    private _handleMessage(msg: { type: string; [key: string]: unknown }): void {
        switch (msg.type) {
            case 'execute': {
                const command = (msg.command as string)?.trim();
                if (!command) return;

                if (this._handleCdCommand(command)) return;

                if (this._currentSessionId) {
                    this._ptyManager.kill(this._currentSessionId);
                    this._currentSessionId = undefined;
                }

                this._createXterm();

                this._writeEmitter?.fire(`\r\n\x1b[1;33m$ ${command}\x1b[0m\r\n`);

                const isTui = this._shouldAutoTui(command);
                let execCommand = command;
                if (!isTui) {
                    const pwdMarker = `__AIPANEL_CWD_${Date.now()}__`;
                    execCommand = `${command}; __aipanel_ec=$?; echo "${pwdMarker}$(pwd)"; exit $__aipanel_ec`;
                    this._pwdMarker = pwdMarker;
                } else {
                    this._pwdMarker = undefined;
                }

                this._currentSessionId = this._ptyManager.execute(
                    execCommand, this._cwd, this._settings.cols, this._settings.rows
                );

                this._panel.webview.postMessage({
                    type: 'started',
                    command,
                    sessionId: this._currentSessionId,
                });

                if (isTui) {
                    this._tuiMode = true;
                    this._createXterm(this._settings.cols, this._settings.rows);
                    this._panel.webview.postMessage({ type: 'tuiDetected' });
                }
                break;
            }
            case 'interrupt': {
                if (this._currentSessionId) {
                    this._ptyManager.write(this._currentSessionId, '\x03');
                }
                break;
            }
            case 'input': {
                if (this._currentSessionId) {
                    this._ptyManager.write(this._currentSessionId, msg.data as string);
                }
                break;
            }
            case 'setCwd': {
                this._cwd = msg.cwd as string;
                break;
            }
            case 'showTerminal': {
                this._vscodeTerminal?.show();
                break;
            }
            case 'saveColors': {
                const overrides = msg.overrides as Record<string, string>;
                this._context.globalState.update('ai-terminal-panel-colors', overrides);
                break;
            }
            case 'saveSettings': {
                const settings = msg.settings as ViewerSettings;
                this._settings = { ...DEFAULT_SETTINGS, ...settings };
                this._context.globalState.update('ai-terminal-panel-settings', this._settings);
                break;
            }
        }
    }

    /**
     * Handle pure `cd` commands without spawning a PTY process.
     * Returns true if the command was handled, false otherwise.
     */
    private _handleCdCommand(command: string): boolean {
        const cdMatch = command.match(/^\s*cd\s*(.*?)\s*$/);
        if (!cdMatch) return false;

        let target = cdMatch[1];

        if (!target || target === '~') {
            target = os.homedir();
        } else if (target === '-') {
            return false;
        } else if (target.startsWith('~/')) {
            target = path.join(os.homedir(), target.slice(2));
        } else if (!path.isAbsolute(target)) {
            target = path.resolve(this._cwd, target);
        }

        target = path.resolve(target);

        try {
            const stat = fs.statSync(target);
            if (!stat.isDirectory()) {
                this._panel.webview.postMessage({
                    type: 'cdResult',
                    success: false,
                    error: `cd: not a directory: ${cdMatch[1] || '~'}`,
                });
                return true;
            }
        } catch {
            this._panel.webview.postMessage({
                type: 'cdResult',
                success: false,
                error: `cd: no such file or directory: ${cdMatch[1] || '~'}`,
            });
            return true;
        }

        this._cwd = target;
        this._panel.webview.postMessage({
            type: 'cdResult',
            success: true,
            cwd: this._cwd,
        });
        return true;
    }

    private _shouldAutoTui(command: string): boolean {
        const words = command.split(/[\s|;&]+/).map(w => {
            const base = w.split('/').pop() || w;
            return base.toLowerCase();
        });
        return this._settings.tuiWhitelist.some(
            prog => words.includes(prog.toLowerCase())
        );
    }

    public dispose(): void {
        TerminalPanel._instances.delete(this);
        if (this._snapshotTimer) clearTimeout(this._snapshotTimer);
        this._ptyManager.disposeAll();
        this._vscodeTerminal?.dispose();
        this._writeEmitter?.dispose();
        this._panel.dispose();
        while (this._disposables.length) {
            this._disposables.pop()?.dispose();
        }
    }

    private _readWebviewFile(filename: string): string {
        const filePath = path.join(this._extensionPath, 'src', 'webview', filename);
        try {
            return fs.readFileSync(filePath, 'utf8');
        } catch {
            return `/* could not load ${filename} */`;
        }
    }

    private _buildHtml(): string {
        const ansiJs = this._readWebviewFile('ansi.js');
        const mainJs = this._readWebviewFile('main.js');

        const css = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
    font-family: var(--vscode-font-family, 'Segoe UI', sans-serif);
    background: var(--vscode-editor-background);
    color: var(--vscode-editor-foreground);
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
.toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: var(--vscode-editorGroupHeader-tabsBackground);
    border-bottom: 1px solid var(--vscode-panel-border);
    flex-shrink: 0;
}
.toolbar-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--vscode-foreground);
    opacity: 0.8;
    margin-right: auto;
}
.btn {
    padding: 3px 10px;
    font-size: 11px;
    border: 1px solid var(--vscode-button-border, transparent);
    border-radius: 3px;
    cursor: pointer;
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
}
.btn:hover { background: var(--vscode-button-secondaryHoverBackground); }
.btn-danger {
    background: var(--vscode-inputValidation-errorBackground);
    color: var(--vscode-inputValidation-errorForeground, var(--vscode-errorForeground));
    border-color: var(--vscode-inputValidation-errorBorder);
}
.btn-danger:hover { opacity: 0.85; }
.output-container {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    font-family: var(--vscode-editor-font-family, 'Cascadia Code', 'Consolas', monospace);
    font-size: var(--vscode-editor-font-size, 13px);
    line-height: 1.5;
    background: var(--vscode-editor-background);
    color: var(--vscode-editor-foreground);
}
.output-container::-webkit-scrollbar { width: 8px; }
.output-container::-webkit-scrollbar-track { background: transparent; }
.output-container::-webkit-scrollbar-thumb {
    background: var(--vscode-scrollbarSlider-background);
    border-radius: 4px;
}
.output-container::-webkit-scrollbar-thumb:hover {
    background: var(--vscode-scrollbarSlider-hoverBackground);
}
.message-block {
    margin-bottom: 16px;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid var(--vscode-panel-border);
}
.message-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    font-size: 11px;
    background: var(--vscode-editorGroupHeader-tabsBackground);
    color: var(--vscode-descriptionForeground);
    border-bottom: 1px solid var(--vscode-panel-border);
}
.prompt { color: var(--vscode-terminal-ansiGreen); font-weight: bold; }
.cmd-text { font-family: monospace; color: var(--vscode-terminal-ansiYellow); font-weight: 600; }
.timestamp { margin-left: auto; font-size: 10px; opacity: 0.6; }
.message-output {
    padding: 10px 12px;
    white-space: pre-wrap;
    word-break: break-all;
    background: var(--vscode-editor-background);
    color: var(--vscode-editor-foreground);
    min-height: 20px;
    user-select: text;
    -webkit-user-select: text;
}
.message-output.running::after {
    content: '\u258b';
    animation: blink 1s step-end infinite;
    color: var(--vscode-editor-foreground);
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
.message-footer {
    padding: 4px 10px;
    font-size: 10px;
    background: var(--vscode-editorGroupHeader-tabsBackground);
    color: var(--vscode-descriptionForeground);
}
.message-footer.success { color: var(--vscode-terminal-ansiGreen); }
.message-footer.error { color: var(--vscode-terminal-ansiRed); }
.welcome { padding: 32px 24px; text-align: center; color: var(--vscode-descriptionForeground); }
.welcome h2 { font-size: 18px; margin-bottom: 12px; color: var(--vscode-foreground); }
.welcome p { font-size: 12px; line-height: 2; }
.welcome code {
    background: var(--vscode-textCodeBlock-background);
    padding: 1px 6px;
    border-radius: 3px;
    font-family: monospace;
    color: var(--vscode-terminal-ansiCyan);
}
.welcome kbd {
    background: var(--vscode-keybindingLabel-background);
    border: 1px solid var(--vscode-keybindingLabel-border);
    border-radius: 3px;
    padding: 1px 5px;
    font-size: 11px;
    font-family: monospace;
}
.input-area {
    flex-shrink: 0;
    padding: 10px 12px;
    background: var(--vscode-editorGroupHeader-tabsBackground);
    border-top: 1px solid var(--vscode-panel-border);
}
.input-row { display: flex; gap: 8px; align-items: flex-end; }
.cwd-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
}
.cwd-input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--vscode-terminal-ansiCyan, var(--vscode-foreground));
    font-family: monospace;
    font-size: 11px;
    outline: none;
}
.command-input {
    flex: 1;
    background: var(--vscode-input-background);
    border: 1px solid var(--vscode-input-border);
    color: var(--vscode-input-foreground);
    padding: 8px 10px;
    font-family: var(--vscode-editor-font-family, monospace);
    font-size: 13px;
    border-radius: 4px;
    outline: none;
    resize: none;
    min-height: 38px;
    max-height: 120px;
    line-height: 1.4;
}
.command-input:focus { border-color: var(--vscode-focusBorder); }
.command-input::placeholder { color: var(--vscode-input-placeholderForeground); }
.send-btn {
    padding: 0 18px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: 1px solid var(--vscode-button-border, transparent);
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    align-self: flex-end;
    height: 38px;
}
.send-btn:hover { background: var(--vscode-button-hoverBackground); }
.send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.status-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 3px 12px;
    font-size: 11px;
    background: var(--vscode-statusBar-background);
    color: var(--vscode-statusBar-foreground);
    flex-shrink: 0;
}
.status-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--vscode-terminal-ansiGreen, var(--vscode-statusBar-foreground));
    flex-shrink: 0;
}
.status-dot.running {
    background: var(--vscode-terminal-ansiYellow, var(--vscode-statusBar-foreground));
    animation: pulse 1s ease-in-out infinite;
}
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
.auto-scroll-btn {
    margin-left: auto;
    background: transparent;
    border: none;
    color: inherit;
    cursor: pointer;
    font-size: 11px;
    opacity: 0.8;
    padding: 0;
}
.auto-scroll-btn:hover { opacity: 1; }
/* ANSI color classes — using VSCode terminal theme variables */
/* Standard colors 0-7 */
.a0{color:var(--vscode-terminal-ansiBlack,#000000)}
.a1{color:var(--vscode-terminal-ansiRed)}
.a2{color:var(--vscode-terminal-ansiGreen)}
.a3{color:var(--vscode-terminal-ansiYellow)}
.a4{color:var(--vscode-terminal-ansiBlue)}
.a5{color:var(--vscode-terminal-ansiMagenta)}
.a6{color:var(--vscode-terminal-ansiCyan)}
.a7{color:var(--vscode-terminal-ansiWhite)}
/* Bright colors 8-15 */
.a8{color:var(--vscode-terminal-ansiBrightBlack)}
.a9{color:var(--vscode-terminal-ansiBrightRed)}
.a10{color:var(--vscode-terminal-ansiBrightGreen)}
.a11{color:var(--vscode-terminal-ansiBrightYellow)}
.a12{color:var(--vscode-terminal-ansiBrightBlue)}
.a13{color:var(--vscode-terminal-ansiBrightMagenta)}
.a14{color:var(--vscode-terminal-ansiBrightCyan)}
.a15{color:var(--vscode-terminal-ansiBrightWhite)}
.ab{font-weight:bold}
/* dim (SGR 2): use ansiBrightBlack color instead of opacity to stay visible on dark backgrounds */
.ad{color:var(--vscode-terminal-ansiBrightBlack,#888888)}
.ai{font-style:italic}.au{text-decoration:underline}
/* Background colors 0-7 */
.abg0{background:var(--vscode-terminal-ansiBlack,#000000)}
.abg1{background:var(--vscode-terminal-ansiRed)}
.abg2{background:var(--vscode-terminal-ansiGreen)}
.abg3{background:var(--vscode-terminal-ansiYellow)}
.abg4{background:var(--vscode-terminal-ansiBlue)}
.abg5{background:var(--vscode-terminal-ansiMagenta)}
.abg6{background:var(--vscode-terminal-ansiCyan)}
.abg7{background:var(--vscode-terminal-ansiWhite)}
/* Background colors 8-15 */
.abg8{background:var(--vscode-terminal-ansiBrightBlack)}
.abg9{background:var(--vscode-terminal-ansiBrightRed)}
.abg10{background:var(--vscode-terminal-ansiBrightGreen)}
.abg11{background:var(--vscode-terminal-ansiBrightYellow)}
.abg12{background:var(--vscode-terminal-ansiBrightBlue)}
.abg13{background:var(--vscode-terminal-ansiBrightMagenta)}
.abg14{background:var(--vscode-terminal-ansiBrightCyan)}
.abg15{background:var(--vscode-terminal-ansiBrightWhite)}
/* TUI mode */
.tui-overlay {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 100;
    pointer-events: none;
}
.tui-status-bar {
    display: none;
    padding: 4px 12px;
    background: var(--vscode-editorGroupHeader-tabsBackground);
    border-top: 2px solid var(--vscode-terminal-ansiYellow, var(--vscode-focusBorder));
    align-items: center;
    gap: 10px;
    font-size: 11px;
    color: var(--vscode-terminal-ansiYellow, var(--vscode-foreground));
}
.tui-status-bar.active { display: flex; }
.tui-hint { flex: 1; opacity: 0.9; }
.command-input.tui-active {
    border-color: var(--vscode-terminal-ansiYellow, var(--vscode-focusBorder)) !important;
}
/* Color settings panel */
#colorSettingsPanel {
    display: none;
    flex-direction: column;
    position: fixed;
    top: 0; right: 0;
    width: 360px;
    height: 100vh;
    background: var(--vscode-sideBar-background, var(--vscode-editor-background));
    border-left: 1px solid var(--vscode-panel-border);
    z-index: 200;
    box-shadow: -4px 0 16px rgba(0,0,0,0.3);
    overflow: hidden;
}
.color-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--vscode-editorGroupHeader-tabsBackground);
    border-bottom: 1px solid var(--vscode-panel-border);
    flex-shrink: 0;
    gap: 6px;
}
.color-panel-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--vscode-foreground);
    white-space: nowrap;
}
.color-panel-desc {
    padding: 6px 12px;
    font-size: 11px;
    color: var(--vscode-descriptionForeground);
    border-bottom: 1px solid var(--vscode-panel-border);
    flex-shrink: 0;
    line-height: 1.5;
}
.color-panel-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
}
.color-panel-list::-webkit-scrollbar { width: 6px; }
.color-panel-list::-webkit-scrollbar-thumb {
    background: var(--vscode-scrollbarSlider-background);
    border-radius: 3px;
}
.color-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 12px;
    font-size: 11px;
}
.color-row:hover { background: var(--vscode-list-hoverBackground); }
.color-row.color-row-active {
    background: var(--vscode-editor-selectionBackground, rgba(0, 122, 204, 0.2));
    box-shadow: inset 3px 0 0 var(--vscode-focusBorder, #007acc);
}
.color-row.color-row-active .color-label {
    color: var(--vscode-list-activeSelectionForeground, var(--vscode-foreground));
    font-weight: 600;
}
.color-preview {
    width: 18px; height: 18px;
    border-radius: 3px;
    border: 1px solid var(--vscode-panel-border);
    flex-shrink: 0;
    display: inline-block;
}
.color-label {
    flex: 1;
    color: var(--vscode-foreground);
    font-family: monospace;
    font-size: 11px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.color-picker {
    width: 32px; height: 22px;
    border: 1px solid var(--vscode-input-border);
    border-radius: 3px;
    padding: 1px;
    cursor: pointer;
    background: var(--vscode-input-background);
    flex-shrink: 0;
}
.color-value {
    font-family: monospace;
    font-size: 10px;
    color: var(--vscode-descriptionForeground);
    width: 56px;
    flex-shrink: 0;
    text-align: right;
}
/* Settings panel */
#settingsPanel {
    display: none;
    flex-direction: column;
    position: fixed;
    top: 0; right: 0;
    width: 360px;
    height: 100vh;
    background: var(--vscode-sideBar-background, var(--vscode-editor-background));
    border-left: 1px solid var(--vscode-panel-border);
    z-index: 200;
    box-shadow: -4px 0 16px rgba(0,0,0,0.3);
    overflow: hidden;
}
.settings-section {
    padding: 12px;
    border-bottom: 1px solid var(--vscode-panel-border);
}
.settings-section-title {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--vscode-descriptionForeground);
    margin-bottom: 8px;
}
.settings-row {
    display: flex;
    align-items: center;
    gap: 8px;
}
.settings-label {
    font-size: 12px;
    color: var(--vscode-foreground);
}
.settings-input {
    width: 80px;
    padding: 4px 8px;
    font-size: 12px;
    font-family: monospace;
    background: var(--vscode-input-background);
    border: 1px solid var(--vscode-input-border);
    color: var(--vscode-input-foreground);
    border-radius: 3px;
    outline: none;
}
.settings-input:focus { border-color: var(--vscode-focusBorder); }
.settings-textarea {
    width: 100%;
    min-height: 100px;
    padding: 8px;
    font-size: 12px;
    font-family: monospace;
    background: var(--vscode-input-background);
    border: 1px solid var(--vscode-input-border);
    color: var(--vscode-input-foreground);
    border-radius: 3px;
    outline: none;
    resize: vertical;
    line-height: 1.5;
}
.settings-textarea:focus { border-color: var(--vscode-focusBorder); }
.settings-hint {
    font-size: 10px;
    color: var(--vscode-descriptionForeground);
    margin-top: 4px;
    line-height: 1.4;
}
.lang-btn {
    padding: 4px 16px;
    font-size: 12px;
    border: 1px solid var(--vscode-button-border, transparent);
    border-radius: 3px;
    cursor: pointer;
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
}
.lang-btn:hover { background: var(--vscode-button-secondaryHoverBackground); }
.lang-btn.active {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
}
/* Tab completion dropdown */
.completion-dropdown {
    position: fixed;
    z-index: 300;
    background: var(--vscode-editorSuggestWidget-background, var(--vscode-editor-background));
    border: 1px solid var(--vscode-editorSuggestWidget-border, var(--vscode-panel-border));
    border-radius: 6px;
    box-shadow: 0 6px 20px rgba(0,0,0,0.4);
    overflow-y: auto;
    max-height: 240px;
    min-width: 160px;
    padding: 4px 0;
    pointer-events: auto;
}
.completion-item {
    padding: 5px 12px;
    font-size: 12px;
    font-family: var(--vscode-editor-font-family, monospace);
    cursor: pointer;
    color: var(--vscode-editorSuggestWidget-foreground, var(--vscode-editor-foreground));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
    gap: 6px;
}
.completion-item:hover { background: var(--vscode-list-hoverBackground); }
.completion-item.selected {
    background: var(--vscode-editorSuggestWidget-selectedBackground, var(--vscode-list-activeSelectionBackground));
    color: var(--vscode-list-activeSelectionForeground, var(--vscode-focusBorder));
}
.completion-prefix { color: var(--vscode-descriptionForeground); }
.completion-match { color: var(--vscode-editorSuggestWidget-foreground, var(--vscode-editor-foreground)); }
.completion-item.selected .completion-match { color: var(--vscode-list-activeSelectionForeground, var(--vscode-focusBorder)); }
.completion-hint {
    padding: 3px 12px 2px;
    font-size: 10px;
    color: var(--vscode-descriptionForeground);
    border-bottom: 1px solid var(--vscode-panel-border);
    margin-bottom: 3px;
}
`;

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<title>AI Terminal Panel</title>
<style>${css}</style>
</head>
<body>
<div class="toolbar">
    <span class="toolbar-title">&#x1F4FA; AI Terminal Panel</span>
    <button class="btn" id="mirrorBtn" title="&#x5728; VSCode Terminal &#x4E2D;&#x67E5;&#x770B;&#x955C;&#x50CF;">&#x1F5A5; Mirror</button>
    <button class="btn" id="copyBtn" title="&#x590D;&#x5236;&#x6240;&#x6709;&#x8F93;&#x51FA;">&#x1F4CB; Copy All</button>
    <button class="btn" id="clearBtn" title="&#x6E05;&#x7A7A;&#x8F93;&#x51FA;">&#x1F5D1; Clear</button>
    <button class="btn" id="tuiToggleBtn" title="&#x624B;&#x52A8;&#x5207;&#x6362; TUI &#x6A21;&#x5F0F;&#xFF08;&#x9010;&#x5B57;&#x7B26;&#x952E;&#x76D8;&#x8F93;&#x5165;&#xFF09;">&#x2328; TUI &#x6A21;&#x5F0F;</button>
    <button class="btn" id="colorSettingsBtn" title="&#x8C03;&#x6574; ANSI &#x989C;&#x8272;&#x6620;&#x5C04;">&#x1F3A8; &#x989C;&#x8272;</button>
    <button class="btn" id="settingsBtn" title="&#x7EC8;&#x7AEF;&#x8BBE;&#x7F6E;">&#x2699; &#x8BBE;&#x7F6E;</button>
    <button class="btn btn-danger" id="interruptBtn" style="display:none" title="&#x4E2D;&#x65AD; (Ctrl+C)">&#x23F9; Interrupt</button>
</div>

<div class="output-container" id="outputContainer">
    <div class="welcome" id="welcomeMsg">
        <h2>&#x1F4FA; AI Terminal Panel</h2>
        <p>
            &#x5728;&#x4E0B;&#x65B9;&#x8F93;&#x5165;&#x6846;&#x4E2D;&#x8F93;&#x5165;&#x547D;&#x4EE4;&#xFF0C;&#x8F93;&#x51FA;&#x5C06;&#x663E;&#x793A;&#x5728;&#x8FD9;&#x91CC;<br>
            &#x652F;&#x6301; <code>claude</code>&#x3001;<code>python</code>&#x3001;<code>npm</code> &#x7B49;&#x4EFB;&#x4F55;&#x547D;&#x4EE4;<br>
            &#x8F93;&#x51FA;&#x5185;&#x5BB9;&#x53EF;&#x4EE5;&#x50CF;&#x666E;&#x901A;&#x6587;&#x672C;&#x4E00;&#x6837;<strong>&#x9009;&#x62E9;&#x548C;&#x590D;&#x5236;</strong><br><br>
            <kbd>Enter</kbd> &#x53D1;&#x9001; &nbsp;&#xB7;&nbsp;
            <kbd>Shift+Enter</kbd> &#x6362;&#x884C; &nbsp;&#xB7;&nbsp;
            <kbd>Ctrl+C</kbd> &#x4E2D;&#x65AD; &nbsp;&#xB7;&nbsp;
            <kbd>&#x2191;&#x2193;</kbd> &#x5386;&#x53F2;
        </p>
    </div>
</div>

<div class="status-bar">
    <div class="status-dot" id="statusDot"></div>
    <span id="statusText">&#x5C31;&#x7EEA;</span>
    <button class="auto-scroll-btn" id="autoScrollBtn">&#x2193; &#x81EA;&#x52A8;&#x6EDA;&#x52A8;: &#x5F00;</button>
</div>

<!-- TUI mode: transparent overlay (visual indicator only, pointer-events:none) -->
<div class="tui-overlay" id="tuiOverlay"></div>

<!-- TUI mode status bar (shown above the input area) -->
<div class="tui-status-bar" id="tuiStatusBar">
    <span>&#x2328;</span>
    <span class="tui-hint">TUI &#x6A21;&#x5F0F; &#x2014; &#x8F93;&#x5165;&#x6846;&#x6709;&#x7126;&#x70B9;&#x65F6;&#x652F;&#x6301;&#x4E2D;&#x6587;&#xFF0C;Enter &#x53D1;&#x9001;&#xFF1B;&#x5931;&#x7126;&#x540E;&#x952E;&#x76D8;&#x76F4;&#x63A5;&#x8F93;&#x5165;</span>
    <button class="btn btn-danger" id="tuiExitBtn">&#x23F9; &#x9000;&#x51FA; TUI</button>
</div>

<!-- Command input area (shared between normal and TUI modes) -->
<div class="input-area" id="normalInputArea">
    <div class="cwd-row">
        <span>&#x1F4C1;</span>
        <input type="text" class="cwd-input" id="cwdInput" value="${this._cwd.replace(/"/g, '&quot;')}" placeholder="/path/to/dir" />
    </div>
    <div class="input-row">
        <textarea
            class="command-input"
            id="commandInput"
            placeholder="&#x8F93;&#x5165;&#x547D;&#x4EE4;&#xFF0C;Enter &#x6267;&#x884C;&#xFF0C;Shift+Enter &#x6362;&#x884C;"
            rows="1"
        ></textarea>
        <button class="send-btn" id="sendBtn">&#x53D1;&#x9001;</button>
    </div>
</div>

<!-- Color settings side panel -->
<div id="colorSettingsPanel"></div>
<!-- Settings side panel -->
<div id="settingsPanel"></div>

<script>
${ansiJs}
${mainJs}
</script>
</body>
</html>`;
    }
}
