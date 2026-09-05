/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const fsMocks = vi.hoisted(() => ({ readdir: vi.fn(), readFile: vi.fn() }));
vi.mock('node:fs', () => {
  const promises = { readdir: fsMocks.readdir, readFile: fsMocks.readFile };
  return { promises, default: { promises } };
});

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NOT_FOUND');
  },
}));

const mod = await import('@/app/blog/[slug]/page');

const md = (front: string, body = 'Para um.\n\n## Titulo\n\nPara dois.\n') =>
  `---\n${front}\n---\n\n${body}`;

describe('blog slug page', () => {
  it('static params list published slugs', async () => {
    fsMocks.readdir.mockResolvedValue(['a.md', 'draft.md']);
    fsMocks.readFile.mockImplementation((p: string) =>
      p.includes('draft')
        ? Promise.resolve(md('title: D\ndate: 2026-01-01\npublished: false'))
        : Promise.resolve(md('title: A\ndate: 2026-02-01'))
    );
    await expect(mod.generateStaticParams()).resolves.toEqual([{ slug: 'a' }]);
  });

  it('metadata falls back Not Found, else canonical', async () => {
    fsMocks.readFile.mockRejectedValueOnce(new Error('ENOENT'));
    await expect(
      mod.generateMetadata({ params: Promise.resolve({ slug: 'ghost' }) })
    ).resolves.toMatchObject({ title: 'Not Found' });

    fsMocks.readFile.mockResolvedValueOnce(
      md('title: Post T\ndescription: Desc D\ndate: 2026-09-05')
    );
    const meta = await mod.generateMetadata({ params: Promise.resolve({ slug: 'post' }) });
    expect(meta.title).toContain('Post T');
    expect(meta.alternates?.canonical).toContain('/blog/post');
  });

  it('renders h2 sections + deal links', async () => {
    fsMocks.readFile.mockResolvedValueOnce(
      md('title: Post T\ndescription: Desc D\ndate: 2026-09-05\ndealIds: 612')
    );
    render(await mod.default({ params: Promise.resolve({ slug: 'post' }) }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Post T');
    expect(screen.getByRole('heading', { level: 2, name: 'Titulo' })).toBeDefined();
    expect(screen.getByRole('link', { name: /ver oferta/i }).getAttribute('href')).toBe(
      '/game/612'
    );
  });

  it('notFound on missing post', async () => {
    fsMocks.readFile.mockRejectedValueOnce(new Error('ENOENT'));
    await expect(mod.default({ params: Promise.resolve({ slug: 'ghost' }) })).rejects.toThrow(
      'NOT_FOUND'
    );
  });
});
