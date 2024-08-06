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
    onunload() { }
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
                new obsidian_1.Notice(`Error creating canvas file: ${canvasFilePath}`);
                return;
            }
            // Add hardcoded nodes and edge for troubleshooting
            const hardcodedNode1 = {
                id: 'hardcoded-node-1',
                x: 100,
                y: 100,
                width: 200,
                height: 50,
                text: 'Hardcoded Node 1',
                type: 'text',
                fontSize: 16,
            };
            const hardcodedNode2 = {
                id: 'hardcoded-node-2',
                x: 300,
                y: 100,
                width: 200,
                height: 50,
                text: 'Hardcoded Node 2',
                type: 'text',
                fontSize: 16,
            };
            const nodes = [hardcodedNode1, hardcodedNode2];
            const edges = [{
                    id: 'hardcoded-edge-1-2',
                    fromNode: 'hardcoded-node-1',
                    toNode: 'hardcoded-node-2',
                    fromSide: 'right',
                    toSide: 'left',
                }];
            // Add nodes and edges to canvas
            defaultCanvasJSON.nodes = nodes;
            defaultCanvasJSON.edges = edges;
            // Write updated content to canvas file
            try {
                yield this.app.vault.modify(canvasFile, JSON.stringify(defaultCanvasJSON));
            }
            catch (e) {
                new obsidian_1.Notice('Error writing to canvas file.');
                return;
            }
            // Open the canvas file in a new pane
            try {
                yield this.app.workspace.getLeaf(true).openFile(canvasFile);
            }
            catch (e) {
                new obsidian_1.Notice('Error opening the canvas file.');
                return;
            }
            new obsidian_1.Notice(`Canvas "${mocFile.basename} Canvas.canvas" created with nodes!`);
        });
    }
}
exports.default = HelloWorldPlugin;
