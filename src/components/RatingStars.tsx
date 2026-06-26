'use client';

import { type KeyboardEvent, useId, useRef, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const STAR_PATH =
  'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';

interface RatingStarsProps {
  value: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (value: number) => void;
  showValue?: boolean;
}

const sizeMap = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' } as const;

function StarIcon({
  filled,
  partial,
  partialPct,
  clipId,
}: {
  filled: boolean;
  partial: boolean;
  partialPct: number;
  clipId: string;
}) {
  if (partial) {
    return (
      <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <rect x="0" y="0" width={partialPct / 100} height="1" />
          </clipPath>
        </defs>
        <path d={STAR_PATH} fill="none" stroke="currentColor" strokeWidth={1.5} opacity={0.35} />
        <path d={STAR_PATH} fill="currentColor" stroke="none" clipPath={`url(#${clipId})`} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
      <path
        d={STAR_PATH}
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.5}
      />
    </svg>
  );
}

export default function RatingStars({
  value,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onChange,
  showValue = false,
}: RatingStarsProps) {
  const uid = useId();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [focusIndex, setFocusIndex] = useState(Math.round(value) - 1);
  const starRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const displayValue = hoveredIndex !== null ? hoveredIndex + 1 : value;
  const displayWhole = Math.floor(displayValue);
  const displayFraction = displayValue - displayWhole;
  const label = `${value.toFixed(1)} / ${maxStars}`;

  function moveFocus(newIndex: number) {
    setFocusIndex(newIndex);
    starRefs.current[newIndex]?.focus();
  }

  function handleKeyDown(e: KeyboardEvent, starValue: number) {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveFocus(Math.min(focusIndex + 1, maxStars - 1));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveFocus(Math.max(focusIndex - 1, 0));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange?.(starValue);
    }
  }

  const stars = Array.from({ length: maxStars }, (_, i) => {
    const sv = i + 1;
    const filled = i < displayWhole;
    const partial = !filled && !interactive && i === displayWhole && displayFraction > 0;
    const partialPct = partial ? displayFraction * 100 : 0;
    const clipId = `${uid}-${i}`;

    const icon = (
      <StarIcon filled={filled} partial={partial} partialPct={partialPct} clipId={clipId} />
    );

    if (interactive) {
      return (
        /* biome-ignore lint/a11y/useSemanticElements: span+role=radio avoids input styling constraints for star rating */
        <span
          key={sv}
          role="radio"
          aria-checked={sv === Math.round(displayValue)}
          aria-label={`${sv} star${sv > 1 ? 's' : ''}`}
          ref={(el) => {
            starRefs.current[i] = el;
          }}
          tabIndex={i === (hoveredIndex !== null ? hoveredIndex : focusIndex) ? 0 : -1}
          className={cn(
            'inline-flex items-center justify-center transition-[transform,color] duration-150 leading-none text-muted-foreground cursor-pointer',
            filled && 'text-amber-400',
            hoveredIndex !== null && i <= hoveredIndex && 'text-amber-400',
            'hover:scale-[1.2] focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 focus-visible:rounded-sm'
          )}
          onClick={() => onChange?.(sv)}
          onKeyDown={(e) => handleKeyDown(e, sv)}
          onFocus={() => setFocusIndex(i)}
          onMouseEnter={() => setHoveredIndex(i)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {icon}
        </span>
      );
    }

    return (
      <span
        key={sv}
        className={cn(
          'inline-flex items-center justify-center transition-[transform,color] duration-150 leading-none text-muted-foreground',
          filled && 'text-amber-400'
        )}
      >
        {icon}
      </span>
    );
  });

  const content = (
    <span
      className={cn('inline-flex items-center gap-0.5', sizeMap[size])}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={interactive ? undefined : label}
    >
      {stars}
      {showValue && (
        <span className="ml-1.5 text-sm font-semibold text-muted-foreground">
          {value.toFixed(1)}
        </span>
      )}
    </span>
  );

  if (interactive) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild tabIndex={-1}>
            {content}
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {value.toFixed(1)} / {maxStars}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
