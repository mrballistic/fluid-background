// Test CommonJS exports by checking the file content
const fs = require('fs');
const path = require('path');

const cjsFile = path.resolve(__dirname, '..', 'dist', 'index.js');

if (!fs.existsSync(cjsFile)) {
  console.error('❌ CommonJS build file does not exist:', cjsFile);
  process.exit(1);
}

const content = fs.readFileSync(cjsFile, 'utf8');

// Check for main exports in the file content
const expectedExports = [
  'FluidBackground',
  'SplashCursor',
  'WebGLContextImpl', 
  'ShaderManagerImpl',
  'FramebufferManagerImpl',
  'WebGLError',
  'ShaderCompilationError'
];

let allExportsFound = true;

for (const exportName of expectedExports) {
  const exportPattern = new RegExp(`exports\\.${exportName}\\s*=`);
  if (exportPattern.test(content)) {
    console.log(`✅ CommonJS export found: ${exportName}`);
  } else {
    console.error(`❌ Missing CommonJS export: ${exportName}`);
    allExportsFound = false;
  }
}

if (allExportsFound) {
  console.log('✅ CommonJS exports test passed');
} else {
  console.error('❌ Some CommonJS exports are missing');
  process.exit(1);
}

// Test splash-cursor CommonJS exports
const splashCjsFile = path.resolve(__dirname, '..', 'dist', 'splash-cursor.js');

if (!fs.existsSync(splashCjsFile)) {
  console.error('❌ Splash-cursor CommonJS build file does not exist:', splashCjsFile);
  process.exit(1);
}

const splashContent = fs.readFileSync(splashCjsFile, 'utf8');

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

let allSplashExportsFound = true;

for (const exportName of expectedSplashExports) {
  const exportPattern = new RegExp(`exports\\.${exportName}\\s*=`);
  if (exportPattern.test(splashContent)) {
    console.log(`✅ Splash-cursor CommonJS export found: ${exportName}`);
  } else {
    console.error(`❌ Missing splash-cursor CommonJS export: ${exportName}`);
    allSplashExportsFound = false;
  }
}

if (allSplashExportsFound) {
  console.log('✅ Splash-cursor CommonJS exports test passed');
} else {
  console.error('❌ Some splash-cursor CommonJS exports are missing');
  process.exit(1);
}

// Test fluid-cursor CommonJS exports
const fluidCjsFile = path.resolve(__dirname, '..', 'dist', 'fluid-cursor.js');

if (!fs.existsSync(fluidCjsFile)) {
  console.error('❌ Fluid-cursor CommonJS build file does not exist:', fluidCjsFile);
  process.exit(1);
}

const fluidContent = fs.readFileSync(fluidCjsFile, 'utf8');

const expectedFluidExports = [
  'FluidCursor'
];

let allFluidExportsFound = true;

for (const exportName of expectedFluidExports) {
  const exportPattern = new RegExp(`exports\\.${exportName}\\s*=`);
  if (exportPattern.test(fluidContent)) {
    console.log(`✅ Fluid-cursor CommonJS export found: ${exportName}`);
  } else {
    console.error(`❌ Missing fluid-cursor CommonJS export: ${exportName}`);
    allFluidExportsFound = false;
  }
}

if (allFluidExportsFound) {
  console.log('✅ Fluid-cursor CommonJS exports test passed');
} else {
  console.error('❌ Some fluid-cursor CommonJS exports are missing');
  process.exit(1);
}