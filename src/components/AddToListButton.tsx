'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import AddToListModal from './AddToListModal';

const variantClasses: Record<string, string> = {
  icon: 'inline-flex items-center justify-center rounded-full p-0 w-8 h-8 border border-border hover:scale-105 hover:bg-[hsl(142,100%,50%)] hover:text-black transition-all backdrop-blur',
  full: 'inline-flex items-center justify-center gap-2 rounded-xl bg-muted px-5 py-2.5 text-sm font-bold w-full border border-border hover:scale-105 hover:bg-[hsl(142,100%,50%)] hover:text-black transition-all backdrop-blur',
};

interface AddToListButtonProps {
  readonly gameId: string;
  readonly variant?: 'icon' | 'full';
  readonly className?: string;
}

/**
 * A client component button that triggers the AddToListModal.
 * Stays small to be included in Server Components like GameCard.
 */
export default function AddToListButton({
  gameId,
  variant = 'icon',
  className,
}: AddToListButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={cn(variantClasses[variant], className)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        title="Add to Playlist"
        aria-label="Add to Playlist"
      >
        <Plus size={variant === 'icon' ? 18 : 20} strokeWidth={2.5} />
        {variant === 'full' && <span>Add to List</span>}
      </button>

      {isOpen && <AddToListModal gameId={gameId} onClose={() => setIsOpen(false)} />}
    </>
  );
}
