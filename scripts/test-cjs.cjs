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
  'FluidCursor',
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

console.log('✅ All CommonJS export tests passed!');