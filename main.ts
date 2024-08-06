import { Plugin, Notice, TFile } from 'obsidian';

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

                const fileContent = await this.app.vault.read(activeFile);
                const nodes = this.createNodesFromHeadings(fileContent);

                // Create the canvas file with nodes
                await this.app.vault.create(canvasFilePath, JSON.stringify({
                    "nodes": nodes,
                    "edges": [],
                    "version": "1"
                }));

                new Notice(`Canvas "${fileName}.canvas" created with nodes!`);
            } else {
                new Notice('No active file found!');
            }
        });
    }

    onunload(): void {
        console.log('Unloading Hello World plugin');
    }

    createNodesFromHeadings(fileContent: string): object[] {
        const lines = fileContent.split('\n');
        const nodes: object[] = [];
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