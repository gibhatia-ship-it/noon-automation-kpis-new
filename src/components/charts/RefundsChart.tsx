'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PeriodMetric } from '@/types';
import ChartCard from '@/components/ui/ChartCard';

interface Props { orders: PeriodMetric; amount: PeriodMetric; }

const PERIODS = ['d1', 'l7d', 'l30d', 'total'] as const;
const PERIOD_LABELS: Record<string, string> = { d1: 'D-1', l7d: 'L7D', l30d: 'L30D', total: 'Total' };
const BAR_COLORS = ['#6366F1', '#D4E600', '#DA291C', '#10B981'];

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-0 border border-surface-2 rounded-xl shadow-card-lg p-3 text-xs">
      <p className="font-semibold mb-1">{PERIOD_LABELS[label] ?? label}</p>
      {payload.map((p: any) => <p key={p.name} style={{ color: p.fill }}>{p.name}: <span className="font-semibold">{p.value?.toLocaleString()}</span></p>)}
    </div>
  );
};

function MiniBar({ metric, label }: { metric: PeriodMetric; label: string }) {
  const data = PERIODS.map(p => ({ period: p, value: metric[p] }));
  return (
    <ChartCard title={label}>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" vertical={false} />
          <XAxis dataKey="period" tickFormatter={p => PERIOD_LABELS[p]} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
          <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
          <Tooltip content={<TT />} />
          <Bar dataKey="value" name={label} radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={BAR_COLORS[i]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default function RefundsChart({ orders, amount }: Props) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-3">Refunds</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MiniBar metric={orders} label="Refund Orders" />
        <MiniBar metric={amount} label="Refund Amount (AED)" />
      </div>
    </div>
  );
}
