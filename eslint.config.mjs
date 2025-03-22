import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Maintain your existing extensions
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  
  // Add custom rules to address the TypeScript issues
  {
    rules: {
      // Disable TypeScript errors for null/undefined assignability
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unnecessary-type-constraint': 'off',
      
      // Disable warning about using 'any' type
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      "react/no-unescaped-entities": 0
    },
  },
  
  // Add specific rules for TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Allow unused variables with underscore prefix
      'no-unused-vars': 'off', // Disable base rule
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_', 
        varsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_' 
      }],
    },
  }
];

export default eslintConfig;