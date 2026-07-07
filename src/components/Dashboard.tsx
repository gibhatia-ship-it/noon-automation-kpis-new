'use client';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { RawRow, SolutionType, Anomaly, DigestData, MappingRow, OperationalWindowRow, FleetSizeRow } from '@/types';
import { REFRESH_INTERVAL_MS, SOLUTION_LABELS, SOLUTION_ICONS } from '@/lib/constants';
import { filterBySolution, getDaysAgoStr, getGlobalSummary } from '@/lib/transforms';
import { detectAnomalies } from '@/lib/anomalyDetection';
import { generateDigest } from '@/lib/digestGenerator';
import Header from './Header';
import AnomalyBanner from './AnomalyBanner';
import DigestCard from './DigestCard';
import SolutionPanel from './SolutionPanel';
import TabBar from './ui/TabBar';
import ChatBot from './ChatBot';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const SOLUTION_TABS: { id: SolutionType; label: string }[] = [
  { id: 'ventureone', label: `${SOLUTION_ICONS.ventureone} ${SOLUTION_LABELS.ventureone}` },
  { id: 'yango', label: `${SOLUTION_ICONS.yango} ${SOLUTION_LABELS.yango}` },
  { id: 'robovan', label: `${SOLUTION_ICONS.robovan} ${SOLUTION_LABELS.robovan}` },
];

function Skeleton() {
  return (
    <div className="space-y-4 p-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-24 rounded-2xl shimmer" />
      ))}
    </div>
  );
}

function GlobalSummaryBar({ rows, mapping }: { rows: RawRow[]; mapping: MappingRow[] }) {
  const d1Str = getDaysAgoStr(1);
  const summary = getGlobalSummary(rows);
  const totalGeofences = summary.reduce((a, s) => a + s.liveGeofences, 0);
  const totalD1Robot = summary.reduce((a, s) => a + s.d1Robot, 0);
  const totalD1Orders = summary.reduce((a, s) => a + s.d1Total, 0);
  const overallPct = totalD1Orders > 0 ? ((totalD1Robot / totalD1Orders) * 100).toFixed(1) : '—';

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-bold text-ink-primary">Autonomous Solutions — Live Overview</p>
          <p className="text-[10px] text-ink-tertiary">D-1: {d1Str} · All solutions combined</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-tertiary">
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">
            {totalGeofences} geofences live
          </span>
          <span className="inline-flex items-center gap-1 bg-noon-yellow-muted text-noon-yellow-dark px-2 py-0.5 rounded-full text-[10px] font-semibold">
            {overallPct}% robot D-1
          </span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {summary.map(s => (
          <div key={s.solution} className="bg-surface-1 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-sm">{SOLUTION_ICONS[s.solution]}</span>
              <span className="text-xs font-semibold text-ink-primary">{SOLUTION_LABELS[s.solution]}</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-ink-primary leading-none">{s.d1Robot.toLocaleString()}</p>
                <p className="text-[10px] text-ink-tertiary mt-0.5">D-1 robot deliveries</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-noon-yellow-dark">{s.liveGeofences}</p>
                <p className="text-[10px] text-ink-tertiary">geofences</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    rows: RawRow[];
    mapping: MappingRow[];
    operationalWindows: OperationalWindowRow[];
    fleetSize: FleetSizeRow[];
    fetchedAt: string;
    dateRange: { min: string | null; max: string | null; distinctDates: number };
  }>(
    '/api/data',
    fetcher,
    { refreshInterval: REFRESH_INTERVAL_MS, revalidateOnFocus: false }
  );

  const [activeSolution, setActiveSolution] = useState<SolutionType>('ventureone');
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [digest, setDigest] = useState<DigestData | null>(null);

  const rows = data?.rows ?? [];
  const mapping = data?.mapping ?? [];
  const opWindows = data?.operationalWindows ?? [];
  const fleetSize: FleetSizeRow[] = data?.fleetSize ?? [];
  const dateRange = data?.dateRange ?? null;

  useEffect(() => {
    if (!rows.length) return;
    const detected = detectAnomalies(rows);
    setAnomalies(detected);
    setDigest(generateDigest(rows, detected, mapping));
  }, [data?.fetchedAt]);

  return (
    <div className="min-h-screen bg-surface-1">
      <Header
        lastUpdated={data?.fetchedAt ?? null}
        isLoading={isValidating}
        onRefresh={() => mutate()}
        hasError={!!error}
      />

      <main className="max-w-screen-2xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {anomalies.length > 0 && <AnomalyBanner anomalies={anomalies} />}
        {digest && <DigestCard digest={digest} />}

        {dateRange && dateRange.distinctDates < 7 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
            <span className="text-amber-500 mt-0.5 shrink-0">⚠️</span>
            <div>
              <p className="text-xs font-semibold text-amber-800">Limited historical data in sheet</p>
              <p className="text-xs text-amber-700 mt-0.5">
                The sheet currently has <strong>{dateRange.distinctDates} day{dateRange.distinctDates !== 1 ? 's' : ''}</strong> of data
                {dateRange.min ? ` (${dateRange.min})` : ''}.
                Trend charts (L7D, L30D, L60D) will show identical data until the sheet accumulates more history.
                This is a <strong>data availability issue</strong>, not a dashboard bug.
              </p>
            </div>
          </div>
        )}

        {rows.length > 0 && <GlobalSummaryBar rows={rows} mapping={mapping} />}

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-ink-primary">Autonomous Delivery</h1>
            <p className="text-xs text-ink-tertiary mt-0.5">Live performance across all solutions</p>
          </div>
          <TabBar
            tabs={SOLUTION_TABS.map(t => ({ id: t.id, label: t.label }))}
            active={activeSolution}
            onChange={v => setActiveSolution(v as SolutionType)}
          />
        </div>

        {isLoading ? (
          <Skeleton />
        ) : error ? (
          <div className="card p-12 text-center text-ink-tertiary text-sm">
            <p className="text-2xl mb-2">⚠️</p>
            <p>Failed to load data. The dashboard will retry automatically.</p>
          </div>
        ) : !rows.length ? (
          <div className="card p-12 text-center text-ink-tertiary text-sm">
            <p className="text-2xl mb-2">📭</p>
            <p>No data found in the sheet.</p>
          </div>
        ) : (
          <motion.div
            key={activeSolution}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <SolutionPanel rows={rows} solution={activeSolution} mapping={mapping} opWindows={opWindows} fleetSize={fleetSize} />
          </motion.div>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-ink-tertiary border-t border-surface-2 mt-8">
        noon Minutes Autonomous Command Centre (L120D days data)
      </footer>

      <ChatBot rows={rows} mapping={mapping} />
    </div>
  );
}
