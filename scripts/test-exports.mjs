#!/usr/bin/env node

/**
 * Test script to verify package exports work correctly
 */

import { existsSync } from 'fs';
import { resolve } from 'path';

const distDir = resolve(process.cwd(), 'dist');

// Check if dist directory exists
if (!existsSync(distDir)) {
  console.error('❌ dist directory does not exist. Run npm run build first.');
  process.exit(1);
}

// Check required files
const requiredFiles = [
  'dist/index.js',
  'dist/index.esm.js',
  'dist/index.d.ts'
];

let allFilesExist = true;

for (const file of requiredFiles) {
  const filePath = resolve(process.cwd(), file);
  if (!existsSync(filePath)) {
    console.error(`❌ Required file missing: ${file}`);
    allFilesExist = false;
  } else {
    console.log(`✅ Found: ${file}`);
  }
}

if (!allFilesExist) {
  console.error('❌ Some required build files are missing.');
  process.exit(1);
}

// Test ESM import
try {
  const esmModule = await import(resolve(distDir, 'index.esm.js'));
  
  // Check for main exports
  const expectedExports = [
    'FluidCursor',
    'WebGLError',
    'ShaderCompilationError'
  ];
  
  for (const exportName of expectedExports) {
    if (!(exportName in esmModule)) {
      console.error(`❌ Missing export: ${exportName}`);
      process.exit(1);
    } else {
      console.log(`✅ Export found: ${exportName}`);
    }
  }
  
  console.log('✅ ESM exports test passed');
} catch (error) {
  console.error('❌ ESM import failed:', error.message);
  process.exit(1);
}



console.log('✅ ESM exports validation complete. CommonJS test will run separately.');

console.log('🎉 All export tests passed!');