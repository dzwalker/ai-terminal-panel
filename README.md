# AI Terminal Panel

A VSCode extension that displays terminal output in a **readable, copyable editor panel**. Optimized for AI CLI tools like Claude Code, Cursor CLI, and other streaming TUI programs.

Unlike the built-in terminal, all output is rendered as selectable HTML text — perfect for reading and copying long outputs.

## Features

- **Copyable output** — select and copy any part of the terminal output like normal text (`Ctrl+C` / `Cmd+C`)
- **ANSI color rendering** — full support for 16-color, 256-color, and RGB ANSI escape codes
- **TUI mode** — auto-detects interactive programs (claude, codex, cursor, vim, htop) and switches to per-character input
- **Command completion** — screen-token-based autocomplete (Tab to accept, ↑↓ to navigate, Esc to dismiss)
- **Interactive input** — send input to running processes (SSH, REPL, etc.) even after TUI mode exits
- **Multiple panels** — open multiple viewer windows, each with its own terminal process
- **Mirror terminal** — a real VSCode terminal runs in the background; click "Mirror" to view it
- **Color settings** — customize ANSI color mappings; changes persist across sessions
- **i18n** — English and Chinese UI

## Usage

### Open a panel

- **Command Palette**: `AI Terminal Panel: Open`
- **Keyboard shortcut**: `Ctrl+Shift+T Ctrl+Shift+V` (Mac: `Cmd+Shift+T Cmd+Shift+V`)

Run the command again to open additional panels.

### Run commands

Type any shell command in the input box and press **Enter** to execute. Output appears in the panel as copyable text.

| Key | Action |
|-----|--------|
| `Enter` | Execute command (or send input to running process) |
| `Shift+Enter` | Insert newline |
| `↑` / `↓` | Navigate command history (or completion list) |
| `Tab` | Accept completion suggestion |
| `Escape` | Dismiss completion |
| `Ctrl+C` / `Cmd+C` | Copy selected text, or interrupt if nothing selected |
| `Ctrl+V` / `Cmd+V` | Paste |

### TUI mode

For interactive programs (claude, codex, cursor, vim, htop, etc.), the extension automatically detects TUI mode when the program enters alternate screen buffer. You can also toggle it manually with the **⌨ TUI** button.

In TUI mode:
- When the input box **has focus**: type normally (supports CJK IME), press Enter to send
- When the input box **loses focus**: keyboard input is forwarded directly to the PTY character by character

### Color settings (🎨 Colors)

Click the **🎨 Colors** button in the toolbar to open the color settings panel.

- **ANSI 16 Colors & Theme Variables** — shows the 16 standard ANSI colors plus foreground/background. By default these read from your VSCode theme. Override any color with the picker; changes apply immediately and persist.
- **⟳ Sync Terminal** — scans the current output for 256-color and RGB colors not in the ANSI 16-color table, and adds them as new editable entries.
- **↺ Reset** — clears all custom overrides and reverts to the VSCode theme defaults.

### Settings (⚙ Settings)

- **Language** — switch between English and Chinese
- **Terminal Size** — configure columns and rows (applies to next command)
- **TUI Whitelist** — commands that auto-enter TUI mode (one per line)

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

## Requirements

- VSCode 1.85+ (or Cursor / VSCodium)
- Node.js (for `node-pty` native module)

## Install

**Cursor / VSCodium**: search "AI Terminal Panel" in the extension marketplace (Open VSX).

**VSCode**: download the `.vsix` from [GitHub Releases](https://github.com/dzwalker/ai-terminal-panel/releases), then install via `Extensions → ... → Install from VSIX`.

## Known Limitations

- TUI programs that require precise terminal dimensions may have layout issues depending on the panel size
- The "Mirror" terminal shows raw ANSI output; the webview panel shows the rendered version

## License

MIT
