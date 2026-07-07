'use client';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  delay?: number;
}

export default function MetricCard({ label, value, sub, accent, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={clsx('card p-5 flex flex-col gap-1', accent && 'ring-2 ring-noon-yellow')}
    >
      <span className="metric-label">{label}</span>
      <span className={clsx('metric-value', accent && 'text-noon-yellow-dark')}>{value}</span>
      {sub && <span className="text-xs text-ink-tertiary mt-0.5">{sub}</span>}
    </motion.div>
  );
}
