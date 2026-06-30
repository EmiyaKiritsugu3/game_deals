'use client';

import { Cookie, DollarSign, ExternalLink, FileText, ShieldCheck } from 'lucide-react';
import type * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export type LegalDocKey = 'privacy' | 'terms' | 'affiliate' | 'cookies' | 'accessibility';

interface LegalDoc {
  title: string;
  icon: React.ElementType;
  updated: string;
  intro: string;
  sections: { heading: string; body: React.ReactNode }[];
}

const DOCS: Record<LegalDocKey, LegalDoc> = {
  privacy: {
    title: 'Privacy Policy',
    icon: ShieldCheck,
    updated: `Last updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`,
    intro:
      'DEALFORGE is built privacy-first. We do not require an account, we do not track you across the web, and we do not sell your data. This policy explains exactly what little data we touch and why.',
    sections: [
      {
        heading: '1. What we collect',
        body: (
          <>
            <p>
              <strong>Almost nothing.</strong> DEALFORGE is a client-side application. We do not
              collect your name, email, IP address (beyond transient server logs for security), or
              any personally identifiable information.
            </p>
            <p className="mt-2">
              Your <strong>wishlist</strong>, <strong>recently-viewed games</strong>, and{' '}
              <strong>UI preferences</strong> (theme, grid density) are stored{' '}
              <strong>only in your browser's local storage</strong> on your device. They never touch
              our servers.
            </p>
          </>
        ),
      },
      {
        heading: '2. Cookies',
        body: (
          <p>
            DEALFORGE sets <strong>no tracking cookies</strong>. We use browser local storage (not
            cookies) for your wishlist and preferences. See our{' '}
            <button
              className="font-medium text-primary underline-offset-2 hover:underline"
              onClick={() =>
                window.dispatchEvent(new CustomEvent('dealforge:open-legal', { detail: 'cookies' }))
              }
            >
              Cookie Policy
            </button>{' '}
            for full details.
          </p>
        ),
      },
      {
        heading: '3. Third-party services',
        body: (
          <>
            <p>We use two external services:</p>
            <ul className="mt-2 ml-4 list-disc space-y-1.5">
              <li>
                <strong>CheapShark API</strong> — our sole data source for game prices. When you
                browse deals, your browser fetches data from our proxy, which calls CheapShark. See{' '}
                <a
                  href="https://apidocs.cheapshark.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline-offset-2 hover:underline inline-flex items-center gap-0.5"
                >
                  their privacy policy <ExternalLink className="size-3" />
                </a>
                .
              </li>
              <li>
                <strong>Storefronts</strong> (Steam, Epic, GOG, etc.) — when you click a deal, you
                leave DEALFORGE and are redirected to the retailer via CheapShark's redirect
                service. The retailer's own privacy policy then applies.
              </li>
            </ul>
          </>
        ),
      },
      {
        heading: '4. Affiliate disclosure',
        body: (
          <p>
            We may earn a commission when you click a deal link and complete a purchase. This never
            affects the price you pay. See our{' '}
            <button
              className="font-medium text-primary underline-offset-2 hover:underline"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent('dealforge:open-legal', { detail: 'affiliate' })
                )
              }
            >
              Affiliate Disclosure
            </button>{' '}
            for details.
          </p>
        ),
      },
      {
        heading: '5. Your rights (LGPD / GDPR)',
        body: (
          <>
            <p>
              Because we don't collect personal data, there's no data to export or delete. To clear
              your wishlist and preferences, you can:
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1.5">
              <li>Open the wishlist drawer and click "Clear all", or</li>
              <li>Clear site data in your browser (Settings → Site data → Clear), or</li>
              <li>Use the "Reset all local data" button in the Cookie Preferences panel.</li>
            </ul>
            <p className="mt-2">
              If you have privacy questions, contact us at{' '}
              <a
                href="mailto:privacy@dealforge.local"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                privacy@dealforge.local
              </a>
              .
            </p>
          </>
        ),
      },
      {
        heading: "6. Children's privacy",
        body: (
          <p>
            DEALFORGE does not knowingly collect any data from anyone, including children under 13
            (COPPA) or under 14 (LGPD). The service is not directed at children.
          </p>
        ),
      },
      {
        heading: '7. Changes to this policy',
        body: (
          <p>
            We will update this page if our practices change. The "Last updated" date at the top
            reflects the most recent revision.
          </p>
        ),
      },
    ],
  },
  terms: {
    title: 'Terms of Use',
    icon: FileText,
    updated: `Last updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`,
    intro:
      "By using DEALFORGE, you agree to these terms. They're written in plain language — no legalese surprises.",
    sections: [
      {
        heading: '1. The service',
        body: (
          <p>
            DEALFORGE is a free aggregator that displays game deals from third-party retailers via
            the CheapShark API. We are <strong>not a store</strong> — we do not sell games, process
            payments, or handle keys. When you click a deal, you transact directly with the
            retailer.
          </p>
        ),
      },
      {
        heading: '2. Price accuracy',
        body: (
          <p>
            Prices are fetched from CheapShark and refreshed approximately every 5 minutes. However,
            retailer prices can change at any moment. We <strong>cannot guarantee</strong> that the
            price shown on DEALFORGE will match the price at the retailer at the moment you click
            through. Always verify the final price before completing a purchase.
          </p>
        ),
      },
      {
        heading: '3. External links & retailers',
        body: (
          <p>
            Deal links redirect through CheapShark to the retailer's website. We have no control
            over retailer practices, including key delivery, refunds, region restrictions, or
            customer support. Any dispute with a retailer must be resolved with that retailer
            directly.
          </p>
        ),
      },
      {
        heading: '4. Key resellers & grey market',
        body: (
          <p>
            Some stores in our listings are <strong>marketplaces or key resellers</strong> rather
            than official retailers. We flag official retailers with a{' '}
            <span className="inline-flex items-center gap-1 font-semibold text-primary">
              <ShieldCheck className="size-3.5" /> Verified
            </span>{' '}
            badge. Purchases from non-verified stores may carry higher risk (revoked keys,
            region-locked activations). Exercise judgment and prefer verified retailers when
            possible.
          </p>
        ),
      },
      {
        heading: '5. Affiliate links',
        body: (
          <p>
            Deal links are affiliate links — we may earn a commission on completed purchases at no
            extra cost to you. This is how DEALFORGE stays free. See our{' '}
            <button
              className="font-medium text-primary underline-offset-2 hover:underline"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent('dealforge:open-legal', { detail: 'affiliate' })
                )
              }
            >
              Affiliate Disclosure
            </button>
            .
          </p>
        ),
      },
      {
        heading: '6. Acceptable use',
        body: (
          <p>
            Don't scrape our API at unreasonable rates, don't attempt to disrupt the service, and
            don't misrepresent DEALFORGE content as your own. The data displayed is sourced from
            CheapShark under their terms.
          </p>
        ),
      },
      {
        heading: '7. Limitation of liability',
        body: (
          <p>
            DEALFORGE is provided "as is" without warranties. We are not liable for any damages
            arising from your use of the service, including (but not limited to) purchases made
            through retailer links, price discrepancies, or outdated information.
          </p>
        ),
      },
      {
        heading: '8. Changes',
        body: <p>We may update these terms. Continued use after changes constitutes acceptance.</p>,
      },
    ],
  },
  affiliate: {
    title: 'Affiliate Disclosure',
    icon: DollarSign,
    updated: `Last updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`,
    intro: 'Honesty first: this is how DEALFORGE makes money while staying free for you.',
    sections: [
      {
        heading: 'The short version',
        body: (
          <p>
            Deal links on DEALFORGE are <strong>affiliate links</strong>. When you click one and buy
            a game, we may earn a small commission from the retailer or from CheapShark's redirect
            service. <strong>You never pay more</strong> — the price is identical to visiting the
            store directly.
          </p>
        ),
      },
      {
        heading: 'Why affiliate links?',
        body: (
          <p>
            Running a deals aggregator costs money (server hosting, API calls, development time).
            Affiliate commissions let us keep DEALFORGE free, ad-free, and account-free for
            everyone.
          </p>
        ),
      },
      {
        heading: 'Does this affect deal rankings?',
        body: (
          <p>
            <strong>No.</strong> Our deal rankings are determined by CheapShark's{' '}
            <em>deal rating</em> algorithm (which factors in savings, popularity, and store
            reputation) — not by commission rates. A higher-commission store will never outrank a
            cheaper or better-rated one. If we ever introduce sponsored placements, they will be
            clearly labeled "Sponsored."
          </p>
        ),
      },
      {
        heading: 'How to recognize affiliate links',
        body: (
          <p>
            All deal CTAs (buttons labeled "Get deal", "Grab this deal", "Claim") are affiliate
            links. They use the HTML attribute{' '}
            <code className="rounded bg-card/60 px-1.5 py-0.5 font-mono text-xs">
              rel="sponsored noopener noreferrer"
            </code>{' '}
            for transparency to search engines and security for your browser.
          </p>
        ),
      },
      {
        heading: 'Your choices',
        body: (
          <p>
            You are free to visit any store directly without using our links — you'll pay the same
            price. We're grateful when you use our links, but there's zero obligation.
          </p>
        ),
      },
      {
        heading: 'FTC compliance',
        body: (
          <p>
            This disclosure complies with the U.S. FTC's Endorsement Guides (16 CFR Part 255), which
            require clear disclosure of material connections between endorsers and retailers.
          </p>
        ),
      },
    ],
  },
  cookies: {
    title: 'Cookie Policy',
    icon: Cookie,
    updated: `Last updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`,
    intro: "Good news: DEALFORGE uses zero tracking cookies. Here's the full breakdown.",
    sections: [
      {
        heading: '1. Cookies we set',
        body: (
          <p>
            <strong>None.</strong> We do not set any cookies — not for analytics, not for
            advertising, not for session tracking.
          </p>
        ),
      },
      {
        heading: '2. Local storage we use',
        body: (
          <>
            <p>
              We use browser <strong>local storage</strong> (a different technology from cookies —
              it's not sent to servers with every request) to remember:
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1.5">
              <li>
                <code className="rounded bg-card/60 px-1.5 py-0.5 font-mono text-xs">
                  dealforge-wishlist
                </code>{' '}
                — your saved games and recently-viewed list
              </li>
              <li>
                <code className="rounded bg-card/60 px-1.5 py-0.5 font-mono text-xs">
                  dealforge-compare
                </code>{' '}
                — deals you've added to the comparison tray
              </li>
              <li>
                <code className="rounded bg-card/60 px-1.5 py-0.5 font-mono text-xs">
                  dealforge-theme
                </code>{' '}
                — your light/dark/system preference
              </li>
              <li>
                <code className="rounded bg-card/60 px-1.5 py-0.5 font-mono text-xs">
                  dealforge-consent
                </code>{' '}
                — your cookie-consent choice (required for LGPD/GDPR)
              </li>
            </ul>
          </>
        ),
      },
      {
        heading: '3. Third-party cookies',
        body: (
          <p>
            When you click a deal link, the retailer's website may set their own cookies. We have no
            control over those — consult each retailer's cookie policy.
          </p>
        ),
      },
      {
        heading: '4. Clearing your data',
        body: (
          <p>
            To remove all DEALFORGE local storage, use your browser's site-data settings (Settings →
            Cookies and site data → dealforge → Clear), or use the "Reset all local data" button in
            the Cookie Preferences panel.
          </p>
        ),
      },
      {
        heading: '5. Why we show a consent banner',
        body: (
          <p>
            Even though we set no tracking cookies, regulations like the EU's GDPR and Brazil's LGPD
            require explicit consent for any non-essential storage. Our consent banner respects this
            while being honest: there's nothing harmful to opt out of.
          </p>
        ),
      },
    ],
  },
  accessibility: {
    title: 'Accessibility Statement',
    icon: ShieldCheck,
    updated: `Last updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`,
    intro:
      'DEALFORGE is committed to being usable by everyone, including gamers with disabilities.',
    sections: [
      {
        heading: '1. Conformance target',
        body: (
          <p>
            We aim to conform to <strong>WCAG 2.1 Level AA</strong>. This is an ongoing effort — if
            you find an accessibility issue, please report it to{' '}
            <a
              href="mailto:a11y@dealforge.local"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              a11y@dealforge.local
            </a>
            .
          </p>
        ),
      },
      {
        heading: "2. Features we've built",
        body: (
          <ul className="ml-4 list-disc space-y-1.5">
            <li>
              <strong>Keyboard navigation</strong> — press{' '}
              <kbd className="rounded border border-border/60 bg-card/60 px-1.5 py-0.5 font-mono text-xs">
                /
              </kbd>{' '}
              to focus search,{' '}
              <kbd className="rounded border border-border/60 bg-card/60 px-1.5 py-0.5 font-mono text-xs">
                Esc
              </kbd>{' '}
              to clear
            </li>
            <li>
              <strong>ARIA live regions</strong> for filter result-count announcements
            </li>
            <li>
              <strong>Semantic HTML</strong> — proper headings, landmarks, and roles
            </li>
            <li>
              <strong>Focus-visible rings</strong> on all interactive elements
            </li>
            <li>
              <strong>Reduced-motion support</strong> — respects prefers-reduced-motion
            </li>
            <li>
              <strong>Alt text</strong> on all game cover images
            </li>
            <li>
              <strong>Color contrast</strong> targeting WCAG AA ratios
            </li>
          </ul>
        ),
      },
      {
        heading: '3. Known limitations',
        body: (
          <ul className="ml-4 list-disc space-y-1.5">
            <li>Some third-party store logos may lack alt text (decorative)</li>
            <li>
              The deal-card hover overlay requires a pointer device (keyboard users get the detail
              dialog instead)
            </li>
            <li>
              Live countdown timer updates may be disorienting for screen readers (marked
              aria-hidden)
            </li>
          </ul>
        ),
      },
    ],
  },
};

interface LegalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docKey: LegalDocKey;
}

export function LegalModal({ open, onOpenChange, docKey }: LegalModalProps) {
  const doc = DOCS[docKey];
  if (!doc) return null;
  const Icon = doc.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-h-[90vh] max-w-2xl overflow-hidden border-border/60 p-0 sm:rounded-2xl">
        <DialogHeader className="border-b border-border/40 p-5 pb-4">
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary">
              <Icon className="size-5" />
            </span>
            {doc.title}
          </DialogTitle>
          <DialogDescription className="sr-only">Legal document: {doc.title}</DialogDescription>
          <p className="mt-1 text-xs text-muted-foreground">{doc.updated}</p>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="p-5 sm:p-6">
            <p className="text-sm leading-relaxed text-foreground/90">{doc.intro}</p>
            <div className="mt-5 space-y-5">
              {doc.sections.map((section, i) => (
                <section key={i}>
                  <h3 className="text-sm font-semibold text-foreground">{section.heading}</h3>
                  <div className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {section.body}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

/** Helper to open a legal doc from anywhere via a custom event. */
export function openLegalDoc(docKey: LegalDocKey) {
  window.dispatchEvent(new CustomEvent('dealforge:open-legal', { detail: docKey }));
}

export { DOCS };
