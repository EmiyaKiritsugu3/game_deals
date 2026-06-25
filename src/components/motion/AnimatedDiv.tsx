'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Enable hover lift effect (default false — entrance only) */
  hover?: boolean;
  /** Entrance animation disabled (default false) */
  noEntrance?: boolean;
}

export function AnimatedDiv({
  children,
  className,
  delay = 0,
  hover = false,
  noEntrance = false,
}: Props) {
  return (
    <motion.div
      className={className}
      initial={noEntrance ? undefined : { opacity: 0, y: 24 }}
      whileInView={noEntrance ? undefined : { opacity: 1, y: 0 }}
      viewport={noEntrance ? undefined : { once: true, margin: '-40px' }}
      transition={noEntrance ? undefined : { duration: 0.45, delay, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={
        hover ? { y: -6, transition: { type: 'spring', stiffness: 300, damping: 18 } } : undefined
      }
    >
      {children}
    </motion.div>
  );
}
