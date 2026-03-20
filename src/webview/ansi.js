/**
 * ANSI escape code → HTML converter
 * Handles: 16 colors, 256 colors, RGB, bold/italic/underline/dim
 * Also handles cursor control sequences used by streaming CLIs (like claude)
 */

function processControlSequences(text) {
    // Normalize line endings
    text = text.replace(/\r\n/g, '\n');

    // Handle \r (carriage return without newline) - overwrite current line
    const lines = text.split('\n');
    const processedLines = lines.map(function(line) {
        const parts = line.split('\r');
        if (parts.length === 1) return line;
        let result = '';
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (part.length >= result.length) {
                result = part;
            } else {
                result = part + result.slice(part.length);
            }
        }
        return result;
    });
    text = processedLines.join('\n');

    // Remove cursor movement sequences: ESC[nA/B/C/D (up/down/right/left)
    text = text.replace(/\x1b\[\d*[ABCD]/g, '');

    // Remove ESC[K (erase to end of line)
    text = text.replace(/\x1b\[\d*K/g, '');

    // Remove ESC[J (erase display)
    text = text.replace(/\x1b\[\d*J/g, '');

    // Remove ESC[H / ESC[f (cursor position)
    text = text.replace(/\x1b\[\d*;\d*[Hf]/g, '');
    text = text.replace(/\x1b\[\d*[Hf]/g, '');

    // Remove ESC[s / ESC[u (save/restore cursor)
    text = text.replace(/\x1b\[[su]/g, '');

    // Remove ESC[?25h/l (show/hide cursor)
    text = text.replace(/\x1b\[\?25[hl]/g, '');

    // Remove ESC[?1049h/l (alternate screen buffer)
    text = text.replace(/\x1b\[\?\d+[hl]/g, '');

    // Remove ESC= / ESC> (keypad mode)
    text = text.replace(/\x1b[=>]/g, '');

    // Remove ESC(B etc (character set)
    text = text.replace(/\x1b\([A-Z0-9]/g, '');

    // Remove ESC]...BEL or ESC]...ST (OSC sequences - window title etc)
    text = text.replace(/\x1b\][^\x07\x1b]*(\x07|\x1b\\)/g, '');

    // Trim trailing blank/whitespace-only lines to at most 2
    text = text.replace(/(\n[ \t]*){3,}$/, '\n\n');

    return text;
}

// 256-color palette (xterm-256color)
var ANSI_256 = (function() {
    var palette = [];
    // 0-15: standard colors (handled by CSS variables; approximate values used as fallback)
    var base16 = [
        '#000000','#800000','#008000','#808000','#000080','#800080','#008080','#c0c0c0',
        '#808080','#ff0000','#00ff00','#ffff00','#0000ff','#ff00ff','#00ffff','#ffffff'
    ];
    for (var i = 0; i < 16; i++) palette.push(base16[i]);
    // 16-231: 6x6x6 color cube
    for (var r = 0; r < 6; r++) {
        for (var g = 0; g < 6; g++) {
            for (var b = 0; b < 6; b++) {
                var rv = r ? r * 40 + 55 : 0;
                var gv = g ? g * 40 + 55 : 0;
                var bv = b ? b * 40 + 55 : 0;
                palette.push('rgb(' + rv + ',' + gv + ',' + bv + ')');
            }
        }
    }
    // 232-255: grayscale ramp
    for (var k = 0; k < 24; k++) {
        var v = k * 10 + 8;
        palette.push('rgb(' + v + ',' + v + ',' + v + ')');
    }
    return palette;
})();

function convertAnsiColors(text) {
    const result = [];
    const parts = text.split(/(\x1b\[[0-9;]*m)/);
    let currentStyles = [];

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part.match(/^\x1b\[[0-9;]*m$/)) {
            // This is an ANSI SGR sequence
            const codes = part.slice(2, -1).split(';').map(Number);
            currentStyles = updateStyles(currentStyles, codes);
        } else if (part.length > 0) {
            // Regular text
            const escaped = escHtml(part);
            if (currentStyles.length > 0) {
                // Separate CSS classes from inline styles
                const classes = [];
                const inlineStyles = [];
                for (const s of currentStyles) {
                    if (s.startsWith('argb_')) {
                        // RGB foreground: argb_R_G_B
                        const parts2 = s.slice(5).split('_');
                        inlineStyles.push('color:rgb(' + parts2.join(',') + ')');
                    } else if (s.startsWith('abgrgb_')) {
                        // RGB background: abgrgb_R_G_B
                        const parts2 = s.slice(7).split('_');
                        inlineStyles.push('background:rgb(' + parts2.join(',') + ')');
                    } else if (s.startsWith('ac')) {
                        // 256-color foreground: ac<idx>
                        const idx = parseInt(s.slice(2));
                        if (idx >= 0 && idx < 256) {
                            inlineStyles.push('color:' + ANSI_256[idx]);
                        }
                    } else if (s.startsWith('abgc')) {
                        // 256-color background: abgc<idx>
                        const idx = parseInt(s.slice(4));
                        if (idx >= 0 && idx < 256) {
                            inlineStyles.push('background:' + ANSI_256[idx]);
                        }
                    } else {
                        classes.push(s);
                    }
                }
                let attrs = '';
                if (classes.length > 0) attrs += ' class="' + classes.join(' ') + '"';
                if (inlineStyles.length > 0) attrs += ' style="' + inlineStyles.join(';') + '"';
                result.push('<span' + attrs + '>' + escaped + '</span>');
            } else {
                result.push(escaped);
            }
        }
    }

    return result.join('');
}

function updateStyles(current, codes) {
    if (codes.length === 0 || (codes.length === 1 && codes[0] === 0)) {
        return [];
    }

    const styles = current.slice();
    let i = 0;

    while (i < codes.length) {
        const code = codes[i];

        if (code === 0) {
            // Reset
            styles.length = 0;
        } else if (code === 1) {
            addStyle(styles, 'ab'); // bold
        } else if (code === 2) {
            addStyle(styles, 'ad'); // dim
        } else if (code === 3) {
            addStyle(styles, 'ai'); // italic
        } else if (code === 4) {
            addStyle(styles, 'au'); // underline
        } else if (code === 22) {
            removeStyle(styles, 'ab');
            removeStyle(styles, 'ad');
        } else if (code === 23) {
            removeStyle(styles, 'ai');
        } else if (code === 24) {
            removeStyle(styles, 'au');
        } else if (code >= 30 && code <= 37) {
            removeFg(styles);
            addStyle(styles, 'a' + (code - 30));
        } else if (code === 38) {
            // 256 color or RGB foreground
            if (codes[i+1] === 5 && i+2 < codes.length) {
                const idx = codes[i+2];
                removeFg(styles);
                addStyle(styles, 'ac' + idx);
                i += 2;
            } else if (codes[i+1] === 2 && i+4 < codes.length) {
                const r = codes[i+2], g = codes[i+3], b = codes[i+4];
                removeFg(styles);
                addStyle(styles, 'argb_' + r + '_' + g + '_' + b);
                i += 4;
            }
        } else if (code === 39) {
            removeFg(styles);
        } else if (code >= 40 && code <= 47) {
            removeBg(styles);
            addStyle(styles, 'abg' + (code - 40));
        } else if (code === 48) {
            if (codes[i+1] === 5 && i+2 < codes.length) {
                const idx = codes[i+2];
                removeBg(styles);
                addStyle(styles, 'abgc' + idx);
                i += 2;
            } else if (codes[i+1] === 2 && i+4 < codes.length) {
                const r = codes[i+2], g = codes[i+3], b = codes[i+4];
                removeBg(styles);
                addStyle(styles, 'abgrgb_' + r + '_' + g + '_' + b);
                i += 4;
            }
        } else if (code === 49) {
            removeBg(styles);
        } else if (code >= 90 && code <= 97) {
            removeFg(styles);
            addStyle(styles, 'a' + (code - 90 + 8));
        } else if (code >= 100 && code <= 107) {
            removeBg(styles);
            addStyle(styles, 'abg' + (code - 100 + 8));
        }

        i++;
    }

    return styles;
}

function addStyle(arr, cls) {
    if (!arr.includes(cls)) arr.push(cls);
}

function removeStyle(arr, cls) {
    const idx = arr.indexOf(cls);
    if (idx >= 0) arr.splice(idx, 1);
}

function removeFg(arr) {
    for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].match(/^a\d+$/) || arr[i].match(/^ac\d+$/) || arr[i].match(/^argb_/)) {
            arr.splice(i, 1);
        }
    }
}

function removeBg(arr) {
    for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].match(/^abg/) && !arr[i].match(/^ab$/)) {
            arr.splice(i, 1);
        }
    }
}

function escHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function ansiToHtml(text) {
    text = processControlSequences(text);
    return convertAnsiColors(text);
}
