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
            // Add ribbon icon
            this.addRibbonIcon('dice', 'Create Canvas', () => __awaiter(this, void 0, void 0, function* () {
                const activeFile = this.app.workspace.getActiveFile();
                if (activeFile) {
                    const fileName = activeFile.basename;
                    const parentPath = activeFile.parent ? activeFile.parent.path : '';
                    const canvasFilePath = `${parentPath}/${fileName}.canvas`;
                    // Check if the canvas file already exists
                    if (yield this.app.vault.adapter.exists(canvasFilePath)) {
                        new obsidian_1.Notice(`Canvas "${fileName}.canvas" already exists!`);
                        return;
                    }
                    try {
                        const fileContent = yield this.app.vault.read(activeFile);
                        console.log('File content:', fileContent);
                        const { nodes, edges } = this.createNodesAndEdgesFromHeadings(fileContent);
                        console.log('Nodes:', nodes);
                        console.log('Edges:', edges);
                        // Create the canvas file with nodes and edges
                        yield this.app.vault.create(canvasFilePath, JSON.stringify({
                            "nodes": nodes,
                            "edges": edges,
                            "version": "1"
                        }));
                        new obsidian_1.Notice(`Canvas "${fileName}.canvas" created with nodes!`);
                    }
                    catch (error) {
                        console.error("Error creating canvas:", error);
                        new obsidian_1.Notice("Failed to create canvas.");
                    }
                }
                else {
                    new obsidian_1.Notice('No active file found!');
                }
            }));
        });
    }
    onunload() {
        console.log('Unloading Hello World plugin');
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
                    label: text,
                    type: "text",
                    subtype: "heading",
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
                        fromNode: parentNodeId,
                        toNode: nodeId
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
