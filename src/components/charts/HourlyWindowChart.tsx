'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import ChartCard from '@/components/ui/ChartCard';
import { NOON_YELLOW } from '@/lib/constants';

interface HourlyEntry { hour: number; value: number; }

interface Props {
  data: HourlyEntry[];
  windowStart: number;
  windowEnd: number;
  period: string;
}

const fmtH = (h: number) => `${String(h).padStart(2, '0')}:00`;

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const inWindow = payload[0]?.payload?.inWindow;
  return (
    <div className="bg-surface-0 border border-surface-2 rounded-xl shadow-card-lg p-3 text-xs">
      <p className="font-semibold mb-1">{fmtH(Number(label))}</p>
      <p className="text-ink-primary">Avg orders: <span className="font-semibold">{payload[0]?.value?.toFixed(1)}</span></p>
      <p className={inWindow ? 'text-emerald-600' : 'text-ink-tertiary'}>{inWindow ? '✓ In operational window' : '✗ Outside window'}</p>
    </div>
  );
};

export default function HourlyWindowChart({ data, windowStart, windowEnd, period }: Props) {
  const chartData = data.map(p => ({
    hour: p.hour,
    value: p.value,
    inWindow: p.hour >= windowStart && p.hour < windowEnd,
  }));

  return (
    <ChartCard
      title={`Hourly Orders — ${period}`}
      subtitle={`Op. window: ${fmtH(windowStart)} – ${fmtH(windowEnd)} · Yellow = in window, Grey = outside`}
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" vertical={false} />
          <XAxis dataKey="hour" tickFormatter={fmtH} tick={{ fontSize: 9, fill: '#9CA3AF' }} interval={2} />
          <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
          <Tooltip content={<TT />} />
          <Bar dataKey="value" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.inWindow ? NOON_YELLOW : '#E5E7EB'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
