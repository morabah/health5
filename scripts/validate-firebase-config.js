#!/usr/bin/env node

/**
 * Firebase Configuration Validator
 * 
 * This script validates Firebase configuration in the codebase against best practices
 * from our lessons learned document. It can be run during CI/CD or manually to ensure
 * Firebase integration follows team standards.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const FIREBASE_CLIENT_PATH = path.resolve(__dirname, '../src/lib/improvedFirebaseClient.ts');
const TARGET_DIRECTORIES = [
  path.resolve(__dirname, '../src/lib'),
  path.resolve(__dirname, '../src/components'),
  path.resolve(__dirname, '../src/app'),
];

// Color codes for output
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

// Rules to validate against
const RULES = [
  {
    name: 'Direct localStorage API mode access',
    pattern: /localStorage\.getItem\(['"]apiMode['"]\)/g,
    excludeFiles: ['appConfig.ts'],
    message: 'Use getApiMode() from appConfig.ts instead of direct localStorage access',
    isCritical: true,
  },
  {
    name: 'Direct localStorage API mode setting',
    pattern: /localStorage\.setItem\(['"]apiMode['"]/g,
    excludeFiles: ['appConfig.ts', 'ClientInit.tsx'],
    message: 'Use setApiMode() from appConfig.ts to properly handle events',
    isCritical: true,
  },
  {
    name: 'Deprecated Firestore persistence',
    pattern: /enableIndexedDbPersistence/g,
    excludeFiles: [],
    message: 'Use the cache configuration option instead of enableIndexedDbPersistence',
    isCritical: false,
  },
  {
    name: 'Unlimited cache size',
    pattern: /CACHE_SIZE_UNLIMITED/g,
    excludeFiles: [],
    message: 'Use a reasonable cache size instead of CACHE_SIZE_UNLIMITED',
    isCritical: false,
  },
  {
    name: 'Conflicting Firestore settings',
    pattern: /experimentalForceLongPolling.*experimentalAutoDetectLongPolling|experimentalAutoDetectLongPolling.*experimentalForceLongPolling/gs,
    excludeFiles: [],
    message: 'Do not use both experimentalForceLongPolling and experimentalAutoDetectLongPolling',
    isCritical: true,
  },
  {
    name: 'Missing Firebase nullcheck',
    pattern: /(db|auth|firestore)\!\./g,
    excludeFiles: ['firebase'],
    message: 'Always check if Firebase services are initialized before using them',
    isCritical: true,
  },
];

// Validate specific Firebase client file
function validateFirebaseClient() {
  console.log(`${COLORS.blue}Validating Firebase client implementation...${COLORS.reset}`);
  
  if (!fs.existsSync(FIREBASE_CLIENT_PATH)) {
    console.error(`${COLORS.red}Error: Firebase client file not found at ${FIREBASE_CLIENT_PATH}${COLORS.reset}`);
    return false;
  }
  
  const content = fs.readFileSync(FIREBASE_CLIENT_PATH, 'utf8');
  let valid = true;
  
  // Essential features to check
  const essentialFeatures = [
    { pattern: /cache\s*:\s*{/g, name: 'Modern cache configuration' },
    { pattern: /ignoreUndefinedProperties\s*:\s*true/g, name: 'ignoreUndefinedProperties setting' },
    { pattern: /status\s*:\s*FirebaseStatus/g, name: 'Status object return type' },
    { pattern: /isFirebaseReady/g, name: 'Firebase readiness check function' },
    { pattern: /catch.*try.*fallback/gs, name: 'Multi-level fallback strategy' },
  ];
  
  essentialFeatures.forEach(feature => {
    if (!feature.pattern.test(content)) {
      console.error(`${COLORS.red}❌ Missing essential feature: ${feature.name}${COLORS.reset}`);
      valid = false;
    } else {
      console.log(`${COLORS.green}✓ Found essential feature: ${feature.name}${COLORS.reset}`);
    }
  });
  
  return valid;
}

// Scan directories for rule violations
function scanDirectories() {
  console.log(`${COLORS.blue}Scanning directories for Firebase best practices...${COLORS.reset}`);
  
  let violations = 0;
  let criticalViolations = 0;
  
  TARGET_DIRECTORIES.forEach(dir => {
    console.log(`${COLORS.blue}Scanning ${dir}...${COLORS.reset}`);
    
    // Get all TypeScript/TSX files
    const files = getFilesRecursively(dir, ['.ts', '.tsx']);
    
    files.forEach(file => {
      const fileName = path.basename(file);
      const content = fs.readFileSync(file, 'utf8');
      
      RULES.forEach(rule => {
        // Skip excluded files
        if (rule.excludeFiles.some(exclude => fileName.includes(exclude))) {
          return;
        }
        
        const matches = content.match(rule.pattern);
        if (matches && matches.length > 0) {
          console.log(`${COLORS.yellow}⚠️ ${rule.isCritical ? 'CRITICAL: ' : ''}${file}:${COLORS.reset}`);
          console.log(`   ${rule.name} - ${rule.message}`);
          console.log(`   Found ${matches.length} instances`);
          
          violations++;
          if (rule.isCritical) {
            criticalViolations++;
          }
        }
      });
    });
  });
  
  return { violations, criticalViolations };
}

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

// Check for import migration
function checkImportMigration() {
  console.log(`${COLORS.blue}Checking for Firebase imports that need migration...${COLORS.reset}`);
  
  let oldImports = 0;
  
  TARGET_DIRECTORIES.forEach(dir => {
    const files = getFilesRecursively(dir, ['.ts', '.tsx']);
    
    files.forEach(file => {
      const fileName = path.basename(file);
      if (fileName.includes('firebase') || fileName.includes('improvedFirebaseClient')) {
        return;
      }
      
      const content = fs.readFileSync(file, 'utf8');
      const oldImportPattern = /import.*['"]@\/lib\/firebaseClient['"]/g;
      const matches = content.match(oldImportPattern);
      
      if (matches && matches.length > 0) {
        console.log(`${COLORS.yellow}⚠️ ${file} still uses old Firebase client${COLORS.reset}`);
        oldImports += matches.length;
      }
    });
  });
  
  return oldImports;
}

// Main execution
function main() {
  console.log(`${COLORS.magenta}==============================================${COLORS.reset}`);
  console.log(`${COLORS.magenta}Firebase Configuration Validation${COLORS.reset}`);
  console.log(`${COLORS.magenta}==============================================${COLORS.reset}`);
  
  let exitCode = 0;
  
  // Validate Firebase client implementation
  const clientValid = validateFirebaseClient();
  if (!clientValid) {
    console.error(`${COLORS.red}Firebase client validation failed!${COLORS.reset}`);
    exitCode = 1;
  }
  
  console.log('');
  
  // Scan for violations
  const { violations, criticalViolations } = scanDirectories();
  if (violations > 0) {
    console.log(`${COLORS.yellow}Found ${violations} rule violations (${criticalViolations} critical)${COLORS.reset}`);
    if (criticalViolations > 0) {
      exitCode = 1;
    }
  } else {
    console.log(`${COLORS.green}No rule violations found!${COLORS.reset}`);
  }
  
  console.log('');
  
  // Check import migration
  const oldImports = checkImportMigration();
  if (oldImports > 0) {
    console.log(`${COLORS.yellow}Found ${oldImports} imports that need migration to improvedFirebaseClient${COLORS.reset}`);
  } else {
    console.log(`${COLORS.green}All imports are using improvedFirebaseClient!${COLORS.reset}`);
  }
  
  console.log('');
  console.log(`${COLORS.magenta}==============================================${COLORS.reset}`);
  console.log(`${COLORS.magenta}Validation complete. Exit code: ${exitCode}${COLORS.reset}`);
  console.log(`${COLORS.magenta}==============================================${COLORS.reset}`);
  
  process.exit(exitCode);
}

main(); 