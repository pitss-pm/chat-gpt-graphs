/**
 * Main content script for ChatGPTGraphs extension
 */

import { extractMermaidCode, isProcessed, markAsProcessed, generateGraphId, looksLikeGraph, debounce } from './utils';
import { renderMermaid, createGraphContainer } from './mermaidRenderer';

// Track processed nodes to avoid re-processing
const processedNodes = new WeakSet<HTMLElement>();

/**
 * Process a single element for Mermaid diagrams
 */
async function processElement(element: HTMLElement): Promise<void> {
  // Skip if already processed
  if (isProcessed(element) || processedNodes.has(element)) {
    return;
  }

  // Extract Mermaid code
  const mermaidCode = extractMermaidCode(element);
  if (!mermaidCode) {
    return;
  }

  console.log('ChatGPTGraphs: Found Mermaid code', { 
    length: mermaidCode.length, 
    preview: mermaidCode.substring(0, 50) 
  });

  // Mark as processed early to avoid duplicate processing
  markAsProcessed(element);
  processedNodes.add(element);

  // Generate unique ID for this graph
  const graphId = generateGraphId();

  // Render the Mermaid diagram
  const result = await renderMermaid(mermaidCode, graphId);

  if (result.success && result.svg) {
    // Create the rendered graph container
    const graphContainer = createGraphContainer(
      graphId,
      element,
      result.svg,
      mermaidCode,
      !!result.fixResult && result.fixResult.errors.length > 0,
      result.fixResult
    );

    // Insert the rendered graph
    // Try to insert after the original element
    const parent = element.parentElement;
    if (parent) {
      // Insert after the code block
      if (element.nextSibling) {
        parent.insertBefore(graphContainer, element.nextSibling);
      } else {
        parent.appendChild(graphContainer);
      }
    } else {
      // Fallback: insert after the element itself
      element.after(graphContainer);
    }
  } else if (result.error) {
    // Show error message
    const errorContainer = document.createElement('div');
    errorContainer.className = 'chatgpt-graphs-error-container';
    errorContainer.innerHTML = `
      <div class="chatgpt-graphs-error-message">
        ⚠️ Failed to render Mermaid diagram: ${result.error}
      </div>
      ${result.fixResult && result.fixResult.suggestions.length > 0 ? `
        <div class="chatgpt-graphs-suggestions">
          <strong>Suggestions:</strong>
          <ul>
            ${result.fixResult.suggestions.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    `;
    
    const parent = element.parentElement;
    if (parent) {
      if (element.nextSibling) {
        parent.insertBefore(errorContainer, element.nextSibling);
      } else {
        parent.appendChild(errorContainer);
      }
    } else {
      element.after(errorContainer);
    }
  }
}

/**
 * Scan the DOM for Mermaid diagrams
 */
function scanForGraphs(root: HTMLElement = document.body): void {
  // Find all pre elements (ChatGPT uses pre > code structure)
  const preBlocks = root.querySelectorAll('pre');
  
  let foundCount = 0;
  let processedCount = 0;
  
  preBlocks.forEach(block => {
    const element = block as HTMLElement;
    
    // Skip if already processed
    if (isProcessed(element) || processedNodes.has(element)) {
      return;
    }
    
    // Skip if it's inside our own container
    if (element.closest('.chatgpt-graphs-container')) {
      return;
    }
    
    const mermaidCode = extractMermaidCode(element);
    if (mermaidCode) {
      foundCount++;
      processElement(element).catch(err => {
        console.error('ChatGPTGraphs: Error processing element', err, element);
      });
      processedCount++;
    }
  });
  
  if (foundCount > 0) {
    console.log(`ChatGPTGraphs: Found ${foundCount} Mermaid diagram(s) to process`);
  }
}

/**
 * Initialize the content script
 */
function init(): void {
  // Initial scan
  scanForGraphs();

  // Set up MutationObserver for dynamic content (ChatGPT is SPA-based)
  const observer = new MutationObserver((mutations: MutationRecord[]) => {
    let shouldScan = false;
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          // Check if it's a pre or code element, or contains one
          if (element.tagName === 'PRE' || 
              element.tagName === 'CODE' || 
              element.querySelector('pre') || 
              element.querySelector('code')) {
            shouldScan = true;
          }
        }
      });
    });
    
    if (shouldScan) {
      // Use debounce but also scan immediately for pre elements
      setTimeout(() => scanForGraphs(), 100);
    }
  });

  // Start observing with more aggressive settings
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
  });
  
  // Expose manual scan function for debugging
  (window as any).chatgptGraphsScan = () => {
    console.log('ChatGPTGraphs: Manual scan triggered');
    scanForGraphs();
  };

  // Also listen for ChatGPT-specific events if available
  if (window.addEventListener) {
    // Re-scan on scroll (for lazy-loaded content)
    let scrollTimeout: ReturnType<typeof setTimeout>;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        scanForGraphs();
      }, 500);
    }, { passive: true });
  }

  console.log('ChatGPTGraphs: Content script initialized');
  console.log('ChatGPTGraphs: Scanning for Mermaid diagrams...');
  
  // Multiple scans to catch content at different load times
  const scanDelays = [100, 500, 1000, 2000, 5000];
  scanDelays.forEach(delay => {
    setTimeout(() => {
      scanForGraphs();
    }, delay);
  });
  
  // Also scan when page becomes visible (for lazy-loaded content)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      setTimeout(() => scanForGraphs(), 500);
    }
  });
  
  // Scan on any user interaction (ChatGPT loads content on scroll/interaction)
  ['scroll', 'click', 'keydown'].forEach(eventType => {
    let timeout: ReturnType<typeof setTimeout>;
    document.addEventListener(eventType, () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => scanForGraphs(), 300);
    }, { passive: true });
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
