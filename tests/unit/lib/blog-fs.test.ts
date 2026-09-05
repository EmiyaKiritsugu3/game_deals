import { beforeEach, describe, expect, it, vi } from 'vitest';

const fsMocks = vi.hoisted(() => ({ readdir: vi.fn(), readFile: vi.fn() }));
vi.mock('node:fs', () => {
  const promises = { readdir: fsMocks.readdir, readFile: fsMocks.readFile };
  return { promises, default: { promises } };
});

// Import AFTER mock so blog.ts fs calls hit the stub.
const { getPost, listPublished, listSlugs } = await import('@/lib/blog');

const md = (front: string, body = 'Body.') => `---\n${front}\n---\n\n${body}\n`;

beforeEach(() => {
  vi.resetAllMocks();
});

describe('listSlugs', () => {
  it('sorted .md slugs only', async () => {
    fsMocks.readdir.mockResolvedValue(['b.md', 'a.md', 'notes.txt']);
    await expect(listSlugs()).resolves.toEqual(['a', 'b']);
  });

  it('empty on fs error', async () => {
    fsMocks.readdir.mockRejectedValue(new Error('no dir'));
    await expect(listSlugs()).resolves.toEqual([]);
  });
});

describe('getPost', () => {
  it('rejects bad slug without touching fs', async () => {
    await expect(getPost('../evil')).resolves.toBeNull();
    expect(fsMocks.readFile).not.toHaveBeenCalled();
  });

  it('null on missing file', async () => {
    fsMocks.readFile.mockRejectedValue(new Error('ENOENT'));
    await expect(getPost('ghost')).resolves.toBeNull();
  });

  it('null when draft', async () => {
    fsMocks.readFile.mockResolvedValue(md('title: T\ndate: 2026-01-01\npublished: false'));
    await expect(getPost('draft')).resolves.toBeNull();
  });

  it('null on bad frontmatter', async () => {
    fsMocks.readFile.mockResolvedValue('no frontmatter');
    await expect(getPost('bad')).resolves.toBeNull();
  });

  it('returns published post', async () => {
    fsMocks.readFile.mockResolvedValue(md('title: T\ndate: 2026-01-01\ndealIds: 1, 2'));
    const post = await getPost('ok');
    expect(post).toMatchObject({ slug: 'ok', title: 'T', dealIds: ['1', '2'] });
  });
});

describe('listPublished', () => {
  it('skips drafts, sorts newest first', async () => {
    fsMocks.readdir.mockResolvedValue(['old.md', 'draft.md', 'new.md']);
    fsMocks.readFile.mockImplementation((p: string) => {
      if (p.includes('old')) return Promise.resolve(md('title: Old\ndate: 2026-01-01'));
      if (p.includes('draft'))
        return Promise.resolve(md('title: D\ndate: 2026-06-01\npublished: false'));
      return Promise.resolve(md('title: New\ndate: 2026-09-01'));
    });
    const posts = await listPublished();
    expect(posts.map((p) => p.slug)).toEqual(['new', 'old']);
  });
});
