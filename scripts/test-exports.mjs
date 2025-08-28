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
  'dist/index.d.ts',
  'dist/splash-cursor.js',
  'dist/splash-cursor.esm.js',
  'dist/splash-cursor.d.ts',
  'dist/fluid-cursor.js',
  'dist/fluid-cursor.esm.js',
  'dist/fluid-cursor.d.ts'
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
    'FluidBackground',
    'SplashCursor',
    'WebGLContextImpl',
    'ShaderManagerImpl',
    'FramebufferManagerImpl',
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

// Test splash-cursor specific exports
try {
  const splashCursorModule = await import(resolve(distDir, 'splash-cursor.esm.js'));
  
  const expectedSplashExports = [
    'SplashCursor',
    'useSplashCursor',
    'ParticleSystem',
    'PhysicsEngine',
    'MetaballRenderer',
    'MouseTracker',
    'SplashCursorVanilla',
    'createSplashCursor',
    'SplashCursorError',
    'CanvasInitializationError',
    'PerformanceError'
  ];
  
  for (const exportName of expectedSplashExports) {
    if (!(exportName in splashCursorModule)) {
      console.error(`❌ Missing splash-cursor export: ${exportName}`);
      process.exit(1);
    } else {
      console.log(`✅ Splash-cursor export found: ${exportName}`);
    }
  }
  
  console.log('✅ Splash-cursor ESM exports test passed');
} catch (error) {
  console.error('❌ Splash-cursor ESM import failed:', error.message);
  process.exit(1);
}

// Test fluid-cursor specific exports
try {
  const fluidCursorModule = await import(resolve(distDir, 'fluid-cursor.esm.js'));
  
  const expectedFluidExports = [
    'FluidCursor'
  ];
  
  for (const exportName of expectedFluidExports) {
    if (!(exportName in fluidCursorModule)) {
      console.error(`❌ Missing fluid-cursor export: ${exportName}`);
      process.exit(1);
    } else {
      console.log(`✅ Fluid-cursor export found: ${exportName}`);
    }
  }
  
  console.log('✅ Fluid-cursor ESM exports test passed');
} catch (error) {
  console.error('❌ Fluid-cursor ESM import failed:', error.message);
  process.exit(1);
}

console.log('✅ ESM exports validation complete. CommonJS test will run separately.');

console.log('🎉 All export tests passed!');