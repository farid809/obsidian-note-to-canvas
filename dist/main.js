"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const dagre = __importStar(require("dagre"));
// Plugin class definition
class HelloWorldPlugin extends obsidian_1.Plugin {
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            this.addCommand({
                id: 'create-canvas',
                name: 'Create Canvas from Note',
                checkCallback: (checking) => {
                    const activeFile = this.app.workspace.getActiveFile();
                    if (activeFile) {
                        if (!checking) {
                            this.createCanvas(activeFile);
                        }
                        return true;
                    }
                    return false;
                }
            });
        });
    }
    onunload() { }
    createCanvas(mocFile) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mocFile || !mocFile.parent || !mocFile.basename) {
                new obsidian_1.Notice("Invalid file structure.");
                return;
            }
            const parentPath = mocFile.parent ? mocFile.parent.path : '';
            if (!parentPath) {
                new obsidian_1.Notice("Invalid parent path.");
                return;
            }
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
            // Read the content of the current note
            let fileContent;
            try {
                fileContent = yield this.app.vault.read(mocFile);
            }
            catch (e) {
                new obsidian_1.Notice('Error reading the file content.');
                return;
            }
            const { nodes, edges } = this.createNodesAndEdgesFromHeadings(fileContent);
            // Add nodes and edges to canvas
            defaultCanvasJSON.nodes = nodes;
            defaultCanvasJSON.edges = edges;
            // Layout the nodes using dagre
            this.layoutNodesAndEdges(nodes, edges);
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
    createNodesAndEdgesFromHeadings(fileContent) {
        const lines = fileContent.split('\n');
        const nodes = [];
        const edges = [];
        let yPos = 0;
        const headingStack = [];
        const spacing = 100; // Adjust spacing between nodes
        lines.forEach((line, index) => {
            var _a;
            try {
                const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
                if (headingMatch) {
                    const level = ((_a = headingMatch[1]) === null || _a === void 0 ? void 0 : _a.length) || 0;
                    const text = headingMatch[2] || '';
                    const nodeId = `node-${index}`;
                    // Create the node
                    nodes.push({
                        id: nodeId,
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 50,
                        text,
                        type: "text",
                        fontSize: 16 + (6 - level) * 2,
                    });
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
                    }
                    headingStack.push({ id: nodeId, level });
                    yPos += spacing; // Adjust spacing between nodes
                }
            }
            catch (error) {
                new obsidian_1.Notice(`Error processing line ${index + 1}: ${line}`);
            }
        });
        return { nodes, edges };
    }
    layoutNodesAndEdges(nodes, edges) {
        const g = new dagre.graphlib.Graph();
        g.setGraph({});
        g.setDefaultEdgeLabel(() => ({}));
        nodes.forEach(node => {
            g.setNode(node.id, { width: node.width, height: node.height });
        });
        edges.forEach(edge => {
            g.setEdge(edge.fromNode, edge.toNode);
        });
        dagre.layout(g);
        g.nodes().forEach((v) => {
            const node = g.node(v);
            const canvasNode = nodes.find(n => n.id === v);
            if (canvasNode) {
                canvasNode.x = node.x - node.width / 2;
                canvasNode.y = node.y - node.height / 2;
            }
        });
    }
}
exports.default = HelloWorldPlugin;
