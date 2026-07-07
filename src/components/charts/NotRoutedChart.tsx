'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { NotRoutedBreakdown, SolutionType } from '@/types';
import { NOT_ROUTED_COLORS, NOT_ROUTED_LABELS } from '@/lib/constants';
import ChartCard from '@/components/ui/ChartCard';

interface Props { data: NotRoutedBreakdown[]; solution: SolutionType; }

const KEYS = ['outside_window', 'age_verification', 'high_value', 'new_address', 'bulky', 'barista', 'customer_id', 'exceeds_capacity', 'cod', 'leave_at_door', 'did_not_opt_in'] as const;

const toPercent = (data: NotRoutedBreakdown[]) => data.map(row => {
  const total = KEYS.reduce((s, k) => s + ((row as any)[k] ?? 0), 0) || 1;
  const out: Record<string, number | string> = { period: row.period };
  for (const k of KEYS) out[k] = parseFloat((((row as any)[k] / total) * 100).toFixed(1));
  return out;
});

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-0 border border-surface-2 rounded-xl shadow-card-lg p-3 text-xs max-w-[220px]">
      <p className="font-semibold text-ink-primary mb-1">{label}</p>
      {payload.filter((p: any) => p.value > 0).sort((a: any, b: any) => b.value - a.value).map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill }}>{NOT_ROUTED_LABELS[p.dataKey]}: <span className="font-semibold">{p.value}%</span></p>
      ))}
    </div>
  );
};

export default function NotRoutedChart({ data, solution }: Props) {
  const pctData = toPercent(data);
  const keys = solution === 'ventureone' ? KEYS.filter(k => k !== 'leave_at_door') : KEYS;

  return (
    <ChartCard title="Orders Not Routed to Robot" subtitle="% breakdown by reason — L7D / L30D / L60D / L120D avg">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={pctData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" vertical={false} />
          <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
          <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} unit="%" domain={[0, 100]} />
          <Tooltip content={<TT />} />
          <Legend wrapperStyle={{ fontSize: 9 }} />
          {keys.map(k => (
            <Bar key={k} dataKey={k} name={NOT_ROUTED_LABELS[k]} stackId="a" fill={NOT_ROUTED_COLORS[k]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
