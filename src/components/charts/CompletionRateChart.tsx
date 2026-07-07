'use client';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CompletionPoint, sliceByPeriod } from '@/lib/transforms';
import { NOON_YELLOW, NOON_RED } from '@/lib/constants';

interface Props {
  data: CompletionPoint[];
  subDescription?: string;
}

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
        <p key={p.name} style={{ color: p.color ?? p.stroke }}>
          {p.name}: <span className="font-semibold">
            {p.name === 'Utilisation %' || p.name === 'Trend' ? `${p.value?.toFixed(1)}%` : p.value?.toLocaleString()}
          </span>
        </p>
      ))}
    </div>
  );
};

export default function CompletionRateChart({ data, subDescription }: Props) {
  const chartData = data;

  const periods = PERIODS.map(p => {
    const slice = sliceByPeriod(data, p.days);
    const delivered = slice.reduce((a, d) => a + d.delivered, 0);
    const routed = slice.reduce((a, d) => a + d.routed, 0);
    const pct = routed > 0 ? (delivered / routed) * 100 : 0;
    return { ...p, delivered, routed, pct };
  });

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">
          Utilisation Rate — Delivered by Robot ÷ Routed to Robot
        </h4>
        {subDescription && (
          <p className="text-[10px] text-ink-tertiary mt-0.5">{subDescription}</p>
        )}
      </div>

      {/* 120D main chart */}
      <div className="card p-4">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
            <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#9CA3AF' }} unit="%" domain={[0, 100]} />
            <Tooltip content={<TT />} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar yAxisId="left" dataKey="routed" name="Routed" fill="#E5E7EB" radius={[2, 2, 0, 0]} />
            <Bar yAxisId="left" dataKey="delivered" name="Delivered" fill={NOON_YELLOW} radius={[2, 2, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="pct" name="Utilisation %" stroke={NOON_RED} strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Period summary cards */}
      <div className="grid grid-cols-5 gap-3">
        {periods.map(p => (
          <div key={p.label} className="bg-surface-0 border border-surface-2 rounded-xl p-3 text-center">
            <p className="text-[10px] text-ink-tertiary uppercase tracking-wider font-semibold">{p.label}</p>
            <p className={`text-xl font-bold mt-1 ${p.pct >= 80 ? 'text-emerald-600' : p.pct >= 50 ? 'text-amber-600' : p.routed > 0 ? 'text-noon-red' : 'text-ink-tertiary'}`}>
              {p.routed > 0 ? `${p.pct.toFixed(1)}%` : '—'}
            </p>
            <p className="text-[10px] text-ink-tertiary mt-1">{p.delivered.toLocaleString()} / {p.routed.toLocaleString()}</p>
            <p className="text-[10px] text-ink-tertiary">del / routed</p>
          </div>
        ))}
      </div>
    </div>
  );
}
