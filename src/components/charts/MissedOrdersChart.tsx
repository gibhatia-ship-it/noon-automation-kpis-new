'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MissedOrdersPeriod } from '@/lib/transforms';
import ChartCard from '@/components/ui/ChartCard';
import { NOON_RED } from '@/lib/constants';
import { SolutionType } from '@/types';

interface Props { data: MissedOrdersPeriod[]; solution: SolutionType; }

const BAR_COLORS = ['#6366F1', '#D4E600', '#DA291C', '#10B981'];

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-surface-0 border border-surface-2 rounded-xl shadow-card-lg p-3 text-xs">
      <p className="font-semibold mb-1">{label}</p>
      <p style={{ color: p.fill }}>Missed %: <span className="font-semibold">{p.payload.missedPct.toFixed(1)}%</span></p>
      <p className="text-ink-tertiary">Missed count: {Math.round(p.payload.missedCount)}</p>
      <p className="text-ink-tertiary">Total in window: {Math.round(p.payload.totalInWindow)}</p>
    </div>
  );
};

export default function MissedOrdersChart({ data, solution }: Props) {
  const vehicleLabel = solution === 'robovan' ? 'Robovan' : 'Robot';
  return (
    <div>
      <h4 className="text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-3">
        Missed Orders % / Downtime
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard
          title={`Missed Orders % — D-1 · L7D · L30D · L60D`}
          subtitle={`Routed to ${vehicleLabel} but not delivered ÷ Total in window`}
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} unit="%" />
              <Tooltip content={<TT />} />
              <Bar dataKey="missedPct" name="Missed %" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={BAR_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Missed Order Count — D-1 · L7D · L30D · L60D"
          subtitle={`Orders routed to ${vehicleLabel} not completed (avg/day)`}
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="bg-surface-0 border border-surface-2 rounded-xl p-3 text-xs">
                      <p className="font-semibold mb-1">{label}</p>
                      <p style={{ color: NOON_RED }}>Missed: <span className="font-semibold">{Math.round(payload[0]?.value as number)}</span></p>
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="missedCount" name="Missed Orders" radius={[4, 4, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={BAR_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
