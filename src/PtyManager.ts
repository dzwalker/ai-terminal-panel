import * as pty from 'node-pty';
import * as os from 'os';
import { EventEmitter } from 'events';

export interface PtySession {
    id: string;
    command: string;
    ptyProcess: pty.IPty;
    createdAt: Date;
}

/**
 * Manages node-pty child processes.
 * A new PTY process is spawned each time the user executes a command from the Webview.
 * PTY output is forwarded to:
 *   1. VSCode Terminal (via Pseudoterminal writeEmitter)
 *   2. Webview (via onData event callback)
 */
export class PtyManager extends EventEmitter {
    private sessions: Map<string, PtySession> = new Map();
    private sessionCounter = 0;

    // Get the system's default shell
    private getDefaultShell(): string {
        if (os.platform() === 'win32') {
            return process.env.COMSPEC || 'cmd.exe';
        }
        return process.env.SHELL || '/bin/bash';
    }

    /**
     * Execute a command and return the session id.
     */
    execute(command: string, cwd: string, cols = 120, rows = 40): string {
        const sessionId = `session-${++this.sessionCounter}-${Date.now()}`;
        const shell = this.getDefaultShell();

        // Use shell -c to support pipes, env vars, etc.
        const shellArgs = os.platform() === 'win32'
            ? ['/c', command]
            : ['-c', command];

        const ptyProcess = pty.spawn(shell, shellArgs, {
            name: 'xterm-256color',
            cols,
            rows,
            cwd,
            env: process.env as { [key: string]: string },
        });

        const session: PtySession = {
            id: sessionId,
            command,
            ptyProcess,
            createdAt: new Date(),
        };

        this.sessions.set(sessionId, session);

        // Forward PTY output to all listeners
        ptyProcess.onData((data: string) => {
            this.emit('data', sessionId, data);
        });

        // Handle process exit
        ptyProcess.onExit(({ exitCode, signal }) => {
            this.emit('exit', sessionId, exitCode, signal);
            this.sessions.delete(sessionId);
        });

        return sessionId;
    }

    /**
     * Send input to a running session (e.g. Ctrl+C).
     */
    write(sessionId: string, data: string): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.ptyProcess.write(data);
        }
    }

    /**
     * Kill a session.
     */
    kill(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.ptyProcess.kill();
            this.sessions.delete(sessionId);
        }
    }

    /**
     * Resize the PTY.
     */
    resize(sessionId: string, cols: number, rows: number): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.ptyProcess.resize(cols, rows);
        }
    }

    /**
     * Kill all sessions.
     */
    disposeAll(): void {
        for (const [id] of this.sessions) {
            this.kill(id);
        }
    }

    isRunning(sessionId: string): boolean {
        return this.sessions.has(sessionId);
    }
}
