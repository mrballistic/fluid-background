import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        HTMLElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        MouseEvent: 'readonly',
        TouchEvent: 'readonly',
        WebGL2RenderingContext: 'readonly',
        WebGLRenderingContext: 'readonly',
        WebGLProgram: 'readonly',
        WebGLShader: 'readonly',
        WebGLTexture: 'readonly',
        WebGLFramebuffer: 'readonly',
        WebGLUniformLocation: 'readonly',
        OES_texture_float: 'readonly',
        OES_texture_half_float: 'readonly',
        OES_texture_float_linear: 'readonly',
        OES_texture_half_float_linear: 'readonly',
        // Node globals
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        // React
        React: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react': react,
      'react-hooks': reactHooks,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-undef': 'off', // TypeScript handles this
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];