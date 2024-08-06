import { Notice, Plugin, TFile } from 'obsidian';
import { CanvasData, CanvasTextData, CanvasEdgeData, NodeSide } from 'obsidian/canvas';
import cytoscape from 'cytoscape';
import dagre from 'dagre';

// Define the structure of a Node
interface Node extends CanvasTextData {
    fontSize: number;
}

// Define Dagre layout options without extending LayoutOptions
interface DagreLayoutOptions {
    name: 'dagre';
    rankDir: 'TB';
    nodeSep?: number;
    edgeSep?: number;
    rankSep?: number;
}

// Plugin class definition
export default class HelloWorldPlugin extends Plugin {
    async onload(): Promise<void> {
        this.addCommand({
            id: 'create-canvas',
            name: 'Create Canvas from Note',
            checkCallback: (checking: boolean) => {
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

        this.addCommand({
            id: 'group-nodes',
            name: 'Group Nodes from Note',
            checkCallback: (checking: boolean) => {
                const activeFile = this.app.workspace.getActiveFile();
                if (activeFile) {
                    if (!checking) {
                        this.createGroupedCanvas(activeFile);
                    }
                    return true;
                }
                return false;
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

        // Layout the nodes using Cytoscape.js
        this.layoutNodesAndEdgesWithCytoscape(nodes, edges);

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

    async createGroupedCanvas(mocFile: TFile): Promise<void> {
        if (!mocFile || !mocFile.parent || !mocFile.basename) {
            new Notice("Invalid file structure.");
            return;
        }

        const parentPath = mocFile.parent ? mocFile.parent.path : '';

        if (!parentPath) {
            new Notice("Invalid parent path.");
            return;
        }

        const canvasFilePath = `${parentPath}/${mocFile.basename} Grouped Canvas.canvas`;

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

        const nodes = this.createGroupedNodesFromHeadings(fileContent);

        // Add nodes to canvas
        defaultCanvasJSON.nodes = nodes;

        // Layout the nodes using Cytoscape.js
        this.layoutGroupedNodesWithCytoscape(nodes);

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

        new Notice(`Grouped Canvas "${mocFile.basename} Grouped Canvas.canvas" created with nodes!`);
    }

    createNodesAndEdgesFromHeadings(fileContent: string): { nodes: CanvasTextData[], edges: CanvasEdgeData[] } {
        const lines = fileContent.split('\n');
        const nodes: CanvasTextData[] = [];
        const edges: CanvasEdgeData[] = [];
        const headingStack: { id: string, level: number }[] = [];
        const spacing = 100; // Adjust spacing between nodes

        let currentContent: string[] = [];
        let currentNode: CanvasTextData | null = null;

        lines.forEach((line, index) => {
            const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
            if (headingMatch) {
                const level = headingMatch[1].length;
                const text = headingMatch[2];
                const nodeId = `node-${index}`;

                // If there is a current node, finalize its content
                if (currentNode) {
                    (currentNode as any).text = currentContent.join('\n');
                    nodes.push(currentNode);
                }

                // Create the new node
                currentNode = {
                    id: nodeId,
                    x: 0,
                    y: 0,
                    width: 200,
                    height: 50,
                    text: `<h${level}>${text}</h${level}>`,
                    type: "text",
                    fontSize: 16 + (6 - level) * 2,
                };
                currentContent = [];

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
            } else if (currentNode) {
                currentContent.push(line);
            }
        });

        // Finalize the last node
        if (currentNode) {
            (currentNode as any).text = currentContent.join('\n');
            nodes.push(currentNode);
        }

        return { nodes, edges };
    }

    createGroupedNodesFromHeadings(fileContent: string): CanvasTextData[] {
        const lines = fileContent.split('\n');
        const nodes: CanvasTextData[] = [];
        const headingStack: { id: string, level: number }[] = [];
        const spacing = 100; // Adjust spacing between nodes

        let currentContent: string[] = [];
        let currentNode: CanvasTextData | null = null;

        lines.forEach((line, index) => {
            const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
            if (headingMatch) {
                const level = headingMatch[1].length;
                const text = headingMatch[2];
                const nodeId = `node-${index}`;

                // If there is a current node, finalize its content
                if (currentNode) {
                    (currentNode as any).text = currentContent.join('\n');
                    nodes.push(currentNode);
                }

                // Create the new node
                currentNode = {
                    id: nodeId,
                    x: 0,
                    y: 0,
                    width: 200,
                    height: 50,
                    text: `<h${level}>${text}</h${level}>`,
                    type: "text",
                    fontSize: 16 + (6 - level) * 2,
                };
                currentContent = [];

                // Group nodes based on heading nesting
                while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
                    headingStack.pop();
                }

                if (headingStack.length > 0) {
                    const parentNodeId = headingStack[headingStack.length - 1].id;
                    nodes.push({
                        id: `group-${parentNodeId}-${nodeId}`,
                        x: 0,
                        y: 0,
                        width: 200,
                        height: 50,
                        text: '',
                        type: "text",
                        fontSize: 0,
                    });
                }

                headingStack.push({ id: nodeId, level });
            } else if (currentNode) {
                currentContent.push(line);
            }
        });

        // Finalize the last node
        if (currentNode) {
            (currentNode as any).text = currentContent.join('\n');
            nodes.push(currentNode);
        }

        return nodes;
    }

    layoutNodesAndEdgesWithCytoscape(nodes: CanvasTextData[], edges: CanvasEdgeData[]): void {
        const cy = cytoscape({
            elements: [
                ...nodes.map(node => ({
                    data: { id: node.id, width: node.width, height: node.height, label: node.text }
                })),
                ...edges.map(edge => ({
                    data: { id: edge.id, source: edge.fromNode, target: edge.toNode }
                }))
            ],
            layout: {
                name: 'dagre', // You can change this to other layout algorithms like 'grid', 'circle', etc.
                rankDir: 'TB', // Top to bottom
                nodeSep: 50,
                edgeSep: 10,
                rankSep: 50
            } as DagreLayoutOptions,
            style: [
                {
                    selector: 'node',
                    style: {
                        'label': 'data(label)',
                        'width': 'data(width)',
                        'height': 'data(height)'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'line-color': '#ccc'
                    }
                }
            ]
        });

        cy.nodes().forEach((node: cytoscape.NodeSingular) => {
            const data = node.data();
            const canvasNode = nodes.find(n => n.id === data.id);
            if (canvasNode) {
                const position = node.position();
                canvasNode.x = position.x - data.width / 2;
                canvasNode.y = position.y - data.height / 2;
            }
        });
    }

    layoutGroupedNodesWithCytoscape(nodes: CanvasTextData[]): void {
        const cy = cytoscape({
            elements: nodes.map(node => ({
                data: { id: node.id, width: node.width, height: node.height, label: node.text }
            })),
            layout: {
                name: 'dagre', // You can change this to other layout algorithms like 'grid', 'circle', etc.
                rankDir: 'TB', // Top to bottom
                nodeSep: 50,
                edgeSep: 10,
                rankSep: 50
            } as DagreLayoutOptions,
            style: [
                {
                    selector: 'node',
                    style: {
                        'label': 'data(label)',
                        'width': 'data(width)',
                        'height': 'data(height)'
                    }
                }
            ]
        });

        cy.nodes().forEach((node: cytoscape.NodeSingular) => {
            const data = node.data();
            const canvasNode = nodes.find(n => n.id === data.id);
            if (canvasNode) {
                const position = node.position();
                canvasNode.x = position.x - data.width / 2;
                canvasNode.y = position.y - data.height / 2;
            }
        });
    }
}
