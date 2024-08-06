import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

export default {
  input: 'main.ts',
  output: {
    file: 'main.js',
    format: 'cjs',
    sourcemap: true
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript(),
    json()
  ],
  external: ['obsidian']
};
