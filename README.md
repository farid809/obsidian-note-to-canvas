
# Obsidian Note to Canvas

A plugin for Obsidian that allows you to create canvases from note headings. It supports both linking nodes based on heading hierarchy and grouping nodes.

## Features

- **Create Canvas from Note**: Converts the headings of the current note into nodes and links them based on the heading hierarchy.
- **Group Nodes from Note**: Converts the headings of the current note into grouped nodes.
- **Layout Options**: Uses `dagre` for automatic layout of nodes to ensure they do not overlap.

## Installation

### Plugin Users

1. **Using BRAT (Beta Reviewers Auto-update Tool)**:
   - Install the BRAT plugin from the Obsidian Community Plugins.
   - Add the GitHub repository URL of this plugin to BRAT.
   - Enable the plugin through BRAT.

2. **Manual Installation**:
   - Download the latest release from the [Releases](https://github.com/your-repo/obsidian-note-to-canvas/releases) page.
   - Extract the contents into your Obsidian vault's plugins folder: `your-vault/.obsidian/plugins/obsidian-note-to-canvas`.
   - Enable the plugin from the Obsidian Settings under Community Plugins.

### Developers

1. **Clone the Repository**:
   ```sh
   git clone https://github.com/your-repo/obsidian-note-to-canvas.git
   cd obsidian-note-to-canvas
   ```

2. **Install Dependencies**:
   ```sh
   npm install
   ```

3. **Build the Plugin**:
   ```sh
   npm run build
   ```

4. **Link the Plugin**:
   - Copy the contents of the build (`main.js`, `manifest.json`, etc.) to your Obsidian vault's plugins folder: `your-vault/.obsidian/plugins/obsidian-note-to-canvas`.
   - Enable the plugin from the Obsidian Settings under Community Plugins.

## Usage

### Commands

1. **Create Canvas from Note**:
   - Opens the command palette (Ctrl+P or Cmd+P).
   - Type `Create Canvas from Note` and execute the command.
   - The plugin will create a canvas file based on the current note's headings.

2. **Group Nodes from Note**:
   - Opens the command palette (Ctrl+P or Cmd+P).
   - Type `Group Nodes from Note` and execute the command.
   - The plugin will create a grouped canvas file based on the current note's headings.

## Configuration

No additional configuration is required. The plugin uses default settings to generate the canvas files and layout the nodes.

## Development

### Building

To build the plugin, use the following commands:

```sh
npm install
npm run build
```

This will create a `main.js` file that you can use in your Obsidian vault.

### Rollup Configuration

The `rollup.config.mjs` file is used to bundle the plugin:

```javascript
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

export default {
  input: 'main.ts',
  output: {
    file: 'main.js',
    format: 'cjs',
    sourcemap: true
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript(),
    json()
  ],
  external: ['obsidian']
};
```

### TypeScript Configuration

Ensure your `tsconfig.json` includes the necessary settings:

```json
{
  "compilerOptions": {
    "target": "es6",
    "module": "es6",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist"
  },
  "include": ["main.ts", "types.d.ts"]
}
```

### Additional Type Declarations

Create a `types.d.ts` file in your project root to handle type declarations for `cytoscape` and `dagre`:

```typescript
declare module 'cytoscape';
declare module 'cytoscape-dagre';
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on GitHub.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
