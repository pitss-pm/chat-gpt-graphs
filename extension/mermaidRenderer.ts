/**
 * Mermaid rendering module
 */

import mermaid from 'mermaid';
import { validateAndFix, FixResult } from './errorDetector';

let mermaidInitialized = false;

/**
 * Detect if the page is in dark mode
 */
function isDarkMode(): boolean {
  // Check multiple ways to detect dark mode
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return true;
  }
  
  // Check ChatGPT's dark mode class
  const html = document.documentElement;
  if (html.classList.contains('dark') || html.classList.contains('dark-mode')) {
    return true;
  }
  
  // Check computed background color
  const bodyStyle = window.getComputedStyle(document.body);
  const bgColor = bodyStyle.backgroundColor;
  if (bgColor) {
    // Parse RGB and check if it's dark (sum < 400)
    const rgbMatch = bgColor.match(/\d+/g);
    if (rgbMatch && rgbMatch.length >= 3) {
      const r = parseInt(rgbMatch[0]);
      const g = parseInt(rgbMatch[1]);
      const b = parseInt(rgbMatch[2]);
      const brightness = r + g + b;
      return brightness < 400;
    }
  }
  
  return false;
}

/**
 * Initialize Mermaid with configuration
 */
export async function initializeMermaid(): Promise<void> {
  if (mermaidInitialized) return;

  const darkMode = isDarkMode();
  const theme = darkMode ? 'dark' : 'default';

  mermaid.initialize({
    startOnLoad: false,
    theme: theme,
    securityLevel: 'loose',
    fontFamily: 'inherit',
    themeVariables: darkMode ? {
      primaryColor: '#10a37f',
      primaryTextColor: '#e5e7eb',
      primaryBorderColor: '#10a37f',
      lineColor: '#9ca3af',
      secondaryColor: '#1f2937',
      tertiaryColor: '#111827',
      background: '#1f2937',
      mainBkg: '#1f2937',
      secondBkg: '#111827',
      textColor: '#e5e7eb',
      textInvertColor: '#1f2937',
      border1: '#374151',
      border2: '#4b5563',
      noteBkgColor: '#111827',
      noteTextColor: '#e5e7eb',
      noteBorderColor: '#374151',
      actorBkg: '#1f2937',
      actorBorder: '#10a37f',
      actorTextColor: '#e5e7eb',
      actorLineColor: '#9ca3af',
      labelBoxBkgColor: '#111827',
      labelBoxBorderColor: '#374151',
      labelTextColor: '#e5e7eb',
      loopTextColor: '#e5e7eb',
      activationBorderColor: '#10a37f',
      activationBkgColor: '#111827',
      sequenceNumberColor: '#1f2937',
      sectionBkgColor: '#111827',
      altSectionBkgColor: '#1f2937',
      sectionBkgColor2: '#111827',
      excludeBkgColor: '#7f1d1d',
      taskBorderColor: '#10a37f',
      taskBkgColor: '#1f2937',
      taskTextColor: '#e5e7eb',
      taskTextLightColor: '#9ca3af',
      taskTextOutsideColor: '#e5e7eb',
      taskTextClickableColor: '#10a37f',
      activeTaskBorderColor: '#10a37f',
      activeTaskBkgColor: '#111827',
      gridColor: '#374151',
      doneTaskBkgColor: '#065f46',
      doneTaskBorderColor: '#10a37f',
      critBorderColor: '#ef4444',
      critBkgColor: '#7f1d1d',
      todayLineColor: '#f59e0b',
      labelColor: '#e5e7eb',
      errorBkgColor: '#7f1d1d',
      errorTextColor: '#fca5a5',
    } : undefined,
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: 'basis'
    },
    sequence: {
      diagramMarginX: 50,
      diagramMarginY: 10,
      actorMargin: 50,
      width: 150,
      height: 65,
      boxMargin: 10,
      boxTextMargin: 5,
      noteMargin: 10,
      messageMargin: 35,
      mirrorActors: true,
      bottomMarginAdj: 1,
      useMaxWidth: true,
      rightAngles: false,
      showSequenceNumbers: false
    },
    gantt: {
      useMaxWidth: true,
      leftPadding: 75
    }
  });

  mermaidInitialized = true;
}

/**
 * Render a Mermaid diagram
 */
export async function renderMermaid(
  code: string,
  containerId: string
): Promise<{ success: boolean; svg?: string; error?: string; fixResult?: FixResult }> {
  await initializeMermaid();

  // Validate and attempt to fix errors
  const fixResult = validateAndFix(code);
  let codeToRender = code;

  if (fixResult.fixed && fixResult.fixedCode) {
    codeToRender = fixResult.fixedCode;
  }

  try {
    // Create a temporary container for rendering
    const tempDiv = document.createElement('div');
    tempDiv.id = containerId;
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    document.body.appendChild(tempDiv);

    // Render the diagram
    const { svg } = await mermaid.render(containerId, codeToRender);
    
    // Clean up - use safer method
    try {
      if (tempDiv.parentNode) {
        tempDiv.parentNode.removeChild(tempDiv);
      }
    } catch (e) {
      // Ignore cleanup errors
    }
    
    // Also clean up any orphaned mermaid elements
    const orphanedElements = document.querySelectorAll(`#${containerId}, #d${containerId}`);
    orphanedElements.forEach(el => {
      try {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      } catch (e) {
        // Ignore
      }
    });

    return {
      success: true,
      svg,
      fixResult: fixResult.errors.length > 0 ? fixResult : undefined
    };
  } catch (error: any) {
    // Clean up on error too
    const orphanedElements = document.querySelectorAll(`#${containerId}, #d${containerId}`);
    orphanedElements.forEach(el => {
      try {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      } catch (e) {
        // Ignore
      }
    });
    
    return {
      success: false,
      error: error.message || 'Failed to render Mermaid diagram',
      fixResult
    };
  }
}

/**
 * Convert SVG to PNG and download
 */
async function downloadGraphAsPNG(svgElement: SVGElement, filename: string, backgroundColor: string): Promise<void> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const svgData = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw SVG
    ctx.drawImage(img, 0, 0);
    
    // Download
    canvas.toBlob((blob) => {
      if (blob) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
      }
    });
    
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

/**
 * Copy SVG as PNG to clipboard
 */
async function copyGraphToClipboard(svgElement: SVGElement, backgroundColor: string): Promise<void> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const svgData = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = async () => {
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw SVG
    ctx.drawImage(img, 0, 0);
    
    // Copy to clipboard
    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          console.log('Graph copied to clipboard');
        } catch (err) {
          console.error('Failed to copy to clipboard:', err);
        }
      }
    });
    
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

/**
 * Create the rendered graph container with watermark and UI
 */
export function createGraphContainer(
  graphId: string,
  originalElement: HTMLElement,
  svg: string,
  sourceCode: string,
  hasErrors: boolean = false,
  fixResult?: FixResult
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'chatgpt-graphs-container';
  container.setAttribute('data-graph-id', graphId);

  // Create wrapper for the SVG
  const svgWrapper = document.createElement('div');
  svgWrapper.className = 'chatgpt-graphs-svg-wrapper';
  svgWrapper.innerHTML = svg;
  svgWrapper.style.backgroundColor = 'transparent';

  // Add watermark
  const watermark = document.createElement('div');
  watermark.className = 'chatgpt-graphs-watermark';
  watermark.textContent = 'Rendered by ChatGPTGraphs';
  svgWrapper.appendChild(watermark);

  container.appendChild(svgWrapper);

  // Create controls panel (background color, download, copy)
  const controlsPanel = document.createElement('div');
  controlsPanel.className = 'chatgpt-graphs-controls-panel';
  
  // Background color picker
  const bgColorGroup = document.createElement('div');
  bgColorGroup.className = 'chatgpt-graphs-control-group';
  
  const bgColorLabel = document.createElement('label');
  bgColorLabel.textContent = 'Background:';
  bgColorLabel.className = 'chatgpt-graphs-control-label';
  
  const bgColorButtons = document.createElement('div');
  bgColorButtons.className = 'chatgpt-graphs-color-buttons';
  
  const colors = [
    { label: 'None', value: 'transparent' },
    { label: 'White', value: '#ffffff' },
    { label: 'Black', value: '#000000' },
    { label: 'Gray', value: '#f3f4f6' }
  ];
  
  colors.forEach(({ label, value }) => {
    const btn = document.createElement('button');
    btn.className = 'chatgpt-graphs-color-btn';
    btn.textContent = label;
    if (value === 'transparent') btn.classList.add('active');
    btn.addEventListener('click', () => {
      svgWrapper.style.backgroundColor = value;
      bgColorButtons.querySelectorAll('.chatgpt-graphs-color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
    bgColorButtons.appendChild(btn);
  });
  
  bgColorGroup.appendChild(bgColorLabel);
  bgColorGroup.appendChild(bgColorButtons);
  controlsPanel.appendChild(bgColorGroup);
  
  // Download button
  const downloadBtn = document.createElement('button');
  downloadBtn.className = 'chatgpt-graphs-icon-btn';
  downloadBtn.innerHTML = '⬇️ Download';
  downloadBtn.setAttribute('aria-label', 'Download graph as PNG');
  downloadBtn.addEventListener('click', async () => {
    const svgElement = svgWrapper.querySelector('svg');
    if (svgElement) {
      const bgColor = svgWrapper.style.backgroundColor || 'transparent';
      await downloadGraphAsPNG(svgElement as SVGElement, `mermaid-graph-${graphId}.png`, bgColor);
    }
  });
  controlsPanel.appendChild(downloadBtn);
  
  // Copy button
  const copyBtn = document.createElement('button');
  copyBtn.className = 'chatgpt-graphs-icon-btn';
  copyBtn.innerHTML = '📋 Copy';
  copyBtn.setAttribute('aria-label', 'Copy graph to clipboard');
  copyBtn.addEventListener('click', async () => {
    const svgElement = svgWrapper.querySelector('svg');
    if (svgElement) {
      const bgColor = svgWrapper.style.backgroundColor || 'transparent';
      await copyGraphToClipboard(svgElement as SVGElement, bgColor);
      copyBtn.innerHTML = '✓ Copied!';
      setTimeout(() => {
        copyBtn.innerHTML = '📋 Copy';
      }, 2000);
    }
  });
  controlsPanel.appendChild(copyBtn);
  
  container.appendChild(controlsPanel);

  // Create feedback panel
  const feedbackPanel = document.createElement('div');
  feedbackPanel.className = 'chatgpt-graphs-feedback-panel';
  
  const statusText = document.createElement('span');
  statusText.className = 'chatgpt-graphs-status';
  statusText.textContent = hasErrors 
    ? '⚠️ Rendered with warnings' 
    : '✓ Rendered by ChatGPTGraphs';
  feedbackPanel.appendChild(statusText);

  // Toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'chatgpt-graphs-toggle';
  toggleBtn.textContent = 'View Source';
  toggleBtn.setAttribute('aria-label', 'Toggle between rendered graph and source code');
  
  let showingSource = false;
  toggleBtn.addEventListener('click', () => {
    showingSource = !showingSource;
    if (showingSource) {
      svgWrapper.style.display = 'none';
      sourceCodeDisplay.style.display = 'block';
      toggleBtn.textContent = 'View Rendered';
    } else {
      svgWrapper.style.display = 'block';
      sourceCodeDisplay.style.display = 'none';
      toggleBtn.textContent = 'View Source';
    }
  });
  feedbackPanel.appendChild(toggleBtn);

  // Source code display (hidden by default)
  const sourceCodeDisplay = document.createElement('pre');
  sourceCodeDisplay.className = 'chatgpt-graphs-source';
  sourceCodeDisplay.style.display = 'none';
  const codeElement = document.createElement('code');
  codeElement.textContent = sourceCode;
  sourceCodeDisplay.appendChild(codeElement);
  container.appendChild(sourceCodeDisplay);

  // Error messages and fix button
  if (hasErrors && fixResult) {
    const errorPanel = document.createElement('div');
    errorPanel.className = 'chatgpt-graphs-error-panel';
    
    fixResult.errors.forEach(error => {
      const errorMsg = document.createElement('div');
      errorMsg.className = 'chatgpt-graphs-error-message';
      errorMsg.textContent = `⚠️ ${error.message}`;
      if (error.suggestion) {
        const suggestion = document.createElement('div');
        suggestion.className = 'chatgpt-graphs-suggestion';
        suggestion.textContent = `💡 ${error.suggestion}`;
        errorMsg.appendChild(suggestion);
      }
      errorPanel.appendChild(errorMsg);
    });

    if (fixResult.suggestions.length > 0) {
      const suggestionsList = document.createElement('ul');
      suggestionsList.className = 'chatgpt-graphs-suggestions';
      fixResult.suggestions.forEach(suggestion => {
        const li = document.createElement('li');
        li.textContent = suggestion;
        suggestionsList.appendChild(li);
      });
      errorPanel.appendChild(suggestionsList);
    }

    if (fixResult.fixed && fixResult.fixedCode) {
      const fixBtn = document.createElement('button');
      fixBtn.className = 'chatgpt-graphs-fix-btn';
      fixBtn.textContent = 'Fix & Re-render';
      fixBtn.addEventListener('click', async () => {
        if (fixResult.fixedCode) {
          const result = await renderMermaid(fixResult.fixedCode, `${graphId}-fixed`);
          if (result.success && result.svg) {
            svgWrapper.innerHTML = result.svg;
            svgWrapper.appendChild(watermark);
            errorPanel.style.display = 'none';
            statusText.textContent = '✓ Rendered by ChatGPTGraphs';
          }
        }
      });
      errorPanel.appendChild(fixBtn);
    }

    container.appendChild(errorPanel);
  }

  return container;
}
