import { RawRow, DigestData, SolutionType, Anomaly, MappingRow } from '@/types';
import { filterBySolution, filterByDateRange, getDaysAgoStr, getGSTDateStr, getGlobalDeliveryTotals, buildNameMap } from './transforms';
import { SOLUTION_LABELS } from './constants';

export const generateDigest = (rows: RawRow[], anomalies: Anomaly[], mapping: MappingRow[] = []): DigestData => {
  const nameMap = buildNameMap(mapping);
  const d1Str = getDaysAgoStr(1);
  const l30From = getDaysAgoStr(30);
  const today = getGSTDateStr();
  const solutions: SolutionType[] = ['ventureone', 'yango', 'robovan'];

  const solutionData = solutions.map(solution => {
    const sRows = filterBySolution(rows, solution);
    const d1Rows = sRows.filter(r => r.date_ === d1Str);
    const l30Rows = filterByDateRange(sRows, l30From, today).filter(r => r.date_ !== d1Str);

    const d1TotalOrders = d1Rows.reduce((a, r) => a + r.total_orders, 0);
    const deliveries = d1Rows.reduce((a, r) => a + r.total_orders_delivered_by_robot, 0);
    const complaints = d1Rows.reduce((a, r) => a + r.ndr_complaints_robot + r.ona_complaints_robot + r.cx_complaints_robot, 0);
    const refundAmount = d1Rows.reduce((a, r) => a + r.refund_amount_total_robot, 0);

    const d1Del = deliveries || 1;
    // DBOTs: use HO time; Autonomous Vans & Sidewalk: use LM time
    const timeKey = solution === 'ventureone' ? 'avg_ho_time_robot' : 'avg_lm_time_robot';
    const d1AvgTime = d1Rows.reduce((a, r) => a + r[timeKey] * r.total_orders_delivered_by_robot, 0) / d1Del;
    const l30Del = l30Rows.reduce((a, r) => a + r.total_orders_delivered_by_robot, 0) || 1;
    const l30AvgTime = l30Rows.reduce((a, r) => a + r[timeKey] * r.total_orders_delivered_by_robot, 0) / l30Del;
    const deliveryTimeVsBaseline = l30AvgTime > 0 ? ((d1AvgTime - l30AvgTime) / l30AvgTime) * 100 : 0;

    // Aggregate by cleaned name so merged geofences (same building, multiple codes) count together
    const geofenceDels = new Map<string, number>();
    for (const r of d1Rows) {
      const name = nameMap.get(r.geofence_code) ?? r.geofence_code;
      geofenceDels.set(name, (geofenceDels.get(name) ?? 0) + r.total_orders_delivered_by_robot);
    }
    const topGeofence = Array.from(geofenceDels.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-';

    return { solution, d1TotalOrders, deliveries, complaints, refundAmount, deliveryTimeVsBaseline, topGeofence };
  });

  const { allTimeDeliveries, currentMonthDeliveries, currentMonthLabel, lastMonthDeliveries, lastMonthLabel } = getGlobalDeliveryTotals(rows);

  return {
    generatedAt: new Date().toISOString(),
    date: d1Str,
    allTimeDeliveries,
    currentMonthDeliveries,
    currentMonthLabel,
    lastMonthDeliveries,
    lastMonthLabel,
    solutions: solutionData,
    anomalies,
  };
};

export const formatDigestText = (digest: DigestData): string => {
  const lines: string[] = [`📅 Daily Digest for ${digest.date}`];
  for (const s of digest.solutions) {
    if (s.deliveries === 0 && s.complaints === 0) continue;
    lines.push(`\n**${SOLUTION_LABELS[s.solution]}**: ${s.deliveries.toLocaleString()} deliveries · ${s.complaints} complaints · AED ${s.refundAmount.toFixed(0)} refunds · Delivery time ${s.deliveryTimeVsBaseline >= 0 ? '+' : ''}${s.deliveryTimeVsBaseline.toFixed(1)}% vs 30d avg`);
  }
  if (digest.anomalies.length) {
    lines.push(`\n⚠️ ${digest.anomalies.length} anomaly${digest.anomalies.length > 1 ? 'ies' : ''} detected — see alerts above.`);
  } else {
    lines.push('\n✅ No anomalies detected.');
  }
  return lines.join('\n');
};

export const shouldRegenerateDigest = (): boolean => {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem('noon_digest_date');
  const now = new Date(Date.now() + 4 * 60 * 60 * 1000);
  const todayStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
  const digestHour = now.getUTCHours(); // 10 AM GST = 10 UTC since offset already applied
  return stored !== todayStr && digestHour >= 10;
};

export const markDigestGenerated = () => {
  if (typeof window === 'undefined') return;
  const now = new Date(Date.now() + 4 * 60 * 60 * 1000);
  const todayStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
  localStorage.setItem('noon_digest_date', todayStr);
};
