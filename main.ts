import { Notice, Plugin, TFile } from 'obsidian';
import { CanvasData, CanvasEdgeData, CanvasTextData } from 'obsidian/canvas';

// Define the structure of a Node
interface Node extends CanvasTextData {
    fontSize: number;
}

// Define the structure of an Edge
interface Edge extends CanvasEdgeData {
    id: string;
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

        // Add hardcoded nodes and edge for troubleshooting
        const hardcodedNode1: CanvasTextData = {
            id: 'hardcoded-node-1',
            x: 100,
            y: 100,
            width: 200,
            height: 50,
            text: 'Hardcoded Node 1',
            type: 'text',
            fontSize: 16,
        };

        const hardcodedNode2: CanvasTextData = {
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

        const edges: CanvasEdgeData[] = [{
            id: 'hardcoded-edge-1-2',
            fromNode: 'hardcoded-node-1',
            toNode: 'hardcoded-node-2',
            fromSide: 'right',
            toSide: 'left',
        }];

        console.log('Adding hardcoded nodes and edge for troubleshooting');

        // Add nodes and edges to canvas
        defaultCanvasJSON.nodes = nodes;
        defaultCanvasJSON.edges = edges;

        // Write updated content to canvas file
        await this.app.vault.modify(canvasFile, JSON.stringify(defaultCanvasJSON));

        // Open the canvas file in a new pane
        await this.app.workspace.getLeaf(true).openFile(canvasFile);

        new Notice(`Canvas "${mocFile.basename} Canvas.canvas" created with nodes!`);
    }
}