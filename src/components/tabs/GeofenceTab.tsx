'use client';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RawRow, SolutionType, GranularityType, DayFilterType, MappingRow, OperationalWindowRow } from '@/types';
import {
  filterByGeofenceCodes, getUniqueGeofenceGroups, getDailyOrders, getHourlyOrders, getNotRoutedBreakdown,
  getComplaintsMetrics, getRefundsMetrics, getDailyTimeMetric, getHourlyTimeMetric,
  getDailyOptIn, filterBySolution, buildWindowMap, buildNameMap, getInsightData,
  getMissedOrdersData, getHourlyOrdersWithMissed, getDailyCompletionRate,
  getDailyOrderTypes,
  getDailyForcedAssignments,
  getDailyDistanceVsTime,
  getDailyReturnRate,
} from '@/lib/transforms';
import Toggle from '@/components/ui/Toggle';
import GeofenceSelector from '@/components/ui/GeofenceSelector';
import OrdersChart from '@/components/charts/OrdersChart';
import NotRoutedChart from '@/components/charts/NotRoutedChart';
import ComplaintsChart from '@/components/charts/ComplaintsChart';
import RefundsChart from '@/components/charts/RefundsChart';
import DeliveryTimeChart from '@/components/charts/DeliveryTimeChart';
import OptInChart from '@/components/charts/OptInChart';
import MissedOrdersChart from '@/components/charts/MissedOrdersChart';
import HourlyMissedChart from '@/components/charts/HourlyMissedChart';
import InsightBlock from '@/components/InsightBlock';
import HourlyWindowChart from '@/components/charts/HourlyWindowChart';
import DeliveryMixChart from '@/components/charts/DeliveryMixChart';
import CompletionRateChart from '@/components/charts/CompletionRateChart';
import OrderTypeChart from '@/components/charts/OrderTypeChart';
import ForcedAssignmentsChart from '@/components/charts/ForcedAssignmentsChart';
import DistanceVsTimeChart from '@/components/charts/DistanceVsTimeChart';
import ReturnRateChart from '@/components/charts/ReturnRateChart';

interface Props { rows: RawRow[]; solution: SolutionType; mapping: MappingRow[]; opWindows: OperationalWindowRow[]; }

const GRANULARITY_OPTS = [{ id: 'daily', label: 'Daily' }, { id: 'hourly', label: 'Hourly' }];
const DAY_OPTS = [{ id: 'all', label: 'All Days' }, { id: 'weekday', label: 'Weekdays' }, { id: 'weekend', label: 'Weekends' }];

export default function GeofenceTab({ rows, solution, mapping, opWindows }: Props) {
  const sRows = useMemo(() => filterBySolution(rows, solution), [rows, solution]);
  const windowMap = useMemo(() => buildWindowMap(opWindows), [opWindows]);
  const nameMap = useMemo(() => buildNameMap(mapping), [mapping]);

  const geofenceGroups = useMemo(() => getUniqueGeofenceGroups(rows, solution, nameMap), [rows, solution, nameMap]);
  const geofenceLabels = useMemo(() => Array.from(geofenceGroups.keys()), [geofenceGroups]);

  const [selected, setSelected] = useState(() => geofenceLabels[0] ?? '');
  const [granularity, setGranularity] = useState<GranularityType>('daily');
  const [dayType, setDayType] = useState<DayFilterType>('all');

  const selectedCodes = useMemo(() => geofenceGroups.get(selected) ?? [], [geofenceGroups, selected]);
  const gRows = useMemo(() => filterByGeofenceCodes(sRows, selectedCodes), [sRows, selectedCodes]);

  const showHO = solution === 'ventureone';
  const showLM = solution !== 'ventureone';
  const showOptIn = solution !== 'ventureone';
  const vehicleLabel = solution === 'robovan' ? 'Robovan' : 'Robot';

  // Orders - only need 120D for new chart pattern; keep multi-period for DeliveryMixChart
  const daily120 = useMemo(() => getDailyOrders(gRows, 120, dayType), [gRows, dayType]);
  const d1 = useMemo(() => getDailyOrders(gRows, 1, dayType), [gRows, dayType]);
  const daily7 = useMemo(() => getDailyOrders(gRows, 7, dayType), [gRows, dayType]);
  const daily30 = useMemo(() => getDailyOrders(gRows, 30, dayType), [gRows, dayType]);
  const daily60 = useMemo(() => getDailyOrders(gRows, 60, dayType), [gRows, dayType]);
  const hourly7 = useMemo(() => getHourlyOrders(gRows, 7, dayType), [gRows, dayType]);
  const hourly30 = useMemo(() => getHourlyOrders(gRows, 30, dayType), [gRows, dayType]);
  const hourly60 = useMemo(() => getHourlyOrders(gRows, 60, dayType), [gRows, dayType]);

  const notRouted = useMemo(() => getNotRoutedBreakdown(gRows, solution, dayType, windowMap), [gRows, solution, dayType, windowMap]);
  const complaints = useMemo(() => getComplaintsMetrics(gRows), [gRows]);
  const refunds = useMemo(() => getRefundsMetrics(gRows), [gRows]);
  const insights = useMemo(() => getInsightData(gRows, solution, windowMap), [gRows, solution, windowMap]);
  const missedData = useMemo(() => getMissedOrdersData(gRows, windowMap), [gRows, windowMap]);
  const hourlyMissedL7 = useMemo(() => getHourlyOrdersWithMissed(gRows, 7, dayType, windowMap), [gRows, dayType, windowMap]);
  const hourlyMissedL30 = useMemo(() => getHourlyOrdersWithMissed(gRows, 30, dayType, windowMap), [gRows, dayType, windowMap]);

  const hoL120 = useMemo(() => showHO ? getDailyTimeMetric(gRows, 120, 'ho', dayType) : [], [gRows, dayType, showHO]);
  const hoD1 = useMemo(() => showHO ? getDailyTimeMetric(gRows, 1, 'ho', dayType) : [], [gRows, dayType, showHO]);
  const hoHourly = useMemo(() => showHO ? getHourlyTimeMetric(gRows, 30, 'ho', dayType) : [], [gRows, dayType, showHO]);

  const lmL120 = useMemo(() => showLM ? getDailyTimeMetric(gRows, 120, 'lm', dayType) : [], [gRows, dayType, showLM]);
  const lmD1 = useMemo(() => showLM ? getDailyTimeMetric(gRows, 1, 'lm', dayType) : [], [gRows, dayType, showLM]);
  const lmHourly = useMemo(() => showLM ? getHourlyTimeMetric(gRows, 30, 'lm', dayType) : [], [gRows, dayType, showLM]);

  const optIn120 = useMemo(() => showOptIn ? getDailyOptIn(gRows, 120, dayType, windowMap) : [], [gRows, dayType, windowMap, showOptIn]);
  const crL120 = useMemo(() => getDailyCompletionRate(gRows, 120, dayType), [gRows, dayType]);
  const otL120 = useMemo(() => getDailyOrderTypes(gRows, 120, dayType), [gRows, dayType]);
  const faL120 = useMemo(() => solution === 'ventureone' ? getDailyForcedAssignments(gRows, 120, dayType) : [], [gRows, dayType, solution]);

  const distMetric = solution === 'ventureone' ? 'ho' as const : 'lm' as const;
  const distPeriods = useMemo(() => solution !== 'ventureone' ? [1, 7, 30, 60, 120].map(days => ({
    label: days === 1 ? 'D-1' : `L${days}D`,
    robot: getDailyDistanceVsTime(gRows, 'robot', distMetric, days, dayType),
    rider: getDailyDistanceVsTime(gRows, 'rider', distMetric, days, dayType),
  })) : [], [gRows, dayType, distMetric, solution]);

  const rrL120 = useMemo(() => solution !== 'ventureone' ? getDailyReturnRate(gRows, 120, dayType) : [], [gRows, dayType, solution]);

  if (!geofenceLabels.length) return <div className="py-16 text-center text-ink-tertiary text-sm">No geofences found.</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <GeofenceSelector geofences={geofenceLabels} selected={selected} onChange={v => setSelected(v)} />
        <Toggle<GranularityType> options={GRANULARITY_OPTS as any} value={granularity} onChange={setGranularity} />
        <Toggle<DayFilterType> options={DAY_OPTS as any} value={dayType} onChange={setDayType} />
      </div>

      <InsightBlock insights={insights} solutionLabel={`${vehicleLabel} — ${selected}`} solution={solution} />

      <section className="space-y-2">
        <h3 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider">Total Orders in Geofence</h3>
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

      {(() => {
        const win = windowMap.get(selectedCodes[0] ?? '');
        const wStart = win?.start ?? 0;
        const wEnd = win?.end ?? 24;
        return (
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider">Hourly Order Distribution (Op. Window)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <HourlyWindowChart data={hourly7.map(p => ({ hour: p.hour, value: p.value }))} windowStart={wStart} windowEnd={wEnd} period="L7D" />
              <HourlyWindowChart data={hourly30.map(p => ({ hour: p.hour, value: p.value }))} windowStart={wStart} windowEnd={wEnd} period="L30D" />
              <HourlyWindowChart data={hourly60.map(p => ({ hour: p.hour, value: p.value }))} windowStart={wStart} windowEnd={wEnd} period="L60D" />
            </div>
          </section>
        );
      })()}

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
