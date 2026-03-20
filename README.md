# Terminal Viewer

A VSCode extension that displays terminal output in a **copyable webview panel**. Unlike the built-in terminal, all output is rendered as selectable HTML text — perfect for copying long outputs from tools like `claude`, `python`, `npm`, etc.

## Features

- **Copyable output** — select and copy any part of the terminal output like normal text
- **ANSI color rendering** — full support for 16-color, 256-color, and RGB ANSI escape codes
- **TUI mode** — supports interactive programs (vim, htop, cursor CLI) with Chinese IME input support
- **Mirror terminal** — a real VSCode terminal runs in the background; click "Mirror" to view it
- **Color settings panel** — customize ANSI color mappings to match your theme
- **Color persistence** — your color customizations are saved across sessions

## Usage

### Open the panel

- **Command Palette**: `Terminal Viewer: Open Panel`
- **Keyboard shortcut**: `Ctrl+Shift+T Ctrl+Shift+V` (Mac: `Cmd+Shift+T Cmd+Shift+V`)

### Run commands

Type any shell command in the input box and press **Enter** to execute. Output appears in the panel as copyable text.

| Key | Action |
|-----|--------|
| `Enter` | Execute command |
| `Shift+Enter` | Insert newline |
| `↑` / `↓` | Navigate command history |
| `Ctrl+C` | Interrupt running command |

### TUI mode

For interactive programs (vim, htop, cursor CLI, etc.), the extension automatically detects TUI mode. You can also toggle it manually with the **⌨ TUI 模式** button.

In TUI mode:
- When the input box **has focus**: type normally (supports Chinese IME), press Enter to send
- When the input box **loses focus**: keyboard input is forwarded directly to the PTY character by character

### Color settings (🎨 颜色)

Click the **🎨 颜色** button in the toolbar to open the color settings panel.

#### ANSI 16色 & 主题变量

Shows the 16 standard ANSI colors plus foreground/background variables. By default these read from your current VSCode theme. You can override any color with the color picker — changes take effect immediately and are saved automatically.

#### 从 Terminal 读取

Scans the current terminal output for **256-color and RGB colors** that are not already in the ANSI 16-color table, and adds them as new entries in the panel. This lets you see and customize any color that appears in your output.

#### ↺ 重置

Clears all custom color overrides and removes extra colors added via "从 Terminal 读取". Reverts to the current VSCode theme colors.

## Architecture

```
User input
    │
    ▼
node-pty (PTY process)
    │  raw ANSI bytes
    ▼
xterm-headless + SerializeAddon
    │  serialized ANSI text
    ▼
ansi.js (ansiToHtml)
    │  HTML with CSS classes
    ▼
CSS variables (--vscode-terminal-ansi*)
    │  resolved by browser
    ▼
Rendered colored text in webview
```

### Color rendering paths

**16 standard ANSI colors** (SGR 30–37, 90–97):
- Rendered as `<span class="a2">` etc.
- CSS: `.a2 { color: var(--vscode-terminal-ansiGreen) }`
- VSCode injects theme values into `body` inline style

**256-color** (SGR 38;5;N):
- Rendered as `<span style="color: rgb(...)">` inline
- Uses the xterm-256color palette

**RGB truecolor** (SGR 38;2;R;G;B):
- Rendered as `<span style="color: rgb(R,G,B)">` inline

## Requirements

- VSCode 1.85+
- Node.js (for `node-pty` native module)

## Extension Settings

Color overrides are stored in VSCode's `globalState` under the key `terminal-viewer-colors` and persist across sessions.

## Known Limitations

- TUI programs that require precise terminal dimensions (e.g., full-screen editors) may have layout issues depending on the panel size
- The "Mirror" terminal shows raw ANSI output; the webview panel shows the rendered version
