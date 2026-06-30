'use client';

import {
  DollarSign,
  HelpCircle,
  Lock,
  RefreshCw,
  ShieldCheck,
  Store,
  TrendingDown,
} from 'lucide-react';
import type * as React from 'react';
import { openLegalDoc } from '@/components/game/legal-modal';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FaqItem {
  q: string;
  a: React.ReactNode;
  icon: React.ElementType;
  iconCls: string;
}

const FAQS: FaqItem[] = [
  {
    q: 'Are these deals legit?',
    icon: ShieldCheck,
    iconCls: 'text-primary',
    a: (
      <>
        <p>
          Yes. Every deal you see comes directly from the{' '}
          <a
            href="https://apidocs.cheapshark.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            CheapShark API
          </a>
          , which aggregates live prices from 30+ retailers including Steam, Epic Games Store, GOG,
          Humble Bundle, Green Man Gaming, and more.
        </p>
        <p className="mt-2">
          When you click a deal, you're redirected to the retailer's official website to complete
          your purchase — DEALFORGE never sells you anything directly.
        </p>
        <p className="mt-2">
          Look for the{' '}
          <span className="inline-flex items-center gap-1 font-semibold text-primary">
            <ShieldCheck className="size-3.5" /> Verified
          </span>{' '}
          badge on deal cards from official retailers (Steam, Epic, GOG, Humble, etc.) for maximum
          peace of mind.
        </p>
      </>
    ),
  },
  {
    q: 'Why is the price different at the store?',
    icon: RefreshCw,
    iconCls: 'text-hot',
    a: (
      <>
        <p>
          Prices refresh approximately every 5 minutes, but retailer prices can change at any moment
          — sometimes mid-session. If you see a different price at checkout, it likely changed
          between our last refresh and your click.
        </p>
        <p className="mt-2">
          Each deal card shows a <span className="font-semibold">"Updated Xm ago"</span> timestamp
          so you can judge freshness. If a deal is older than 5 minutes, hit the{' '}
          <span className="font-semibold">Refresh deals</span> button below the grid.
        </p>
        <p className="mt-2 text-muted-foreground">
          We cannot guarantee price accuracy at the moment of purchase — always verify the final
          price at the retailer before paying.
        </p>
      </>
    ),
  },
  {
    q: 'Do I need an account?',
    icon: Lock,
    iconCls: 'text-fuchsia-300',
    a: (
      <>
        <p>
          <strong>No.</strong> DEALFORGE is completely account-free. There's no sign-up, no login,
          no email required.
        </p>
        <p className="mt-2">
          Your wishlist, recently-viewed games, and UI preferences are stored{' '}
          <strong>only in your browser's local storage</strong> on your device. They're never sent
          to our servers. Clear your browser data and they're gone — that's by design.
        </p>
      </>
    ),
  },
  {
    q: 'How do you make money?',
    icon: DollarSign,
    iconCls: 'text-hot',
    a: (
      <>
        <p>
          Deal links on DEALFORGE are <strong>affiliate links</strong>. When you click one and
          complete a purchase, we may earn a small commission from the retailer or from CheapShark's
          redirect service.
        </p>
        <p className="mt-2">
          <strong>You never pay more</strong> — the price is identical to visiting the store
          directly. Affiliate commissions are how we keep DEALFORGE free, ad-free, and account-free.
        </p>
        <p className="mt-2">
          Rankings are <strong>never</strong> influenced by commission rates. A higher-commission
          store will never outrank a cheaper or better-rated one.{' '}
          <button
            onClick={() => openLegalDoc('affiliate')}
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Read the full affiliate disclosure →
          </button>
        </p>
      </>
    ),
  },
  {
    q: 'How are deals ranked?',
    icon: TrendingDown,
    iconCls: 'text-primary',
    a: (
      <>
        <p>
          The "deal rating" you see on each card comes from CheapShark's composite algorithm, which
          factors in:
        </p>
        <ul className="mt-2 ml-4 list-disc space-y-1">
          <li>
            <strong>Savings percentage</strong> — how much off retail
          </li>
          <li>
            <strong>Popularity</strong> — how many users are clicking the deal
          </li>
          <li>
            <strong>Store reputation</strong> — historical reliability of the retailer
          </li>
          <li>
            <strong>Metacritic score</strong> — critical reception (when available)
          </li>
        </ul>
        <p className="mt-2">Our sections use transparent criteria:</p>
        <ul className="mt-2 ml-4 list-disc space-y-1">
          <li>
            <strong>Featured</strong> — top 8 by savings, deduplicated
          </li>
          <li>
            <strong>Trending</strong> — deal rating ≥ 8 AND savings ≥ 50%
          </li>
          <li>
            <strong>Deal of the Day</strong> — deterministic pick from top 5 by rating × savings,
            stable per day
          </li>
          <li>
            <strong>Leaderboard</strong> — top 5 by savings percentage
          </li>
        </ul>
      </>
    ),
  },
  {
    q: 'Can I trust the key resellers?',
    icon: Store,
    iconCls: 'text-amber-400',
    a: (
      <>
        <p>
          Some stores in our listings are <strong>marketplaces or key resellers</strong> (e.g., G2A,
          Kinguin, Eneba) rather than official retailers. While most transactions on these
          marketplaces are fine, they carry higher risk:
        </p>
        <ul className="mt-2 ml-4 list-disc space-y-1">
          <li>Keys may be region-locked or revoked after activation</li>
          <li>Customer support is handled by the marketplace, not the publisher</li>
          <li>Refund policies vary and may be stricter than official stores</li>
        </ul>
        <p className="mt-2">
          Our advice: look for the{' '}
          <span className="inline-flex items-center gap-1 font-semibold text-primary">
            <ShieldCheck className="size-3.5" /> Verified
          </span>{' '}
          badge, which marks official retailers (Steam, Epic, GOG, Humble, Green Man Gaming,
          Fanatical, Gamesplanet, GamersGate). When in doubt, prefer verified stores for peace of
          mind.
        </p>
      </>
    ),
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="mx-auto mt-24 max-w-3xl scroll-mt-20 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary animate-fade-in-down">
          <HelpCircle className="size-3.5" />
          FAQ
        </span>
        <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl animate-fade-in-up">
          Questions, answered honestly
        </h2>
        <p
          className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground sm:text-base animate-fade-in-up"
          style={{ animationDelay: '100ms' }}
        >
          The concerns every gamer has before trusting a deals site — addressed directly.
        </p>
      </div>

      <Accordion defaultValue={['faq-0']} className="space-y-2.5">
        {FAQS.map((faq, i) => {
          const Icon = faq.icon;
          return (
            <AccordionItem
              key={i} /* biome-ignore lint/suspicious/noArrayIndexKey: static FAQ list */
              value={`faq-${i}`}
              className="overflow-hidden rounded-2xl border border-border/40 glass px-4 transition-colors data-[state=open]:border-primary/40"
            >
              <AccordionTrigger className="py-4 text-left hover:no-underline">
                <div className="flex items-center gap-3 pr-2">
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-lg bg-card/60 ${faq.iconCls}`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="text-sm font-semibold sm:text-base">{faq.q}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-0 text-sm leading-relaxed text-muted-foreground">
                <div className="pl-11">{faq.a}</div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Still have questions? */}
      <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-border/40 glass p-4 sm:flex-row sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
            <HelpCircle className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Still have questions?</p>
            <p className="text-xs text-muted-foreground">
              We're happy to explain anything that's unclear.
            </p>
          </div>
        </div>
        <a
          href="mailto:hello@dealforge.local"
          className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/40 px-4 py-2 text-xs font-medium transition-all hover:border-primary/40 hover:text-primary"
        >
          Contact us
        </a>
      </div>
    </section>
  );
}
