import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, '..', '..', '..');
const publicDir = join(projectRoot, 'public');
const appDir = join(projectRoot, 'src', 'app');

describe('PWA Manifest', () => {
  it('should have manifest.ts in src/app/ (Next.js native approach)', () => {
    const manifestPath = join(appDir, 'manifest.ts');
    expect(existsSync(manifestPath)).toBe(true);
  });

  it('should export a function returning valid manifest fields', () => {
    const manifestPath = join(appDir, 'manifest.ts');
    const content = readFileSync(manifestPath, 'utf-8');

    // Verify it exports a default function (Next.js convention)
    expect(content).toContain('export default function manifest');
    // Verify required PWA fields are present in the return object
    expect(content).toContain('name:');
    expect(content).toContain('short_name:');
    expect(content).toContain('start_url:');
    expect(content).toContain('display:');
    expect(content).toContain('icons:');
  });

  it('should have RegisterSW component imported in layout.tsx', () => {
    const layoutPath = join(appDir, 'layout.tsx');
    const content = readFileSync(layoutPath, 'utf-8');
    expect(content).toContain('RegisterSW');
  });

  it('should have a favicon file in public/', () => {
    const faviconExists =
      existsSync(join(publicDir, 'favicon.ico')) || existsSync(join(publicDir, 'favicon.svg'));
    expect(faviconExists).toBe(true);
  });

  it('should have service worker in public/', () => {
    const swPath = join(publicDir, 'sw.js');
    expect(existsSync(swPath)).toBe(true);
  });
});
