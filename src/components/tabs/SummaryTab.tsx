'use client';
import { useMemo } from 'react';
import { RawRow, SolutionType, MappingRow, OperationalWindowRow, FleetSizeRow } from '@/types';
import { getSummaryWithMapping, getDaysAgoStr, filterBySolution, getCompletionRateSummary } from '@/lib/transforms';
import { SOLUTION_LABELS, SOLUTION_ICONS } from '@/lib/constants';
import MetricCard from '@/components/ui/MetricCard';
import { motion } from 'framer-motion';

interface Props {
  rows: RawRow[];
  solution: SolutionType;
  mapping: MappingRow[];
  opWindows: OperationalWindowRow[];
  fleetSize: FleetSizeRow[];
}

export default function SummaryTab({ rows, solution, mapping, opWindows, fleetSize }: Props) {
  const m = getSummaryWithMapping(rows, solution, mapping, opWindows);
  const d1Str = getDaysAgoStr(1);
  const sRows = useMemo(() => filterBySolution(rows, solution), [rows, solution]);
  const completionSummary = useMemo(() => getCompletionRateSummary(sRows), [sRows]);
  const d1Completion = completionSummary.find(s => s.period === 'D-1');

  const fleetEntry = fleetSize.find(f => f.solution === solution);
  const robotCount = fleetEntry?.totalLive ?? m.totalRobots;
  const areasLive = fleetEntry?.areasLive ?? null;

  const buildingsLabel = solution === 'yango' ? 'Live Buildings / Villas' : solution === 'robovan' ? 'Areas Live' : 'Live Buildings';
  const vehicleLabel = solution === 'robovan' ? 'Robovan' : 'Robot';
  const countLabel = solution === 'robovan' ? 'Total Vans' : 'Total Robots';

  const fmtOptIn = (v: number | null) => v !== null ? `${v.toFixed(1)}%` : '—';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label={countLabel}
          value={robotCount || '—'}
          sub={areasLive ?? 'Live fleet'}
          accent
          delay={0}
        />
        <MetricCard label={buildingsLabel} value={m.totalBuildings} sub={`${SOLUTION_LABELS[solution]} geofences`} delay={0.05} />
        <MetricCard
          label={`D-1 ${vehicleLabel} Deliveries`}
          value={m.d1RobotDeliveries.toLocaleString()}
          sub={d1Completion && d1Completion.routed > 0 ? `of ${d1Completion.routed} routed` : d1Str}
          delay={0.1}
        />
        <MetricCard
          label="D-1 Utilisation Rate"
          value={d1Completion && d1Completion.routed > 0 ? `${d1Completion.pct.toFixed(1)}%` : '—'}
          sub={d1Completion ? `${d1Completion.delivered} delivered / ${d1Completion.routed} routed` : 'No D-1 data'}
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard label="Orders Outside Op. Window (D-1)" value={m.d1OutsideWindow.toLocaleString()} sub="Orders arriving outside scheduled hours" delay={0.2} />
      </div>

      {/* Utilisation rate summary across periods */}
      <div className="card p-4">
        <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-1">
          Utilisation Rate — {vehicleLabel} Delivered ÷ Routed
        </p>
        {solution === 'ventureone' && (
          <p className="text-[10px] text-ink-tertiary mb-3">(% of delivered orders / % of total orders that could have been delivered by robot)</p>
        )}
        {solution !== 'ventureone' && <div className="mb-3" />}
        <div className="grid grid-cols-5 gap-3">
          {completionSummary.map(s => (
            <div key={s.period} className="text-center bg-surface-1 rounded-xl px-3 py-2.5">
              <p className="text-[10px] text-ink-tertiary uppercase tracking-wider">{s.period}</p>
              <p className={`text-lg font-bold mt-0.5 ${s.pct >= 80 ? 'text-emerald-600' : s.pct >= 50 ? 'text-amber-600' : s.routed > 0 ? 'text-noon-red' : 'text-ink-tertiary'}`}>
                {s.routed > 0 ? `${s.pct.toFixed(1)}%` : '—'}
              </p>
              <p className="text-[10px] text-ink-tertiary mt-0.5">{s.delivered.toLocaleString()} / {s.routed.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Opt-in periods — only for yango and robovan */}
      {m.optInPcts && (
        <div className="card p-4">
          <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-3">
            Opt-in Rate — Orders Routed to {vehicleLabel} ÷ Total in Op. Window
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {([['D-1', m.optInPcts.d1], ['L7D', m.optInPcts.l7d], ['L30D', m.optInPcts.l30d], ['L60D', m.optInPcts.l60d]] as [string, number | null][]).map(([label, val]) => (
              <div key={label} className="bg-surface-1 rounded-xl px-3 py-2.5 text-center">
                <p className="text-[10px] text-ink-tertiary uppercase tracking-wider">{label}</p>
                <p className="text-lg font-bold text-ink-primary mt-0.5">{fmtOptIn(val)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Areas */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">{SOLUTION_ICONS[solution]}</span>
          <h3 className="text-sm font-semibold text-ink-primary">{buildingsLabel} — {SOLUTION_LABELS[solution]}</h3>
          <span className="text-xs text-ink-tertiary ml-auto">{m.liveAreas.length} area{m.liveAreas.length !== 1 ? 's' : ''}</span>
        </div>
        {areasLive && (
          <div className="mb-3 px-3 py-2 bg-noon-yellow-muted rounded-lg border border-noon-yellow/30">
            <p className="text-[11px] font-semibold text-noon-yellow-dark">Coverage: {areasLive}</p>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {m.liveAreas.map((a, i) => (
            <motion.div
              key={a.code}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-surface-1 rounded-xl px-3 py-2.5 flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-noon-yellow shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-ink-primary truncate">{a.name}</p>
                <p className="text-[10px] text-ink-tertiary truncate">{a.area}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
