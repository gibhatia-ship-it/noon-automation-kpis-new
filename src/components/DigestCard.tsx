'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, TrendingUp, Calendar } from 'lucide-react';
import { DigestData } from '@/types';
import { SOLUTION_LABELS, SOLUTION_ICONS } from '@/lib/constants';

interface Props { digest: DigestData | null; }

export default function DigestCard({ digest }: Props) {
  const [open, setOpen] = useState(true);

  if (!digest) return null;

  const visibleSolutions = digest.solutions.filter(s => s.d1TotalOrders > 0 || s.deliveries > 0 || s.complaints > 0);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-1 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-noon-yellow-muted flex items-center justify-center">
            <FileText size={14} className="text-noon-yellow-dark" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-primary">Daily Digest — {digest.date}</p>
            <p className="text-xs text-ink-tertiary">D-1 snapshot across all autonomous solutions</p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-ink-tertiary" /> : <ChevronDown size={16} className="text-ink-tertiary" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-5 pb-5 border-t border-surface-2">
              {/* Global KPI panels */}
              <div className="grid grid-cols-3 gap-4 mt-4 mb-4">
                <div className="bg-noon-yellow-muted rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-noon-yellow flex items-center justify-center shrink-0">
                    <TrendingUp size={14} className="text-ink-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-ink-tertiary uppercase tracking-wider">Total Deliveries (L120D)</p>
                    <p className="text-xl font-bold text-ink-primary">{digest.allTimeDeliveries.toLocaleString()}</p>
                    <p className="text-[10px] text-ink-tertiary">DBOTs + Sidewalk + Vans</p>
                  </div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                    <Calendar size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-ink-tertiary uppercase tracking-wider">{digest.currentMonthLabel} Deliveries</p>
                    <p className="text-xl font-bold text-ink-primary">{digest.currentMonthDeliveries.toLocaleString()}</p>
                    <p className="text-[10px] text-ink-tertiary">Month to date</p>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                    <Calendar size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-ink-tertiary uppercase tracking-wider">{digest.lastMonthLabel} Deliveries</p>
                    <p className="text-xl font-bold text-ink-primary">{digest.lastMonthDeliveries.toLocaleString()}</p>
                    <p className="text-[10px] text-ink-tertiary">Full month</p>
                  </div>
                </div>
              </div>

              {visibleSolutions.length === 0 ? (
                <p className="text-xs text-ink-tertiary italic">No D-1 data available yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {visibleSolutions.map(s => (
                    <div key={s.solution} className="bg-surface-1 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span>{SOLUTION_ICONS[s.solution]}</span>
                        <span className="text-sm font-semibold">{SOLUTION_LABELS[s.solution]}</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <Row label="Total Orders" value={s.d1TotalOrders.toLocaleString()} />
                        <Row label="Robot Deliveries" value={s.deliveries.toLocaleString()} />
                        <Row label="Total Orders by Robots %" value={s.d1TotalOrders > 0 ? `${((s.deliveries / s.d1TotalOrders) * 100).toFixed(1)}%` : '—'} />
                        <Row label="Complaints" value={s.complaints.toString()} warn={s.complaints > 0} />
                        <Row label="Refunds" value={`AED ${s.refundAmount.toFixed(0)}`} warn={s.refundAmount > 0} />
                        <Row label="Top Geofence" value={s.topGeofence} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {digest.anomalies.length > 0 && (
                <p className="mt-4 text-xs text-amber-600 font-medium">⚠️ {digest.anomalies.length} anomal{digest.anomalies.length > 1 ? 'ies' : 'y'} detected — review the alert banners above.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-ink-tertiary">{label}</span>
      <span className={`font-semibold ${warn ? 'text-noon-red' : 'text-ink-primary'}`}>{value}</span>
    </div>
  );
}
