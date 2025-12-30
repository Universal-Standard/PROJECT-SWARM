#!/usr/bin/env node

/**
 * Script to replace console.log/error/warn with structured logger
 * Run: node scripts/fix-console-calls.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

const filesToFix = [
  // Server files (priority)
  'server/lib/scheduler.ts',
  'server/lib/webhooks.ts',
  'server/lib/workflow-version.ts',
  'server/ai/orchestrator.ts',
  'server/ai/executor.ts',
  'server/routes.ts',
  'server/scheduler.ts',
  'server/websocket.ts',
  'server/vite.ts',
  'server/auth/github-oauth.ts',
  'server/auth/encryption.ts',
  'server/middleware/error-handler.ts',
  'server/middleware/github-auth.ts',
  'server/seed.ts',
];

function fixConsoleInFile(filePath) {
  console.log(`Processing: ${filePath}`);

  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  // Check if logger is already imported
  const hasLoggerImport = content.includes('from "./logger"') || content.includes('from "../lib/logger"');

  // Determine correct import path
  let importPath = './logger';
  if (filePath.startsWith('server/lib/')) {
    importPath = './logger';
  } else if (filePath.startsWith('server/ai/')) {
    importPath = '../lib/logger';
  } else if (filePath.startsWith('server/middleware/')) {
    importPath = '../lib/logger';
  } else if (filePath.startsWith('server/auth/')) {
    importPath = '../lib/logger';
  } else if (filePath.startsWith('server/')) {
    importPath = './lib/logger';
  }

  // Add logger import if not present
  if (!hasLoggerImport && (content.includes('console.log') || content.includes('console.error') || content.includes('console.warn'))) {
    // Find the last import statement
    const importRegex = /^import .+ from .+;$/gm;
    const imports = content.match(importRegex);
    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      content = content.slice(0, lastImportIndex + lastImport.length) +
                `\nimport { logger } from "${importPath}";` +
                content.slice(lastImportIndex + lastImport.length);
      modified = true;
    }
  }

  // Replace console.log with logger.info
  const logRegex = /console\.log\((\[.*?\]\s*)?(.+)\);/g;
  content = content.replace(logRegex, (match, prefix, message) => {
    modified = true;
    // Extract message and context
    if (prefix) {
      // Has prefix like [Scheduler]
      const cleanPrefix = prefix.replace(/[\[\]]/g, '').trim();
      return `logger.info(${message});`;
    }
    return `logger.info(${message});`;
  });

  // Replace console.error with logger.error
  const errorRegex = /console\.error\((\[.*?\]\s*)?(.+?),\s*(\w+)\);/g;
  content = content.replace(errorRegex, (match, prefix, message, errorVar) => {
    modified = true;
    return `logger.error(${message}, ${errorVar});`;
  });

  // Replace simple console.error
  const simpleErrorRegex = /console\.error\((.+?)\);/g;
  content = content.replace(simpleErrorRegex, (match, message) => {
    if (!match.includes('logger.error')) {
      modified = true;
      return `logger.error(${message});`;
    }
    return match;
  });

  // Replace console.warn with logger.warn
  content = content.replace(/console\.warn\((.+)\);/g, (match, message) => {
    modified = true;
    return `logger.warn(${message});`;
  });

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Fixed: ${filePath}`);
    return 1;
  }

  console.log(`⏭️  Skipped: ${filePath} (no changes needed)`);
  return 0;
}

let totalFixed = 0;
for (const file of filesToFix) {
  try {
    totalFixed += fixConsoleInFile(file);
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
}

console.log(`\n✨ Complete! Fixed ${totalFixed} files.`);
