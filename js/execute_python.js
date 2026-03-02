import { app } from "../../scripts/app.js";

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
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name !== "ExecutePython") return;

        const origOnConnectionsChange = nodeType.prototype.onConnectionsChange;
        const origOnNodeCreated = nodeType.prototype.onNodeCreated;
        const origOnNodeLoaded = nodeType.prototype.onNodeLoaded;

        nodeType.prototype.onNodeCreated = function () {
            const result = origOnNodeCreated?.apply(this, arguments);

            setTimeout(() => reconcileDynamicInputs(this), 100);

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
            return result;
        };

        nodeType.prototype.onConnectionsChange = function (type, index, connected, link_info) {
            const result = origOnConnectionsChange?.apply(this, arguments);
            setTimeout(() => reconcileDynamicInputs(this), 0);
            return result;
        };
    }
});