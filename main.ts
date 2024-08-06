import { Notice, Plugin, TFile } from 'obsidian';
import { CanvasData, CanvasEdgeData, CanvasTextData, NodeSide } from 'obsidian/canvas';

// Define the structure of a Node
interface Node extends CanvasTextData {
    fontSize: number;
}

// Plugin class definition
export default class HelloWorldPlugin extends Plugin {
    async onload(): Promise<void> {
        this.addCommand({
            id: 'create-canvas',
            name: 'Create Canvas from Note',
            callback: () => {
                const activeFile = this.app.workspace.getActiveFile();
                if (activeFile) {
                    this.createCanvas(activeFile);
                } else {
                    new Notice('No active file found!');
                }
            }
        });
    }

    onunload(): void {}

    async createCanvas(mocFile: TFile): Promise<void> {
        if (!mocFile || !mocFile.parent || !mocFile.basename) {
            new Notice("Invalid file structure.");
            return;
        }

        const parentPath = mocFile.parent ? mocFile.parent.path : '';

        if (!parentPath) {
            new Notice("Invalid parent path.");
            return;
        }

        const canvasFilePath = `${parentPath}/${mocFile.basename} Canvas.canvas`;

        // Default Canvas JSON structure
        const defaultCanvasJSON: CanvasData = {
            edges: [],
            nodes: []
        };

        // Check if canvas file already exists
        let canvasFile;
        try {
            canvasFile = await this.app.vault.create(canvasFilePath, JSON.stringify(defaultCanvasJSON));
        } catch (e) {
            new Notice(`Error creating canvas file: ${canvasFilePath}`);
            return;
        }

        // Read the content of the current note
        let fileContent: string;
        try {
            fileContent = await this.app.vault.read(mocFile);
        } catch (e) {
            new Notice('Error reading the file content.');
            return;
        }

        const { nodes, edges } = this.createNodesAndEdgesFromHeadings(fileContent);

        // Add nodes and edges to canvas
        defaultCanvasJSON.nodes = nodes;
        defaultCanvasJSON.edges = edges;

        // Write updated content to canvas file
        try {
            await this.app.vault.modify(canvasFile, JSON.stringify(defaultCanvasJSON));
        } catch (e) {
            new Notice('Error writing to canvas file.');
            return;
        }

        // Open the canvas file in a new pane
        try {
            await this.app.workspace.getLeaf(true).openFile(canvasFile);
        } catch (e) {
            new Notice('Error opening the canvas file.');
            return;
        }

        new Notice(`Canvas "${mocFile.basename} Canvas.canvas" created with nodes!`);
    }

    createNodesAndEdgesFromHeadings(fileContent: string): { nodes: CanvasTextData[], edges: CanvasEdgeData[] } {
        const lines = fileContent.split('\n');
        const nodes: CanvasTextData[] = [];
        const edges: CanvasEdgeData[] = [];
        let yPos = 0;
        const headingStack: { id: string, level: number }[] = [];
        const spacing = 100; // Adjust spacing between nodes

        lines.forEach((line, index) => {
            try {
                const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
                if (headingMatch) {
                    const level = headingMatch[1]?.length || 0;
                    const text = headingMatch[2] || '';
                    const nodeId = `node-${index}`;

                    // Create the node
                    nodes.push({
                        id: nodeId,
                        x: level * spacing,
                        y: yPos,
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
                            fromSide: "bottom" as NodeSide,
                            toSide: "top" as NodeSide,
                        });
                    }

                    headingStack.push({ id: nodeId, level });

                    yPos += spacing; // Adjust spacing between nodes
                }
            } catch (error) {
                new Notice(`Error processing line ${index + 1}: ${line}`);
            }
        });

        return { nodes, edges };
    }
}