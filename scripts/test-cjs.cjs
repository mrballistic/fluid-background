// Test CommonJS exports by checking the file content
const fs = require('fs');
const path = require('path');

const cjsFile = path.resolve(__dirname, '..', 'dist', 'index.js');

if (!fs.existsSync(cjsFile)) {
  console.error('❌ CommonJS build file does not exist:', cjsFile);
  process.exit(1);
}

const content = fs.readFileSync(cjsFile, 'utf8');

// Check for default export in the file content
if (content.includes('exports.default') || content.includes('module.exports')) {
  console.log(`✅ CommonJS default export found`);
} else {
  console.error(`❌ Missing CommonJS default export`);
  process.exit(1);
}

console.log('✅ CommonJS exports test passed');

console.log('✅ All CommonJS export tests passed!');