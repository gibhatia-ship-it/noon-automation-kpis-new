'use client';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Clock, Package, AlertTriangle } from 'lucide-react';
import { InsightData } from '@/lib/transforms';
import { SolutionType } from '@/types';

interface Props { insights: InsightData; solutionLabel: string; solution: SolutionType; }

function StatRow({ icon, label, value, highlight }: { icon?: React.ReactNode; label: string; value: string; highlight?: 'good' | 'warn' | 'neutral' }) {
  const color = highlight === 'good' ? 'text-emerald-600' : highlight === 'warn' ? 'text-noon-red' : 'text-ink-primary';
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-surface-2 last:border-0">
      <div className="flex items-center gap-1.5 text-xs text-ink-tertiary">
        {icon && <span className="w-3.5 h-3.5 shrink-0">{icon}</span>}
        <span>{label}</span>
      </div>
      <span className={`text-xs font-semibold ${color} text-right`}>{value}</span>
    </div>
  );
}

export default function InsightBlock({ insights, solutionLabel, solution }: Props) {
  const {
    weekdayAvgOrders, weekendAvgOrders, robotDeliveryPct, outsideWindowPct,
    avgDeliveryTimeRobot, avgDeliveryTimeRider, deliveryTimeDelta,
    d1AvgTimeRobot, d1AvgTimeRider,
    totalD1Orders, totalD1RobotDeliveries, outsideWindowD1, timeMetricLabel,
    d1ForcedAssigned, l30dAvgForcedAssigned,
    d1ReturnRate, d1SuccessRate, l30dReturnRate, l30dSuccessRate,
  } = insights;

  const vehicleLabel = solution === 'robovan' ? 'Robovan' : 'Robot';
  const d1RobotPct = totalD1Orders > 0 ? ((totalD1RobotDeliveries / totalD1Orders) * 100).toFixed(1) : '—';
  const d1OutsidePct = totalD1Orders > 0 ? ((outsideWindowD1 / totalD1Orders) * 100).toFixed(0) : '0';

  // Delivery time insight
  const isFaster = deliveryTimeDelta < 0;
  const absDelta = Math.abs(deliveryTimeDelta);
  // L30D summary shown in trends column
  const timeRatio = isFaster
    ? (avgDeliveryTimeRider > 0 ? avgDeliveryTimeRider / avgDeliveryTimeRobot : 1)
    : (avgDeliveryTimeRobot > 0 ? avgDeliveryTimeRobot / avgDeliveryTimeRider : 1);
  const timeInsightL30D = avgDeliveryTimeRobot > 0 && avgDeliveryTimeRider > 0
    ? `${avgDeliveryTimeRobot.toFixed(1)} min ${vehicleLabel} vs ${avgDeliveryTimeRider.toFixed(1)} min Rider (${timeRatio.toFixed(1)}x ${isFaster ? 'faster' : 'slower'})`
    : null;
  // D-1 time shown in snapshot column — matches the D-1 chart badge directly
  const timeInsightD1 = d1AvgTimeRobot > 0 && d1AvgTimeRider > 0
    ? `${d1AvgTimeRobot.toFixed(1)} min ${vehicleLabel} vs ${d1AvgTimeRider.toFixed(1)} min Rider`
    : null;

  const weekdayHigher = weekdayAvgOrders >= weekendAvgOrders;
  const weekdayRatio = weekdayAvgOrders > 0 && weekendAvgOrders > 0
    ? weekdayHigher
      ? `Weekday ${(weekdayAvgOrders / weekendAvgOrders).toFixed(1)}x > Weekend`
      : `Weekend ${(weekendAvgOrders / weekdayAvgOrders).toFixed(1)}x > Weekday`
    : null;

  if (totalD1Orders === 0 && weekdayAvgOrders === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-noon-yellow-muted border border-noon-yellow/30 rounded-xl p-4"
    >
      <p className="text-[10px] font-bold text-noon-yellow-dark uppercase tracking-widest mb-3">Auto Insights — {solutionLabel}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
        {/* D-1 Performance */}
        <div>
          <p className="text-[10px] font-semibold text-ink-tertiary uppercase tracking-wider mb-1.5">D-1 Snapshot</p>
          {totalD1Orders > 0 && (
            <>
              <StatRow
                icon={<Package size={11} />}
                label="Total orders"
                value={totalD1Orders.toLocaleString()}
              />
              <StatRow
                icon={isFaster ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                label={`${vehicleLabel} deliveries`}
                value={`${totalD1RobotDeliveries.toLocaleString()} (${d1RobotPct}%)`}
                highlight={parseFloat(d1RobotPct) > 30 ? 'good' : 'neutral'}
              />
              {outsideWindowD1 > 0 && (
                <StatRow
                  icon={<AlertTriangle size={11} />}
                  label="Outside op. window"
                  value={`${outsideWindowD1} orders (${d1OutsidePct}%)`}
                  highlight="warn"
                />
              )}
              {timeInsightD1 && (
                <StatRow
                  icon={<Clock size={11} />}
                  label={`${timeMetricLabel} (D-1)`}
                  value={timeInsightD1}
                  highlight={d1AvgTimeRobot < d1AvgTimeRider ? 'good' : 'warn'}
                />
              )}
              {solution === 'ventureone' && d1ForcedAssigned > 0 && (
                <StatRow
                  icon={<AlertTriangle size={11} />}
                  label="Forced assigned (D-1)"
                  value={`${d1ForcedAssigned} orders`}
                  highlight={d1ForcedAssigned > l30dAvgForcedAssigned * 1.5 ? 'warn' : 'neutral'}
                />
              )}
              {d1ReturnRate !== null && (
                <StatRow
                  icon={<TrendingDown size={11} />}
                  label="Return rate (D-1)"
                  value={`${d1ReturnRate.toFixed(1)}% returned / ${d1SuccessRate?.toFixed(1)}% success`}
                  highlight={d1ReturnRate > 20 ? 'warn' : 'good'}
                />
              )}
            </>
          )}
          {totalD1Orders === 0 && (
            <p className="text-xs text-ink-tertiary italic">No D-1 data available</p>
          )}
        </div>

        {/* L30D Trends */}
        <div className="mt-3 md:mt-0">
          <p className="text-[10px] font-semibold text-ink-tertiary uppercase tracking-wider mb-1.5">L30D Trends</p>
          {weekdayRatio && (
            <StatRow
              label="Order volume pattern"
              value={weekdayRatio}
            />
          )}
          <StatRow
            label={`${vehicleLabel} delivery rate`}
            value={`${robotDeliveryPct.toFixed(1)}% of orders`}
            highlight={robotDeliveryPct > 30 ? 'good' : robotDeliveryPct > 10 ? 'neutral' : 'warn'}
          />
          {outsideWindowPct > 0 && (
            <StatRow
              icon={<AlertTriangle size={11} />}
              label="Outside op. window"
              value={`${outsideWindowPct.toFixed(1)}% of orders`}
              highlight={outsideWindowPct > 20 ? 'warn' : 'neutral'}
            />
          )}
          {timeInsightL30D && (
            <StatRow
              icon={<Clock size={11} />}
              label={`${timeMetricLabel} (L30D avg)`}
              value={timeInsightL30D}
              highlight={isFaster ? 'good' : 'warn'}
            />
          )}
          {l30dReturnRate !== null && (
            <StatRow
              icon={<TrendingDown size={11} />}
              label="Return rate (L30D)"
              value={`${l30dReturnRate.toFixed(1)}% returned / ${l30dSuccessRate?.toFixed(1)}% success`}
              highlight={l30dReturnRate > 20 ? 'warn' : 'good'}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
