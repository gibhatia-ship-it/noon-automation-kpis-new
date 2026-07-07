import { RawRow, SolutionType, DailyPoint, HourlyPoint, NotRoutedBreakdown, PeriodMetric, DeliveryTimeSeries, HourlyDeliveryTime, OptInPoint, SummaryMetrics, OperationalWindowRow, MappingRow } from '@/types';
import { GST_OFFSET_MS } from './constants';

// ── Date helpers ──────────────────────────────────────────────────────────────

export const getGSTDateStr = (): string => {
  const d = new Date(Date.now() + GST_OFFSET_MS);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

export const getDaysAgoStr = (daysAgo: number): string => {
  const d = new Date(Date.now() + GST_OFFSET_MS - daysAgo * 86400000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

const pad = (n: number) => String(n).padStart(2, '0');

export const parseSheetDate = (raw: string): string => {
  if (!raw) return '';
  const parts = raw.trim().split('/');
  if (parts.length === 3) {
    const [m, d, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return raw.trim();
};

export const isWeekday = (dateStr: string): boolean => {
  const dow = new Date(dateStr + 'T12:00:00Z').getUTCDay();
  return dow >= 1 && dow <= 5;
};

// ── Row parsing ───────────────────────────────────────────────────────────────

export const getSolutionType = (code: string): SolutionType | null => {
  const c = code.toLowerCase();
  if (c.includes('ventureone')) return 'ventureone';
  if (c.includes('yango')) return 'yango';
  if (c.includes('robovan')) return 'robovan';
  return null;
};

export const parseRow = (raw: Record<string, string>): RawRow | null => {
  const geofence_code = raw['geofence_code']?.trim();
  if (!geofence_code) return null;
  const solutionType = getSolutionType(geofence_code);
  if (!solutionType) return null;
  const date_ = parseSheetDate(raw['date_'] ?? raw['date'] ?? '');
  if (!date_) return null;
  const n = (k: string) => { const v = parseFloat(raw[k]); return isNaN(v) ? 0 : v; };
  return {
    geofence_code, wh_code: raw['wh_code']?.trim() ?? '', date_,
    hour: parseInt(raw['hour']) || 0, solutionType,
    total_orders: n('total_orders'),
    total_orders_routed_to_robot: n('total_orders_routed_to_robot'),
    total_orders_not_routed_to_rover: n('total_orders_not_routed_to_rover'),
    total_orders_delivered_by_robot: n('total_orders_delivered_by_robot'),
    total_orders_delivered_by_rider: n('total_orders_delivered_by_rider'),
    undelivered_robot_orders: n('undelivered_robot_orders'),
    total_forced_assigned_orders: n('total_forced_assigned_orders'),
    total_forced_assigned_robot_orders: n('total_forced_assigned_robot_orders'),
    frozen_orders_total: n('frozen_orders_total'),
    fragile_orders_total: n('fragile_orders_total'),
    lbd_orders_total: n('lbd_orders_total'),
    frozen_orders_robot: n('frozen_orders_robot'),
    fragile_orders_robot: n('fragile_orders_robot'),
    lbd_orders_robot: n('lbd_orders_robot'),
    avg_distance_robot: n('avg_distance_robot'),
    avg_distance_rider: n('avg_distance_rider'),
    age_verification_orders: n('age_verification_orders'),
    high_value_orders: n('high_value_orders'),
    address_not_have_floor_unit_details: n('address_not_have_floor_unit_details'),
    bulky_orders: n('bulky_orders'), barista_orders: n('barista_orders'),
    customer_id_required_orders: n('customer_id_required_orders'),
    exceeds_bot_capacity_orders: n('exceeds_bot_capacity_orders'),
    cod_orders: n('cod_orders'), leave_at_door_orders: n('leave_at_door_orders'),
    customer_did_not_opt_in: n('customer_did_not_opt_in'),
    ndr_complaints: n('ndr_complaints'), ndr_pct: n('ndr_pct'),
    ona_complaints: n('ona_complaints'), cx_complaints: n('cx_complaints'),
    ndr_complaints_robot: n('ndr_complaints_robot'), ndr_pct_robot: n('ndr_pct_robot'),
    ona_complaints_robot: n('ona_complaints_robot'), cx_complaints_robot: n('cx_complaints_robot'),
    ndr_complaints_rider: n('ndr_complaints_rider'), ndr_pct_rider: n('ndr_pct_rider'),
    ona_complaints_rider: n('ona_complaints_rider'), cx_complaints_rider: n('cx_complaints_rider'),
    refund_orders: n('refund_orders'), refund_amount_total: n('refund_amount_total'),
    refund_orders_robot: n('refund_orders_robot'), refund_amount_total_robot: n('refund_amount_total_robot'),
    refund_orders_rider: n('refund_orders_rider'), refund_amount_total_rider: n('refund_amount_total_rider'),
    avg_pickup_time: n('avg_pickup_time'), avg_lm_time: n('avg_lm_time'),
    avg_ho_time: n('avg_ho_time'), avg_delivery_time: n('avg_delivery_time'),
    p95_delivery_time: n('p95_delivery_time'),
    avg_pickup_time_robot: n('avg_pickup_time_robot'), avg_lm_time_robot: n('avg_lm_time_robot'),
    avg_ho_time_robot: n('avg_ho_time_robot'), avg_delivery_time_robot: n('avg_delivery_time_robot'),
    p95_delivery_time_robot: n('p95_delivery_time_robot'),
    avg_pickup_time_rider: n('avg_pickup_time_rider'), avg_lm_time_rider: n('avg_lm_time_rider'),
    avg_ho_time_rider: n('avg_ho_time_rider'), avg_delivery_time_rider: n('avg_delivery_time_rider'),
    p95_delivery_time_rider: n('p95_delivery_time_rider'),
  };
};

// ── Filtering ─────────────────────────────────────────────────────────────────

export const filterBySolution = (rows: RawRow[], solution: SolutionType) =>
  rows.filter(r => r.solutionType === solution);

export const filterByGeofence = (rows: RawRow[], geofence: string) =>
  rows.filter(r => r.geofence_code === geofence);

export const filterByGeofenceCodes = (rows: RawRow[], codes: string[]) => {
  const set = new Set(codes);
  return rows.filter(r => set.has(r.geofence_code));
};

// Returns a map of display name → [geofence codes], deduplicating by cleaned name
export const getUniqueGeofenceGroups = (
  rows: RawRow[],
  solution: SolutionType,
  nameMap: Map<string, string>
): Map<string, string[]> => {
  const codes = Array.from(new Set(filterBySolution(rows, solution).map(r => r.geofence_code))).sort();
  const groups = new Map<string, string[]>();
  for (const code of codes) {
    const label = nameMap.get(code) ?? code;
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(code);
  }
  return groups;
};

export const filterByDateRange = (rows: RawRow[], fromStr: string, toStr: string) =>
  rows.filter(r => r.date_ >= fromStr && r.date_ <= toStr);

export const filterByDayType = (rows: RawRow[], dayType: 'all' | 'weekday' | 'weekend') => {
  if (dayType === 'all') return rows;
  return rows.filter(r => dayType === 'weekday' ? isWeekday(r.date_) : !isWeekday(r.date_));
};

// ── Aggregation helpers ───────────────────────────────────────────────────────

type AggRow = {
  total_orders: number;
  total_orders_delivered_by_robot: number;
  total_orders_delivered_by_rider: number;
  total_orders_not_routed_to_rover: number;
  total_orders_routed_to_robot: number;
  age_verification_orders: number;
  high_value_orders: number;
  address_not_have_floor_unit_details: number;
  bulky_orders: number;
  barista_orders: number;
  customer_id_required_orders: number;
  exceeds_bot_capacity_orders: number;
  cod_orders: number;
  leave_at_door_orders: number;
  customer_did_not_opt_in: number;
  ndr_complaints_robot: number;
  ona_complaints_robot: number;
  cx_complaints_robot: number;
  refund_orders_robot: number;
  refund_amount_total_robot: number;
  // Weighted sums (divide by total_orders_delivered_by_robot/rider to get avg)
  avg_lm_time_robot: number;
  avg_ho_time_robot: number;
  avg_delivery_time_robot: number;
  p95_delivery_time_robot: number;
  avg_lm_time_rider: number;
  avg_ho_time_rider: number;
  avg_delivery_time_rider: number;
  p95_delivery_time_rider: number;
};

const sumRows = (rows: RawRow[]): AggRow & { count: number } => {
  const z: AggRow & { count: number } = {
    total_orders: 0, total_orders_delivered_by_robot: 0, total_orders_delivered_by_rider: 0,
    total_orders_not_routed_to_rover: 0, total_orders_routed_to_robot: 0,
    age_verification_orders: 0, high_value_orders: 0, address_not_have_floor_unit_details: 0,
    bulky_orders: 0, barista_orders: 0, customer_id_required_orders: 0,
    exceeds_bot_capacity_orders: 0, cod_orders: 0, leave_at_door_orders: 0,
    customer_did_not_opt_in: 0, ndr_complaints_robot: 0, ona_complaints_robot: 0,
    cx_complaints_robot: 0, refund_orders_robot: 0, refund_amount_total_robot: 0,
    avg_lm_time_robot: 0, avg_ho_time_robot: 0, avg_delivery_time_robot: 0, p95_delivery_time_robot: 0,
    avg_lm_time_rider: 0, avg_ho_time_rider: 0, avg_delivery_time_rider: 0, p95_delivery_time_rider: 0,
    count: 0,
  };
  for (const r of rows) {
    z.total_orders += r.total_orders;
    z.total_orders_delivered_by_robot += r.total_orders_delivered_by_robot;
    z.total_orders_delivered_by_rider += r.total_orders_delivered_by_rider;
    z.total_orders_not_routed_to_rover += r.total_orders_not_routed_to_rover;
    z.total_orders_routed_to_robot += r.total_orders_routed_to_robot;
    z.age_verification_orders += r.age_verification_orders;
    z.high_value_orders += r.high_value_orders;
    z.address_not_have_floor_unit_details += r.address_not_have_floor_unit_details;
    z.bulky_orders += r.bulky_orders;
    z.barista_orders += r.barista_orders;
    z.customer_id_required_orders += r.customer_id_required_orders;
    z.exceeds_bot_capacity_orders += r.exceeds_bot_capacity_orders;
    z.cod_orders += r.cod_orders;
    z.leave_at_door_orders += r.leave_at_door_orders;
    z.customer_did_not_opt_in += r.customer_did_not_opt_in;
    z.ndr_complaints_robot += r.ndr_complaints_robot;
    z.ona_complaints_robot += r.ona_complaints_robot;
    z.cx_complaints_robot += r.cx_complaints_robot;
    z.refund_orders_robot += r.refund_orders_robot;
    z.refund_amount_total_robot += r.refund_amount_total_robot;
    z.count++;
    // Robot time: weight by robot deliveries
    if (r.total_orders_delivered_by_robot > 0) {
      z.avg_lm_time_robot += r.avg_lm_time_robot * r.total_orders_delivered_by_robot;
      z.avg_ho_time_robot += r.avg_ho_time_robot * r.total_orders_delivered_by_robot;
      z.avg_delivery_time_robot += r.avg_delivery_time_robot * r.total_orders_delivered_by_robot;
      z.p95_delivery_time_robot += r.p95_delivery_time_robot * r.total_orders_delivered_by_robot;
    }
    // Rider time: weight by rider deliveries (independent of robot routing)
    if (r.total_orders_delivered_by_rider > 0) {
      z.avg_lm_time_rider += r.avg_lm_time_rider * r.total_orders_delivered_by_rider;
      z.avg_ho_time_rider += r.avg_ho_time_rider * r.total_orders_delivered_by_rider;
      z.avg_delivery_time_rider += r.avg_delivery_time_rider * r.total_orders_delivered_by_rider;
      z.p95_delivery_time_rider += r.p95_delivery_time_rider * r.total_orders_delivered_by_rider;
    }
  }
  return z;
};

const groupBy = <T>(arr: T[], key: (v: T) => string): Map<string, T[]> => {
  const m = new Map<string, T[]>();
  for (const v of arr) { const k = key(v); if (!m.has(k)) m.set(k, []); m.get(k)!.push(v); }
  return m;
};

// ── Orders line chart ─────────────────────────────────────────────────────────

export const getDailyOrders = (rows: RawRow[], days: number, dayType: 'all' | 'weekday' | 'weekend'): DailyPoint[] => {
  const today = getGSTDateStr();
  const from = getDaysAgoStr(days);
  const filtered = filterByDayType(filterByDateRange(rows, from, today), dayType);
  const byDate = groupBy(filtered, r => r.date_);
  return Array.from(byDate.entries())
    .map(([date, rs]) => {
      const s = sumRows(rs);
      return { date, value: s.total_orders, robotPct: s.total_orders > 0 ? (s.total_orders_delivered_by_robot / s.total_orders) * 100 : 0, robotCount: s.total_orders_delivered_by_robot };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const getHourlyOrders = (rows: RawRow[], days: number, dayType: 'all' | 'weekday' | 'weekend'): HourlyPoint[] => {
  const today = getGSTDateStr();
  const from = getDaysAgoStr(days);
  const filtered = filterByDayType(filterByDateRange(rows, from, today), dayType);
  const byHour = groupBy(filtered, r => String(r.hour));
  const uniqueDays = new Set(filtered.map(r => r.date_)).size || 1;
  return Array.from({ length: 24 }, (_, h) => {
    const rs = byHour.get(String(h)) ?? [];
    const total = rs.reduce((a, r) => a + r.total_orders, 0);
    const robot = rs.reduce((a, r) => a + r.total_orders_delivered_by_robot, 0);
    const routed = rs.reduce((a, r) => a + r.total_orders_routed_to_robot, 0);
    const missed = Math.max(0, routed - robot);
    return { hour: h, value: total / uniqueDays, robotPct: total > 0 ? (robot / total) * 100 : 0, missedByRobot: missed / uniqueDays };
  });
};

// ── Not-routed breakdown ──────────────────────────────────────────────────────

export const getNotRoutedBreakdown = (rows: RawRow[], solution: SolutionType, dayType: 'all' | 'weekday' | 'weekend', windowMap?: Map<string, { start: number; end: number }>): NotRoutedBreakdown[] => {
  const today = getGSTDateStr();
  const periods: Array<{ label: string; days: number }> = [{ label: 'L7D Avg', days: 7 }, { label: 'L30D Avg', days: 30 }, { label: 'L60D Avg', days: 60 }, { label: 'L120D Avg', days: 120 }];
  return periods.map(({ label, days }) => {
    const filtered = filterByDayType(filterByDateRange(rows, getDaysAgoStr(days), today), dayType);
    const uniqueDays = new Set(filtered.map(r => r.date_)).size || 1;
    const s = sumRows(filtered);
    const outsideWindow = windowMap ? filtered.filter(r => isOutsideWindow(r, windowMap)).reduce((a, r) => a + r.total_orders, 0) : 0;
    return {
      period: label,
      age_verification: s.age_verification_orders / uniqueDays,
      high_value: s.high_value_orders / uniqueDays,
      new_address: s.address_not_have_floor_unit_details / uniqueDays,
      bulky: s.bulky_orders / uniqueDays,
      barista: s.barista_orders / uniqueDays,
      customer_id: s.customer_id_required_orders / uniqueDays,
      exceeds_capacity: s.exceeds_bot_capacity_orders / uniqueDays,
      cod: s.cod_orders / uniqueDays,
      leave_at_door: (solution === 'yango' || solution === 'robovan') ? s.leave_at_door_orders / uniqueDays : 0,
      did_not_opt_in: s.customer_did_not_opt_in / uniqueDays,
      outside_window: outsideWindow / uniqueDays,
    };
  });
};

// ── Complaints ────────────────────────────────────────────────────────────────

export const getComplaintsMetrics = (rows: RawRow[]): { ndr: PeriodMetric; ndrPct: PeriodMetric; ona: PeriodMetric; cx: PeriodMetric } => {
  const today = getGSTDateStr();
  const d1 = getDaysAgoStr(1);
  const calc = (rs: RawRow[]) => ({ ndr: rs.reduce((a, r) => a + r.ndr_complaints_robot, 0), ona: rs.reduce((a, r) => a + r.ona_complaints_robot, 0), cx: rs.reduce((a, r) => a + r.cx_complaints_robot, 0), ndrPctNum: rs.reduce((a, r) => a + r.ndr_complaints_robot, 0), ndrPctDen: rs.reduce((a, r) => a + r.total_orders_delivered_by_robot, 0) });
  const d1Data = calc(filterByDateRange(rows, d1, d1));
  const l7Data = calc(filterByDateRange(rows, getDaysAgoStr(7), today));
  const l30Data = calc(filterByDateRange(rows, getDaysAgoStr(30), today));
  const allData = calc(rows);
  const pct = (n: number, d: number) => d > 0 ? (n / d) * 100 : 0;
  return {
    ndr: { d1: d1Data.ndr, l7d: l7Data.ndr, l30d: l30Data.ndr, total: allData.ndr },
    ndrPct: { d1: pct(d1Data.ndrPctNum, d1Data.ndrPctDen), l7d: pct(l7Data.ndrPctNum, l7Data.ndrPctDen), l30d: pct(l30Data.ndrPctNum, l30Data.ndrPctDen), total: pct(allData.ndrPctNum, allData.ndrPctDen) },
    ona: { d1: d1Data.ona, l7d: l7Data.ona, l30d: l30Data.ona, total: allData.ona },
    cx: { d1: d1Data.cx, l7d: l7Data.cx, l30d: l30Data.cx, total: allData.cx },
  };
};

// ── Refunds ───────────────────────────────────────────────────────────────────

export const getRefundsMetrics = (rows: RawRow[]): { orders: PeriodMetric; amount: PeriodMetric } => {
  const today = getGSTDateStr();
  const d1 = getDaysAgoStr(1);
  const sum = (rs: RawRow[]) => ({ o: rs.reduce((a, r) => a + r.refund_orders_robot, 0), a: rs.reduce((a, r) => a + r.refund_amount_total_robot, 0) });
  const d1s = sum(filterByDateRange(rows, d1, d1));
  const l7s = sum(filterByDateRange(rows, getDaysAgoStr(7), today));
  const l30s = sum(filterByDateRange(rows, getDaysAgoStr(30), today));
  const all = sum(rows);
  return {
    orders: { d1: d1s.o, l7d: l7s.o, l30d: l30s.o, total: all.o },
    amount: { d1: d1s.a, l7d: l7s.a, l30d: l30s.a, total: all.a },
  };
};

// ── Delivery time ─────────────────────────────────────────────────────────────

export const getDailyTimeMetric = (rows: RawRow[], days: number, metric: 'ho' | 'lm', dayType: 'all' | 'weekday' | 'weekend') => {
  const today = getGSTDateStr();
  const filtered = filterByDayType(filterByDateRange(rows, getDaysAgoStr(days), today), dayType);
  const byDate = groupBy(filtered, r => r.date_);
  return Array.from(byDate.entries()).map(([date, rs]) => {
    const s = sumRows(rs);
    const rDel = s.total_orders_delivered_by_robot;
    const riDel = s.total_orders_delivered_by_rider;
    const rw = rDel || 1;
    const riw = riDel || 1;
    return {
      date,
      robot: metric === 'ho' ? s.avg_ho_time_robot / rw : s.avg_lm_time_robot / rw,
      rider: metric === 'ho' ? s.avg_ho_time_rider / riw : s.avg_lm_time_rider / riw,
      robotDeliveries: rDel,
      riderDeliveries: riDel,
    };
  }).sort((a, b) => a.date.localeCompare(b.date));
};

export const getHourlyTimeMetric = (rows: RawRow[], days: number, metric: 'ho' | 'lm', dayType: 'all' | 'weekday' | 'weekend') => {
  const today = getGSTDateStr();
  const filtered = filterByDayType(filterByDateRange(rows, getDaysAgoStr(days), today), dayType);
  const byHour = groupBy(filtered, r => String(r.hour));
  return Array.from({ length: 24 }, (_, h) => {
    const rs = byHour.get(String(h)) ?? [];
    const s = sumRows(rs);
    const rDel = s.total_orders_delivered_by_robot;
    const riDel = s.total_orders_delivered_by_rider;
    const rw = rDel || 1;
    const riw = riDel || 1;
    return {
      hour: h,
      robot: metric === 'ho' ? s.avg_ho_time_robot / rw : s.avg_lm_time_robot / rw,
      rider: metric === 'ho' ? s.avg_ho_time_rider / riw : s.avg_lm_time_rider / riw,
      robotDeliveries: rDel,
      riderDeliveries: riDel,
    };
  });
};

export const getDailyDeliveryTime = (rows: RawRow[], days: number, solution: SolutionType, dayType: 'all' | 'weekday' | 'weekend'): DeliveryTimeSeries[] => {
  const today = getGSTDateStr();
  const filtered = filterByDayType(filterByDateRange(rows, getDaysAgoStr(days), today), dayType);
  const byDate = groupBy(filtered, r => r.date_);
  return Array.from(byDate.entries()).map(([date, rs]) => {
    const s = sumRows(rs);
    const robWeight = s.total_orders_delivered_by_robot || 1;
    const ridWeight = s.total_orders_delivered_by_rider || 1;
    return {
      date,
      robotPrimary: solution === 'ventureone' ? s.avg_ho_time_robot / robWeight : s.avg_lm_time_robot / robWeight,
      riderPrimary: solution === 'ventureone' ? s.avg_ho_time_rider / ridWeight : s.avg_lm_time_rider / ridWeight,
      robotDelivery: s.avg_delivery_time_robot / robWeight,
      riderDelivery: s.avg_delivery_time_rider / ridWeight,
      robotP95: s.p95_delivery_time_robot / robWeight,
      riderP95: s.p95_delivery_time_rider / ridWeight,
    };
  }).sort((a, b) => a.date.localeCompare(b.date));
};

export const getHourlyDeliveryTime = (rows: RawRow[], days: number, solution: SolutionType, dayType: 'all' | 'weekday' | 'weekend'): HourlyDeliveryTime[] => {
  const today = getGSTDateStr();
  const filtered = filterByDayType(filterByDateRange(rows, getDaysAgoStr(days), today), dayType);
  const byHour = groupBy(filtered, r => String(r.hour));
  return Array.from({ length: 24 }, (_, h) => {
    const rs = byHour.get(String(h)) ?? [];
    const s = sumRows(rs);
    const rw = s.total_orders_delivered_by_robot || 1;
    const riw = s.total_orders_delivered_by_rider || 1;
    return {
      hour: h,
      robotPrimary: solution === 'ventureone' ? s.avg_ho_time_robot / rw : s.avg_lm_time_robot / rw,
      riderPrimary: solution === 'ventureone' ? s.avg_ho_time_rider / riw : s.avg_lm_time_rider / riw,
      robotDelivery: s.avg_delivery_time_robot / rw,
      riderDelivery: s.avg_delivery_time_rider / riw,
    };
  });
};

// ── Opt-in % (new formula: routed to robot in window / total in window) ───────

export const getDailyOptIn = (rows: RawRow[], days: number, dayType: 'all' | 'weekday' | 'weekend', windowMap?: Map<string, { start: number; end: number }>): OptInPoint[] => {
  const today = getGSTDateStr();
  const filtered = filterByDayType(filterByDateRange(rows, getDaysAgoStr(days), today), dayType);
  const windowRows = windowMap ? filtered.filter(r => isWithinWindow(r, windowMap)) : filtered;
  const byDate = groupBy(windowRows, r => r.date_);
  return Array.from(byDate.entries()).map(([date, rs]) => {
    const totalInWindow = rs.reduce((a, r) => a + r.total_orders, 0);
    const routedToRobot = rs.reduce((a, r) => a + r.total_orders_routed_to_robot, 0);
    return { date, pct: totalInWindow > 0 ? (routedToRobot / totalInWindow) * 100 : 0 };
  }).sort((a, b) => a.date.localeCompare(b.date));
};

// ── Missed orders / Downtime ──────────────────────────────────────────────────

export interface MissedOrdersPeriod {
  period: string;
  missedPct: number;
  missedCount: number;
  totalInWindow: number;
}

export const getMissedOrdersData = (rows: RawRow[], windowMap: Map<string, { start: number; end: number }>): MissedOrdersPeriod[] => {
  const today = getGSTDateStr();
  const periods = [
    { label: 'D-1', from: getDaysAgoStr(1), to: getDaysAgoStr(1) },
    { label: 'L7D', from: getDaysAgoStr(7), to: today },
    { label: 'L30D', from: getDaysAgoStr(30), to: today },
    { label: 'L60D', from: getDaysAgoStr(60), to: today },
    { label: 'L120D', from: getDaysAgoStr(120), to: today },
  ];
  return periods.map(({ label, from, to }) => {
    const windowRows = filterByDateRange(rows, from, to).filter(r => isWithinWindow(r, windowMap));
    const totalInWindow = windowRows.reduce((a, r) => a + r.total_orders, 0);
    const routed = windowRows.reduce((a, r) => a + r.total_orders_routed_to_robot, 0);
    const delivered = windowRows.reduce((a, r) => a + r.total_orders_delivered_by_robot, 0);
    // Missed = routed but delivered by rider; denominator excludes robot deliveries
    const missed = Math.max(0, routed - delivered);
    const denominator = Math.max(0, totalInWindow - delivered);
    return {
      period: label,
      missedPct: denominator > 0 ? (missed / denominator) * 100 : 0,
      missedCount: missed,
      totalInWindow,
    };
  });
};

export interface HourlyMissedPoint {
  hour: number;
  total: number;
  robot: number;
  missed: number;
}

export const getHourlyOrdersWithMissed = (rows: RawRow[], days: number, dayType: 'all' | 'weekday' | 'weekend', windowMap: Map<string, { start: number; end: number }>): HourlyMissedPoint[] => {
  const today = getGSTDateStr();
  const filtered = filterByDayType(filterByDateRange(rows, getDaysAgoStr(days), today), dayType);
  const windowRows = filtered.filter(r => isWithinWindow(r, windowMap));
  const byHour = groupBy(windowRows, r => String(r.hour));
  const uniqueDays = new Set(windowRows.map(r => r.date_)).size || 1;
  return Array.from({ length: 24 }, (_, h) => {
    const rs = byHour.get(String(h)) ?? [];
    const total = rs.reduce((a, r) => a + r.total_orders, 0);
    const robot = rs.reduce((a, r) => a + r.total_orders_delivered_by_robot, 0);
    const routed = rs.reduce((a, r) => a + r.total_orders_routed_to_robot, 0);
    const missed = Math.max(0, routed - robot);
    return { hour: h, total: total / uniqueDays, robot: robot / uniqueDays, missed: missed / uniqueDays };
  });
};

// ── Completion rate (delivered by robot / routed to robot) ────────────────────

export interface CompletionPoint {
  date: string;
  delivered: number;
  routed: number;
  pct: number;
}

export const getDailyCompletionRate = (rows: RawRow[], days: number, dayType: 'all' | 'weekday' | 'weekend'): CompletionPoint[] => {
  const today = getGSTDateStr();
  const filtered = filterByDayType(filterByDateRange(rows, getDaysAgoStr(days), today), dayType);
  const byDate = groupBy(filtered, r => r.date_);
  return Array.from(byDate.entries()).map(([date, rs]) => {
    const delivered = rs.reduce((a, r) => a + r.total_orders_delivered_by_robot, 0);
    const routed = rs.reduce((a, r) => a + r.total_orders_routed_to_robot, 0);
    return { date, delivered, routed, pct: routed > 0 ? (delivered / routed) * 100 : 0 };
  }).sort((a, b) => a.date.localeCompare(b.date));
};

export interface CompletionPeriod {
  period: string;
  delivered: number;
  routed: number;
  pct: number;
}

export const getCompletionRateSummary = (rows: RawRow[]): CompletionPeriod[] => {
  const today = getGSTDateStr();
  return [
    { label: 'D-1', from: getDaysAgoStr(1), to: getDaysAgoStr(1) },
    { label: 'L7D',  from: getDaysAgoStr(7),   to: today },
    { label: 'L30D', from: getDaysAgoStr(30),  to: today },
    { label: 'L60D', from: getDaysAgoStr(60),  to: today },
    { label: 'L120D',from: getDaysAgoStr(120), to: today },
  ].map(({ label, from, to }) => {
    const subset = filterByDateRange(rows, from, to);
    const delivered = subset.reduce((a, r) => a + r.total_orders_delivered_by_robot, 0);
    const routed = subset.reduce((a, r) => a + r.total_orders_routed_to_robot, 0);
    return { period: label, delivered, routed, pct: routed > 0 ? (delivered / routed) * 100 : 0 };
  });
};

// ── Summary metrics ───────────────────────────────────────────────────────────

export const getSummaryMetrics = (rows: RawRow[], solution: SolutionType): SummaryMetrics => {
  const sRows = filterBySolution(rows, solution);
  const d1Str = getDaysAgoStr(1);
  const d1Rows = sRows.filter(r => r.date_ === d1Str);
  return {
    liveGeofences: new Set(sRows.map(r => r.geofence_code)).size,
    d1RobotDeliveries: d1Rows.reduce((a, r) => a + r.total_orders_delivered_by_robot, 0),
    d1TotalDeliveries: d1Rows.reduce((a, r) => a + r.total_orders, 0),
  };
};

export const getGeofences = (rows: RawRow[], solution: SolutionType): string[] =>
  Array.from(new Set(filterBySolution(rows, solution).map(r => r.geofence_code))).sort();

// ── Operational window helpers ────────────────────────────────────────────────

export const buildWindowMap = (windows: OperationalWindowRow[]): Map<string, { start: number; end: number }> => {
  const m = new Map<string, { start: number; end: number }>();
  for (const w of windows) m.set(w.geofence_code, { start: w.start_hour, end: w.end_hour });
  return m;
};

export const isWithinWindow = (row: RawRow, windowMap: Map<string, { start: number; end: number }>): boolean => {
  const w = windowMap.get(row.geofence_code);
  if (!w) return true;
  return row.hour >= w.start && row.hour < w.end;
};

export const isOutsideWindow = (row: RawRow, windowMap: Map<string, { start: number; end: number }>): boolean =>
  !isWithinWindow(row, windowMap);

// ── Mapping helpers ───────────────────────────────────────────────────────────

export const buildNameMap = (mapping: MappingRow[]): Map<string, string> => {
  const m = new Map<string, string>();
  for (const r of mapping) if (r.cleaned_name) m.set(r.geofence_code, r.cleaned_name);
  return m;
};

export const getCleanedName = (geofenceCode: string, nameMap: Map<string, string>): string =>
  nameMap.get(geofenceCode) ?? geofenceCode;

// ── Insight block calculations ────────────────────────────────────────────────

export interface InsightData {
  weekdayAvgOrders: number;
  weekendAvgOrders: number;
  weekdayVsWeekendRatio: number;
  robotDeliveryPct: number;
  outsideWindowPct: number;
  avgDeliveryTimeRobot: number;
  avgDeliveryTimeRider: number;
  deliveryTimeDelta: number;
  d1AvgTimeRobot: number;
  d1AvgTimeRider: number;
  totalD1Orders: number;
  totalD1RobotDeliveries: number;
  outsideWindowD1: number;
  timeMetricLabel: string;
  // Forced assignments (DBOTs)
  d1ForcedAssigned: number;
  l30dAvgForcedAssigned: number;
  // Return rate (yango/robovan)
  d1ReturnRate: number | null;
  d1SuccessRate: number | null;
  l30dReturnRate: number | null;
  l30dSuccessRate: number | null;
}

export const getInsightData = (rows: RawRow[], solution: SolutionType, windowMap?: Map<string, { start: number; end: number }>): InsightData => {
  const today = getGSTDateStr();
  const from30 = getDaysAgoStr(30);
  const d1Str = getDaysAgoStr(1);
  const allRows = filterByDateRange(rows, from30, today);
  const wdRows = allRows.filter(r => isWeekday(r.date_));
  const weRows = allRows.filter(r => !isWeekday(r.date_));

  const wdDays = new Set(wdRows.map(r => r.date_)).size || 1;
  const weDays = new Set(weRows.map(r => r.date_)).size || 1;
  const weekdayAvgOrders = wdRows.reduce((a, r) => a + r.total_orders, 0) / wdDays;
  const weekendAvgOrders = weRows.reduce((a, r) => a + r.total_orders, 0) / weDays;

  const totalOrders = allRows.reduce((a, r) => a + r.total_orders, 0) || 1;
  const totalRobot = allRows.reduce((a, r) => a + r.total_orders_delivered_by_robot, 0);
  const outsideWindow = windowMap ? allRows.filter(r => isOutsideWindow(r, windowMap)).reduce((a, r) => a + r.total_orders, 0) : 0;

  // Use the correct metric for each solution:
  // DBOTs → HO time, Sidewalk/Vans → LM time
  const isDBOT = solution === 'ventureone';
  const robotWeight = allRows.reduce((a, r) => a + r.total_orders_delivered_by_robot, 0) || 1;
  const riderWeight = allRows.reduce((a, r) => a + r.total_orders_delivered_by_rider, 0) || 1;
  const avgDeliveryTimeRobot = isDBOT
    ? allRows.reduce((a, r) => a + r.avg_ho_time_robot * r.total_orders_delivered_by_robot, 0) / robotWeight
    : allRows.reduce((a, r) => a + r.avg_lm_time_robot * r.total_orders_delivered_by_robot, 0) / robotWeight;
  const avgDeliveryTimeRider = isDBOT
    ? allRows.reduce((a, r) => a + r.avg_ho_time_rider * r.total_orders_delivered_by_rider, 0) / riderWeight
    : allRows.reduce((a, r) => a + r.avg_lm_time_rider * r.total_orders_delivered_by_rider, 0) / riderWeight;

  const d1Rows = rows.filter(r => r.date_ === d1Str);
  const d1Total = d1Rows.reduce((a, r) => a + r.total_orders, 0);
  const d1Robot = d1Rows.reduce((a, r) => a + r.total_orders_delivered_by_robot, 0);
  const d1Outside = windowMap ? d1Rows.filter(r => isOutsideWindow(r, windowMap)).reduce((a, r) => a + r.total_orders, 0) : 0;

  // D-1 delivery time (weighted by deliveries, same method as L30D)
  const d1RobotWeight = d1Rows.reduce((a, r) => a + r.total_orders_delivered_by_robot, 0) || 1;
  const d1RiderWeight = d1Rows.reduce((a, r) => a + r.total_orders_delivered_by_rider, 0) || 1;
  const d1AvgTimeRobot = isDBOT
    ? d1Rows.reduce((a, r) => a + r.avg_ho_time_robot * r.total_orders_delivered_by_robot, 0) / d1RobotWeight
    : d1Rows.reduce((a, r) => a + r.avg_lm_time_robot * r.total_orders_delivered_by_robot, 0) / d1RobotWeight;
  const d1AvgTimeRider = isDBOT
    ? d1Rows.reduce((a, r) => a + r.avg_ho_time_rider * r.total_orders_delivered_by_rider, 0) / d1RiderWeight
    : d1Rows.reduce((a, r) => a + r.avg_lm_time_rider * r.total_orders_delivered_by_rider, 0) / d1RiderWeight;

  // Forced assignments (meaningful for DBOTs)
  const d1ForcedAssigned = d1Rows.reduce((a, r) => a + r.total_forced_assigned_robot_orders, 0);
  const l30dForcedDays = new Set(allRows.map(r => r.date_)).size || 1;
  const l30dAvgForcedAssigned = allRows.reduce((a, r) => a + r.total_forced_assigned_robot_orders, 0) / l30dForcedDays;

  // Return rate (yango/robovan: undelivered_robot_orders / total_orders_routed_to_robot)
  const showReturn = solution !== 'ventureone';
  const d1Routed = d1Rows.reduce((a, r) => a + r.total_orders_routed_to_robot, 0);
  const d1Undelivered = d1Rows.reduce((a, r) => a + r.undelivered_robot_orders, 0);
  const l30dRouted = allRows.reduce((a, r) => a + r.total_orders_routed_to_robot, 0);
  const l30dUndelivered = allRows.reduce((a, r) => a + r.undelivered_robot_orders, 0);
  const d1ReturnRate = showReturn && d1Routed > 0 ? (d1Undelivered / d1Routed) * 100 : null;
  const d1SuccessRate = d1ReturnRate !== null ? 100 - d1ReturnRate : null;
  const l30dReturnRate = showReturn && l30dRouted > 0 ? (l30dUndelivered / l30dRouted) * 100 : null;
  const l30dSuccessRate = l30dReturnRate !== null ? 100 - l30dReturnRate : null;

  return {
    weekdayAvgOrders, weekendAvgOrders,
    weekdayVsWeekendRatio: weekdayAvgOrders > 0 ? weekendAvgOrders / weekdayAvgOrders : 0,
    robotDeliveryPct: (totalRobot / totalOrders) * 100,
    outsideWindowPct: (outsideWindow / totalOrders) * 100,
    avgDeliveryTimeRobot, avgDeliveryTimeRider,
    deliveryTimeDelta: avgDeliveryTimeRider > 0 ? ((avgDeliveryTimeRobot - avgDeliveryTimeRider) / avgDeliveryTimeRider) * 100 : 0,
    d1AvgTimeRobot: d1Robot > 0 ? d1AvgTimeRobot : 0,
    d1AvgTimeRider: d1Rows.reduce((a, r) => a + r.total_orders_delivered_by_rider, 0) > 0 ? d1AvgTimeRider : 0,
    totalD1Orders: d1Total, totalD1RobotDeliveries: d1Robot, outsideWindowD1: d1Outside,
    timeMetricLabel: isDBOT ? 'HO Time' : 'LM Time',
    d1ForcedAssigned, l30dAvgForcedAssigned,
    d1ReturnRate, d1SuccessRate, l30dReturnRate, l30dSuccessRate,
  };
};

export const getSummaryWithMapping = (rows: RawRow[], solution: SolutionType, mapping: MappingRow[], windows: OperationalWindowRow[]) => {
  const sRows = filterBySolution(rows, solution);
  const d1Str = getDaysAgoStr(1);
  const d1Rows = sRows.filter(r => r.date_ === d1Str);
  const windowMap = buildWindowMap(windows);
  const nameMap = buildNameMap(mapping);

  const sMapping = mapping.filter(m => {
    const code = m.geofence_code.toLowerCase();
    if (solution === 'ventureone') return code.includes('ventureone');
    if (solution === 'yango') return code.includes('yango');
    if (solution === 'robovan') return code.includes('robovan');
    return false;
  });

  const mappedRobots = sMapping.reduce((a, m) => a + m.total_robots, 0);
  const liveAreas = sMapping.map(m => ({ code: m.geofence_code, name: m.cleaned_name || m.geofence_code, area: m.area }));
  // Fall back to geofence count when mapping doesn't have robot counts (e.g. yango sheet has blank column)
  const totalRobots = mappedRobots > 0 ? mappedRobots : liveAreas.length;
  const totalBuildings = liveAreas.length;

  const d1RobotDeliveries = d1Rows.reduce((a, r) => a + r.total_orders_delivered_by_robot, 0);
  // Eligible = orders routed to robot (within window)
  const d1EligibleOrders = d1Rows.filter(r => isWithinWindow(r, windowMap)).reduce((a, r) => a + r.total_orders_routed_to_robot, 0);
  const d1OutsideWindow = d1Rows.filter(r => isOutsideWindow(r, windowMap)).reduce((a, r) => a + r.total_orders, 0);

  // Opt-in per period: total_orders_routed_to_robot in window / total_orders in window
  const calcOptIn = (rs: RawRow[]) => {
    const windowRows = rs.filter(r => isWithinWindow(r, windowMap));
    const total = windowRows.reduce((a, r) => a + r.total_orders, 0);
    const routed = windowRows.reduce((a, r) => a + r.total_orders_routed_to_robot, 0);
    return total > 0 ? (routed / total) * 100 : null;
  };

  const today = getGSTDateStr();
  const optInPcts = solution !== 'ventureone' ? {
    d1: calcOptIn(d1Rows),
    l7d: calcOptIn(filterByDateRange(sRows, getDaysAgoStr(7), today)),
    l30d: calcOptIn(filterByDateRange(sRows, getDaysAgoStr(30), today)),
    l60d: calcOptIn(filterByDateRange(sRows, getDaysAgoStr(60), today)),
  } : null;

  return { totalBuildings, totalRobots, liveAreas, d1RobotDeliveries, d1EligibleOrders, d1OutsideWindow, optInPcts };
};

export const getGlobalDeliveryTotals = (rows: RawRow[]): {
  allTimeDeliveries: number;
  currentMonthDeliveries: number;
  currentMonthLabel: string;
  lastMonthDeliveries: number;
  lastMonthLabel: string;
} => {
  const today = getGSTDateStr();
  const [year, month] = today.split('-');
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthIdx = parseInt(month) - 1;

  const currentMonthStart = `${year}-${month}-01`;
  const prevMonthNum = monthIdx === 0 ? 12 : monthIdx;
  const prevYear = monthIdx === 0 ? parseInt(year) - 1 : parseInt(year);
  const prevMonthStart = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}-01`;

  const allTimeDeliveries = rows.reduce((a, r) => a + r.total_orders_delivered_by_robot, 0);
  const currentMonthDeliveries = rows
    .filter(r => r.date_ >= currentMonthStart)
    .reduce((a, r) => a + r.total_orders_delivered_by_robot, 0);
  const lastMonthDeliveries = rows
    .filter(r => r.date_ >= prevMonthStart && r.date_ < currentMonthStart)
    .reduce((a, r) => a + r.total_orders_delivered_by_robot, 0);

  return {
    allTimeDeliveries,
    currentMonthDeliveries,
    currentMonthLabel: monthNames[monthIdx],
    lastMonthDeliveries,
    lastMonthLabel: monthNames[prevMonthNum - 1],
  };
};

export const getGlobalSummary = (rows: RawRow[]) => {
  const d1Str = getDaysAgoStr(1);
  const solutions: SolutionType[] = ['ventureone', 'yango', 'robovan'];
  return solutions.map(s => {
    const sRows = filterBySolution(rows, s);
    const d1Rows = sRows.filter(r => r.date_ === d1Str);
    return { solution: s, liveGeofences: new Set(sRows.map(r => r.geofence_code)).size, d1Robot: d1Rows.reduce((a, r) => a + r.total_orders_delivered_by_robot, 0), d1Total: d1Rows.reduce((a, r) => a + r.total_orders, 0) };
  });
};

// ── Order type breakdown (frozen / fragile / LBD) ─────────────────────────────

export interface OrderTypePoint { date: string; frozen: number; fragile: number; lbd: number; total: number; }
export interface OrderTypePeriod { period: string; frozen: number; fragile: number; lbd: number; }

export const getDailyOrderTypes = (rows: RawRow[], days: number, dayType: 'all' | 'weekday' | 'weekend'): OrderTypePoint[] => {
  const today = getGSTDateStr();
  const filtered = filterByDayType(filterByDateRange(rows, getDaysAgoStr(days), today), dayType);
  const byDate = groupBy(filtered, r => r.date_);
  return Array.from(byDate.entries()).map(([date, rs]) => ({
    date,
    frozen: rs.reduce((a, r) => a + r.frozen_orders_total, 0),
    fragile: rs.reduce((a, r) => a + r.fragile_orders_total, 0),
    lbd: rs.reduce((a, r) => a + r.lbd_orders_total, 0),
    total: rs.reduce((a, r) => a + r.total_orders, 0),
  })).sort((a, b) => a.date.localeCompare(b.date));
};

export const getOrderTypeSummary = (rows: RawRow[]): OrderTypePeriod[] => {
  const today = getGSTDateStr();
  return [
    { label: 'D-1', from: getDaysAgoStr(1), to: getDaysAgoStr(1) },
    { label: 'L7D', from: getDaysAgoStr(7), to: today },
    { label: 'L30D', from: getDaysAgoStr(30), to: today },
    { label: 'L60D', from: getDaysAgoStr(60), to: today },
    { label: 'L120D', from: getDaysAgoStr(120), to: today },
  ].map(({ label, from, to }) => {
    const s = filterByDateRange(rows, from, to);
    return {
      period: label,
      frozen: s.reduce((a, r) => a + r.frozen_orders_total, 0),
      fragile: s.reduce((a, r) => a + r.fragile_orders_total, 0),
      lbd: s.reduce((a, r) => a + r.lbd_orders_total, 0),
    };
  });
};

// ── Forced assignments ────────────────────────────────────────────────────────

export interface ForcedPoint { date: string; count: number; }
export interface ForcedPeriod { period: string; count: number; }

export const getDailyForcedAssignments = (rows: RawRow[], days: number, dayType: 'all' | 'weekday' | 'weekend'): ForcedPoint[] => {
  const today = getGSTDateStr();
  const filtered = filterByDayType(filterByDateRange(rows, getDaysAgoStr(days), today), dayType);
  const byDate = groupBy(filtered, r => r.date_);
  return Array.from(byDate.entries()).map(([date, rs]) => ({
    date,
    count: rs.reduce((a, r) => a + r.total_forced_assigned_robot_orders, 0),
  })).sort((a, b) => a.date.localeCompare(b.date));
};

export const getForcedAssignmentSummary = (rows: RawRow[]): ForcedPeriod[] => {
  const today = getGSTDateStr();
  return [
    { label: 'D-1', from: getDaysAgoStr(1), to: getDaysAgoStr(1) },
    { label: 'L7D', from: getDaysAgoStr(7), to: today },
    { label: 'L30D', from: getDaysAgoStr(30), to: today },
    { label: 'L60D', from: getDaysAgoStr(60), to: today },
    { label: 'L120D', from: getDaysAgoStr(120), to: today },
  ].map(({ label, from, to }) => ({
    period: label,
    count: filterByDateRange(rows, from, to).reduce((a, r) => a + r.total_forced_assigned_robot_orders, 0),
  }));
};

// ── Distance vs delivery time ─────────────────────────────────────────────────

export interface DistanceTimePoint { date: string; distance: number; time: number; }

export const getDailyDistanceVsTime = (
  rows: RawRow[],
  who: 'robot' | 'rider',
  metric: 'ho' | 'lm',
  days: number,
  dayType: 'all' | 'weekday' | 'weekend',
): DistanceTimePoint[] => {
  const today = getGSTDateStr();
  const filtered = filterByDayType(filterByDateRange(rows, getDaysAgoStr(days), today), dayType);
  const byDate = groupBy(filtered, r => r.date_);
  return Array.from(byDate.entries()).map(([date, rs]) => {
    const wt = rs.reduce((a, r) => a + (who === 'robot' ? r.total_orders_delivered_by_robot : r.total_orders_delivered_by_rider), 0) || 1;
    const dist = rs.reduce((a, r) => a + (who === 'robot' ? r.avg_distance_robot : r.avg_distance_rider) * (who === 'robot' ? r.total_orders_delivered_by_robot : r.total_orders_delivered_by_rider), 0) / wt;
    const timeField: (r: RawRow) => number = who === 'robot'
      ? (metric === 'ho' ? (r: RawRow) => r.avg_ho_time_robot : (r: RawRow) => r.avg_lm_time_robot)
      : (metric === 'ho' ? (r: RawRow) => r.avg_ho_time_rider : (r: RawRow) => r.avg_lm_time_rider);
    const t = rs.reduce((a, r) => a + timeField(r) * (who === 'robot' ? r.total_orders_delivered_by_robot : r.total_orders_delivered_by_rider), 0) / wt;
    return { date, distance: dist, time: t };
  }).sort((a, b) => a.date.localeCompare(b.date));
};

// ── Return rate (yango / robovan) ─────────────────────────────────────────────

export interface ReturnRatePoint { date: string; undelivered: number; routed: number; returnPct: number; successPct: number; }
export interface ReturnRatePeriod { period: string; undelivered: number; routed: number; returnPct: number; successPct: number; }

export const getDailyReturnRate = (rows: RawRow[], days: number, dayType: 'all' | 'weekday' | 'weekend'): ReturnRatePoint[] => {
  const today = getGSTDateStr();
  const filtered = filterByDayType(filterByDateRange(rows, getDaysAgoStr(days), today), dayType);
  const byDate = groupBy(filtered, r => r.date_);
  return Array.from(byDate.entries()).map(([date, rs]) => {
    const undelivered = rs.reduce((a, r) => a + r.undelivered_robot_orders, 0);
    const routed = rs.reduce((a, r) => a + r.total_orders_routed_to_robot, 0);
    const returnPct = routed > 0 ? (undelivered / routed) * 100 : 0;
    return { date, undelivered, routed, returnPct, successPct: 100 - returnPct };
  }).sort((a, b) => a.date.localeCompare(b.date));
};

export const getReturnRateSummary = (rows: RawRow[]): ReturnRatePeriod[] => {
  const today = getGSTDateStr();
  return [
    { label: 'D-1', from: getDaysAgoStr(1), to: getDaysAgoStr(1) },
    { label: 'L7D', from: getDaysAgoStr(7), to: today },
    { label: 'L30D', from: getDaysAgoStr(30), to: today },
    { label: 'L60D', from: getDaysAgoStr(60), to: today },
    { label: 'L120D', from: getDaysAgoStr(120), to: today },
  ].map(({ label, from, to }) => {
    const s = filterByDateRange(rows, from, to);
    const undelivered = s.reduce((a, r) => a + r.undelivered_robot_orders, 0);
    const routed = s.reduce((a, r) => a + r.total_orders_routed_to_robot, 0);
    const returnPct = routed > 0 ? (undelivered / routed) * 100 : 0;
    return { period: label, undelivered, routed, returnPct, successPct: 100 - returnPct };
  });
};

// ── Chart helpers ─────────────────────────────────────────────────────────────

export const sliceByPeriod = <T extends { date: string }>(data: T[], days: number): T[] => {
  if (days === 1) {
    const d1 = getDaysAgoStr(1);
    return data.filter(d => d.date === d1);
  }
  const from = getDaysAgoStr(days);
  return data.filter(d => d.date >= from);
};

export const addTrendLine = <T>(
  data: T[],
  getValue: (d: T) => number,
  window = 7,
): (T & { trend: number })[] =>
  data.map((d, i) => {
    const slice = data.slice(Math.max(0, i - window + 1), i + 1);
    const trend = slice.reduce((a, w) => a + getValue(w), 0) / slice.length;
    return { ...d, trend };
  });
