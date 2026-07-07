'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RawRow, SolutionType, MappingRow, OperationalWindowRow, FleetSizeRow } from '@/types';
import { SOLUTION_LABELS, SOLUTION_DESCRIPTIONS, SOLUTION_ICONS } from '@/lib/constants';
import { filterBySolution } from '@/lib/transforms';
import TabBar from '@/components/ui/TabBar';
import SummaryTab from '@/components/tabs/SummaryTab';
import AggregatedTab from '@/components/tabs/AggregatedTab';
import GeofenceTab from '@/components/tabs/GeofenceTab';

interface Props { rows: RawRow[]; solution: SolutionType; mapping: MappingRow[]; opWindows: OperationalWindowRow[]; fleetSize: FleetSizeRow[]; }

const TABS = [
  { id: 'summary', label: 'Summary' },
  { id: 'aggregated', label: 'Aggregated Insights' },
  { id: 'geofence', label: 'Geofence Level' },
];

export default function SolutionPanel({ rows, solution, mapping, opWindows, fleetSize }: Props) {
  const [tab, setTab] = useState('summary');
  const count = new Set(filterBySolution(rows, solution).map(r => r.geofence_code)).size;

  return (
    <div className="card p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-noon-yellow-muted flex items-center justify-center text-2xl">
            {SOLUTION_ICONS[solution]}
          </div>
          <div>
            <h2 className="text-base font-bold text-ink-primary">{SOLUTION_LABELS[solution]}</h2>
            <p className="text-xs text-ink-tertiary">{SOLUTION_DESCRIPTIONS[solution]} · {count} geofence{count !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <TabBar tabs={TABS} active={tab} onChange={setTab} size="sm" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'summary' && <SummaryTab rows={rows} solution={solution} mapping={mapping} opWindows={opWindows} fleetSize={fleetSize} />}
          {tab === 'aggregated' && <AggregatedTab rows={rows} solution={solution} mapping={mapping} opWindows={opWindows} />}
          {tab === 'geofence' && <GeofenceTab rows={rows} solution={solution} mapping={mapping} opWindows={opWindows} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
