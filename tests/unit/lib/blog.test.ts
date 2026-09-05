import { describe, expect, it } from 'vitest';
import { parsePost } from '@/lib/blog';

const RAW = `---
title: Jogos grátis da semana
description: Os melhores jogos gratuitos.
date: 2026-09-05
published: true
dealIds: 612, 123
---

Corpo do post.

## Seção

Mais texto.
`;

describe('parsePost', () => {
  it('parses frontmatter + body', () => {
    const post = parsePost('jogos-gratis-da-semana', RAW);
    expect(post).toMatchObject({
      slug: 'jogos-gratis-da-semana',
      title: 'Jogos grátis da semana',
      date: '2026-09-05',
      published: true,
      dealIds: ['612', '123'],
    });
    expect(post?.body).toContain('Corpo do post.');
  });

  it('defaults published true, empty dealIds', () => {
    const post = parsePost('x', '---\ntitle: T\ndate: 2026-01-01\n---\nB\n');
    expect(post?.published).toBe(true);
    expect(post?.dealIds).toEqual([]);
  });

  it('published false stays draft', () => {
    const post = parsePost('x', '---\ntitle: T\ndate: 2026-01-01\npublished: false\n---\nB\n');
    expect(post?.published).toBe(false);
  });

  it('null without frontmatter or required fields', () => {
    expect(parsePost('x', 'no frontmatter')).toBeNull();
    expect(parsePost('x', '---\ntitle: T\n---\nB\n')).toBeNull();
  });
});
