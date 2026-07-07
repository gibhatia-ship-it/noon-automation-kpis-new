'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ForcedPoint, sliceByPeriod } from '@/lib/transforms';

interface Props {
  data: ForcedPoint[];
}

const PERIODS = [
  { label: 'L120D', days: 120 },
  { label: 'L60D', days: 60 },
  { label: 'L30D', days: 30 },
  { label: 'L7D', days: 7 },
  { label: 'D-1', days: 1 },
];

const fmt = (d: string) => d.slice(5);

export default function ForcedAssignmentsChart({ data }: Props) {
  const periods = PERIODS.map(p => {
    const slice = sliceByPeriod(data, p.days);
    return { ...p, count: slice.reduce((a, d) => a + d.count, 0) };
  });

  const l30avg = periods.find(p => p.label === 'L30D');
  const dailyAvg = l30avg && sliceByPeriod(data, 30).length > 0
    ? l30avg.count / Math.max(1, sliceByPeriod(data, 30).length)
    : 0;

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">
        Forced Robot Assignments
      </h4>

      <div className="card p-4">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
            <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
            <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} allowDecimals={false} />
            <Tooltip
              content={({ active, payload, label: l }) => active && payload?.length ? (
                <div className="bg-surface-0 border border-surface-2 rounded-xl shadow-card-lg p-3 text-xs">
                  <p className="font-semibold mb-1">{l}</p>
                  <p className="text-amber-600">Forced: <span className="font-semibold">{payload[0]?.value?.toLocaleString()}</span></p>
                </div>
              ) : null}
            />
            {dailyAvg > 0 && <ReferenceLine y={dailyAvg} stroke="#F59E0B" strokeDasharray="4 2" label={{ value: 'L30D avg', fontSize: 10, fill: '#F59E0B', position: 'insideTopRight' }} />}
            <Bar dataKey="count" name="Forced Assigned" fill="#F59E0B" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {periods.map(p => (
          <div key={p.label} className="bg-surface-0 border border-surface-2 rounded-xl p-3 text-center">
            <p className="text-[10px] text-ink-tertiary uppercase tracking-wider font-semibold">{p.label}</p>
            <p className="text-xl font-bold text-amber-600 mt-1">{p.count.toLocaleString()}</p>
            <p className="text-[10px] text-ink-tertiary mt-1">robot forced</p>
          </div>
        ))}
      </div>
    </div>
  );
}
