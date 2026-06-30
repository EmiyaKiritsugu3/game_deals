'use client';

import { Check, Copy, Link as LinkIcon, Mail, MessageCircle, Share2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { dealRedirectUrl } from '@/lib/deal-utils';
import type { DealWithStore } from '@/lib/types';
import { cn } from '@/lib/utils';

/** Inline SVG for brand icons removed from lucide 1.21 */
/* biome-ignore lint/a11y/noSvgWithoutTitle: decorative brand icon */
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
/* biome-ignore lint/a11y/noSvgWithoutTitle: decorative brand icon */
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
/* biome-ignore lint/a11y/noSvgWithoutTitle: decorative brand icon */
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

interface DealShareDialogProps {
  deal: DealWithStore | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DealShareDialog({ deal, open, onOpenChange }: DealShareDialogProps) {
  const [copied, setCopied] = React.useState(false);
  const shareUrl = deal ? dealRedirectUrl(deal.dealID) : '';
  const shareText = deal
    ? `🚀 ${deal.title} is ${deal.isFree ? 'FREE' : `$${deal.salePrice}`} (${Math.round(deal.savingsNum)}% off) on DEALFORGE!`
    : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleShare = async (
    platform: 'twitter' | 'facebook' | 'reddit' | 'linkedin' | 'email' | 'native'
  ) => {
    if (!deal) return;
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      email: `mailto:?subject=${encodeURIComponent(`Game deal: ${deal.title}`)}&body=${encodedText}%0A%0A${encodedUrl}`,
    };

    if (platform === 'native') {
      if (navigator.share) {
        try {
          await navigator.share({ title: deal.title, text: shareText, url: shareUrl });
        } catch {
          // user cancelled — no action needed
        }
      } else {
        handleCopyLink();
      }
      return;
    }

    window.open(urls[platform], '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  if (!deal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong overflow-hidden border-border/60 p-0 sm:max-w-md sm:rounded-2xl">
        <DialogHeader className="border-b border-border/40 p-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
              <Share2 className="size-4" />
            </span>
            Share this deal
          </DialogTitle>
          <DialogDescription className="sr-only">
            Share {deal.title} deal to social media or copy the link.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4">
          {/* Deal preview card */}
          <div className="mb-4 overflow-hidden rounded-xl border border-border/40 bg-card/30">
            <div className="flex items-center gap-3 p-3">
              <div
                className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-card/60"
                style={{
                  backgroundImage: `url(${deal.thumb})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-semibold">{deal.title}</p>
                <div className="mt-0.5 flex items-center gap-2 text-xs">
                  <span className="font-extrabold text-gradient-emerald">
                    {deal.isFree ? 'FREE' : `$${deal.salePrice}`}
                  </span>
                  {!deal.isFree && deal.normalPriceNum > deal.salePriceNum && (
                    <span className="text-muted-foreground line-through tabular-nums">
                      ${deal.normalPrice}
                    </span>
                  )}
                  <span className="rounded bg-primary/15 px-1 py-0.5 font-semibold text-primary">
                    -{Math.round(deal.savingsNum)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Social share buttons */}
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Share to
          </p>
          <div className="mb-4 grid grid-cols-5 gap-2">
            <ShareButton
              icon={TwitterIcon}
              label="Twitter"
              color="hover:bg-sky-500/15 hover:text-sky-400 hover:border-sky-500/40"
              onClick={() => handleShare('twitter')}
            />
            <ShareButton
              icon={FacebookIcon}
              label="Facebook"
              color="hover:bg-blue-500/15 hover:text-blue-400 hover:border-blue-500/40"
              onClick={() => handleShare('facebook')}
            />
            <ShareButton
              icon={MessageCircle}
              label="Reddit"
              color="hover:bg-orange-500/15 hover:text-orange-400 hover:border-orange-500/40"
              onClick={() => handleShare('reddit')}
            />
            <ShareButton
              icon={LinkedInIcon}
              label="LinkedIn"
              color="hover:bg-blue-600/15 hover:text-blue-500 hover:border-blue-600/40"
              onClick={() => handleShare('linkedin')}
            />
            <ShareButton
              icon={Mail}
              label="Email"
              color="hover:bg-primary/15 hover:text-primary hover:border-primary/40"
              onClick={() => handleShare('email')}
            />
          </div>

          {/* Native share (mobile) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              type="button"
              onClick={() => handleShare('native')}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-all hover:brightness-110"
            >
              <Share2 className="size-4" />
              Share via device
            </button>
          )}

          {/* Copy link */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Or copy link
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/40 p-2">
              <LinkIcon className="size-4 shrink-0 text-muted-foreground" />
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="h-8 min-w-0 flex-1 bg-transparent text-xs text-muted-foreground focus:outline-none"
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                  copied
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-primary text-primary-foreground hover:brightness-110'
                )}
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 animate-share-pop" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Affiliate disclosure microcopy */}
          <p className="mt-3 text-center text-[10px] text-muted-foreground">
            Deal links are affiliate links — never affect the price you pay.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShareButton({
  icon: Icon,
  label,
  color,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Share to ${label}`}
      className={cn(
        'group flex flex-col items-center gap-1.5 rounded-xl border border-border/50 bg-card/40 p-2.5 transition-all hover:-translate-y-0.5',
        color
      )}
    >
      <Icon className="size-5 transition-transform group-hover:scale-110" />
      <span className="text-[9px] font-medium text-muted-foreground">{label}</span>
    </button>
  );
}
