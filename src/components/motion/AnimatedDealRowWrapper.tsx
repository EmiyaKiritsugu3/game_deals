'use client';

import { motion } from 'motion/react';
import { type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  delay?: number;
}

/**
 * Client wrapper for DealRow entrance animation.
 * ponytail: merge into DealRow if it becomes a client component.
 */
export function AnimatedDealRowWrapper({ children, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.35, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}
