#!/usr/bin/env node

/**
 * Comprehensive build process test script
 * Tests TypeScript compilation, bundle generation, and export validation
 */

import { execSync } from 'child_process';
import { existsSync, statSync } from 'fs';
import { resolve } from 'path';

console.log('🔧 Testing build process...\n');

// Test 1: Clean build
console.log('1. Testing clean build...');
try {
  execSync('npm run clean', { stdio: 'inherit' });
  console.log('✅ Clean completed successfully\n');
} catch (error) {
  console.error('❌ Clean failed:', error.message);
  process.exit(1);
}

// Test 2: TypeScript compilation
console.log('2. Testing TypeScript compilation...');
try {
  execSync('npm run build:types', { stdio: 'inherit' });
  console.log('✅ TypeScript compilation completed\n');
} catch (error) {
  console.error('❌ TypeScript compilation failed:', error.message);
  process.exit(1);
}

// Test 3: Rollup build
console.log('3. Testing Rollup build...');
try {
  execSync('npm run build:rollup', { stdio: 'inherit' });
  console.log('✅ Rollup build completed\n');
} catch (error) {
  console.error('❌ Rollup build failed:', error.message);
  process.exit(1);
}

// Test 4: Verify all build artifacts exist
console.log('4. Verifying build artifacts...');
const requiredFiles = [
  'dist/index.js',
  'dist/index.esm.js', 
  'dist/index.d.ts'
];

let allArtifactsExist = true;

for (const file of requiredFiles) {
  const filePath = resolve(process.cwd(), file);
  if (!existsSync(filePath)) {
    console.error(`❌ Missing build artifact: ${file}`);
    allArtifactsExist = false;
  } else {
    const stats = statSync(filePath);
    console.log(`✅ Found: ${file} (${stats.size} bytes)`);
  }
}

if (!allArtifactsExist) {
  console.error('\n❌ Some build artifacts are missing');
  process.exit(1);
}

console.log('\n✅ All build artifacts verified\n');

// Test 5: Export validation
console.log('5. Testing exports...');
try {
  execSync('npm run test:exports', { stdio: 'inherit' });
  console.log('✅ Export validation completed\n');
} catch (error) {
  console.error('❌ Export validation failed:', error.message);
  process.exit(1);
}

console.log('🎉 All build process tests passed!');