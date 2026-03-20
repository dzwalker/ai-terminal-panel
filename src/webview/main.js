// AI Terminal Panel Webview Main Script

// ─── i18n ──────────────────────────────────────────────────────────────────
var I18N = {
    en: {
        'btn.mirror': '🖥 Mirror',
        'btn.mirror.title': 'View mirror in VSCode Terminal',
        'btn.copyAll': '📋 Copy All',
        'btn.copyAll.title': 'Copy all output',
        'btn.clear': '🗑 Clear',
        'btn.clear.title': 'Clear output',
        'btn.tuiToggle': '⌨ TUI',
        'btn.tuiToggle.title': 'Toggle TUI mode (per-character keyboard input)',
        'btn.tuiExit': '⌨ Exit TUI',
        'btn.colors': '🎨 Colors',
        'btn.colors.title': 'Adjust ANSI color mapping',
        'btn.settings': '⚙ Settings',
        'btn.settings.title': 'Terminal settings',
        'btn.interrupt': '⏹ Interrupt',
        'btn.interrupt.title': 'Interrupt (Ctrl+C)',
        'btn.send': 'Send',
        'status.ready': 'Ready',
        'status.running': 'Running: ',
        'autoScroll.on': '↓ Auto-scroll: ON',
        'autoScroll.off': '↓ Auto-scroll: OFF',
        'tui.placeholder': 'TUI: type then Enter to send; unfocused = direct keyboard',
        'tui.status': 'TUI Mode — input box supports CJK, unfocused = direct keyboard',
        'tui.exitBtn': '⏹ Exit TUI',
        'input.placeholder': 'Enter command, Enter to run, Shift+Enter for newline',
        'copy.done': '✓ Copied',
        'exit.success': '✓ Command completed',
        'exit.error': '✗ Exited with code: ',
        'welcome.title': '📺 AI Terminal Panel',
        'welcome.html': 'Type a command below, output appears here<br>Supports <code>claude</code>, <code>cursor</code>, <code>python</code>, <code>npm</code> and any command<br>Output text can be <strong>selected and copied</strong><br><br><kbd>Enter</kbd> Send &nbsp;·&nbsp; <kbd>Shift+Enter</kbd> Newline &nbsp;·&nbsp; <kbd>Ctrl+C</kbd> Interrupt &nbsp;·&nbsp; <kbd>↑↓</kbd> History',
        'colorPanel.title': '🎨 ANSI Color Mapping',
        'colorPanel.syncBtn': '⟳ Sync Terminal',
        'colorPanel.syncBtn.title': 'Read colors from current VSCode Terminal theme',
        'colorPanel.resetBtn': '↺ Reset',
        'colorPanel.resetBtn.title': 'Reset to VSCode theme defaults',
        'colorPanel.closeBtn': '✕ Close',
        'colorPanel.desc': 'Changes apply immediately. Click "Sync Terminal" to scan for unlisted colors.',
        'colorPanel.ansiSection': 'ANSI 16 Colors & Theme Variables',
        'colorPanel.extraSection': 'Colors from Terminal',
        'colorPanel.noNewColors': '✓ No new colors found (all output colors already listed)',
        'settingsPanel.title': '⚙ Terminal Settings',
        'settingsPanel.closeBtn': '✕ Close',
        'settingsPanel.lang': 'Language',
        'settingsPanel.termSize': 'Terminal Size',
        'settingsPanel.cols': 'Columns',
        'settingsPanel.rows': 'Rows',
        'settingsPanel.termSizeHint': 'Applies to next command',
        'settingsPanel.tuiWhitelist': 'TUI Auto-detect Whitelist',
        'settingsPanel.tuiWhitelistHint': 'Commands that auto-enter TUI mode (one per line)',
    },
    zh: {
        'btn.mirror': '🖥 Mirror',
        'btn.mirror.title': '在 VSCode Terminal 中查看镜像',
        'btn.copyAll': '📋 复制全部',
        'btn.copyAll.title': '复制所有输出',
        'btn.clear': '🗑 清空',
        'btn.clear.title': '清空输出',
        'btn.tuiToggle': '⌨ TUI',
        'btn.tuiToggle.title': '手动切换 TUI 模式（逐字符键盘输入）',
        'btn.tuiExit': '⌨ 退出 TUI',
        'btn.colors': '🎨 颜色',
        'btn.colors.title': '调整 ANSI 颜色映射',
        'btn.settings': '⚙ 设置',
        'btn.settings.title': '终端设置',
        'btn.interrupt': '⏹ 中断',
        'btn.interrupt.title': '中断 (Ctrl+C)',
        'btn.send': '发送',
        'status.ready': '就绪',
        'status.running': '执行中: ',
        'autoScroll.on': '↓ 自动滚动: 开',
        'autoScroll.off': '↓ 自动滚动: 关',
        'tui.placeholder': 'TUI 模式：输入后 Enter 发送（支持中文），失焦后键盘直接输入',
        'tui.status': 'TUI 模式 — 输入框有焦点时支持中文，失焦后键盘直接输入',
        'tui.exitBtn': '⏹ 退出 TUI',
        'input.placeholder': '输入命令，Enter 执行，Shift+Enter 换行',
        'copy.done': '✓ 已复制',
        'exit.success': '✓ 命令执行完成',
        'exit.error': '✗ 命令退出，退出码: ',
        'welcome.title': '📺 AI Terminal Panel',
        'welcome.html': '在下方输入框中输入命令，输出将显示在这里<br>支持 <code>claude</code>、<code>cursor</code>、<code>python</code>、<code>npm</code> 等任何命令<br>输出内容可以像普通文本一样<strong>选择和复制</strong><br><br><kbd>Enter</kbd> 发送 &nbsp;·&nbsp; <kbd>Shift+Enter</kbd> 换行 &nbsp;·&nbsp; <kbd>Ctrl+C</kbd> 中断 &nbsp;·&nbsp; <kbd>↑↓</kbd> 历史',
        'colorPanel.title': '🎨 ANSI 颜色映射设置',
        'colorPanel.syncBtn': '⟳ 读取终端',
        'colorPanel.syncBtn.title': '从当前 VSCode Terminal 主题读取颜色',
        'colorPanel.resetBtn': '↺ 重置',
        'colorPanel.resetBtn.title': '重置为 VSCode 主题默认值',
        'colorPanel.closeBtn': '✕ 关闭',
        'colorPanel.desc': '修改颜色后立即生效。点击"读取终端"扫描输出中未收录的颜色并添加到下方。',
        'colorPanel.ansiSection': 'ANSI 16色 & 主题变量',
        'colorPanel.extraSection': '从 Terminal 读取的颜色',
        'colorPanel.noNewColors': '✓ 没有发现新颜色（当前输出中的颜色均已在表中）',
        'settingsPanel.title': '⚙ 终端设置',
        'settingsPanel.closeBtn': '✕ 关闭',
        'settingsPanel.lang': '语言 / Language',
        'settingsPanel.termSize': '终端尺寸',
        'settingsPanel.cols': '列数',
        'settingsPanel.rows': '行数',
        'settingsPanel.termSizeHint': '下次执行命令时生效',
        'settingsPanel.tuiWhitelist': 'TUI 自动检测白名单',
        'settingsPanel.tuiWhitelistHint': '自动进入 TUI 模式的命令（每行一个）',
    }
};

var currentLang = 'zh';
function t(key) {
    return (I18N[currentLang] && I18N[currentLang][key]) || I18N['en'][key] || key;
}

// ─── Settings ──────────────────────────────────────────────────────────────
var DEFAULT_TUI_WHITELIST = ['claude', 'agent', 'htop', 'top', 'vim', 'vi', 'nano', 'less', 'man', 'cursor'];
var viewerSettings = {
    lang: 'zh',
    cols: 120,
    rows: 40,
    tuiWhitelist: DEFAULT_TUI_WHITELIST.slice()
};

// ─── Color settings panel ────────────────────────────────────────────────────
var COLOR_VARS = [
    ['--vscode-terminal-ansiBlack',         '0 Black'],
    ['--vscode-terminal-ansiRed',           '1 Red'],
    ['--vscode-terminal-ansiGreen',         '2 Green'],
    ['--vscode-terminal-ansiYellow',        '3 Yellow'],
    ['--vscode-terminal-ansiBlue',          '4 Blue'],
    ['--vscode-terminal-ansiMagenta',       '5 Magenta'],
    ['--vscode-terminal-ansiCyan',          '6 Cyan'],
    ['--vscode-terminal-ansiWhite',         '7 White'],
    ['--vscode-terminal-ansiBrightBlack',   '8 Bright Black'],
    ['--vscode-terminal-ansiBrightRed',     '9 Bright Red'],
    ['--vscode-terminal-ansiBrightGreen',   '10 Bright Green'],
    ['--vscode-terminal-ansiBrightYellow',  '11 Bright Yellow'],
    ['--vscode-terminal-ansiBrightBlue',    '12 Bright Blue'],
    ['--vscode-terminal-ansiBrightMagenta', '13 Bright Magenta'],
    ['--vscode-terminal-ansiBrightCyan',    '14 Bright Cyan'],
    ['--vscode-terminal-ansiBrightWhite',   '15 Bright White'],
    ['--vscode-terminal-foreground',        'Foreground'],
    ['--vscode-terminal-background',        'Background'],
    ['--vscode-editor-background',          'Editor Background'],
    ['--vscode-editor-foreground',          'Editor Foreground'],
];

var EXTRA_COLORS = [];

// ANSI CSS class -> CSS variable name mapping
var ANSI_CLASS_TO_VAR = {};
(function() {
    var varNames = [
        '--vscode-terminal-ansiBlack', '--vscode-terminal-ansiRed',
        '--vscode-terminal-ansiGreen', '--vscode-terminal-ansiYellow',
        '--vscode-terminal-ansiBlue', '--vscode-terminal-ansiMagenta',
        '--vscode-terminal-ansiCyan', '--vscode-terminal-ansiWhite',
        '--vscode-terminal-ansiBrightBlack', '--vscode-terminal-ansiBrightRed',
        '--vscode-terminal-ansiBrightGreen', '--vscode-terminal-ansiBrightYellow',
        '--vscode-terminal-ansiBrightBlue', '--vscode-terminal-ansiBrightMagenta',
        '--vscode-terminal-ansiBrightCyan', '--vscode-terminal-ansiBrightWhite',
    ];
    for (var i = 0; i < 16; i++) {
        ANSI_CLASS_TO_VAR['a' + i] = varNames[i];
        ANSI_CLASS_TO_VAR['abg' + i] = varNames[i];
    }
    ANSI_CLASS_TO_VAR['ad'] = '--vscode-terminal-ansiBrightBlack';
})();

function highlightSelectedColors() {
    var active = document.querySelectorAll('.color-row.color-row-active');
    for (var i = 0; i < active.length; i++) active[i].classList.remove('color-row-active');

    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;

    var range = sel.getRangeAt(0);
    var container = document.getElementById('outputContainer');
    if (!container || !container.contains(range.commonAncestorContainer)) return;

    var colorKeys = {};
    var spans = container.querySelectorAll('span[class], span[style]');
    for (var j = 0; j < spans.length; j++) {
        var span = spans[j];
        if (!range.intersectsNode(span)) continue;
        if (span.className) {
            var classes = span.className.split(/\s+/);
            for (var k = 0; k < classes.length; k++) {
                var varName = ANSI_CLASS_TO_VAR[classes[k]];
                if (varName) colorKeys[varName] = true;
            }
        }
        var styleAttr = span.getAttribute('style') || '';
        var cm = styleAttr.match(/(?:^|;)\s*color\s*:\s*([^;]+)/);
        if (cm) {
            var hex = colorToHex(cm[1].trim());
            if (hex !== '#888888') colorKeys['extra:' + hex] = true;
        }
        var bm = styleAttr.match(/(?:^|;)\s*background\s*:\s*([^;]+)/);
        if (bm) {
            var hexBg = colorToHex(bm[1].trim());
            if (hexBg !== '#888888') colorKeys['extra:' + hexBg] = true;
        }
    }

    var rows = document.querySelectorAll('.color-row[data-color-key]');
    for (var r = 0; r < rows.length; r++) {
        if (colorKeys[rows[r].getAttribute('data-color-key')]) {
            rows[r].classList.add('color-row-active');
        }
    }
}

document.addEventListener('selectionchange', highlightSelectedColors);

// ─── Color utilities ───────────────────────────────────────────────────────
function readCssVar(name) {
    var fromBodyInline = document.body.style.getPropertyValue(name).trim();
    if (fromBodyInline) return fromBodyInline;
    var fromRootInline = document.documentElement.style.getPropertyValue(name).trim();
    if (fromRootInline) return fromRootInline;
    var fromComputed = getComputedStyle(document.body).getPropertyValue(name).trim();
    if (fromComputed) return fromComputed;
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

var _SENTINEL_COLOR = 'rgb(1, 2, 3)';
function readOriginalCssVar(name) {
    var el = document.createElement('div');
    el.style.cssText = 'display:none;color:var(' + name + ',rgb(1,2,3))';
    document.body.appendChild(el);
    var rgb = getComputedStyle(el).color;
    document.body.removeChild(el);
    if (rgb === _SENTINEL_COLOR) return '';
    return rgb;
}

function colorToHex(color) {
    if (!color) return '#888888';
    if (/^#[0-9a-fA-F]{6}$/.test(color)) return color;
    if (/^#[0-9a-fA-F]{3}$/.test(color)) {
        const r = color[1]+color[1], g = color[2]+color[2], b = color[3]+color[3];
        return '#' + r + g + b;
    }
    const m = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (m) {
        return '#' + [m[1],m[2],m[3]].map(function(v) {
            return ('0' + parseInt(v).toString(16)).slice(-2);
        }).join('');
    }
    return '#888888';
}

function normalizeColor(raw) {
    if (/^rgb/.test(raw) || /^#/.test(raw)) return raw;
    return raw;
}

// ─── Color panel ───────────────────────────────────────────────────────────
function buildColorPanel() {
    var panel = document.getElementById('colorSettingsPanel');
    if (!panel) return;
    panel.innerHTML = '';

    var header = document.createElement('div');
    header.className = 'color-panel-header';
    header.innerHTML =
        '<span class="color-panel-title">' + t('colorPanel.title') + '</span>' +
        '<div style="display:flex;gap:6px">' +
        '<button class="btn" id="colorSyncBtn" title="' + t('colorPanel.syncBtn.title') + '">' + t('colorPanel.syncBtn') + '</button>' +
        '<button class="btn" id="colorResetBtn" title="' + t('colorPanel.resetBtn.title') + '">' + t('colorPanel.resetBtn') + '</button>' +
        '<button class="btn" id="colorPanelCloseBtn">' + t('colorPanel.closeBtn') + '</button>' +
        '</div>';
    panel.appendChild(header);

    var desc = document.createElement('div');
    desc.className = 'color-panel-desc';
    desc.textContent = t('colorPanel.desc');
    panel.appendChild(desc);

    var list = document.createElement('div');
    list.className = 'color-panel-list';

    function makeColorRow(hexVal, label, colorKey, onPickerChange) {
        var row = document.createElement('div');
        row.className = 'color-row';
        row.dataset.colorKey = colorKey;

        var preview = document.createElement('span');
        preview.className = 'color-preview';
        preview.style.background = hexVal;
        preview.title = hexVal;

        var labelEl = document.createElement('span');
        labelEl.className = 'color-label';
        labelEl.textContent = label;

        var picker = document.createElement('input');
        picker.type = 'color';
        picker.className = 'color-picker';
        picker.value = hexVal;
        picker.title = hexVal;

        var valueEl = document.createElement('span');
        valueEl.className = 'color-value';
        valueEl.textContent = hexVal;

        picker.addEventListener('input', function() {
            var hex = picker.value;
            preview.style.background = hex;
            valueEl.textContent = hex;
            onPickerChange(hex);
        });

        row.appendChild(preview);
        row.appendChild(labelEl);
        row.appendChild(picker);
        row.appendChild(valueEl);
        return row;
    }

    var section1Title = document.createElement('div');
    section1Title.style.cssText = 'padding:4px 12px;font-size:10px;font-weight:600;color:var(--vscode-descriptionForeground);text-transform:uppercase;letter-spacing:0.5px;';
    section1Title.textContent = t('colorPanel.ansiSection');
    list.appendChild(section1Title);

    COLOR_VARS.forEach(function(item) {
        var varName = item[0], label = item[1];
        var override = document.documentElement.style.getPropertyValue(varName).trim();
        var currentVal = override || readOriginalCssVar(varName) || readCssVar(varName);
        var hexVal = colorToHex(currentVal);

        var row = makeColorRow(hexVal, label, varName, function(hex) {
            document.documentElement.style.setProperty(varName, hex);
            saveColorOverrides();
        });
        row.querySelector('.color-picker').dataset.varName = varName;
        list.appendChild(row);
    });

    if (EXTRA_COLORS.length > 0) {
        var section2Title = document.createElement('div');
        section2Title.style.cssText = 'padding:8px 12px 4px;font-size:10px;font-weight:600;color:var(--vscode-descriptionForeground);text-transform:uppercase;letter-spacing:0.5px;border-top:1px solid var(--vscode-panel-border);margin-top:4px;';
        section2Title.textContent = t('colorPanel.extraSection');
        list.appendChild(section2Title);

        EXTRA_COLORS.forEach(function(item, idx) {
            var key = item[0], hexVal = item[1], label = item[2];
            var row = makeColorRow(hexVal, label, 'extra:' + key, function(hex) {
                EXTRA_COLORS[idx][1] = hex;
                saveColorOverrides();
            });
            list.appendChild(row);
        });
    }

    panel.appendChild(list);

    document.getElementById('colorSyncBtn').onclick = syncColorsFromTerminal;
    document.getElementById('colorResetBtn').onclick = resetColors;
    document.getElementById('colorPanelCloseBtn').onclick = toggleColorPanel;

    highlightSelectedColors();
}

function syncColorsFromTerminal() {
    var outputContainer = document.getElementById('outputContainer');
    if (!outputContainer) return;

    var knownHexSet = {};
    COLOR_VARS.forEach(function(item) {
        var val = readOriginalCssVar(item[0]);
        if (val) knownHexSet[colorToHex(val)] = true;
        var override = document.documentElement.style.getPropertyValue(item[0]).trim();
        if (override) knownHexSet[colorToHex(override)] = true;
    });
    EXTRA_COLORS.forEach(function(item) {
        knownHexSet[colorToHex(item[1])] = true;
    });

    var newColors = {};
    var spans = outputContainer.querySelectorAll('span[style]');
    spans.forEach(function(span) {
        var style = span.getAttribute('style') || '';
        var colorMatch = style.match(/(?:^|;)\s*color\s*:\s*([^;]+)/);
        if (colorMatch) {
            var raw = colorMatch[1].trim();
            var hex = colorToHex(normalizeColor(raw));
            if (hex !== '#888888' && !knownHexSet[hex]) {
                newColors[hex] = { type: 'color', raw: raw };
            }
        }
        var bgMatch = style.match(/(?:^|;)\s*background\s*:\s*([^;]+)/);
        if (bgMatch) {
            var rawBg = bgMatch[1].trim();
            var hexBg = colorToHex(normalizeColor(rawBg));
            if (hexBg !== '#888888' && !knownHexSet[hexBg]) {
                newColors[hexBg] = { type: 'background', raw: rawBg };
            }
        }
    });

    var added = 0;
    Object.keys(newColors).forEach(function(hex) {
        var info = newColors[hex];
        var label = (info.type === 'background' ? 'BG ' : 'FG ') + hex;
        EXTRA_COLORS.push([hex, hex, label]);
        knownHexSet[hex] = true;
        added++;
    });

    if (added > 0) {
        buildColorPanel();
    } else {
        var descEl = document.querySelector('.color-panel-desc');
        if (descEl) {
            var orig = descEl.textContent;
            descEl.textContent = t('colorPanel.noNewColors');
            setTimeout(function() { descEl.textContent = orig; }, 2000);
        }
    }
}

function saveColorOverrides() {
    var cssVarOverrides = {};
    COLOR_VARS.forEach(function(item) {
        var val = document.documentElement.style.getPropertyValue(item[0]).trim();
        if (val) cssVarOverrides[item[0]] = val;
    });
    if (typeof _vscode !== 'undefined') {
        _vscode.postMessage({
            type: 'saveColors',
            overrides: { cssVarOverrides: cssVarOverrides, extraColors: EXTRA_COLORS }
        });
    }
}

function resetColors() {
    COLOR_VARS.forEach(function(item) {
        document.documentElement.style.removeProperty(item[0]);
    });
    EXTRA_COLORS.length = 0;
    saveColorOverrides();
    buildColorPanel();
}

function toggleColorPanel() {
    var panel = document.getElementById('colorSettingsPanel');
    if (!panel) return;
    var isVisible = panel.style.display !== 'none' && panel.style.display !== '';
    if (isVisible) {
        panel.style.display = 'none';
    } else {
        panel.style.display = 'flex';
        buildColorPanel();
    }
}

// ─── Settings panel ────────────────────────────────────────────────────────
function buildSettingsPanel() {
    var panel = document.getElementById('settingsPanel');
    if (!panel) return;
    panel.innerHTML = '';

    var header = document.createElement('div');
    header.className = 'color-panel-header';
    header.innerHTML =
        '<span class="color-panel-title">' + t('settingsPanel.title') + '</span>' +
        '<button class="btn" id="settingsPanelCloseBtn">' + t('settingsPanel.closeBtn') + '</button>';
    panel.appendChild(header);

    var body = document.createElement('div');
    body.style.cssText = 'flex:1;overflow-y:auto;padding:0;';

    // ── Language ──
    var langSection = document.createElement('div');
    langSection.className = 'settings-section';
    langSection.innerHTML =
        '<div class="settings-section-title">' + t('settingsPanel.lang') + '</div>' +
        '<div class="settings-row">' +
        '<button class="lang-btn' + (currentLang === 'zh' ? ' active' : '') + '" id="langZhBtn">中文</button>' +
        '<button class="lang-btn' + (currentLang === 'en' ? ' active' : '') + '" id="langEnBtn">English</button>' +
        '</div>';
    body.appendChild(langSection);

    // ── Terminal size ──
    var sizeSection = document.createElement('div');
    sizeSection.className = 'settings-section';
    sizeSection.innerHTML =
        '<div class="settings-section-title">' + t('settingsPanel.termSize') + '</div>' +
        '<div class="settings-row">' +
        '<span class="settings-label">' + t('settingsPanel.cols') + '</span>' +
        '<input type="number" class="settings-input" id="termColsInput" value="' + viewerSettings.cols + '" min="40" max="400">' +
        '<span class="settings-label" style="margin-left:12px">' + t('settingsPanel.rows') + '</span>' +
        '<input type="number" class="settings-input" id="termRowsInput" value="' + viewerSettings.rows + '" min="10" max="200">' +
        '</div>' +
        '<div class="settings-hint">' + t('settingsPanel.termSizeHint') + '</div>';
    body.appendChild(sizeSection);

    // ── TUI whitelist ──
    var tuiSection = document.createElement('div');
    tuiSection.className = 'settings-section';
    tuiSection.innerHTML =
        '<div class="settings-section-title">' + t('settingsPanel.tuiWhitelist') + '</div>' +
        '<textarea class="settings-textarea" id="tuiWhitelistInput" rows="8">' +
        viewerSettings.tuiWhitelist.join('\n') +
        '</textarea>' +
        '<div class="settings-hint">' + t('settingsPanel.tuiWhitelistHint') + '</div>';
    body.appendChild(tuiSection);

    panel.appendChild(body);

    // ── Bind events ──
    document.getElementById('settingsPanelCloseBtn').onclick = toggleSettingsPanel;

    document.getElementById('langZhBtn').onclick = function() {
        currentLang = 'zh';
        viewerSettings.lang = 'zh';
        persistSettings();
        applyI18n();
    };
    document.getElementById('langEnBtn').onclick = function() {
        currentLang = 'en';
        viewerSettings.lang = 'en';
        persistSettings();
        applyI18n();
    };

    var colsInput = document.getElementById('termColsInput');
    var rowsInput = document.getElementById('termRowsInput');
    colsInput.onchange = function() {
        viewerSettings.cols = Math.max(40, Math.min(400, parseInt(colsInput.value) || 120));
        colsInput.value = viewerSettings.cols;
        persistSettings();
    };
    rowsInput.onchange = function() {
        viewerSettings.rows = Math.max(10, Math.min(200, parseInt(rowsInput.value) || 40));
        rowsInput.value = viewerSettings.rows;
        persistSettings();
    };

    var whitelistInput = document.getElementById('tuiWhitelistInput');
    whitelistInput.onchange = function() {
        viewerSettings.tuiWhitelist = whitelistInput.value.split('\n')
            .map(function(s) { return s.trim(); })
            .filter(function(s) { return s.length > 0; });
        persistSettings();
    };
}

function toggleSettingsPanel() {
    var panel = document.getElementById('settingsPanel');
    if (!panel) return;
    var isVisible = panel.style.display !== 'none' && panel.style.display !== '';
    if (isVisible) {
        panel.style.display = 'none';
    } else {
        panel.style.display = 'flex';
        buildSettingsPanel();
    }
}

function persistSettings() {
    if (typeof _vscode !== 'undefined') {
        _vscode.postMessage({ type: 'saveSettings', settings: viewerSettings });
    }
}

// ─── i18n apply ────────────────────────────────────────────────────────────
function applyI18n() {
    _setI18n('mirrorBtn', t('btn.mirror'), t('btn.mirror.title'));
    _setI18n('copyBtn', t('btn.copyAll'), t('btn.copyAll.title'));
    _setI18n('clearBtn', t('btn.clear'), t('btn.clear.title'));
    _setI18n('tuiToggleBtn', null, t('btn.tuiToggle.title'));
    _setI18n('colorSettingsBtn', t('btn.colors'), t('btn.colors.title'));
    _setI18n('settingsBtn', t('btn.settings'), t('btn.settings.title'));
    _setI18n('interruptBtn', t('btn.interrupt'), t('btn.interrupt.title'));

    var welcomeTitle = document.querySelector('#welcomeMsg h2');
    if (welcomeTitle) welcomeTitle.textContent = t('welcome.title');
    var welcomeP = document.querySelector('#welcomeMsg p');
    if (welcomeP) welcomeP.innerHTML = t('welcome.html');

    if (typeof window._refreshDynamicI18n === 'function') {
        window._refreshDynamicI18n();
    }

    var colorPanel = document.getElementById('colorSettingsPanel');
    if (colorPanel && colorPanel.style.display === 'flex') {
        buildColorPanel();
    }
    var settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel && settingsPanel.style.display === 'flex') {
        buildSettingsPanel();
    }
}

function _setI18n(id, text, title) {
    var el = document.getElementById(id);
    if (!el) return;
    if (text !== null && text !== undefined) el.textContent = text;
    if (title !== undefined) el.title = title;
}

// ─────────────────────────────────────────────────────────────────────────────
var _vscode;

(function() {
    const vscode = acquireVsCodeApi();
    _vscode = vscode;

    let autoScroll = true;
    let isRunning = false;
    let currentBlock = null;
    let currentOutput = null;
    const history = [];
    let historyIndex = -1;
    let tuiMode = false;

    const outputContainer = document.getElementById('outputContainer');
    const commandInput = document.getElementById('commandInput');
    const sendBtn = document.getElementById('sendBtn');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const interruptBtn = document.getElementById('interruptBtn');
    const autoScrollBtn = document.getElementById('autoScrollBtn');
    const tuiOverlay = document.getElementById('tuiOverlay');
    const tuiStatusBar = document.getElementById('tuiStatusBar');
    const tuiExitBtn = document.getElementById('tuiExitBtn');
    var tuiToggleBtn = document.getElementById('tuiToggleBtn');

    // ── Button events ──
    document.getElementById('mirrorBtn').onclick = function() {
        vscode.postMessage({ type: 'showTerminal' });
    };
    document.getElementById('clearBtn').onclick = clearOutput;
    document.getElementById('copyBtn').onclick = copyAll;
    interruptBtn.onclick = interrupt;
    autoScrollBtn.onclick = toggleAutoScroll;
    tuiExitBtn.onclick = exitTuiMode;
    document.getElementById('colorSettingsBtn').onclick = toggleColorPanel;
    document.getElementById('settingsBtn').onclick = toggleSettingsPanel;

    // Send button: in TUI mode acts like Enter, otherwise normal send
    sendBtn.onclick = function() {
        if (tuiMode) {
            var text = commandInput.value;
            vscode.postMessage({ type: 'input', data: (text || '') + '\r' });
            commandInput.value = '';
            autoResize(commandInput);
        } else {
            sendCommand();
        }
    };

    if (tuiToggleBtn) {
        tuiToggleBtn.onclick = function() {
            if (tuiMode) exitTuiMode();
            else enterTuiMode();
        };
    }

    document.getElementById('cwdInput').onchange = function(e) {
        vscode.postMessage({ type: 'setCwd', cwd: e.target.value });
    };

    // TUI mode: document-level keydown, only when commandInput is unfocused
    document.addEventListener('keydown', function(e) {
        if (!tuiMode) return;
        if (document.activeElement === commandInput) return;

        // Let native clipboard / select-all shortcuts pass through
        if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a'].includes(e.key)) return;

        e.preventDefault();
        e.stopPropagation();
        const data = keyEventToAnsi(e);
        if (data) {
            vscode.postMessage({ type: 'input', data: data });
        }
    });

    outputContainer.addEventListener('scroll', function() {
        const atBottom = outputContainer.scrollHeight - outputContainer.scrollTop <= outputContainer.clientHeight + 50;
        if (!atBottom && isRunning) {
            autoScroll = false;
            autoScrollBtn.textContent = t('autoScroll.off');
        }
    });

    // ── Messages from extension ──
    window.addEventListener('message', function(event) {
        const msg = event.data;
        if (msg.type === 'started') onCommandStarted(msg.command);
        else if (msg.type === 'snapshot') onSnapshot(msg.data);
        else if (msg.type === 'exit') onCommandExit(msg.exitCode);
        else if (msg.type === 'tuiDetected') enterTuiMode();
        else if (msg.type === 'tuiExited') exitTuiMode();
        else if (msg.type === 'loadColors') applyColorOverrides(msg.overrides);
        else if (msg.type === 'loadSettings') onLoadSettings(msg.settings);
    });

    function onLoadSettings(s) {
        if (!s || typeof s !== 'object') return;
        if (s.lang) currentLang = s.lang;
        viewerSettings.lang = s.lang || 'zh';
        viewerSettings.cols = s.cols || 120;
        viewerSettings.rows = s.rows || 40;
        viewerSettings.tuiWhitelist = s.tuiWhitelist || DEFAULT_TUI_WHITELIST.slice();
        applyI18n();
    }

    function applyColorOverrides(overrides) {
        if (!overrides || typeof overrides !== 'object') return;
        var cssVarOverrides = overrides.cssVarOverrides || overrides;
        var extraColors = overrides.extraColors || [];
        Object.keys(cssVarOverrides).forEach(function(varName) {
            document.documentElement.style.setProperty(varName, cssVarOverrides[varName]);
        });
        EXTRA_COLORS.length = 0;
        extraColors.forEach(function(item) { EXTRA_COLORS.push(item); });
        var panel = document.getElementById('colorSettingsPanel');
        if (panel && panel.style.display === 'flex') {
            buildColorPanel();
        }
    }

    function onCommandStarted(command) {
        isRunning = true;

        const welcome = document.getElementById('welcomeMsg');
        if (welcome) welcome.style.display = 'none';

        const block = document.createElement('div');
        block.className = 'message-block';

        const header = document.createElement('div');
        header.className = 'message-header';
        const ts = new Date().toLocaleTimeString();
        header.innerHTML =
            '<span class="prompt">$</span>' +
            '<span class="cmd-text">' + escHtml(command) + '</span>' +
            '<span class="timestamp">' + ts + '</span>';

        const output = document.createElement('div');
        output.className = 'message-output running';

        block.appendChild(header);
        block.appendChild(output);
        outputContainer.appendChild(block);

        currentBlock = block;
        currentOutput = output;

        if (!tuiMode) sendBtn.disabled = true;
        interruptBtn.style.display = 'inline-block';
        statusDot.className = 'status-dot running';
        const shortCmd = command.length > 50 ? command.substring(0, 50) + '...' : command;
        statusText.textContent = t('status.running') + shortCmd;
        scrollToBottom();
    }

    function onSnapshot(snapshotData) {
        if (!currentOutput) return;
        currentOutput.innerHTML = ansiToHtml(snapshotData);
        if (autoScroll) scrollToBottom();
    }

    function onCommandExit(exitCode) {
        isRunning = false;
        exitTuiMode();

        if (currentOutput) {
            currentOutput.classList.remove('running');
        }

        if (currentBlock) {
            const footer = document.createElement('div');
            footer.className = 'message-footer ' + (exitCode === 0 ? 'success' : 'error');
            footer.textContent = exitCode === 0 ? t('exit.success') : t('exit.error') + exitCode;
            currentBlock.appendChild(footer);
        }

        currentBlock = null;
        currentOutput = null;

        sendBtn.disabled = false;
        interruptBtn.style.display = 'none';
        statusDot.className = 'status-dot';
        statusText.textContent = t('status.ready');
        commandInput.focus();
        if (autoScroll) scrollToBottom();
    }

    function enterTuiMode() {
        if (tuiMode) return;
        tuiMode = true;
        if (tuiStatusBar) tuiStatusBar.classList.add('active');
        commandInput.classList.add('tui-active');
        commandInput.placeholder = t('tui.placeholder');
        statusText.textContent = t('tui.status');
        if (tuiToggleBtn) tuiToggleBtn.textContent = t('btn.tuiExit');
        sendBtn.disabled = false;
        commandInput.focus();
    }

    function exitTuiMode() {
        if (!tuiMode) return;
        tuiMode = false;
        if (tuiStatusBar) tuiStatusBar.classList.remove('active');
        commandInput.classList.remove('tui-active');
        commandInput.placeholder = t('input.placeholder');
        statusText.textContent = t('status.ready');
        if (tuiToggleBtn) tuiToggleBtn.textContent = t('btn.tuiToggle');
        if (isRunning) sendBtn.disabled = true;
        commandInput.focus();
    }

    function sendCommand() {
        const cmd = commandInput.value.trim();
        if (!cmd || isRunning) return;
        if (history[history.length - 1] !== cmd) history.push(cmd);
        historyIndex = history.length;
        commandInput.value = '';
        autoResize(commandInput);
        vscode.postMessage({ type: 'execute', command: cmd });
    }

    function interrupt() {
        vscode.postMessage({ type: 'interrupt' });
    }

    function clearOutput() {
        outputContainer.innerHTML = '';
        currentBlock = null;
        currentOutput = null;
    }

    function copyAll() {
        const text = outputContainer.innerText;
        navigator.clipboard.writeText(text).then(function() {
            const btn = document.getElementById('copyBtn');
            btn.textContent = t('copy.done');
            setTimeout(function() { btn.textContent = t('btn.copyAll'); }, 1500);
        });
    }

    function toggleAutoScroll() {
        autoScroll = !autoScroll;
        autoScrollBtn.textContent = autoScroll ? t('autoScroll.on') : t('autoScroll.off');
        if (autoScroll) scrollToBottom();
    }

    function scrollToBottom() {
        outputContainer.scrollTop = outputContainer.scrollHeight;
    }

    commandInput.addEventListener('keydown', handleKeyDown);
    commandInput.addEventListener('input', function() { autoResize(commandInput); });

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (tuiMode) {
                const text = commandInput.value;
                vscode.postMessage({ type: 'input', data: (text || '') + '\r' });
                commandInput.value = '';
                autoResize(commandInput);
            } else {
                sendCommand();
            }
        } else if (e.key === 'Escape' && tuiMode) {
            e.preventDefault();
            vscode.postMessage({ type: 'input', data: '\x1b' });
        } else if (e.key === 'ArrowUp' && !e.shiftKey) {
            if (tuiMode) {
                e.preventDefault();
                vscode.postMessage({ type: 'input', data: '\x1b[A' });
            } else if (commandInput.selectionStart === 0) {
                e.preventDefault();
                if (historyIndex > 0) {
                    historyIndex--;
                    commandInput.value = history[historyIndex];
                    autoResize(commandInput);
                }
            }
        } else if (e.key === 'ArrowDown' && !e.shiftKey) {
            if (tuiMode) {
                e.preventDefault();
                vscode.postMessage({ type: 'input', data: '\x1b[B' });
            } else {
                e.preventDefault();
                if (historyIndex < history.length - 1) {
                    historyIndex++;
                    commandInput.value = history[historyIndex];
                } else {
                    historyIndex = history.length;
                    commandInput.value = '';
                }
                autoResize(commandInput);
            }
        } else if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
            // Cmd+C (Mac) is always copy; Ctrl+C copies when text is selected, otherwise interrupts
            const hasSelection = window.getSelection && window.getSelection().toString().length > 0;
            if (e.metaKey || hasSelection) {
                // Let the browser handle native copy
                return;
            }
            if (isRunning) {
                e.preventDefault();
                interrupt();
            }
        } else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
            // Let the browser handle native paste
            return;
        }
    }

    function autoResize(el) {
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }

    function escHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function keyEventToAnsi(e) {
        const key = e.key;
        const ctrl = e.ctrlKey;
        const alt = e.altKey;
        const shift = e.shiftKey;

        if (ctrl && !alt) {
            if (key === 'c') return '\x03';
            if (key === 'd') return '\x04';
            if (key === 'z') return '\x1a';
            if (key === 'a') return '\x01';
            if (key === 'e') return '\x05';
            if (key === 'k') return '\x0b';
            if (key === 'u') return '\x15';
            if (key === 'w') return '\x17';
            if (key === 'l') return '\x0c';
            if (key === 'r') return '\x12';
            if (key === 'p') return '\x10';
            if (key === 'n') return '\x0e';
            if (key === 'b') return '\x02';
            if (key === 'f') return '\x06';
            if (key === '[') return '\x1b';
            if (key === '\\') return '\x1c';
            if (key === ']') return '\x1d';
        }

        if (alt && !ctrl) {
            if (key === 'ArrowLeft') return '\x1b\x62';
            if (key === 'ArrowRight') return '\x1b\x66';
            if (key === 'b') return '\x1b\x62';
            if (key === 'f') return '\x1b\x66';
            if (key === 'd') return '\x1b\x64';
            if (key.length === 1) return '\x1b' + key;
        }

        switch (key) {
            case 'Enter':       return shift ? '\x1b[27;2;13~' : '\r';
            case 'Backspace':   return ctrl ? '\x17' : '\x7f';
            case 'Delete':      return '\x1b[3~';
            case 'Tab':         return shift ? '\x1b[Z' : '\t';
            case 'Escape':      return '\x1b';
            case 'ArrowUp':     return '\x1b[A';
            case 'ArrowDown':   return '\x1b[B';
            case 'ArrowRight':  return '\x1b[C';
            case 'ArrowLeft':   return '\x1b[D';
            case 'Home':        return '\x1b[H';
            case 'End':         return '\x1b[F';
            case 'PageUp':      return '\x1b[5~';
            case 'PageDown':    return '\x1b[6~';
            case 'Insert':      return '\x1b[2~';
            case 'F1':          return '\x1bOP';
            case 'F2':          return '\x1bOQ';
            case 'F3':          return '\x1bOR';
            case 'F4':          return '\x1bOS';
            case 'F5':          return '\x1b[15~';
            case 'F6':          return '\x1b[17~';
            case 'F7':          return '\x1b[18~';
            case 'F8':          return '\x1b[19~';
            case 'F9':          return '\x1b[20~';
            case 'F10':         return '\x1b[21~';
            case 'F11':         return '\x1b[23~';
            case 'F12':         return '\x1b[24~';
        }

        if (key.length === 1 && !ctrl) return key;
        return null;
    }

    // Expose dynamic i18n refresh for applyI18n() to call
    window._refreshDynamicI18n = function() {
        sendBtn.textContent = t('btn.send');
        autoScrollBtn.textContent = autoScroll ? t('autoScroll.on') : t('autoScroll.off');
        if (tuiMode) {
            commandInput.placeholder = t('tui.placeholder');
            statusText.textContent = t('tui.status');
            if (tuiToggleBtn) tuiToggleBtn.textContent = t('btn.tuiExit');
        } else {
            commandInput.placeholder = t('input.placeholder');
            if (tuiToggleBtn) tuiToggleBtn.textContent = t('btn.tuiToggle');
            if (!isRunning) {
                statusText.textContent = t('status.ready');
            }
        }
        // TUI status bar hint
        var tuiHint = document.querySelector('.tui-hint');
        if (tuiHint) tuiHint.textContent = t('tui.status');
        var tuiExitBtnEl = document.getElementById('tuiExitBtn');
        if (tuiExitBtnEl) tuiExitBtnEl.textContent = t('tui.exitBtn');
    };

    // Init
    commandInput.focus();
    applyI18n();
    setTimeout(syncColorsFromTerminal, 100);
})();
