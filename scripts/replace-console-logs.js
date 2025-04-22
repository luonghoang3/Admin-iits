/**
 * Script to replace console.log with logger.log in the codebase
 * 
 * Usage:
 * node scripts/replace-console-logs.js
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Configuration
const ROOT_DIR = path.resolve(__dirname, '../frontend/src');
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const IGNORE_DIRS = ['node_modules', '.next', 'out', 'build', 'dist'];
const LOGGER_IMPORT = "import logger from '@/lib/logger'";

// Regular expressions
const consoleLogRegex = /console\.log\(/g;
const consoleErrorRegex = /console\.error\(/g;
const consoleWarnRegex = /console\.warn\(/g;
const consoleInfoRegex = /console\.info\(/g;
const consoleDebugRegex = /console\.debug\(/g;

// Check if a file already has logger import
function hasLoggerImport(content) {
  return content.includes("import logger from '@/lib/logger'") || 
         content.includes('import logger from "@/lib/logger"');
}

// Add logger import to a file
function addLoggerImport(content) {
  // Find the last import statement
  const importRegex = /^import .+$/gm;
  const imports = [...content.matchAll(importRegex)];
  
  if (imports.length === 0) {
    // No imports found, add at the beginning
    return `${LOGGER_IMPORT}\n\n${content}`;
  }
  
  // Find the last import statement
  const lastImport = imports[imports.length - 1];
  const lastImportIndex = lastImport.index + lastImport[0].length;
  
  // Insert logger import after the last import
  return content.slice(0, lastImportIndex) + 
         '\nimport logger from \'@/lib/logger\'' + 
         content.slice(lastImportIndex);
}

// Replace console.* with logger.*
function replaceConsoleCalls(content) {
  let modified = content;
  let hasChanges = false;
  
  // Replace console.log
  if (consoleLogRegex.test(modified)) {
    modified = modified.replace(consoleLogRegex, 'logger.log(');
    hasChanges = true;
  }
  
  // Replace console.error
  if (consoleErrorRegex.test(modified)) {
    modified = modified.replace(consoleErrorRegex, 'logger.error(');
    hasChanges = true;
  }
  
  // Replace console.warn
  if (consoleWarnRegex.test(modified)) {
    modified = modified.replace(consoleWarnRegex, 'logger.warn(');
    hasChanges = true;
  }
  
  // Replace console.info
  if (consoleInfoRegex.test(modified)) {
    modified = modified.replace(consoleInfoRegex, 'logger.info(');
    hasChanges = true;
  }
  
  // Replace console.debug
  if (consoleDebugRegex.test(modified)) {
    modified = modified.replace(consoleDebugRegex, 'logger.debug(');
    hasChanges = true;
  }
  
  return { modified, hasChanges };
}

// Process a single file
async function processFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Replace console.* calls
    const { modified, hasChanges } = replaceConsoleCalls(content);
    
    if (hasChanges) {
      console.log(`Processing: ${filePath}`);
      
      // Add logger import if needed
      let finalContent = modified;
      if (!hasLoggerImport(finalContent)) {
        finalContent = addLoggerImport(finalContent);
      }
      
      // Write changes back to file
      await writeFile(filePath, finalContent, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return false;
  }
}

// Recursively scan directory for files
async function scanDirectory(dir) {
  let filesProcessed = 0;
  let filesChanged = 0;
  
  async function scan(currentDir) {
    const entries = await readdir(currentDir);
    
    for (const entry of entries) {
      // Skip ignored directories
      if (IGNORE_DIRS.includes(entry)) continue;
      
      const fullPath = path.join(currentDir, entry);
      const stats = await stat(fullPath);
      
      if (stats.isDirectory()) {
        // Recursively scan subdirectories
        await scan(fullPath);
      } else if (stats.isFile() && EXTENSIONS.includes(path.extname(fullPath))) {
        // Process file if it has a matching extension
        filesProcessed++;
        const changed = await processFile(fullPath);
        if (changed) filesChanged++;
      }
    }
  }
  
  await scan(dir);
  return { filesProcessed, filesChanged };
}

// Main function
async function main() {
  console.log('Starting console.log replacement...');
  console.log(`Scanning directory: ${ROOT_DIR}`);
  
  try {
    const { filesProcessed, filesChanged } = await scanDirectory(ROOT_DIR);
    console.log(`\nSummary:`);
    console.log(`- Files processed: ${filesProcessed}`);
    console.log(`- Files changed: ${filesChanged}`);
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
main();
