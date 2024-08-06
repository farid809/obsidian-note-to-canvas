"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const obsidian_1 = require("obsidian");
// Plugin class definition
class HelloWorldPlugin extends obsidian_1.Plugin {
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Loading Hello World plugin');
            this.addCommand({
                id: 'create-canvas',
                name: 'Create Canvas from Note',
                callback: () => {
                    const activeFile = this.app.workspace.getActiveFile();
                    if (activeFile) {
                        this.createCanvas(activeFile);
                    }
                    else {
                        new obsidian_1.Notice('No active file found!');
                    }
                }
            });
        });
    }
    onunload() {
        console.log('Unloading Hello World plugin');
    }
    createCanvas(mocFile) {
        return __awaiter(this, void 0, void 0, function* () {
            const parentPath = mocFile.parent ? mocFile.parent.path : '';
            const canvasFilePath = `${parentPath}/${mocFile.basename} Canvas.canvas`;
            // Default Canvas JSON structure
            const defaultCanvasJSON = {
                edges: [],
                nodes: []
            };
            // Check if canvas file already exists
            let canvasFile;
            try {
                canvasFile = yield this.app.vault.create(canvasFilePath, JSON.stringify(defaultCanvasJSON));
            }
            catch (e) {
                console.error(e);
                new obsidian_1.Notice(`Error creating canvas file: ${canvasFilePath}`);
                return;
            }
            const fileContent = yield this.app.vault.read(mocFile);
            if (!fileContent) {
                new obsidian_1.Notice("File content is empty or couldn't be read.");
                return;
            }
            const { nodes, edges } = this.createNodesAndEdgesFromHeadings(fileContent);
            console.log('Nodes:', nodes);
            console.log('Edges:', edges);
            // Add nodes and edges to canvas
            defaultCanvasJSON.nodes = nodes;
            defaultCanvasJSON.edges = edges;
            // Write updated content to canvas file
            yield this.app.vault.modify(canvasFile, JSON.stringify(defaultCanvasJSON));
            // Open the canvas file in a new pane
            yield this.app.workspace.getLeaf(true).openFile(canvasFile);
            new obsidian_1.Notice(`Canvas "${mocFile.basename} Canvas.canvas" created with nodes!`);
        });
    }
    createNodesAndEdgesFromHeadings(fileContent) {
        const lines = fileContent.split('\n');
        const nodes = [];
        const edges = [];
        let yPos = 0;
        const headingStack = [];
        lines.forEach((line, index) => {
            var _a;
            const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
            if (headingMatch) {
                const level = ((_a = headingMatch[1]) === null || _a === void 0 ? void 0 : _a.length) || 0;
                const text = headingMatch[2] || '';
                const nodeId = `node-${index}`;
                // Create the node
                nodes.push({
                    id: nodeId,
                    x: 100 * level,
                    y: yPos,
                    width: 200,
                    height: 50,
                    text,
                    type: "text",
                    fontSize: 16 + (6 - level) * 2,
                });
                console.log(`Created node: ${nodeId} at level ${level} with text "${text}"`);
                // Create edges based on heading nesting
                while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
                    headingStack.pop();
                }
                if (headingStack.length > 0) {
                    const parentNodeId = headingStack[headingStack.length - 1].id;
                    edges.push({
                        id: `edge-${parentNodeId}-${nodeId}`,
                        fromNode: parentNodeId,
                        toNode: nodeId,
                        fromSide: "bottom",
                        toSide: "top",
                    });
                    console.log(`Created edge from ${parentNodeId} to ${nodeId}`);
                }
                headingStack.push({ id: nodeId, level });
                yPos += 70; // Adjust spacing between nodes
            }
        });
        return { nodes, edges };
    }
}
exports.default = HelloWorldPlugin;
