'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';
import { useState } from 'react';
import { Anomaly } from '@/types';
import { SOLUTION_LABELS } from '@/lib/constants';
import clsx from 'clsx';

interface Props { anomalies: Anomaly[]; }

export default function AnomalyBanner({ anomalies }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const visible = anomalies.filter(a => !dismissed.has(a.id));

  if (!visible.length) return null;

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {visible.map(a => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25 }}
            className={clsx(
              'flex items-start gap-3 px-4 py-3 rounded-xl border text-sm',
              a.severity === 'critical' ? 'badge-critical' : 'badge-warning'
            )}
          >
            <span className="mt-0.5 shrink-0">
              {a.severity === 'critical' ? <AlertCircle size={15} /> : <AlertTriangle size={15} />}
            </span>
            <div className="flex-1 min-w-0">
              <span className="font-semibold">{SOLUTION_LABELS[a.solution]}</span>
              <span className="mx-1.5 text-ink-tertiary">·</span>
              <span>{a.message}</span>
            </div>
            <button onClick={() => setDismissed(prev => { const s = new Set(Array.from(prev)); s.add(a.id); return s; })} className="shrink-0 text-ink-tertiary hover:text-ink-primary transition-colors">
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
