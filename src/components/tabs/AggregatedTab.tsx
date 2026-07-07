'use client';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RawRow, SolutionType, GranularityType, DayFilterType, MappingRow, OperationalWindowRow } from '@/types';
import {
  getDailyOrders, getHourlyOrders, getNotRoutedBreakdown, getComplaintsMetrics, getRefundsMetrics,
  getDailyTimeMetric, getHourlyTimeMetric, getDailyOptIn, filterBySolution,
  buildWindowMap, getInsightData, getMissedOrdersData, getHourlyOrdersWithMissed,
  getDailyCompletionRate,
  getDailyOrderTypes,
  getDailyForcedAssignments,
  getDailyDistanceVsTime,
  getDailyReturnRate,
} from '@/lib/transforms';
import Toggle from '@/components/ui/Toggle';
import OrdersChart from '@/components/charts/OrdersChart';
import NotRoutedChart from '@/components/charts/NotRoutedChart';
import ComplaintsChart from '@/components/charts/ComplaintsChart';
import RefundsChart from '@/components/charts/RefundsChart';
import DeliveryTimeChart from '@/components/charts/DeliveryTimeChart';
import OptInChart from '@/components/charts/OptInChart';
import CompletionRateChart from '@/components/charts/CompletionRateChart';
import OrderTypeChart from '@/components/charts/OrderTypeChart';
import ForcedAssignmentsChart from '@/components/charts/ForcedAssignmentsChart';
import DistanceVsTimeChart from '@/components/charts/DistanceVsTimeChart';
import ReturnRateChart from '@/components/charts/ReturnRateChart';
import MissedOrdersChart from '@/components/charts/MissedOrdersChart';
import HourlyMissedChart from '@/components/charts/HourlyMissedChart';
import InsightBlock from '@/components/InsightBlock';
import DeliveryMixChart from '@/components/charts/DeliveryMixChart';

interface Props { rows: RawRow[]; solution: SolutionType; mapping: MappingRow[]; opWindows: OperationalWindowRow[]; }

const GRANULARITY_OPTS = [{ id: 'daily', label: 'Daily' }, { id: 'hourly', label: 'Hourly' }];
const DAY_OPTS = [{ id: 'all', label: 'All Days' }, { id: 'weekday', label: 'Weekdays' }, { id: 'weekend', label: 'Weekends' }];

export default function AggregatedTab({ rows, solution, mapping, opWindows }: Props) {
  const [granularity, setGranularity] = useState<GranularityType>('daily');
  const [dayType, setDayType] = useState<DayFilterType>('all');

  const sRows = useMemo(() => filterBySolution(rows, solution), [rows, solution]);
  const windowMap = useMemo(() => buildWindowMap(opWindows), [opWindows]);

  const daily120 = useMemo(() => getDailyOrders(sRows, 120, dayType), [sRows, dayType]);
  const hourly7 = useMemo(() => getHourlyOrders(sRows, 7, dayType), [sRows, dayType]);
  const hourly30 = useMemo(() => getHourlyOrders(sRows, 30, dayType), [sRows, dayType]);
  const hourly60 = useMemo(() => getHourlyOrders(sRows, 60, dayType), [sRows, dayType]);

  const notRouted = useMemo(() => getNotRoutedBreakdown(sRows, solution, dayType, windowMap), [sRows, solution, dayType, windowMap]);
  const complaints = useMemo(() => getComplaintsMetrics(sRows), [sRows]);
  const refunds = useMemo(() => getRefundsMetrics(sRows), [sRows]);
  const insights = useMemo(() => getInsightData(sRows, solution, windowMap), [sRows, solution, windowMap]);
  const missedData = useMemo(() => getMissedOrdersData(sRows, windowMap), [sRows, windowMap]);
  const hourlyMissedL7 = useMemo(() => getHourlyOrdersWithMissed(sRows, 7, dayType, windowMap), [sRows, dayType, windowMap]);
  const hourlyMissedL30 = useMemo(() => getHourlyOrdersWithMissed(sRows, 30, dayType, windowMap), [sRows, dayType, windowMap]);

  const showHO = solution === 'ventureone';
  const showLM = solution !== 'ventureone';
  const showOptIn = solution !== 'ventureone';
  const vehicleLabel = solution === 'robovan' ? 'Robovan' : 'Robot';

  const hoL120 = useMemo(() => showHO ? getDailyTimeMetric(sRows, 120, 'ho', dayType) : [], [sRows, dayType, showHO]);
  const hoD1 = useMemo(() => showHO ? getDailyTimeMetric(sRows, 1, 'ho', dayType) : [], [sRows, dayType, showHO]);
  const hoHourly = useMemo(() => showHO ? getHourlyTimeMetric(sRows, 30, 'ho', dayType) : [], [sRows, dayType, showHO]);

  const lmL120 = useMemo(() => showLM ? getDailyTimeMetric(sRows, 120, 'lm', dayType) : [], [sRows, dayType, showLM]);
  const lmD1 = useMemo(() => showLM ? getDailyTimeMetric(sRows, 1, 'lm', dayType) : [], [sRows, dayType, showLM]);
  const lmHourly = useMemo(() => showLM ? getHourlyTimeMetric(sRows, 30, 'lm', dayType) : [], [sRows, dayType, showLM]);

  const optIn120 = useMemo(() => showOptIn ? getDailyOptIn(sRows, 120, dayType, windowMap) : [], [sRows, dayType, windowMap, showOptIn]);
  const crL120 = useMemo(() => getDailyCompletionRate(sRows, 120, dayType), [sRows, dayType]);
  const otL120 = useMemo(() => getDailyOrderTypes(sRows, 120, dayType), [sRows, dayType]);
  const faL120 = useMemo(() => solution === 'ventureone' ? getDailyForcedAssignments(sRows, 120, dayType) : [], [sRows, dayType, solution]);

  const distMetric = solution === 'ventureone' ? 'ho' as const : 'lm' as const;
  const distPeriods = useMemo(() => solution !== 'ventureone' ? [1, 7, 30, 60, 120].map(days => ({
    label: days === 1 ? 'D-1' : `L${days}D`,
    robot: getDailyDistanceVsTime(sRows, 'robot', distMetric, days, dayType),
    rider: getDailyDistanceVsTime(sRows, 'rider', distMetric, days, dayType),
  })) : [], [sRows, dayType, distMetric, solution]);

  const rrL120 = useMemo(() => solution !== 'ventureone' ? getDailyReturnRate(sRows, 120, dayType) : [], [sRows, dayType, solution]);

  // For DeliveryMixChart (still uses multi-period for bar chart visual)
  const daily7 = useMemo(() => getDailyOrders(sRows, 7, dayType), [sRows, dayType]);
  const daily30 = useMemo(() => getDailyOrders(sRows, 30, dayType), [sRows, dayType]);
  const daily60 = useMemo(() => getDailyOrders(sRows, 60, dayType), [sRows, dayType]);
  const d1 = useMemo(() => getDailyOrders(sRows, 1, dayType), [sRows, dayType]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-8">
      <InsightBlock insights={insights} solutionLabel={`${vehicleLabel}s — Aggregated`} solution={solution} />

      <div className="flex flex-wrap items-center gap-3">
        <Toggle<GranularityType> options={GRANULARITY_OPTS as any} value={granularity} onChange={setGranularity} />
        <Toggle<DayFilterType> options={DAY_OPTS as any} value={dayType} onChange={setDayType} />
      </div>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider">Total Orders</h3>
        <OrdersChart daily120={daily120} hourly7={hourly7} hourly30={hourly30} hourly60={hourly60} granularity={granularity} />
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider">{vehicleLabel} Deliveries</h3>
        <OrdersChart daily120={daily120} hourly7={hourly7} hourly30={hourly30} hourly60={hourly60} granularity={granularity} showRobotAbsolute vehicleLabel={vehicleLabel} />
      </section>

      {granularity === 'daily' && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider">Delivery Mix — Total vs {vehicleLabel}</h3>
          <DeliveryMixChart d1={d1} l7d={daily7} l30d={daily30} l60d={daily60} vehicleLabel={vehicleLabel} />
        </section>
      )}

      {granularity === 'hourly' && (
        <HourlyMissedChart l7d={hourlyMissedL7} l30d={hourlyMissedL30} solution={solution} />
      )}

      <MissedOrdersChart data={missedData} solution={solution} />
      <NotRoutedChart data={notRouted} solution={solution} />
      <ComplaintsChart {...complaints} />
      <RefundsChart {...refunds} />

      {showHO && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider">HO Time Comparison ({vehicleLabel} vs Rider)</h3>
          <DeliveryTimeChart metric="ho" daily120={hoL120} d1={hoD1} hourly={hoHourly} granularity={granularity} solution={solution} />
        </section>
      )}

      {showLM && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider">LM Time Comparison ({vehicleLabel} vs Rider)</h3>
          <DeliveryTimeChart metric="lm" daily120={lmL120} d1={lmD1} hourly={lmHourly} granularity={granularity} solution={solution} />
        </section>
      )}

      <OrderTypeChart data={otL120} />

      {solution === 'ventureone' && <ForcedAssignmentsChart data={faL120} />}

      {showOptIn && <OptInChart data={optIn120} />}

      <CompletionRateChart
        data={crL120}
        subDescription={solution === 'ventureone' ? '(% of delivered orders / % of total orders that could have been delivered by robot)' : undefined}
      />

      {solution !== 'ventureone' && <DistanceVsTimeChart periods={distPeriods} metric={distMetric} robotLabel={vehicleLabel} />}

      {solution !== 'ventureone' && rrL120.length > 0 && (
        <ReturnRateChart data={rrL120} vehicleLabel={vehicleLabel} />
      )}
    </motion.div>
  );
}
