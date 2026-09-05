import { promises as fs } from 'node:fs';
import path from 'node:path';

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  published: boolean;
  dealIds: string[];
  body: string;
}

// ponytail: hand-rolled frontmatter, no new dep — format is fixed and tiny.
export function parsePost(slug: string, raw: string): BlogPost | null {
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  if (!m) return null;
  const meta: Record<string, string> = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  if (!meta.title || !meta.date) return null;
  return {
    slug,
    title: meta.title,
    description: meta.description ?? '',
    date: meta.date,
    published: meta.published !== 'false',
    dealIds: (meta.dealIds ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    body: m[2].trim(),
  };
}

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

export async function listSlugs(): Promise<string[]> {
  try {
    const files = await fs.readdir(BLOG_DIR);
    return files
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.slice(0, -3))
      .sort();
  } catch {
    return [];
  }
}

export async function getPost(slug: string): Promise<BlogPost | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  try {
    const raw = await fs.readFile(path.join(BLOG_DIR, `${slug}.md`), 'utf8');
    const post = parsePost(slug, raw);
    return post?.published ? post : null;
  } catch {
    return null;
  }
}

export async function listPublished(): Promise<BlogPost[]> {
  const posts: BlogPost[] = [];
  for (const slug of await listSlugs()) {
    const post = await getPost(slug);
    if (post) posts.push(post);
  }
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}
