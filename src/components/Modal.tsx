import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    maxWidth?: string;
    zIndex?: string;
}

export default function Modal({ isOpen, onClose, children, maxWidth = '420px', zIndex = '9999' }: ModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={`fixed inset-0 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm z-[${zIndex}]`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className={`relative flex w-full flex-col gap-6 rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl md:p-8`}
                        style={{ maxWidth }}
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white"
                            onClick={onClose}
                        >
                            <X size={20} />
                        </button>
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
