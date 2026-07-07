'use client';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { HourlyMissedPoint } from '@/lib/transforms';
import ChartCard from '@/components/ui/ChartCard';
import { NOON_YELLOW, NOON_RED } from '@/lib/constants';
import { SolutionType } from '@/types';

interface Props { l7d: HourlyMissedPoint[]; l30d: HourlyMissedPoint[]; solution: SolutionType; }

const fmtH = (h: number) => `${String(h).padStart(2, '0')}:00`;

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-0 border border-surface-2 rounded-xl shadow-card-lg p-3 text-xs space-y-0.5">
      <p className="font-semibold mb-1">{fmtH(label)}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color ?? p.fill }}>
          {p.name}: <span className="font-semibold">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </p>
      ))}
    </div>
  );
};

function SingleChart({ data, title, vehicleLabel }: { data: HourlyMissedPoint[]; title: string; vehicleLabel: string }) {
  return (
    <ChartCard title={title} subtitle={`Avg orders/hour within op. window · ${vehicleLabel} deliveries vs missed`}>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" vertical={false} />
          <XAxis dataKey="hour" tickFormatter={fmtH} tick={{ fontSize: 9, fill: '#9CA3AF' }} interval={2} />
          <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
          <Tooltip content={<TT />} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="total" name="Total Orders" fill="#E5E7EB" radius={[3, 3, 0, 0]} />
          <Bar dataKey="robot" name={`${vehicleLabel} Delivered`} fill={NOON_YELLOW} radius={[3, 3, 0, 0]} />
          <Line type="monotone" dataKey="missed" name="Missed by Robot" stroke={NOON_RED} strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default function HourlyMissedChart({ l7d, l30d, solution }: Props) {
  const vehicleLabel = solution === 'robovan' ? 'Robovan' : 'Robot';
  return (
    <div>
      <h4 className="text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-3">
        Orders by Hour — {vehicleLabel} vs Missed
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SingleChart data={l7d} title="L7D Average by Hour" vehicleLabel={vehicleLabel} />
        <SingleChart data={l30d} title="L30D Average by Hour" vehicleLabel={vehicleLabel} />
      </div>
    </div>
  );
}
