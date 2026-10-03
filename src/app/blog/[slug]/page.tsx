import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPost, listPublished } from '@/lib/blog';
import { safeJsonLdStringify } from '@/lib/json-ld';
import { SITE_URL } from '@/lib/metadata-helpers';

// ponytail: zero-md rendering — body is trusted local markdown, render as
// paragraphs. Rich md parser only when authors need more than paragraphs.
function renderBody(body: string) {
  return body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const h = block.startsWith('## ') ? block.slice(3).trim() : null;
      if (h) {
        return (
          <h2 key={`h-${h}`} className="text-xl font-bold mt-8 mb-3">
            {h}
          </h2>
        );
      }
      return (
        <p key={`p-${block.slice(0, 32)}`} className="text-muted-foreground leading-relaxed mb-4">
          {block}
        </p>
      );
    });
}

export async function generateStaticParams() {
  return (await listPublished()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: Readonly<{ params: Promise<{ slug: string }> }>): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Not Found' };
  return {
    title: `${post.title} — GameDeals Blog`,
    description: post.description,
    alternates: { canonical: `${SITE_URL}/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${SITE_URL}/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({
  params,
}: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    url: `${SITE_URL}/blog/${slug}`,
    isPartOf: { '@type': 'WebSite', name: 'GameDeals', url: SITE_URL },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD escaped via safeJsonLdStringify
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(jsonLd) }}
      />
      <main className="container">
        <div className="pt-8 pb-16 max-w-2xl mx-auto">
          <p className="text-sm text-muted-foreground mb-2">
            {new Date(`${post.date}T12:00:00Z`).toLocaleDateString('pt-BR')}
          </p>
          <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
          <p className="text-muted-foreground mb-6">{post.description}</p>
          <article>{renderBody(post.body)}</article>
          {post.dealIds.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-bold mb-4">Ofertas citadas</h2>
              <div className="grid gap-3">
                {post.dealIds.map((id) => (
                  <Link
                    key={id}
                    href={`/game/${id}`}
                    className="rounded-xl border border-border bg-card p-4 no-underline text-inherit font-semibold hover:border-primary"
                  >
                    Ver oferta →
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
