/**
 * Utility functions for the ChatGPTGraphs extension
 */

export interface GraphNode {
  element: HTMLElement;
  source: string;
  type: 'mermaid' | 'code' | 'rendered';
  id: string;
}

/**
 * Generate a unique ID for a graph node
 */
export function generateGraphId(): string {
  return `chatgpt-graph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if a node has already been processed
 */
export function isProcessed(node: HTMLElement): boolean {
  return node.hasAttribute('data-chatgpt-graphs-processed');
}

/**
 * Mark a node as processed
 */
export function markAsProcessed(node: HTMLElement): void {
  node.setAttribute('data-chatgpt-graphs-processed', 'true');
}

/**
 * Extract Mermaid code from various code block formats
 */
export function extractMermaidCode(element: HTMLElement): string | null {
  // Check if it's already a rendered Mermaid SVG
  if (element.querySelector('svg.mermaid') || element.closest('.chatgpt-graphs-container')) {
    return null; // Already rendered
  }

  // Get the actual code element and its text
  let codeElement: HTMLElement | null = null;
  let text = '';

  // Handle different element types
  if (element.tagName === 'CODE') {
    codeElement = element;
    text = element.textContent?.trim() || '';
  } else if (element.tagName === 'PRE') {
    // For pre elements, get the code inside
    codeElement = element.querySelector('code');
    if (codeElement) {
      text = codeElement.textContent?.trim() || '';
    } else {
      // Sometimes pre contains text directly
      text = element.textContent?.trim() || '';
    }
  } else {
    // For other elements, search for code
    codeElement = element.querySelector('code');
    if (codeElement) {
      text = codeElement.textContent?.trim() || '';
    } else {
      text = element.textContent?.trim() || '';
    }
  }

  if (!text || text.length < 10) {
    return null;
  }

  // Check for explicit mermaid language markers
  if (codeElement) {
    const classes = (codeElement.className || '').toString();
    const hasMermaidClass = 
      classes.includes('mermaid') || 
      classes.includes('language-mermaid') ||
      codeElement.getAttribute('data-language') === 'mermaid' ||
      codeElement.getAttribute('lang') === 'mermaid';
    
    if (hasMermaidClass && looksLikeGraph(text)) {
      return text;
    }
  }

  // Check if text starts with Mermaid diagram keywords (most reliable)
  const mermaidStartPattern = /^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|gantt|pie|erDiagram|journey|gitgraph|mindmap|timeline|quadrantChart|requirement|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment)\s/;
  if (mermaidStartPattern.test(text)) {
    return text;
  }

  // Check for markdown code blocks with mermaid
  const markdownMatch = text.match(/```mermaid\s*\n?([\s\S]*?)```/);
  if (markdownMatch) {
    return markdownMatch[1].trim();
  }

  // More lenient check: if it has Mermaid-like patterns and is in a code block
  if (codeElement && looksLikeGraph(text)) {
    // Additional validation: should have arrows or connections
    if (text.includes('-->') || text.includes('--') || text.includes('->>') || text.includes('participant')) {
      return text;
    }
  }

  return null;
}

/**
 * Sanitize node IDs in Mermaid code
 */
export function sanitizeNodeId(id: string): string {
  // Remove special characters, keep alphanumeric and underscores
  return id.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[0-9]/, '_$&');
}

/**
 * Check if text content looks like a graph structure
 */
export function looksLikeGraph(text: string): boolean {
  const graphPatterns = [
    /^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|gantt|pie|erDiagram|journey|gitgraph|mindmap|timeline|quadrantChart|requirement|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment)/m,
    /->|-->/,
    /\[.*\]|\(.*\)|\{.*\}/,
  ];

  return graphPatterns.some(pattern => pattern.test(text));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if element is visible
 */
export function isElementVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}
