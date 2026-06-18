'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import styles from './AddToListButton.module.css';
import AddToListModal from './AddToListModal';

interface AddToListButtonProps {
  readonly gameId: string;
  readonly variant?: 'icon' | 'full';
}

/**
 * A client component button that triggers the AddToListModal.
 * Stays small to be included in Server Components like GameCard.
 */
export default function AddToListButton({ gameId, variant = 'icon' }: AddToListButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={`${styles.button} ${styles[variant]}`}
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

      {isOpen && <AddToListModal gameId={gameId} onClose={() => setIsOpen(false)} />}
    </>
  );
}
