# ChatGPTGraphs Chrome Extension

A modern Chrome Extension that automatically detects and renders Mermaid diagrams on ChatGPT and other websites.

## Features

- 🎯 **Automatic Detection**: Detects Mermaid syntax in code blocks, markdown, and rendered outputs
- 🎨 **Beautiful Rendering**: Converts Mermaid code into high-quality SVG visuals
- 🔧 **Error Detection & Fixing**: Identifies common errors and provides auto-fix suggestions
- 💬 **User Feedback UI**: Clean, non-intrusive interface with source code toggle
- 🎭 **Dark Mode Support**: Automatically adapts to your system theme
- ⚡ **Performance Optimized**: Processes graphs once, avoids re-render loops

## Supported Diagram Types

- Flowcharts
- Sequence Diagrams
- Class Diagrams
- State Diagrams
- Gantt Charts
- Pie Charts
- And more Mermaid diagram types

## Installation

### Development

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Production Build

```bash
npm run build
```

The built extension will be in the `dist` folder.

## Development

### Watch Mode

For development with auto-rebuild:

```bash
npm run dev
```

### Type Checking

```bash
npm run type-check
```

## Project Structure

```
ChatGPTGraphs/
├── extension/
│   ├── manifest.json          # Extension manifest (V3)
│   ├── contentScript.ts       # Main content script
│   ├── background.ts          # Background service worker
│   ├── mermaidRenderer.ts     # Mermaid rendering logic
│   ├── errorDetector.ts       # Error detection and fixing
│   ├── utils.ts               # Utility functions
│   └── styles.css             # Extension styles
├── dist/                      # Built extension (generated)
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## How It Works

1. **Detection**: The content script uses a `MutationObserver` to watch for new DOM elements
2. **Extraction**: Mermaid code is extracted from code blocks, markdown, and other sources
3. **Validation**: Code is validated and common errors are detected
4. **Rendering**: Valid Mermaid code is rendered using Mermaid.js
5. **Display**: Rendered graphs are displayed with a watermark and feedback panel

## Permissions

- `activeTab`: Access to the current tab
- `scripting`: Inject content scripts
- `storage`: Store user preferences (future use)
- `host_permissions`: Access to ChatGPT and all URLs for graph detection

## Browser Compatibility

- Chrome (Manifest V3)
- Edge (Manifest V3)
- Other Chromium-based browsers

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
