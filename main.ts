import { Notice, Plugin, TFile } from 'obsidian';
import { CanvasData, CanvasEdgeData, CanvasTextData } from 'obsidian/canvas';

// Define the structure of a Node
interface Node {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    type: string;
    subtype: string;
    fontSize: number;
}

// Define the structure of an Edge
interface Edge {
    fromNode: string;
    toNode: string;
    id: string;
    fromSide: string;
    toSide: string;
}

// Plugin class definition
export default class HelloWorldPlugin extends Plugin {
    async onload(): Promise<void> {
        console.log('Loading Hello World plugin');

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

    onunload(): void {
        console.log('Unloading Hello World plugin');
    }

    async createCanvas(mocFile: TFile): Promise<void> {
        const parentPath = mocFile.parent ? mocFile.parent.path : '';

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
            console.error(e);
            new Notice(`Error creating canvas file: ${canvasFilePath}`);
            return;
        }

        const fileContent = await this.app.vault.read(mocFile);
        const { nodes, edges } = this.createNodesAndEdgesFromHeadings(fileContent);

        console.log('Nodes:', nodes);
        console.log('Edges:', edges);

        // Add nodes and edges to canvas
        defaultCanvasJSON.nodes = nodes as CanvasTextData[];
        defaultCanvasJSON.edges = edges as CanvasEdgeData[];

        // Write updated content to canvas file
        await this.app.vault.modify(canvasFile, JSON.stringify(defaultCanvasJSON));

        // Open the canvas file in a new pane
        await this.app.workspace.getLeaf(true).openFile(canvasFile);

        new Notice(`Canvas "${mocFile.basename} Canvas.canvas" created with nodes!`);
    }

    createNodesAndEdgesFromHeadings(fileContent: string): { nodes: CanvasTextData[], edges: CanvasEdgeData[] } {
        const lines = fileContent.split('\n');
        const nodes: CanvasTextData[] = [];
        const edges: CanvasEdgeData[] = [];
        let yPos = 0;
        const headingStack: { id: string, level: number }[] = [];

        lines.forEach((line, index) => {
            const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
            if (headingMatch) {
                const level = headingMatch[1]?.length || 0;
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