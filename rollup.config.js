import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

export default [
  // Main package ESM build
  {
    input: 'src/index.ts',
    output: {
      file: packageJson.module,
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
      }),
    ],
    external: ['react', 'react-dom'],
  },
  // Main package CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: packageJson.main,
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
      }),
    ],
    external: ['react', 'react-dom'],
  },
  // Splash Cursor ESM build
  {
    input: 'src/splash-cursor/index.ts',
    output: {
      file: 'dist/splash-cursor.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
      }),
    ],
    external: ['react', 'react-dom'],
  },
  // Splash Cursor CommonJS build
  {
    input: 'src/splash-cursor/index.ts',
    output: {
      file: 'dist/splash-cursor.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
      }),
    ],
    external: ['react', 'react-dom'],
  },
  // Fluid Cursor ESM build
  {
    input: 'src/fluid-cursor/index.ts',
    output: {
      file: 'dist/fluid-cursor.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
      }),
    ],
    external: ['react', 'react-dom'],
  },
  // Fluid Cursor CommonJS build
  {
    input: 'src/fluid-cursor/index.ts',
    output: {
      file: 'dist/fluid-cursor.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
      }),
    ],
    external: ['react', 'react-dom'],
  },
  // Main package TypeScript declarations
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'esm',
    },
    plugins: [
      dts({
        tsconfig: './tsconfig.build.json',
      }),
    ],
    external: ['react', 'react-dom'],
  },
  // Splash Cursor TypeScript declarations
  {
    input: 'src/splash-cursor/index.ts',
    output: {
      file: 'dist/splash-cursor.d.ts',
      format: 'esm',
    },
    plugins: [
      dts({
        tsconfig: './tsconfig.build.json',
      }),
    ],
    external: ['react', 'react-dom'],
  },
  // Fluid Cursor TypeScript declarations
  {
    input: 'src/fluid-cursor/index.ts',
    output: {
      file: 'dist/fluid-cursor.d.ts',
      format: 'esm',
    },
    plugins: [
      dts({
        tsconfig: './tsconfig.build.json',
      }),
    ],
    external: ['react', 'react-dom'],
  },
];