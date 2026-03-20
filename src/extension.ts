import * as vscode from 'vscode';
import { TerminalPanel } from './TerminalPanel';

export function activate(context: vscode.ExtensionContext) {
    console.log('AI Terminal Panel extension activated');

    const openCmd = vscode.commands.registerCommand('aiTerminalPanel.open', () => {
        TerminalPanel.create(context);
    });

    const attachCmd = vscode.commands.registerCommand('aiTerminalPanel.attachToTerminal', () => {
        TerminalPanel.create(context);
    });

    context.subscriptions.push(openCmd, attachCmd);
}

export function deactivate() {
    TerminalPanel.disposeAll();
}
