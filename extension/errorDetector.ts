/**
 * Mermaid error detection and auto-fix utilities
 */

export interface MermaidError {
  type: 'syntax' | 'node' | 'arrow' | 'unsupported' | 'unknown';
  message: string;
  line?: number;
  suggestion?: string;
}

export interface FixResult {
  fixed: boolean;
  fixedCode?: string;
  errors: MermaidError[];
  suggestions: string[];
}

/**
 * Detect common Mermaid syntax errors
 */
export function detectErrors(code: string): MermaidError[] {
  const errors: MermaidError[] = [];
  const lines = code.split('\n');

  // Check for unsupported diagram types
  const supportedTypes = [
    'flowchart', 'graph', 'sequenceDiagram', 'classDiagram',
    'stateDiagram', 'gantt', 'pie', 'erDiagram', 'journey',
    'gitgraph', 'mindmap', 'timeline', 'quadrantChart',
    'requirement', 'C4Context', 'C4Container', 'C4Component',
    'C4Dynamic', 'C4Deployment'
  ];

  const firstLine = lines[0]?.trim() || '';
  const diagramType = firstLine.match(/^(\w+)/)?.[1];
  
  // Only report unsupported if it's clearly a diagram type declaration
  if (diagramType && !supportedTypes.includes(diagramType) && firstLine.length < 50) {
    errors.push({
      type: 'unsupported',
      message: `Unsupported diagram type: ${diagramType}`,
      line: 1,
      suggestion: `Try one of: ${supportedTypes.slice(0, 5).join(', ')}`
    });
  }

  // Check for invalid node names (containing special characters without quotes)
  lines.forEach((line, index) => {
    // Match node definitions like: A[Label] or A --> B
    const nodeDefMatch = line.match(/(\w+)\s*\[/);
    if (nodeDefMatch) {
      const nodeId = nodeDefMatch[1];
      if (!/^[a-zA-Z0-9_]+$/.test(nodeId)) {
        errors.push({
          type: 'node',
          message: `Invalid node ID: ${nodeId}. Node IDs should contain only alphanumeric characters and underscores.`,
          line: index + 1,
          suggestion: `Use a valid ID like: ${nodeId.replace(/[^a-zA-Z0-9_]/g, '_')}`
        });
      }
    }

    // Check for missing arrows in connections
    if (line.includes('--') && !line.match(/--[->]|-->|==>|==>/)) {
      errors.push({
        type: 'arrow',
        message: 'Incomplete arrow syntax. Use --> or ---> for connections.',
        line: index + 1,
        suggestion: 'Replace -- with --> or --->'
      });
    }
  });

  // Check for common syntax typos
  if (code.includes('flowchart') && !code.includes('-->') && !code.includes('---')) {
    errors.push({
      type: 'syntax',
      message: 'Flowchart detected but no connections found.',
      suggestion: 'Add connections using --> or ---'
    });
  }

  return errors;
}

/**
 * Attempt to auto-fix common Mermaid errors
 */
export function attemptAutoFix(code: string, errors: MermaidError[]): FixResult {
  let fixedCode = code;
  const suggestions: string[] = [];
  let fixed = false;

  // Fix invalid node IDs
  const nodeIdErrors = errors.filter(e => e.type === 'node');
  if (nodeIdErrors.length > 0) {
    fixedCode = fixedCode.replace(/(\w+)\s*\[/g, (match, nodeId) => {
      const sanitized = nodeId.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[0-9]/, '_$&');
      if (sanitized !== nodeId) {
        fixed = true;
        return `${sanitized}[`;
      }
      return match;
    });
  }

  // Fix incomplete arrows
  const arrowErrors = errors.filter(e => e.type === 'arrow');
  if (arrowErrors.length > 0) {
    fixedCode = fixedCode.replace(/--(?!>)/g, '-->');
    fixed = true;
  }

  // Auto-quote labels with special characters
  fixedCode = fixedCode.replace(/\[([^\]]*[^\w\s][^\]]*)\]/g, (match, label) => {
    if (!label.startsWith('"') && !label.endsWith('"')) {
      fixed = true;
      return `["${label}"]`;
    }
    return match;
  });

  // Generate suggestions for unfixable errors
  errors.forEach(error => {
    if (error.suggestion) {
      suggestions.push(`Line ${error.line || '?'}: ${error.suggestion}`);
    }
  });

  return {
    fixed,
    fixedCode: fixed ? fixedCode : undefined,
    errors: errors.filter(e => !fixed || (e.type !== 'node' && e.type !== 'arrow')),
    suggestions
  };
}

/**
 * Validate Mermaid code and return fix result
 */
export function validateAndFix(code: string): FixResult {
  const errors = detectErrors(code);
  if (errors.length === 0) {
    return {
      fixed: false,
      errors: [],
      suggestions: []
    };
  }

  return attemptAutoFix(code, errors);
}
