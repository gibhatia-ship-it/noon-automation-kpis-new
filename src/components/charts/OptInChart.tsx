'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { OptInPoint } from '@/types';
import { sliceByPeriod } from '@/lib/transforms';
import { NOON_YELLOW } from '@/lib/constants';

interface Props { data: OptInPoint[]; }

const PERIODS = [
  { label: 'L120D', days: 120 },
  { label: 'L60D', days: 60 },
  { label: 'L30D', days: 30 },
  { label: 'L7D', days: 7 },
  { label: 'D-1', days: 1 },
];

const fmt = (d: string) => d.slice(5);

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-0 border border-surface-2 rounded-xl shadow-card-lg p-3 text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.stroke }}>{p.name}: <span className="font-semibold">{p.value?.toFixed(1)}%</span></p>
      ))}
    </div>
  );
};

export default function OptInChart({ data }: Props) {
  const chartData = data;

  const periods = PERIODS.map(p => {
    const slice = sliceByPeriod(data, p.days);
    const avg = slice.length > 0 ? slice.reduce((a, d) => a + d.pct, 0) / slice.length : 0;
    return { ...p, avg, count: slice.length };
  });

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">Opt-in Rate — Orders Routed to Robot ÷ Total Orders in Window</h4>

      <div className="card p-4">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
            <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
            <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} unit="%" domain={[0, 100]} />
            <Tooltip content={<TT />} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line type="monotone" dataKey="pct" name="Opt-in %" stroke={NOON_YELLOW} strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {periods.map(p => (
          <div key={p.label} className="bg-surface-0 border border-surface-2 rounded-xl p-3 text-center">
            <p className="text-[10px] text-ink-tertiary uppercase tracking-wider font-semibold">{p.label}</p>
            <p className={`text-xl font-bold mt-1 ${p.avg >= 70 ? 'text-emerald-600' : p.avg >= 40 ? 'text-amber-600' : p.count > 0 ? 'text-noon-red' : 'text-ink-tertiary'}`}>
              {p.count > 0 ? `${p.avg.toFixed(1)}%` : '—'}
            </p>
            <p className="text-[10px] text-ink-tertiary mt-1">avg opt-in</p>
          </div>
        ))}
      </div>
    </div>
  );
}
