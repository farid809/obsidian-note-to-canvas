import { Plugin, Notice, TFile } from 'obsidian';

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
}

// Plugin class definition
export default class HelloWorldPlugin extends Plugin {
    async onload(): Promise<void> {
        console.log('Loading Hello World plugin');

        // Add ribbon icon
        this.addRibbonIcon('dice', 'Create Canvas', async () => {
            const activeFile = this.app.workspace.getActiveFile();
            if (activeFile) {
                const fileName = activeFile.basename;
                const parentPath = activeFile.parent ? activeFile.parent.path : '';

                const canvasFilePath = `${parentPath}/${fileName}.canvas`;

                // Check if the canvas file already exists
                if (await this.app.vault.adapter.exists(canvasFilePath)) {
                    new Notice(`Canvas "${fileName}.canvas" already exists!`);
                    return;
                }

                try {
                    const fileContent = await this.app.vault.read(activeFile);
                    console.log('File content:', fileContent);

                    const { nodes, edges } = this.createNodesAndEdgesFromHeadings(fileContent);
                    console.log('Nodes:', nodes);
                    console.log('Edges:', edges);

                    // Create the canvas file with nodes and edges
                    await this.app.vault.create(canvasFilePath, JSON.stringify({
                        "nodes": nodes,
                        "edges": edges,
                        "version": "1"
                    }));

                    new Notice(`Canvas "${fileName}.canvas" created with nodes!`);
                } catch (error) {
                    console.error("Error creating canvas:", error);
                    new Notice("Failed to create canvas.");
                }
            } else {
                new Notice('No active file found!');
            }
        });
    }

    onunload(): void {
        console.log('Unloading Hello World plugin');
    }

    createNodesAndEdgesFromHeadings(fileContent: string): { nodes: Node[], edges: Edge[] } {
        const lines = fileContent.split('\n');
        const nodes: Node[] = [];
        const edges: Edge[] = [];
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