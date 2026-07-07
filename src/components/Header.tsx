'use client';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface Props { lastUpdated: string | null; isLoading: boolean; onRefresh: () => void; hasError: boolean; }

export default function Header({ lastUpdated, isLoading, onRefresh, hasError }: Props) {
  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai' }) + ' GST';
  };

  return (
    <header className="sticky top-0 z-50 bg-surface-0/90 backdrop-blur-md border-b border-surface-2">
      <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <img src="/noon-minutes-logo.png" alt="noon Minutes" className="h-8 w-auto" />
            <span className="text-ink-tertiary text-sm">·</span>
            <span className="text-sm text-ink-secondary font-medium">Autonomous Command Centre</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasError ? (
            <div className="flex items-center gap-1.5 text-noon-red text-xs font-medium">
              <WifiOff size={13} /> Data error — retrying
            </div>
          ) : lastUpdated ? (
            <div className="flex items-center gap-1.5 text-ink-tertiary text-xs">
              <Wifi size={13} className="text-green-500" />
              Updated {fmtTime(lastUpdated)}
            </div>
          ) : null}

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-noon-yellow hover:bg-noon-yellow-light text-ink-primary text-xs font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-60"
          >
            <motion.span animate={isLoading ? { rotate: 360 } : { rotate: 0 }} transition={isLoading ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}>
              <RefreshCw size={12} />
            </motion.span>
            {isLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>
    </header>
  );
}
