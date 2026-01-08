# ChatGPTGraphs Browser Extension

A modern browser extension that automatically detects and renders Mermaid diagrams on ChatGPT and other websites.

## Supported Browsers

| Browser | Status | Download |
|---------|--------|----------|
| Chrome | ✅ Supported | [Releases](../../releases) |
| Firefox | ✅ Supported | [Releases](../../releases) |
| Edge | ✅ Supported | [Releases](../../releases) |
| Opera | ✅ Supported | [Releases](../../releases) |

## Features

- 🎯 **Automatic Detection**: Detects Mermaid syntax in code blocks, markdown, and rendered outputs
- 🎨 **Beautiful Rendering**: Converts Mermaid code into high-quality SVG visuals
- 🔧 **Error Detection & Fixing**: Identifies common errors and provides auto-fix suggestions
- 💬 **User Feedback UI**: Clean, non-intrusive interface with source code toggle
- 🎭 **Dark Mode Support**: Automatically adapts to your system theme
- ⚡ **Performance Optimized**: Processes graphs once, avoids re-render loops
- ⏳ **Smart Loading**: Shows skeleton loader while rendering, waits for ChatGPT to finish typing
- 🎨 **Background Control**: Change graph background color (transparent, white, black, gray)
- 📥 **Export Options**: Download as PNG or copy to clipboard

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
# Build for all browsers
npm run build:all

# Build for specific browser
npm run build:chrome
npm run build:firefox
npm run build:edge
npm run build:opera

# Build with zip files for release
npm run build:release
```

Built extensions will be in:
- `dist-chrome/` - Chrome extension
- `dist-firefox/` - Firefox extension  
- `dist-edge/` - Edge extension
- `dist-opera/` - Opera extension
- `releases/` - Zip files for distribution

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

| Browser | Manifest Version | Notes |
|---------|-----------------|-------|
| Chrome | V3 | Full support |
| Firefox | V3 | Full support (109+) |
| Edge | V3 | Full support |
| Opera | V3 | Full support |

## CI/CD

This project uses GitHub Actions for automated builds:

- **On Push**: Builds extensions for all browsers
- **On Tag (v*)**: Creates a GitHub Release with all browser packages
- **Artifacts**: Each browser's extension is available as a separate artifact

To create a release:
```bash
git tag v1.0.0
git push origin v1.0.0
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
