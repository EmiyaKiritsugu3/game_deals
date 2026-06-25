'use client';

import { motion } from 'motion/react';
import { type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  delay?: number;
}

/**
 * Client wrapper around async GameCard for entrance animation + spring hover lift.
 * ponytail: if GameCard becomes a client component, merge this directly.
 */
export function AnimatedGameCardWrapper({ children, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 18 } }}
      className="shrink-0"
    >
      {children}
    </motion.div>
  );
}
