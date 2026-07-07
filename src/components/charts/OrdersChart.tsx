'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DailyPoint, HourlyPoint } from '@/types';
import { sliceByPeriod } from '@/lib/transforms';
import { NOON_YELLOW } from '@/lib/constants';
import ChartCard from '@/components/ui/ChartCard';

interface Props {
  daily120: DailyPoint[];
  hourly7: HourlyPoint[];
  hourly30: HourlyPoint[];
  hourly60: HourlyPoint[];
  granularity: 'daily' | 'hourly';
  showRobotAbsolute?: boolean;
  vehicleLabel?: string;
}

const PERIODS = [
  { label: 'L120D', days: 120 },
  { label: 'L60D', days: 60 },
  { label: 'L30D', days: 30 },
  { label: 'L7D', days: 7 },
  { label: 'D-1', days: 1 },
];

const fmt = (d: string) => d.slice(5);
const fmtH = (h: number) => `${String(h).padStart(2, '0')}:00`;

const TT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-0 border border-surface-2 rounded-xl shadow-card-lg p-3 text-xs">
      <p className="font-semibold text-ink-primary mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color ?? p.stroke }}>{p.name}: <span className="font-semibold">{typeof p.value === 'number' ? Math.round(p.value).toLocaleString() : p.value}</span></p>
      ))}
    </div>
  );
};

export default function OrdersChart({ daily120, hourly7, hourly30, hourly60, granularity, showRobotAbsolute, vehicleLabel }: Props) {
  const vLabel = vehicleLabel ?? 'Robot';

  if (granularity === 'hourly') {
    const hourlyDatasets = [
      { label: 'L7D', data: hourly7 },
      { label: 'L30D', data: hourly30 },
      { label: 'L60D', data: hourly60 },
    ];
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {hourlyDatasets.map(({ label, data }) => (
          <ChartCard key={label} title={showRobotAbsolute ? `${vLabel} Deliveries — ${label}` : `Total Orders — ${label}`} subtitle="By hour of day">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
                <XAxis dataKey="hour" tickFormatter={fmtH} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <Tooltip content={<TT />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                {showRobotAbsolute
                  ? <Line type="monotone" dataKey="robotCount" name={`${vLabel} Deliveries`} stroke={NOON_YELLOW} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  : <Line type="monotone" dataKey="value" name="Orders" stroke={NOON_YELLOW} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                }
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        ))}
      </div>
    );
  }

  const dataKey = showRobotAbsolute ? 'robotCount' : 'value';
  const chartData = daily120;

  const periods = PERIODS.map(p => {
    const slice = sliceByPeriod(daily120, p.days);
    const total = slice.reduce((a, d) => a + ((d as any)[dataKey] ?? 0), 0);
    return { ...p, total };
  });

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
            <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
            <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
            <Tooltip content={<TT />} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Line type="monotone" dataKey={dataKey} name={showRobotAbsolute ? `${vLabel} Deliveries` : 'Total Orders'} stroke={NOON_YELLOW} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {periods.map(p => (
          <div key={p.label} className="bg-surface-0 border border-surface-2 rounded-xl p-3 text-center">
            <p className="text-[10px] text-ink-tertiary uppercase tracking-wider font-semibold">{p.label}</p>
            <p className="text-xl font-bold text-ink-primary mt-1">{p.total.toLocaleString()}</p>
            <p className="text-[10px] text-ink-tertiary mt-1">{showRobotAbsolute ? 'deliveries' : 'orders'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
