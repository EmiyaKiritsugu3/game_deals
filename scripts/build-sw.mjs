import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as esbuild from 'esbuild';

const OUT_FILE = resolve(import.meta.dirname, '..', 'public', 'sw.js');

await esbuild.build({
  entryPoints: [resolve(import.meta.dirname, '..', 'sw.ts')],
  bundle: true,
  outfile: OUT_FILE,
  format: 'iife',
  target: 'es2020',
  define: {
    'process.env.NODE_ENV': '"production"',
    'self.__SW_MANIFEST': '[]',
  },
});

console.log('✓ Service worker built → public/sw.js');
