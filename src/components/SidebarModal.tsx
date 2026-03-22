'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function SidebarModal({ children }: { children: React.ReactNode }) {
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
        [dismissModal, overlay]
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
        <motion.div 
            ref={overlay} 
            className="fixed inset-0 z-[100] flex justify-end bg-black/60 p-0 backdrop-blur-sm sm:p-4"
            onClick={onClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <motion.div 
                className="relative flex h-full w-full flex-col overflow-hidden bg-background shadow-2xl sm:max-w-2xl sm:rounded-2xl sm:border sm:border-white/10"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                <button 
                    onClick={dismissModal} 
                    className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-black/80"
                    aria-label="Close sidebar"
                >
                    <X size={24} />
                </button>
                <div className="h-full overflow-y-auto overflow-x-hidden">
                    {children}
                </div>
            </motion.div>
        </motion.div>
    );
}
