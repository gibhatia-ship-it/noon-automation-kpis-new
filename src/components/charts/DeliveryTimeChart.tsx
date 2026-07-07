'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SolutionType } from '@/types';
import { sliceByPeriod } from '@/lib/transforms';
import { NOON_YELLOW, NOON_RED } from '@/lib/constants';
import ChartCard from '@/components/ui/ChartCard';

export interface TimeSeriesPoint {
  date: string;
  robot: number;
  rider: number;
  robotDeliveries?: number;
  riderDeliveries?: number;
}

export interface HourlyTimePoint {
  hour: number;
  robot: number;
  rider: number;
  robotDeliveries?: number;
  riderDeliveries?: number;
}

interface Props {
  metric: 'ho' | 'lm';
  daily120: TimeSeriesPoint[];
  d1: TimeSeriesPoint[];
  hourly: HourlyTimePoint[];
  granularity: 'daily' | 'hourly';
  solution: SolutionType;
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
    <div className="bg-surface-0 border border-surface-2 rounded-xl shadow-card-lg p-3 text-xs space-y-0.5">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => p.value != null && (
        <p key={p.name} style={{ color: p.stroke }}>
          {p.name}: <span className="font-semibold">
            {p.name === 'Gap (Robot − Rider)'
              ? `${p.value > 0 ? '+' : ''}${p.value.toFixed(1)} min`
              : `${p.value.toFixed(1)} min`}
          </span>
        </p>
      ))}
    </div>
  );
};

function weightedAvg(data: TimeSeriesPoint[], field: 'robot' | 'rider') {
  const delField = field === 'robot' ? 'robotDeliveries' : 'riderDeliveries';
  const valid = data.filter(d => d[field] > 0);
  if (!valid.length) return 0;
  const totalDel = valid.reduce((a, d) => a + (d[delField] ?? 1), 0);
  return valid.reduce((a, d) => a + d[field] * (d[delField] ?? 1), 0) / totalDel;
}

function DirectionBadge({ robot, rider }: { robot: number; rider: number }) {
  if (!robot || !rider) return null;
  const diff = (robot - rider) / rider;
  const ratio = diff > 0.01 ? robot / rider : diff < -0.01 ? rider / robot : 1;
  const ratioStr = ratio.toFixed(1) + 'x';
  if (diff > 0.01) return <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">{ratioStr} slower</span>;
  if (diff < -0.01) return <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{ratioStr} faster</span>;
  return <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Equal</span>;
}

export default function DeliveryTimeChart({ metric, daily120, d1, hourly, granularity, solution }: Props) {
  const metricLabel = metric === 'ho' ? 'HO Time' : 'LM Time';
  const vehicleLabel = solution === 'robovan' ? 'Robovan' : 'Robot';
  const robotLabel = `${vehicleLabel} ${metricLabel}`;
  const riderLabel = `Rider ${metricLabel}`;

  if (granularity === 'hourly') {
    const hourlyWithDelta = hourly.map(d => ({
      ...d,
      delta: d.robot > 0 && d.rider > 0 ? d.robot - d.rider : null,
    }));
    return (
      <ChartCard title={`${metricLabel} by Hour`} subtitle="Robot vs Rider (mins) — Gap line converging toward 0 = improving">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={hourlyWithDelta} margin={{ top: 4, right: 16, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
            <XAxis dataKey="hour" tickFormatter={fmtH} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#9CA3AF' }} unit=" m" />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#9CA3AF' }} unit=" m" />
            <Tooltip content={<TT />} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <ReferenceLine yAxisId="right" y={0} stroke="#6366F1" strokeDasharray="3 3" strokeOpacity={0.5} />
            {hourly.some(d => d.robot > 0) && <Line yAxisId="left" type="monotone" dataKey="robot" name={robotLabel} stroke={NOON_YELLOW} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />}
            <Line yAxisId="left" type="monotone" dataKey="rider" name={riderLabel} stroke={NOON_RED} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line yAxisId="right" type="monotone" dataKey="delta" name="Gap (Robot − Rider)" stroke="#6366F1" strokeWidth={2} dot={false} strokeDasharray="5 3" activeDot={{ r: 4 }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    );
  }

  const hasRobotData = daily120.some(d => d.robot > 0);

  // Add delta field: robot - rider (null when either is missing)
  const chartData = daily120.map(d => ({
    ...d,
    delta: d.robot > 0 && d.rider > 0 ? d.robot - d.rider : null,
  }));

  const periods = PERIODS.map(p => {
    const slice = sliceByPeriod(daily120, p.days);
    const robot = weightedAvg(slice, 'robot');
    const rider = weightedAvg(slice, 'rider');
    const delta = robot > 0 && rider > 0 ? robot - rider : null;
    return { ...p, robot, rider, delta };
  });

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <p className="text-[10px] text-ink-tertiary mb-2">Gap line (dashed) = Robot − Rider. Converging toward 0 means robot is catching up.</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 8, right: 48, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
            <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#9CA3AF' }} unit=" m" />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#9CA3AF' }} unit=" m" label={{ value: 'Gap', angle: 90, position: 'insideRight', fontSize: 9, fill: '#9CA3AF' }} />
            <Tooltip content={<TT />} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <ReferenceLine yAxisId="right" y={0} stroke="#6366F1" strokeDasharray="3 3" strokeOpacity={0.4} label={{ value: '0 = equal', fontSize: 9, fill: '#6366F1', position: 'insideTopRight' }} />
            {hasRobotData && <Line yAxisId="left" type="monotone" dataKey="robot" name={robotLabel} stroke={NOON_YELLOW} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />}
            <Line yAxisId="left" type="monotone" dataKey="rider" name={riderLabel} stroke={NOON_RED} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            {hasRobotData && <Line yAxisId="right" type="monotone" dataKey="delta" name="Gap (Robot − Rider)" stroke="#6366F1" strokeWidth={2} dot={false} strokeDasharray="5 3" activeDot={{ r: 4 }} connectNulls={false} />}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {periods.map(p => (
          <div key={p.label} className="bg-surface-0 border border-surface-2 rounded-xl p-3 text-center">
            <p className="text-[10px] text-ink-tertiary uppercase tracking-wider font-semibold">{p.label}</p>
            {p.robot > 0 ? (
              <>
                <p className="text-base font-bold text-noon-yellow-dark mt-1">{p.robot.toFixed(1)}m</p>
                <p className="text-[10px] text-ink-tertiary">{vehicleLabel}</p>
                <p className="text-base font-bold text-slate-500 mt-0.5">{p.rider > 0 ? `${p.rider.toFixed(1)}m` : '—'}</p>
                <p className="text-[10px] text-ink-tertiary">Rider</p>
                {p.delta != null && (
                  <p className="text-sm font-bold mt-1.5 text-ink-tertiary">
                    {p.delta > 0 ? '+' : ''}{p.delta.toFixed(1)}m gap
                  </p>
                )}
                {p.rider > 0 && <div className="mt-0.5"><DirectionBadge robot={p.robot} rider={p.rider} /></div>}
              </>
            ) : (
              <>
                <p className="text-xl font-bold text-ink-tertiary mt-1">—</p>
                <p className="text-[10px] text-ink-tertiary">no robot data</p>
                <p className="text-base font-bold text-slate-500 mt-0.5">{p.rider > 0 ? `${p.rider.toFixed(1)}m` : '—'}</p>
                <p className="text-[10px] text-ink-tertiary">Rider</p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
