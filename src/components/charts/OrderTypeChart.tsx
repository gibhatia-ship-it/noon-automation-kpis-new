'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { OrderTypePoint, sliceByPeriod } from '@/lib/transforms';

interface Props {
  data: OrderTypePoint[];
}

const PERIODS = [
  { label: 'L120D', days: 120 },
  { label: 'L60D', days: 60 },
  { label: 'L30D', days: 30 },
  { label: 'L7D', days: 7 },
  { label: 'D-1', days: 1 },
];

const fmt = (d: string) => d.slice(5);

interface TypeConfig {
  key: 'frozen' | 'fragile' | 'lbd';
  label: string;
  icon: string;
  barColor: string;
  lineColor: string;
}

const TYPES: TypeConfig[] = [
  { key: 'frozen',  label: 'Frozen Orders',  icon: '❄',  barColor: '#93C5FD', lineColor: '#2563EB' },
  { key: 'fragile', label: 'Fragile Orders', icon: '◇', barColor: '#C4B5FD', lineColor: '#7C3AED' },
  { key: 'lbd',     label: 'LBD Orders',     icon: '↩', barColor: '#6EE7B7', lineColor: '#059669' },
];

function makeTT(key: string, label: string) {
  return ({ active, payload, label: l }: any) => {
    if (!active || !payload?.length) return null;
    const count = payload.find((p: any) => p.dataKey === key)?.value ?? 0;
    const total = payload[0]?.payload?.total ?? 0;
    const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
    return (
      <div className="bg-surface-0 border border-surface-2 rounded-xl shadow-card-lg p-3 text-xs">
        <p className="font-semibold mb-1">{l}</p>
        <p className="text-ink-primary">{label}: <span className="font-semibold">{count.toLocaleString()} ({pct}% of total)</span></p>
        <p className="text-ink-tertiary">Total orders: {total.toLocaleString()}</p>
      </div>
    );
  };
}

function SingleTypeChart({ data, config }: { data: OrderTypePoint[]; config: TypeConfig }) {
  const TT = makeTT(config.key, config.label);
  return (
    <div className="card p-4 space-y-4">
      <h4 className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">
        {config.icon} {config.label} — % of Total Orders
      </h4>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
          <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
          <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} allowDecimals={false} />
          <Tooltip content={<TT />} />
          <Bar dataKey={config.key} name={config.label} fill={config.barColor} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <PeriodCards data={data} config={config} />
    </div>
  );
}

function PeriodCards({ data, config }: { data: OrderTypePoint[]; config: TypeConfig }) {
  const periods = PERIODS.map(p => {
    const slice = sliceByPeriod(data, p.days);
    const count = slice.reduce((a, d) => a + d[config.key], 0);
    const total = slice.reduce((a, d) => a + d.total, 0);
    const pct = total > 0 ? (count / total) * 100 : 0;
    return { ...p, count, total, pct };
  });

  return (
    <div className="grid grid-cols-5 gap-2">
      {periods.map(p => (
        <div key={p.label} className="bg-surface-1 rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-ink-tertiary uppercase tracking-wider font-semibold">{p.label}</p>
          <p className="text-base font-bold text-ink-primary mt-1">{p.total > 0 ? `${p.pct.toFixed(1)}%` : '—'}</p>
          <p className="text-[10px] text-ink-tertiary mt-0.5">{p.count.toLocaleString()} orders</p>
        </div>
      ))}
    </div>
  );
}

export default function OrderTypeChart({ data }: Props) {
  const charts = TYPES.map(config => ({ config, chartData: data }));

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">
        Order Type Breakdown — % of Total Orders
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {charts.map(({ config, chartData }) => (
          <SingleTypeChart key={config.key} data={chartData} config={config} />
        ))}
      </div>
    </div>
  );
}
