import { RawRow, SolutionType, Anomaly } from '@/types';
import { filterBySolution, filterByDateRange, getDaysAgoStr, getGSTDateStr } from './transforms';
import { SOLUTION_LABELS } from './constants';

export const detectAnomalies = (rows: RawRow[]): Anomaly[] => {
  const anomalies: Anomaly[] = [];
  const d1Str = getDaysAgoStr(1);
  const solutions: SolutionType[] = ['ventureone', 'yango', 'robovan'];

  for (const solution of solutions) {
    const sRows = filterBySolution(rows, solution);
    const d1Rows = sRows.filter(r => r.date_ === d1Str);
    if (!d1Rows.length) continue;

    // Absolute threshold: >= 3 complaints is a flag
    const d1Complaints = d1Rows.reduce((a, r) => a + r.ndr_complaints_robot + r.ona_complaints_robot + r.cx_complaints_robot, 0);
    if (d1Complaints >= 3) {
      anomalies.push({
        id: `${solution}_complaints`,
        type: 'high_complaints',
        solution,
        message: `${d1Complaints} complaints on D-1 (threshold: ≥3)`,
        severity: d1Complaints >= 6 ? 'critical' : 'warning',
        value: d1Complaints,
        baseline: 3,
      });
    }

    // Refunds: flag if D-1 refund orders > 0
    const d1Refunds = d1Rows.reduce((a, r) => a + r.refund_orders_robot, 0);
    const d1RefundAmt = d1Rows.reduce((a, r) => a + r.refund_amount_total_robot, 0);
    if (d1Refunds > 0) {
      anomalies.push({
        id: `${solution}_refunds`,
        type: 'high_refunds',
        solution,
        message: `${d1Refunds} refund order${d1Refunds > 1 ? 's' : ''} (AED ${d1RefundAmt.toFixed(0)}) on D-1`,
        severity: d1Refunds >= 3 ? 'critical' : 'warning',
        value: d1Refunds,
        baseline: 0,
      });
    }

    // Low robot deliveries vs L30D average: flag if D-1 robot deliveries = 0 but L30D avg > 5
    const today = getGSTDateStr();
    const l30Rows = filterByDateRange(sRows, getDaysAgoStr(30), today).filter(r => r.date_ !== d1Str);
    const l30DayMap = new Map<string, number>();
    for (const r of l30Rows) l30DayMap.set(r.date_, (l30DayMap.get(r.date_) ?? 0) + r.total_orders_delivered_by_robot);
    const l30Avg = l30DayMap.size > 0 ? Array.from(l30DayMap.values()).reduce((a, b) => a + b, 0) / l30DayMap.size : 0;
    const d1Robot = d1Rows.reduce((a, r) => a + r.total_orders_delivered_by_robot, 0);
    if (l30Avg > 5 && d1Robot < l30Avg * 0.3) {
      anomalies.push({
        id: `${solution}_low_deliveries`,
        type: 'low_deliveries',
        solution,
        message: `Robot deliveries on D-1 (${d1Robot}) are <30% of L30D avg (${l30Avg.toFixed(0)})`,
        severity: d1Robot === 0 ? 'critical' : 'warning',
        value: d1Robot,
        baseline: l30Avg,
      });
    }
  }

  return anomalies;
};
