'use client';

import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

export default function SidebarModal({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const overlay = useRef<HTMLDivElement>(null);

  const dismissModal = useCallback(() => {
    router.back();
  }, [router]);

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlay.current) {
        if (dismissModal) dismissModal();
      }
    },
    [dismissModal]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissModal();
    },
    [dismissModal]
  );

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onKeyDown]);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: overlay backdrop — keyboard handled by document listener
    <div
      ref={overlay}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Escape') dismissModal();
      }}
      tabIndex={-1}
    >
      <div className="relative w-full max-w-[650px] h-screen bg-background border-l border-border shadow-[-10px_0_30px_rgba(0,0,0,0.5)] flex flex-col overflow-y-auto animate-slide-in-right max-[768px]:max-w-full">
        <button
          type="button"
          onClick={dismissModal}
          className="absolute top-6 right-6 bg-card border border-border text-muted-foreground w-10 h-10 rounded-full flex items-center justify-center cursor-pointer z-[200] transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary hover:scale-105 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          aria-label="Close sidebar"
        >
          <X size={24} />
        </button>
        <div className="flex-1 flex flex-col w-full">{children}</div>
      </div>
    </div>
  );
}
