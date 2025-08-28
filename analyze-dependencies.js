#!/usr/bin/env node

/**
 * Dependency Analysis Script for Repository Cleanup
 * 
 * This script analyzes the codebase to identify:
 * 1. Which files are actually used by FluidCursor
 * 2. Import/export relationships
 * 3. Unused utilities, types, and helper functions
 * 4. Test files testing non-existent or broken functionality
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Track all files and their dependencies
const fileMap = new Map();
const usedFiles = new Set();
const testFiles = new Map();
const exampleFiles = new Map();

// Patterns to identify different file types
const patterns = {
  test: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
  component: /\.(tsx|jsx)$/,
  typescript: /\.(ts|tsx)$/,
  javascript: /\.(js|jsx)$/,
  example: /^examples\//,
  docs: /^docs\//
};

/**
 * Extract imports from a file content
 */
function extractImports(content, filePath) {
  const imports = [];
  
  // Match ES6 imports
  const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"`]([^'"`]+)['"`]/g;
  
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    
    // Skip node_modules imports
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      continue;
    }
    
    // Resolve relative imports
    const resolvedPath = resolveImportPath(importPath, filePath);
    if (resolvedPath) {
      imports.push(resolvedPath);
    }
  }
  
  // Match require statements
  const requireRegex = /require\(['"`]([^'"`]+)['"`]\)/g;
  while ((match = requireRegex.exec(content)) !== null) {
    const importPath = match[1];
    
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      continue;
    }
    
    const resolvedPath = resolveImportPath(importPath, filePath);
    if (resolvedPath) {
      imports.push(resolvedPath);
    }
  }
  
  return imports;
}

/**
 * Resolve import path to actual file path
 */
function resolveImportPath(importPath, fromFile) {
  const fromDir = path.dirname(fromFile);
  let resolvedPath = path.resolve(fromDir, importPath);
  
  // Try different extensions
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
  
  // Check if it's already a complete path
  if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
    return path.relative(process.cwd(), resolvedPath);
  }
  
  // Try with extensions
  for (const ext of extensions) {
    const withExt = resolvedPath + ext;
    if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) {
      return path.relative(process.cwd(), withExt);
    }
  }
  
  // Try index files
  for (const ext of extensions) {
    const indexPath = path.join(resolvedPath, 'index' + ext);
    if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
      return path.relative(process.cwd(), indexPath);
    }
  }
  
  return null;
}

/**
 * Recursively scan directory for files
 */
function scanDirectory(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and other irrelevant directories
      if (['node_modules', '.git', 'dist', 'coverage', '.next'].includes(entry)) {
        continue;
      }
      scanDirectory(fullPath, files);
    } else if (stat.isFile()) {
      // Only include relevant file types
      if (patterns.typescript.test(entry) || patterns.javascript.test(entry)) {
        files.push(path.relative(process.cwd(), fullPath));
      }
    }
  }
  
  return files;
}

/**
 * Analyze a single file
 */
function analyzeFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const imports = extractImports(content, filePath);
  
  const analysis = {
    path: filePath,
    imports,
    isTest: patterns.test.test(filePath),
    isExample: patterns.example.test(filePath),
    isComponent: patterns.component.test(filePath),
    size: content.length,
    lines: content.split('\n').length,
    exports: extractExports(content),
    hasDefaultExport: /export\s+default/.test(content),
    hasNamedExports: /export\s+(?:const|function|class|interface|type)/.test(content)
  };
  
  return analysis;
}

/**
 * Extract exports from file content
 */
function extractExports(content) {
  const exports = [];
  
  // Named exports
  const namedExportRegex = /export\s+(?:const|function|class|interface|type)\s+(\w+)/g;
  let match;
  while ((match = namedExportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  
  // Export statements
  const exportStatementRegex = /export\s+\{([^}]+)\}/g;
  while ((match = exportStatementRegex.exec(content)) !== null) {
    const exportList = match[1].split(',').map(e => e.trim().split(' as ')[0].trim());
    exports.push(...exportList);
  }
  
  return exports;
}

/**
 * Trace dependencies starting from FluidCursor
 */
function traceDependencies(startFile, visited = new Set()) {
  if (visited.has(startFile) || !fileMap.has(startFile)) {
    return;
  }
  
  visited.add(startFile);
  usedFiles.add(startFile);
  
  const fileInfo = fileMap.get(startFile);
  for (const importPath of fileInfo.imports) {
    traceDependencies(importPath, visited);
  }
}

/**
 * Main analysis function
 */
function analyzeCodebase() {
  console.log('🔍 Starting codebase dependency analysis...\n');
  
  // Scan all files
  const allFiles = scanDirectory('src');
  allFiles.push(...scanDirectory('examples'));
  
  console.log(`📁 Found ${allFiles.length} files to analyze\n`);
  
  // Analyze each file
  for (const filePath of allFiles) {
    const analysis = analyzeFile(filePath);
    if (analysis) {
      fileMap.set(filePath, analysis);
      
      if (analysis.isTest) {
        testFiles.set(filePath, analysis);
      }
      
      if (analysis.isExample) {
        exampleFiles.set(filePath, analysis);
      }
    }
  }
  
  // Find FluidCursor component
  const fluidCursorPath = 'src/components/FluidCursor/FluidCursor.tsx';
  
  if (!fileMap.has(fluidCursorPath)) {
    console.error('❌ FluidCursor component not found!');
    return;
  }
  
  console.log('✅ Found FluidCursor component, tracing dependencies...\n');
  
  // Trace dependencies from FluidCursor
  traceDependencies(fluidCursorPath);
  
  // Also trace from FluidCursor index file
  const fluidCursorIndex = 'src/components/FluidCursor/index.ts';
  if (fileMap.has(fluidCursorIndex)) {
    traceDependencies(fluidCursorIndex);
  }
  
  // Generate report
  generateReport();
}

/**
 * Generate comprehensive analysis report
 */
function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: fileMap.size,
      usedByFluidCursor: usedFiles.size,
      unused: fileMap.size - usedFiles.size,
      testFiles: testFiles.size,
      exampleFiles: exampleFiles.size
    },
    fluidCursorDependencies: Array.from(usedFiles).sort(),
    unusedFiles: [],
    brokenTests: [],
    workingExamples: [],
    brokenExamples: [],
    componentAnalysis: {},
    utilityAnalysis: {},
    typeAnalysis: {}
  };
  
  // Identify unused files
  for (const [filePath, fileInfo] of fileMap) {
    if (!usedFiles.has(filePath)) {
      report.unusedFiles.push({
        path: filePath,
        size: fileInfo.size,
        lines: fileInfo.lines,
        isTest: fileInfo.isTest,
        isExample: fileInfo.isExample,
        exports: fileInfo.exports
      });
    }
  }
  
  // Analyze test files
  for (const [filePath, fileInfo] of testFiles) {
    const testedFile = filePath.replace(/\.(test|spec)\.(ts|tsx)$/, '.$2');
    const testedFileAlt = filePath.replace(/\.(test|spec)\.(ts|tsx)$/, '.tsx');
    
    const isTestingExistingFile = fileMap.has(testedFile) || fileMap.has(testedFileAlt);
    const isTestingUsedFile = usedFiles.has(testedFile) || usedFiles.has(testedFileAlt);
    
    if (!isTestingExistingFile || !isTestingUsedFile) {
      report.brokenTests.push({
        path: filePath,
        testedFile: testedFile,
        exists: isTestingExistingFile,
        used: isTestingUsedFile,
        reason: !isTestingExistingFile ? 'File does not exist' : 'File not used by FluidCursor'
      });
    }
  }
  
  // Analyze examples
  for (const [filePath, fileInfo] of exampleFiles) {
    // Check if example imports working components
    const importsFluidCursor = fileInfo.imports.some(imp => 
      imp.includes('FluidCursor') || imp.includes('components/FluidCursor')
    );
    const importsWorkingComponents = fileInfo.imports.every(imp => {
      if (imp.startsWith('src/')) {
        return usedFiles.has(imp);
      }
      return true; // External imports are OK
    });
    
    if (importsFluidCursor && importsWorkingComponents) {
      report.workingExamples.push(filePath);
    } else {
      report.brokenExamples.push({
        path: filePath,
        reason: !importsFluidCursor ? 'Does not use FluidCursor' : 'Imports broken components',
        imports: fileInfo.imports
      });
    }
  }
  
  // Analyze components
  const components = ['FluidCursor'];
  for (const component of components) {
    const componentFiles = Array.from(fileMap.keys()).filter(path => 
      path.includes(component) && !path.includes('.test.')
    );
    
    report.componentAnalysis[component] = {
      files: componentFiles,
      used: componentFiles.some(file => usedFiles.has(file)),
      mainFile: componentFiles.find(file => file.endsWith(`${component}.tsx`)),
      dependencies: componentFiles.filter(file => usedFiles.has(file))
    };
  }
  
  // Analyze utilities
  const utilityFiles = Array.from(fileMap.keys()).filter(path => path.startsWith('src/utils/'));
  for (const utilFile of utilityFiles) {
    const fileInfo = fileMap.get(utilFile);
    report.utilityAnalysis[utilFile] = {
      used: usedFiles.has(utilFile),
      exports: fileInfo.exports,
      size: fileInfo.size,
      imports: fileInfo.imports
    };
  }
  
  // Analyze types
  const typeFiles = Array.from(fileMap.keys()).filter(path => 
    path.startsWith('src/types/') || path.includes('types')
  );
  for (const typeFile of typeFiles) {
    const fileInfo = fileMap.get(typeFile);
    report.typeAnalysis[typeFile] = {
      used: usedFiles.has(typeFile),
      exports: fileInfo.exports,
      size: fileInfo.size
    };
  }
  
  // Write report to file
  fs.writeFileSync('dependency-analysis-report.json', JSON.stringify(report, null, 2));
  
  // Print summary
  printSummary(report);
}

/**
 * Print analysis summary to console
 */
function printSummary(report) {
  console.log('📊 DEPENDENCY ANALYSIS REPORT');
  console.log('=' .repeat(50));
  console.log(`📅 Generated: ${report.timestamp}`);
  console.log(`📁 Total files analyzed: ${report.summary.totalFiles}`);
  console.log(`✅ Files used by FluidCursor: ${report.summary.usedByFluidCursor}`);
  console.log(`❌ Unused files: ${report.summary.unused}`);
  console.log(`🧪 Test files: ${report.summary.testFiles}`);
  console.log(`📝 Example files: ${report.summary.exampleFiles}\n`);
  
  console.log('🎯 COMPONENT ANALYSIS');
  console.log('-'.repeat(30));
  for (const [component, analysis] of Object.entries(report.componentAnalysis)) {
    console.log(`${component}: ${analysis.used ? '✅ USED' : '❌ UNUSED'} (${analysis.files.length} files)`);
  }
  console.log();
  
  console.log('🔧 UTILITY FILES');
  console.log('-'.repeat(30));
  const usedUtils = Object.entries(report.utilityAnalysis).filter(([_, analysis]) => analysis.used);
  const unusedUtils = Object.entries(report.utilityAnalysis).filter(([_, analysis]) => !analysis.used);
  console.log(`✅ Used utilities: ${usedUtils.length}`);
  console.log(`❌ Unused utilities: ${unusedUtils.length}`);
  if (unusedUtils.length > 0) {
    console.log('   Unused utility files:');
    unusedUtils.forEach(([file]) => console.log(`   - ${file}`));
  }
  console.log();
  
  console.log('🧪 TEST ANALYSIS');
  console.log('-'.repeat(30));
  console.log(`❌ Broken/irrelevant tests: ${report.brokenTests.length}`);
  if (report.brokenTests.length > 0) {
    console.log('   Broken test files:');
    report.brokenTests.forEach(test => {
      console.log(`   - ${test.path} (${test.reason})`);
    });
  }
  console.log();
  
  console.log('📝 EXAMPLE ANALYSIS');
  console.log('-'.repeat(30));
  console.log(`✅ Working examples: ${report.workingExamples.length}`);
  console.log(`❌ Broken examples: ${report.brokenExamples.length}`);
  if (report.brokenExamples.length > 0) {
    console.log('   Broken example files:');
    report.brokenExamples.forEach(example => {
      console.log(`   - ${example.path} (${example.reason})`);
    });
  }
  console.log();
  
  console.log('💾 Full report saved to: dependency-analysis-report.json');
  console.log('🎯 FluidCursor dependencies saved to: fluid-cursor-dependencies.txt');
  
  // Save FluidCursor dependencies to separate file
  fs.writeFileSync('fluid-cursor-dependencies.txt', 
    Array.from(usedFiles).sort().join('\n')
  );
}

// Run the analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeCodebase();
}

export { analyzeCodebase, fileMap, usedFiles };