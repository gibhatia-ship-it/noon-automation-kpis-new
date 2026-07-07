'use client';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface Tab { id: string; label: string; }
interface Props { tabs: Tab[]; active: string; onChange: (id: string) => void; size?: 'sm' | 'md'; }

export default function TabBar({ tabs, active, onChange, size = 'md' }: Props) {
  return (
    <div className="relative flex bg-surface-2 rounded-xl p-1 gap-0.5">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'relative rounded-lg font-medium transition-colors z-10',
            size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
            active === tab.id ? 'text-ink-primary' : 'text-ink-secondary hover:text-ink-primary'
          )}
        >
          {active === tab.id && (
            <motion.div
              layoutId={`tab-bg-${tabs.map(t => t.id).join('-')}`}
              className="absolute inset-0 bg-surface-0 rounded-lg shadow-card"
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
