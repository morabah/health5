#!/usr/bin/env node

/**
 * Firebase Best Practices Auto-Fixer
 * 
 * This script automatically applies best practices for Firebase and API mode
 * usage across the project based on our Cursor rules.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const TARGET_DIRECTORIES = [
  path.resolve(__dirname, '../src/lib'),
  path.resolve(__dirname, '../src/components'),
  path.resolve(__dirname, '../src/app'),
  path.resolve(__dirname, '../src/services'),
  path.resolve(__dirname, '../src/hooks'),
  path.resolve(__dirname, '../src/context'),
];

// Color codes for output
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Transformations to apply
const TRANSFORMATIONS = [
  {
    name: 'Fix direct localStorage API mode access',
    pattern: /localStorage\.getItem\(['"]apiMode['"]\)/g,
    replacement: 'getApiMode()',
    requiredImport: "import { getApiMode } from '@/config/appConfig';",
    excludeFiles: ['appConfig.ts'],
  },
  {
    name: 'Fix direct localStorage API mode setting',
    pattern: /localStorage\.setItem\(['"]apiMode['"], ['"](live|mock)['"]\)/g,
    replacement: "setApiMode('$1')",
    requiredImport: "import { setApiMode } from '@/config/appConfig';",
    excludeFiles: ['appConfig.ts', 'ClientInit.tsx'],
  },
  {
    name: 'Fix Firebase imports',
    pattern: /import\s+\{([^}]*)\}\s+from\s+['"]@\/lib\/firebaseClient['"]/g,
    replacement: (match, imports) => {
      // Ensure we're importing the same things but from the improved client
      return `import {${imports}} from '@/lib/improvedFirebaseClient'`;
    },
    requiresComplexReplacement: true,
    excludeFiles: ['firebaseClient.ts', 'improvedFirebaseClient.ts'],
  },
  {
    name: 'Add status object to Firebase initialization',
    pattern: /const\s+\{\s*(app|auth|db|analytics)(?:\s*,\s*(app|auth|db|analytics))?(?:\s*,\s*(app|auth|db|analytics))?(?:\s*,\s*(app|auth|db|analytics))?\s*\}\s*=\s*initializeFirebaseClient\(([^)]*)\)/g,
    replacement: (match, ...args) => {
      // Extract the imports and arguments
      const imports = args.slice(0, 4).filter(Boolean);
      const callArgs = args[4] || '';
      
      // Create the new initialization with status
      return `const { ${imports.join(', ')}, status } = initializeFirebaseClient(${callArgs})`;
    },
    requiresComplexReplacement: true,
    excludeFiles: ['firebaseClient.ts', 'improvedFirebaseClient.ts'],
  },
  {
    name: 'Add Firebase readiness check',
    pattern: /(db|auth|firestore)\!\.([a-zA-Z]+)/g,
    replacement: (match, service, method) => {
      return `${service} && ${service}.${method}`;
    },
    requiresComplexReplacement: true,
    excludeFiles: ['firebase'],
  },
  {
    name: 'Add isFirebaseReady check before using Firebase services',
    pattern: /if\s*\(\s*(db|auth)\s*\)\s*\{/g,
    replacement: 'if (isFirebaseReady()) {',
    requiredImport: "import { isFirebaseReady } from '@/lib/improvedFirebaseClient';",
    excludeFiles: ['firebaseClient.ts', 'improvedFirebaseClient.ts'],
  },
];

// File extensions to process
const FILE_EXTENSIONS = ['.ts', '.tsx'];

// Helper to get files recursively
function getFilesRecursively(dir, extensions) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(filePath, extensions));
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

// Extract import statements from file content
function extractImports(content) {
  const importMatches = content.match(/^import\s+.*?from\s+['"].*?['"];?$/gm) || [];
  return importMatches;
}

// Add import if it doesn't exist
function addImportIfNeeded(content, importStatement) {
  const imports = extractImports(content);
  
  // Check if we already have this import
  for (const existingImport of imports) {
    if (existingImport.includes(importStatement.split('from')[1].trim())) {
      // If the import is from the same module, check if we need to add something to it
      if (importStatement.includes('{') && existingImport.includes('{')) {
        const requiredItems = importStatement.match(/\{\s*([^}]*)\s*\}/)[1].split(',').map(i => i.trim());
        const existingItems = existingImport.match(/\{\s*([^}]*)\s*\}/)[1].split(',').map(i => i.trim());
        
        let needsUpdate = false;
        for (const item of requiredItems) {
          if (!existingItems.includes(item)) {
            needsUpdate = true;
            existingItems.push(item);
          }
        }
        
        if (needsUpdate) {
          const updatedImport = existingImport.replace(/\{\s*([^}]*)\s*\}/, `{ ${existingItems.join(', ')} }`);
          return content.replace(existingImport, updatedImport);
        }
      }
      return content; // Import already exists
    }
  }
  
  // Add new import after existing imports
  if (imports.length > 0) {
    const lastImport = imports[imports.length - 1];
    const lastImportIndex = content.indexOf(lastImport) + lastImport.length;
    return content.slice(0, lastImportIndex) + '\n' + importStatement + content.slice(lastImportIndex);
  } else {
    // No imports, add at the beginning (after any comments or 'use client')
    const useClientMatch = content.match(/^(['"]use client['"];?\n)/);
    if (useClientMatch) {
      const useClientStatement = useClientMatch[1];
      const useClientIndex = content.indexOf(useClientStatement) + useClientStatement.length;
      return content.slice(0, useClientIndex) + '\n' + importStatement + '\n' + content.slice(useClientIndex);
    } else {
      // Just add at the beginning
      return importStatement + '\n' + content;
    }
  }
}

// Process a single file
function processFile(filePath) {
  console.log(`${COLORS.blue}Processing ${filePath}${COLORS.reset}`);
  
  const fileName = path.basename(filePath);
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // Track required imports
  const requiredImports = new Set();
  
  // Apply transformations
  TRANSFORMATIONS.forEach(transformation => {
    // Skip excluded files
    if (transformation.excludeFiles && transformation.excludeFiles.some(exclude => fileName.includes(exclude))) {
      return;
    }
    
    // Apply the transformation
    let newContent;
    
    if (transformation.requiresComplexReplacement) {
      // For transformations with function replacements
      newContent = content.replace(transformation.pattern, (...args) => {
        hasChanges = true;
        return transformation.replacement(...args);
      });
    } else {
      // For simple string replacements
      newContent = content.replace(transformation.pattern, (match) => {
        hasChanges = true;
        return transformation.replacement;
      });
    }
    
    if (newContent !== content) {
      console.log(`${COLORS.green}  ✓ Applied: ${transformation.name}${COLORS.reset}`);
      content = newContent;
      
      // Add required import if specified
      if (transformation.requiredImport) {
        requiredImports.add(transformation.requiredImport);
      }
    }
  });
  
  // Add required imports
  for (const importStatement of requiredImports) {
    const newContent = addImportIfNeeded(content, importStatement);
    if (newContent !== content) {
      console.log(`${COLORS.green}  ✓ Added import: ${importStatement}${COLORS.reset}`);
      content = newContent;
      hasChanges = true;
    }
  }
  
  // Write changes
  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`${COLORS.green}  ✓ Updated ${filePath}${COLORS.reset}`);
    return 1;
  } else {
    console.log(`${COLORS.yellow}  ○ No changes needed for ${filePath}${COLORS.reset}`);
    return 0;
  }
}

// Main execution
function main() {
  console.log(`${COLORS.magenta}==============================================${COLORS.reset}`);
  console.log(`${COLORS.magenta}Firebase Best Practices Auto-Fixer${COLORS.reset}`);
  console.log(`${COLORS.magenta}==============================================${COLORS.reset}`);
  
  let totalChangedFiles = 0;
  let totalFiles = 0;
  
  // Process each target directory
  TARGET_DIRECTORIES.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`${COLORS.cyan}Scanning directory: ${dir}${COLORS.reset}`);
      
      const files = getFilesRecursively(dir, FILE_EXTENSIONS);
      totalFiles += files.length;
      
      files.forEach(file => {
        try {
          totalChangedFiles += processFile(file);
        } catch (error) {
          console.error(`${COLORS.red}Error processing ${file}: ${error.message}${COLORS.reset}`);
        }
      });
    } else {
      console.warn(`${COLORS.yellow}Directory not found: ${dir}${COLORS.reset}`);
    }
  });
  
  console.log('');
  console.log(`${COLORS.magenta}==============================================${COLORS.reset}`);
  console.log(`${COLORS.magenta}Scan Complete${COLORS.reset}`);
  console.log(`${COLORS.magenta}==============================================${COLORS.reset}`);
  console.log(`${COLORS.green}Files processed: ${totalFiles}${COLORS.reset}`);
  console.log(`${COLORS.green}Files updated: ${totalChangedFiles}${COLORS.reset}`);
  console.log('');
  console.log(`${COLORS.blue}Next steps:${COLORS.reset}`);
  console.log(`${COLORS.blue}1. Run the validation script: ${COLORS.cyan}npm run validate:firebase${COLORS.reset}`);
  console.log(`${COLORS.blue}2. Review the changes and fix any remaining issues${COLORS.reset}`);
  console.log(`${COLORS.blue}3. Run tests to ensure everything still works${COLORS.reset}`);
}

main(); 