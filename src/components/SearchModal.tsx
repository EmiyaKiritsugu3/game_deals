'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Gamepad2 } from 'lucide-react';

export default function SearchModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Global Keyboard Listener for ⌘K or Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Prevent background scrolling when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-card/80 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] pointer-events-auto flex flex-col"
                        >
                            {/* Search Input Area */}
                            <div className="flex items-center border-b border-white/5 px-4 py-4">
                                <Search size={20} className="text-primary mr-3" />
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Search games, deals, or stores..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1 bg-transparent text-lg text-foreground placeholder:text-muted-foreground outline-none"
                                />
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 rounded-md bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Results Area (Placeholder for actual API mapping later) */}
                            <div className="max-h-[60vh] overflow-y-auto p-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                {searchQuery.length === 0 ? (
                                    <div className="px-4 py-12 text-center flex flex-col items-center justify-center text-muted-foreground">
                                        <Gamepad2 size={32} className="mb-3 opacity-20" />
                                        <p className="text-sm">Type a command or search...</p>
                                    </div>
                                ) : (
                                    <div className="p-2 text-center text-sm text-muted-foreground">
                                        Integration with Supabase/API pending for query: <strong className="text-primary">{searchQuery}</strong>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between border-t border-white/5 bg-background/50 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                <span>Use <kbd className="font-mono bg-white/10 px-1 py-0.5 rounded text-foreground">↑</kbd> <kbd className="font-mono bg-white/10 px-1 py-0.5 rounded text-foreground">↓</kbd> to navigate</span>
                                <span><kbd className="font-mono bg-white/10 px-1 py-0.5 rounded text-foreground">ESC</kbd> to close</span>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
