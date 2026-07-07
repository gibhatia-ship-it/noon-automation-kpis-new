'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DistanceTimePoint } from '@/lib/transforms';
import ChartCard from '@/components/ui/ChartCard';
import { NOON_YELLOW, NOON_RED } from '@/lib/constants';

interface PeriodEntry { label: string; robot: DistanceTimePoint[]; rider: DistanceTimePoint[]; }
interface Props {
  periods: PeriodEntry[];
  metric: 'ho' | 'lm';
  robotLabel: string;
}

const fmt = (d: string) => d.slice(5);

// Convert raw distance-time points into min/km efficiency series
function toEfficiency(robot: DistanceTimePoint[], rider: DistanceTimePoint[]) {
  // Merge by date
  const byDate = new Map<string, { date: string; robotEff: number; riderEff: number; robotDist: number; riderDist: number }>();
  for (const r of robot) {
    if (r.distance > 0) byDate.set(r.date, { date: r.date, robotEff: r.time / r.distance, riderEff: 0, robotDist: r.distance, riderDist: 0 });
  }
  for (const r of rider) {
    if (r.distance > 0) {
      const existing = byDate.get(r.date);
      if (existing) { existing.riderEff = r.time / r.distance; existing.riderDist = r.distance; }
      else byDate.set(r.date, { date: r.date, robotEff: 0, riderEff: r.time / r.distance, robotDist: 0, riderDist: r.distance });
    }
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function aggStats(points: DistanceTimePoint[]) {
  const valid = points.filter(p => p.distance > 0 && p.time > 0);
  if (!valid.length) return null;
  const avgDist = valid.reduce((a, p) => a + p.distance, 0) / valid.length;
  const avgEff = valid.reduce((a, p) => a + p.time / p.distance, 0) / valid.length;
  return { avgDist, avgEff };
}

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-0 border border-surface-2 rounded-xl shadow-card-lg p-3 text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => p.value > 0 && (
        <p key={p.name} style={{ color: p.stroke }}>
          {p.name}: <span className="font-semibold">{p.value?.toFixed(2)} min/km</span>
        </p>
      ))}
    </div>
  );
};

function PeriodChart({ data, label, robotLabel, metric }: { data: ReturnType<typeof toEfficiency>; label: string; robotLabel: string; metric: string }) {
  const hasData = data.some(d => d.robotEff > 0 || d.riderEff > 0);
  return (
    <ChartCard
      title={`Efficiency — ${label}`}
      subtitle={`${metric === 'ho' ? 'HO' : 'LM'} time per km`}
    >
      {!hasData ? (
        <div className="h-[180px] flex items-center justify-center text-xs text-ink-tertiary">No distance data</div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
            <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
            <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} unit=" min/km" tickFormatter={(v) => v.toFixed(1)} />
            <Tooltip content={<TT />} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line type="monotone" dataKey="robotEff" name={robotLabel} stroke={NOON_YELLOW} strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
            <Line type="monotone" dataKey="riderEff" name="Rider" stroke="#94A3B8" strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export default function DistanceVsTimeChart({ periods, metric, robotLabel }: Props) {
  const timeLbl = metric === 'ho' ? 'HO' : 'LM';
  const allRobot = periods.flatMap(p => p.robot);
  const allRider = periods.flatMap(p => p.rider);
  const robotStats = aggStats(allRobot);
  const riderStats = aggStats(allRider);

  const efficiencyNote = (() => {
    if (!robotStats || !riderStats) return null;
    const slower = robotStats.avgEff > riderStats.avgEff;
    const ratio = slower ? robotStats.avgEff / riderStats.avgEff : riderStats.avgEff / robotStats.avgEff;
    return `${robotLabel} is ${ratio.toFixed(1)}x ${slower ? 'slower' : 'faster'} per km than rider`;
  })();

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">
          Distance & {timeLbl} Time Efficiency — min per km
        </h4>
        <p className="text-[10px] text-ink-tertiary mt-0.5">
          Lower = more efficient. Shows how many minutes each party takes per km of distance covered.
        </p>
      </div>

      {/* Summary strip */}
      {(robotStats || riderStats) && (
        <div className="card p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[10px] text-ink-tertiary uppercase tracking-wider">Avg Distance ({robotLabel})</p>
              <p className="text-lg font-bold text-ink-primary mt-0.5">{robotStats ? `${robotStats.avgDist.toFixed(2)} km` : '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-ink-tertiary uppercase tracking-wider">Efficiency ({robotLabel})</p>
              <p className="text-lg font-bold text-noon-yellow-dark mt-0.5">{robotStats ? `${robotStats.avgEff.toFixed(2)} min/km` : '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-ink-tertiary uppercase tracking-wider">Efficiency (Rider)</p>
              <p className="text-lg font-bold text-ink-secondary mt-0.5">{riderStats ? `${riderStats.avgEff.toFixed(2)} min/km` : '—'}</p>
            </div>
          </div>
          {/* Route optimisation insight */}
          {robotStats && riderStats && riderStats.avgDist > 0 && (
            <div className="mt-3 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
              <p className="text-[11px] font-semibold text-emerald-700 text-center">
                {robotStats.avgDist < riderStats.avgDist
                  ? `✓ ${robotLabel} takes a ${((1 - robotStats.avgDist / riderStats.avgDist) * 100).toFixed(0)}% shorter route than rider (${robotStats.avgDist.toFixed(2)} km vs ${riderStats.avgDist.toFixed(2)} km avg) — more optimised path`
                  : `${robotLabel} route is ${((robotStats.avgDist / riderStats.avgDist - 1) * 100).toFixed(0)}% longer than rider (${robotStats.avgDist.toFixed(2)} km vs ${riderStats.avgDist.toFixed(2)} km avg)`}
              </p>
            </div>
          )}
          {efficiencyNote && (
            <div className={`mt-2 text-center text-[11px] font-semibold px-3 py-1.5 rounded-lg ${efficiencyNote.includes('slower') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {efficiencyNote} (L120D avg)
            </div>
          )}
        </div>
      )}

      {/* Per-period efficiency charts */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {periods.map(p => (
          <PeriodChart
            key={p.label}
            data={toEfficiency(p.robot, p.rider)}
            label={p.label}
            robotLabel={robotLabel}
            metric={metric}
          />
        ))}
      </div>

      {/* Avg distance per period table */}
      <div className="card p-4">
        <p className="text-[10px] font-semibold text-ink-tertiary uppercase tracking-wider mb-3">Average Distance per Order (km)</p>
        <div className="grid grid-cols-5 gap-3">
          {periods.map(p => {
            const rStats = aggStats(p.robot);
            const riStats = aggStats(p.rider);
            return (
              <div key={p.label} className="text-center bg-surface-1 rounded-xl px-3 py-2.5">
                <p className="text-[10px] text-ink-tertiary uppercase tracking-wider">{p.label}</p>
                <p className="text-sm font-bold text-noon-yellow-dark mt-0.5">{rStats ? `${rStats.avgDist.toFixed(2)}` : '—'} km</p>
                <p className="text-[10px] text-ink-tertiary">{robotLabel}</p>
                <p className="text-sm font-bold text-slate-500 mt-1">{riStats ? `${riStats.avgDist.toFixed(2)}` : '—'} km</p>
                <p className="text-[10px] text-ink-tertiary">Rider</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
