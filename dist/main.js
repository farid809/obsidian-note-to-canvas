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
                    const fileContent = yield this.app.vault.read(activeFile);
                    const nodes = this.createNodesFromHeadings(fileContent);
                    // Create the canvas file with nodes
                    yield this.app.vault.create(canvasFilePath, JSON.stringify({
                        "nodes": nodes,
                        "edges": [],
                        "version": "1"
                    }));
                    new obsidian_1.Notice(`Canvas "${fileName}.canvas" created with nodes!`);
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
    createNodesFromHeadings(fileContent) {
        const lines = fileContent.split('\n');
        const nodes = [];
        let yPos = 0;
        lines.forEach((line, index) => {
            const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
            if (headingMatch) {
                const level = headingMatch[1].length;
                const text = headingMatch[2];
                nodes.push({
                    "id": `node-${index}`,
                    "x": 100 * level,
                    "y": yPos,
                    "width": 200,
                    "height": 50,
                    "label": text,
                    "type": "text",
                    "subtype": "heading",
                    "fontSize": 16 + (6 - level) * 2,
                });
                yPos += 70; // Adjust spacing between nodes
            }
        });
        return nodes;
    }
}
exports.default = HelloWorldPlugin;
