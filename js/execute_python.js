import { app } from "../../scripts/app.js";

let aceLoaded = null;
function loadAce() {
    if (window.ace) return Promise.resolve();
    if (aceLoaded) return aceLoaded;
    aceLoaded = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.36.5/ace.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
    return aceLoaded;
}

function updateAllExecutePythonNodes() {
    const allNodes = app.graph?._nodes || app.canvas?.nodes || [];
    for (const node of allNodes) {
        if (node.type && node.type.startsWith("ExecutePython")) {
            upgradeCodeWidget(node).catch(console.warn);
        }
    }
}

async function upgradeCodeWidget(node) {
    const enableHighlighting = app.extensionManager.setting.get('ExecutePython.enableHighlighting')
    const showLineNumbers = app.extensionManager.setting.get('ExecutePython.showLineNumbers')
    const theme = app.extensionManager.setting.get('ExecutePython.theme')
    
    const codeWidget = node.widgets?.find(w => w.name === 'code');
    if (!codeWidget) return;
    const textarea = codeWidget.element;
    if (!textarea) return;

    if (textarea.aceEditor) {
        textarea.aceEditor.destroy();
        delete textarea.aceEditor;
    }
    if (textarea.nextSibling && textarea.nextSibling.classList?.contains('ace_editor')) {
        textarea.nextSibling.remove();
    }
    const parent = textarea.parentNode;
    const existingAce = parent.querySelector('.ace_editor');
    if (existingAce) existingAce.remove();

    textarea.style.display = '';

    if (!enableHighlighting) {
        return;
    }

    await loadAce();

    textarea.style.display = 'none';
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.flex = '1 1 0';
    textarea.parentNode.insertBefore(container, textarea.nextSibling);

    const editor = ace.edit(container);
    editor.setTheme(`ace/theme/${theme}`);
    editor.session.setMode('ace/mode/python');
    editor.setOptions({
        showPrintMargin: false,
        showLineNumbers: showLineNumbers,
        showGutter: showLineNumbers,
        wrap: true
    });
    editor.setValue(textarea.value, -1);

    editor.session.on('change', () => {
        textarea.value = editor.getValue();
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });

    textarea.aceEditor = editor;
    editor.resize();
}

function reconcileDynamicInputs(node) {
    const inputs = node.inputs || [];
    
    const dynamicIndices = [];
    for (const input of inputs) {
        if (input.name && /^arg\d+$/.test(input.name)) {
            dynamicIndices.push(parseInt(input.name.slice(3), 10));
        }
    }
    if (dynamicIndices.length === 0) return;

    let maxConnected = -1;
    for (const input of inputs) {
        if (input.name && /^arg\d+$/.test(input.name) && input.link != null) {
            const idx = parseInt(input.name.slice(3), 10);
            if (idx > maxConnected) maxConnected = idx;
        }
    }

    const desiredMax = maxConnected + 1;
    const currentMax = Math.max(...dynamicIndices);

    if (currentMax < desiredMax) {
        for (let i = currentMax + 1; i <= desiredMax; i++) {
            node.addInput(`arg${i}`, "*");
        }
    } else if (currentMax > desiredMax) {
        for (let i = currentMax; i > desiredMax; i--) {
            const inputIndex = inputs.findIndex(inp => inp.name === `arg${i}`);
            if (inputIndex !== -1) node.removeInput(inputIndex);
        }
    }
}

function reconcileOutputs(node) {
    const outputCountWidget = node.widgets?.find(w => w.name === 'n_outputs');
    if (!outputCountWidget) return;
    
    const desired = outputCountWidget.value;
    const current = node.outputs ? node.outputs.length : 0;

    if (desired > current) {
        for (let i = current; i < desired; i++) {
            node.addOutput(`res${i}`, "*");
        }
    } else if (desired < current) {
        for (let i = current - 1; i >= desired; i--) {
            if (node.outputs[i]?.links?.length) {
                node.disconnectOutput(i);
            }
            node.removeOutput(i);
        }
    }
}

app.registerExtension({
    name: "Comfy.ExecutePythonDynamicIO",
    settings: [
        {
            id: "ExecutePython.enableHighlighting",
            name: "Enable syntax highlighting for ExecutePython node",
            type: "boolean",
            defaultValue: true,
            onChange: () => {
                setTimeout(() => updateAllExecutePythonNodes(), 100)
            }
        },
        {
            id: "ExecutePython.showLineNumbers",
            name: "Show line numbers in ExecutePython node",
            type: "boolean",
            defaultValue: false,
            onChange: () => {
                setTimeout(() => updateAllExecutePythonNodes(), 100)
            }
        },
        {
            id: "ExecutePython.theme",
            name: "ExecutePython Editor Theme",
            type: "combo",
            defaultValue: "monokai",
            options: [
                { text: "Chrome (Light)", value: "chrome" },
                { text: "Monokai (Dark)", value: "monokai" },
                { text: "Twilight (Dark)", value: "twilight" },
                { text: "GitHub (Light)", value: "github" },
                { text: "Xcode (Light)", value: "xcode" },
                { text: "Eclipse (Light)", value: "eclipse" },
                { text: "Terminal (Dark)", value: "terminal" },
                { text: "Solarized Light", value: "solarized_light" },
                { text: "Solarized Dark", value: "solarized_dark" }
            ],
            onChange: () => {
                setTimeout(() => updateAllExecutePythonNodes(), 100)
            }
        }
    ],
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (!nodeData.name.startsWith("ExecutePython")) return;

        const origOnConnectionsChange = nodeType.prototype.onConnectionsChange;
        const origOnNodeCreated = nodeType.prototype.onNodeCreated;
        const origOnNodeLoaded = nodeType.prototype.onNodeLoaded;

        nodeType.prototype.onNodeCreated = function () {
            const result = origOnNodeCreated?.apply(this, arguments);

            setTimeout(() => {
                reconcileDynamicInputs(this);
                reconcileOutputs(this);
                upgradeCodeWidget(this);
            }, 100);

            const outputCountWidget = this.widgets?.find(w => w.name === 'n_outputs');
            if (outputCountWidget) {
                outputCountWidget.callback = () => reconcileOutputs(this);
                setTimeout(() => reconcileOutputs(this), 10);
            }

            return result;
        };

        nodeType.prototype.onNodeLoaded = function () {
            const result = origOnNodeLoaded?.apply(this, arguments);
            reconcileDynamicInputs(this);
            reconcileOutputs(this);
            upgradeCodeWidget(this);
            return result;
        };

        nodeType.prototype.onConnectionsChange = function (type, index, connected, link_info) {
            const result = origOnConnectionsChange?.apply(this, arguments);
            setTimeout(() => reconcileDynamicInputs(this), 0);
            return result;
        };
    }
});