'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import AddToListModal from './AddToListModal';
import { cn } from '@/lib/utils';

interface AddToListButtonProps {
  gameId: string;
  variant?: 'icon' | 'full';
  className?: string;
}

/**
 * A client component button that triggers the AddToListModal.
 * Stays small to be included in Server Components like GameCard.
 */
export default function AddToListButton({ gameId, variant = 'icon', className = '' }: AddToListButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const baseClasses = "group relative flex items-center justify-center font-bold text-white transition-all overflow-hidden hover:scale-105 active:scale-95";
  const variants = {
    icon: "h-9 w-9 rounded-full bg-black/40 backdrop-blur-md hover:bg-primary",
    full: "gap-2 rounded-lg bg-white/10 px-5 py-3 text-sm hover:bg-primary shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
  };

  return (
    <>
      <button 
        className={cn(baseClasses, variants[variant], className)}
        onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(true);
        }}
        title="Add to Playlist"
      >
        <Plus size={variant === 'icon' ? 18 : 20} strokeWidth={2.5} />
        {variant === 'full' && <span>Add to List</span>}
      </button>

      {isOpen && (
        <AddToListModal 
            gameId={gameId} 
            onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  );
}
