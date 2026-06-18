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
  it('should have a manifest.json file in public/', () => {
    const manifestPath = join(publicDir, 'manifest.json');
    expect(existsSync(manifestPath)).toBe(true);
  });

  it('should have valid JSON with required PWA fields', () => {
    const manifestPath = join(publicDir, 'manifest.json');
    const content = readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(content) as Record<string, unknown>;

    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('short_name');
    expect(manifest).toHaveProperty('start_url');
    expect(manifest).toHaveProperty('display');
    expect(manifest).toHaveProperty('icons');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });

  it('should have manifest link tag in layout.tsx', () => {
    const layoutPath = join(appDir, 'layout.tsx');
    const content = readFileSync(layoutPath, 'utf-8');
    expect(content).toContain('<link rel="manifest" href="/manifest.json" />');
  });

  it('should have a favicon file in public/', () => {
    const faviconExists =
      existsSync(join(publicDir, 'favicon.ico')) || existsSync(join(publicDir, 'favicon.svg'));
    expect(faviconExists).toBe(true);
  });
});
