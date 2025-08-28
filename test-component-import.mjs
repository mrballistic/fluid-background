// Test importing the FluidCursor component
import { FluidCursor } from './dist/index.esm.js';

console.log('✅ FluidCursor component imported successfully');
console.log('Component type:', typeof FluidCursor);
console.log('Component name:', FluidCursor.name);

// Test that it's a React component function
if (typeof FluidCursor === 'function') {
    console.log('✅ FluidCursor is a function (React component)');
} else {
    console.log('❌ FluidCursor is not a function');
    process.exit(1);
}

console.log('🎉 All import tests passed!');