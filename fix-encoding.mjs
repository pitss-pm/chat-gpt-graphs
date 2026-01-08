import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function ensureUTF8(filePath) {
  console.log(`Fixing encoding for: ${filePath}`);
  
  // Read as binary first, then decode as UTF-8
  const buffer = readFileSync(filePath);
  
  // Remove BOM if present (EF BB BF)
  let start = 0;
  if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    start = 3;
    console.log('  Removed BOM');
  }
  
  // Decode as UTF-8, replacing invalid sequences
  let content = buffer.slice(start).toString('utf8');
  
  // Remove any invalid UTF-8 control characters (except tab, LF, CR)
  content = content.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
  
  // Validate UTF-8 by encoding and decoding
  const validatedBuffer = Buffer.from(content, 'utf8');
  const validated = validatedBuffer.toString('utf8');
  
  // Write back as binary buffer to ensure exact UTF-8 encoding (no BOM)
  writeFileSync(filePath, validatedBuffer);
  console.log(`  Fixed: ${filePath} (${(validatedBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
}

// Fix contentScript.js
const contentScriptPath = resolve(__dirname, 'dist/contentScript.js');
ensureUTF8(contentScriptPath);

// Fix background.js
const backgroundPath = resolve(__dirname, 'dist/background.js');
ensureUTF8(backgroundPath);

console.log('Encoding fix complete!');
