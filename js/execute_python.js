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

app.registerExtension({
    name: "Comfy.ExecutePythonDynamicInputs",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name !== "ExecutePython") return;

        const origOnConnectionsChange = nodeType.prototype.onConnectionsChange;
        const origOnNodeCreated = nodeType.prototype.onNodeCreated;

        nodeType.prototype.onNodeCreated = function () {
            const result = origOnNodeCreated?.apply(this, arguments);
            setTimeout(() => reconcileDynamicInputs(this), 100);
            return result;
        };

        nodeType.prototype.onConnectionsChange = function (type, index, connected, link_info) {
            const result = origOnConnectionsChange?.apply(this, arguments);
            setTimeout(() => reconcileDynamicInputs(this), 0);
            return result;
        };
    }
});