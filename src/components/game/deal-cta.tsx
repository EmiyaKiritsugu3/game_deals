'use client';

import { ArrowRight, ExternalLink, type LucideIcon } from 'lucide-react';
import type * as React from 'react';
import { cn } from '@/lib/utils';

type DealCtaVariant = 'primary' | 'secondary' | 'ghost' | 'hot' | 'free';
type DealCtaSize = 'sm' | 'md' | 'lg';

interface DealCtaProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: DealCtaVariant;
  size?: DealCtaSize;
  /** Optional leading icon. Defaults to variant-appropriate icon. */
  icon?: LucideIcon;
  /** Hide the trailing arrow icon. */
  hideArrow?: boolean;
  /** Render with the sheen sweep hover effect. */
  sheen?: boolean;
  /** Make the button fill available width. */
  fullWidth?: boolean;
  children: React.ReactNode;
}

const VARIANT_CLS: Record<DealCtaVariant, string> = {
  primary:
    'bg-primary text-primary-foreground shadow-md shadow-primary/30 hover:brightness-110 hover:shadow-primary/40',
  secondary:
    'border border-border/50 bg-card/40 backdrop-blur-md text-foreground hover:border-primary/40 hover:bg-accent/30',
  ghost: 'text-muted-foreground hover:text-foreground hover:bg-accent/30',
  hot: 'bg-gradient-to-br from-hot to-amber-500 text-black shadow-md shadow-hot/30 hover:brightness-110',
  free: 'bg-gradient-to-br from-hot to-amber-500 text-black shadow-md shadow-hot/30 hover:brightness-110',
};

const SIZE_CLS: Record<DealCtaSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2 rounded-full',
};

/**
 * Unified CTA button for the DEALFORGE app. Always renders as an <a> because
 * every deal CTA is a redirect link (CheapShark affiliate link or in-page
 * anchor). Provides consistent visual hierarchy across hero, deal cards,
 * detail dialog, wishlist, and bottom CTA band.
 *
 * Designed to replace the inconsistent "Get deal" / "Grab this deal" /
 * "Start saving" buttons that VLM flagged in round-3 review.
 */
export function DealCta({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  hideArrow = false,
  sheen = true,
  fullWidth = false,
  className,
  children,
  ...anchorProps
}: DealCtaProps) {
  const defaultIcon = variant === 'secondary' || variant === 'ghost' ? ArrowRight : ExternalLink;
  const LeadingIcon =
    Icon ?? (variant === 'primary' || variant === 'hot' || variant === 'free' ? null : defaultIcon);
  const showTrailingArrow =
    !hideArrow && (variant === 'primary' || variant === 'hot' || variant === 'free');

  return (
    <a
      className={cn(
        'group inline-flex items-center justify-center font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        VARIANT_CLS[variant],
        SIZE_CLS[size],
        sheen && 'sheen',
        fullWidth && 'w-full',
        className
      )}
      {...anchorProps}
    >
      {LeadingIcon && <LeadingIcon className="size-4 transition-transform group-hover:scale-110" />}
      <span>{children}</span>
      {showTrailingArrow && (
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      )}
    </a>
  );
}

/**
 * Convenience preset for the standard "Get deal" CTA on deal cards/dialogs.
 * Emerald primary, sheen sweep, external-link semantics.
 */
export function GetDealCta({
  href,
  size = 'md',
  label = 'Get deal',
  className,
}: {
  href: string;
  size?: DealCtaSize;
  label?: string;
  className?: string;
}) {
  return (
    <DealCta
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      variant="primary"
      size={size}
      sheen
      className={className}
    >
      {label}
    </DealCta>
  );
}

/**
 * Convenience preset for the "Grab this deal" hot-amber CTA used in
 * Deal of the Day spotlight. Hot amber gradient with sheen.
 */
export function GrabDealCta({
  href,
  size = 'lg',
  label = 'Grab this deal',
  className,
}: {
  href: string;
  size?: DealCtaSize;
  label?: string;
  className?: string;
}) {
  return (
    <DealCta
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      variant="hot"
      size={size}
      sheen
      className={className}
    >
      {label}
    </DealCta>
  );
}

/**
 * Convenience preset for the "Claim free" CTA on free-game cards.
 * Fuchsia → amber gradient with sheen.
 */
export function ClaimFreeCta({
  href,
  size = 'md',
  label = 'Claim free',
  className,
}: {
  href: string;
  size?: DealCtaSize;
  label?: string;
  className?: string;
}) {
  return (
    <DealCta
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      variant="free"
      size={size}
      sheen
      className={className}
    >
      {label}
    </DealCta>
  );
}
