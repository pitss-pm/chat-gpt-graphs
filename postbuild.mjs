import { readFileSync, writeFileSync, readdirSync, existsSync, unlinkSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function removeExports(content) {
  // Remove export statements (can be multiline)
  content = content.replace(/export\s*\{[^}]*\}\s*;?\s*$/gm, '');
  // Also remove standalone export statements
  content = content.replace(/^export\s+.*;?\s*$/gm, '');
  return content.trim();
}

function cleanUTF8(content) {
  // Remove invalid UTF-8 control characters (except tab, newline, carriage return)
  // Keep only printable characters and standard whitespace
  return content
    .split('')
    .filter(c => {
      const code = c.charCodeAt(0);
      // Allow: printable ASCII (32-126), tab (9), newline (10), carriage return (13)
      // Allow: valid UTF-8 multi-byte sequences (128+)
      // Block: control characters except tab/newline/carriage return (0-8, 11-12, 14-31)
      // Block: invalid UTF-8 sequences (128-159 except valid multi-byte)
      if (code >= 32 && code <= 126) return true; // Printable ASCII
      if (code === 9 || code === 10 || code === 13) return true; // Tab, LF, CR
      if (code >= 160) return true; // Valid UTF-8 multi-byte (above Latin-1)
      return false; // Block control characters and invalid sequences
    })
    .join('');
}

function inlineChunks(mainFile, distDir) {
  let content = readFileSync(mainFile, 'utf-8');
  content = cleanUTF8(content); // Clean invalid characters first
  
  // Find all chunk files referenced in __vite__mapDeps
  const chunkFiles = new Set();
  const depMapMatch = content.match(/__vite__mapDeps.*?\[(.*?)\]/s);
  if (depMapMatch) {
    const fileList = depMapMatch[1];
        const files = fileList.match(/"([^"]+\.js)"/g);
    if (files) {
      files.forEach(f => {
        const fileName = f.replace(/"/g, '');
        chunkFiles.add(fileName);
      });
    }
  }
  
  // Also find dynamic import() calls
  const importMatches = content.matchAll(/import\(['"]([^'"]+\.js)['"]\)/g);
  for (const match of importMatches) {
    chunkFiles.add(match[1]);
  }
  
  // Read and inline all chunk files
  const chunkContents = [];
  for (const chunkFile of chunkFiles) {
    const chunkPath = join(distDir, chunkFile);
    if (existsSync(chunkPath)) {
      let chunkContent = readFileSync(chunkPath, 'utf-8');
      chunkContent = cleanUTF8(chunkContent); // Clean invalid characters first
      chunkContent = removeExports(chunkContent);
      chunkContents.push({ file: chunkFile, content: chunkContent });
      console.log(`Inlining chunk: ${chunkFile}`);
    }
  }
  
  // Remove the __vite__mapDeps function and replace dynamic imports
  content = content.replace(/const __vite__mapDeps=[^;]+;/s, '');
  content = content.replace(/__vite__mapDeps\([^)]+\)/g, '[]');
  
  // Replace dynamic imports with inline code
  // This is a simplified approach - in reality, we'd need to handle the async nature
  // For now, we'll append chunks at the end and hope they execute in order
  for (const { file, content: chunkContent } of chunkContents) {
    // Remove the import statement and replace with inline execution
    const importPattern = new RegExp(`import\\(['"]${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]\\)[^;]*;?`, 'g');
    content = content.replace(importPattern, '');
  }
  
  // Append all chunk contents at the end
  if (chunkContents.length > 0) {
    content += '\n\n// Inlined chunks\n';
    chunkContents.forEach(({ content: chunkContent }) => {
      content += '\n' + chunkContent + '\n';
    });
  }
  
  // Remove exports from main content
  content = removeExports(content);
  
  // Wrap in IIFE if not already wrapped
  if (!content.trim().startsWith('(function')) {
    content = `(function() {
  'use strict';
  
${content}
})();`;
  }
  
  // Clean UTF-8 and ensure valid encoding
  content = cleanUTF8(content);
  // Ensure content is valid UTF-8 by round-tripping through Buffer
  const buffer = Buffer.from(content, 'utf-8');
  const cleanedContent = buffer.toString('utf-8');
  // Write without BOM (BOM would be EF BB BF at start)
  writeFileSync(mainFile, cleanedContent, { encoding: 'utf8', flag: 'w' });
  
  // Delete chunk files (they're now inlined)
  chunkFiles.forEach(chunkFile => {
    const chunkPath = join(distDir, chunkFile);
    if (existsSync(chunkPath)) {
      unlinkSync(chunkPath);
      console.log(`Deleted chunk file: ${chunkFile}`);
    }
  });
  
  return chunkFiles.size;
}

// Process contentScript.js
const contentScriptPath = resolve(__dirname, 'dist/contentScript.js');
const distDir = resolve(__dirname, 'dist');

if (existsSync(contentScriptPath)) {
  const chunkCount = inlineChunks(contentScriptPath, distDir);
  console.log(`Processed contentScript.js, inlined ${chunkCount} chunks`);
} else {
  console.warn('contentScript.js not found');
}

// Process background.js (simpler, just remove exports)
const backgroundPath = resolve(__dirname, 'dist/background.js');
if (existsSync(backgroundPath)) {
  let content = readFileSync(backgroundPath, 'utf-8');
  content = cleanUTF8(content); // Clean invalid characters first
  content = removeExports(content);
  if (!content.trim().startsWith('(function')) {
    content = `(function() {
  'use strict';
  
${content}
})();`;
  }
  // Ensure content is valid UTF-8
  const buffer = Buffer.from(content, 'utf-8');
  const cleanedContent = buffer.toString('utf-8');
  // Write without BOM
  writeFileSync(backgroundPath, cleanedContent, { encoding: 'utf8', flag: 'w' });
  console.log('Processed background.js');
}

console.log('Post-build processing complete!');
