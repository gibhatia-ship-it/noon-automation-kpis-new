'use client';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { DailyPoint } from '@/types';
import { NOON_YELLOW, NOON_RED } from '@/lib/constants';
import ChartCard from '@/components/ui/ChartCard';

interface Props {
  d1: DailyPoint[];
  l7d: DailyPoint[];
  l30d: DailyPoint[];
  l60d: DailyPoint[];
  vehicleLabel?: string;
}

const fmt = (d: string) => d.slice(5);

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const total = payload.find((p: any) => p.dataKey === 'value')?.value ?? 0;
  const robot = payload.find((p: any) => p.dataKey === 'robotCount')?.value ?? 0;
  const pct = total > 0 ? ((robot / total) * 100).toFixed(1) : '0';
  return (
    <div className="bg-surface-0 border border-surface-2 rounded-xl shadow-card-lg p-3 text-xs">
      <p className="font-semibold text-ink-primary mb-1">{label}</p>
      <p className="text-ink-secondary">Total orders: <span className="font-semibold">{Math.round(total).toLocaleString()}</span></p>
      <p style={{ color: NOON_YELLOW }}>Robot deliveries: <span className="font-semibold">{Math.round(robot).toLocaleString()}</span></p>
      <p className="text-ink-tertiary">Robot share: <span className="font-semibold">{pct}%</span></p>
    </div>
  );
};

function SingleMixChart({ data, period, vehicleLabel }: { data: DailyPoint[]; period: string; vehicleLabel: string }) {
  return (
    <ChartCard title={`Delivery Mix — ${period}`} subtitle={`Total orders (bar) vs ${vehicleLabel} deliveries (line)`}>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" vertical={false} />
          <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
          <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
          <Tooltip content={<TT />} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar yAxisId="left" dataKey="value" name="Total Orders" fill="#E5E7EB" radius={[2, 2, 0, 0]} />
          <Line yAxisId="left" type="monotone" dataKey="robotCount" name={`${vehicleLabel} Deliveries`} stroke={NOON_YELLOW} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default function DeliveryMixChart({ d1, l7d, l30d, l60d, vehicleLabel = 'Robot' }: Props) {
  const datasets = [
    { period: 'D-1', data: d1 },
    { period: 'L7D', data: l7d },
    { period: 'L30D', data: l30d },
    { period: 'L60D', data: l60d },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {datasets.map(({ period, data }) => (
        <SingleMixChart key={period} data={data} period={period} vehicleLabel={vehicleLabel} />
      ))}
    </div>
  );
}
