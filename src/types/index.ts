export type SolutionType = 'ventureone' | 'yango' | 'robovan';

export interface FleetSizeRow {
  solution: SolutionType;
  totalLive: number;
  areasLive: string;
}

export interface MappingRow {
  geofence_code: string;
  service_provider: string;
  solution: string;
  area: string;
  total_robots: number;
  cleaned_name: string;
}

export interface OperationalWindowRow {
  geofence_code: string;
  cleaned_name: string;
  timings: string;
  start_hour: number;
  end_hour: number;
}
export type GranularityType = 'daily' | 'hourly';
export type DayFilterType = 'all' | 'weekday' | 'weekend';

export interface RawRow {
  geofence_code: string;
  wh_code: string;
  date_: string; // YYYY-MM-DD
  hour: number;
  total_orders: number;
  total_orders_routed_to_robot: number;
  total_orders_not_routed_to_rover: number;
  total_orders_delivered_by_robot: number;
  total_orders_delivered_by_rider: number;
  undelivered_robot_orders: number;
  total_forced_assigned_orders: number;
  total_forced_assigned_robot_orders: number;
  frozen_orders_total: number;
  fragile_orders_total: number;
  lbd_orders_total: number;
  frozen_orders_robot: number;
  fragile_orders_robot: number;
  lbd_orders_robot: number;
  avg_distance_robot: number;
  avg_distance_rider: number;
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
  ndr_complaints: number;
  ndr_pct: number;
  ona_complaints: number;
  cx_complaints: number;
  ndr_complaints_robot: number;
  ndr_pct_robot: number;
  ona_complaints_robot: number;
  cx_complaints_robot: number;
  ndr_complaints_rider: number;
  ndr_pct_rider: number;
  ona_complaints_rider: number;
  cx_complaints_rider: number;
  refund_orders: number;
  refund_amount_total: number;
  refund_orders_robot: number;
  refund_amount_total_robot: number;
  refund_orders_rider: number;
  refund_amount_total_rider: number;
  avg_pickup_time: number;
  avg_lm_time: number;
  avg_ho_time: number;
  avg_delivery_time: number;
  p95_delivery_time: number;
  avg_pickup_time_robot: number;
  avg_lm_time_robot: number;
  avg_ho_time_robot: number;
  avg_delivery_time_robot: number;
  p95_delivery_time_robot: number;
  avg_pickup_time_rider: number;
  avg_lm_time_rider: number;
  avg_ho_time_rider: number;
  avg_delivery_time_rider: number;
  p95_delivery_time_rider: number;
  solutionType: SolutionType;
}

export interface DailyPoint {
  date: string;
  value: number;
  robotPct?: number;
  robotCount?: number;
}

export interface HourlyPoint {
  hour: number;
  value: number;
  robotPct?: number;
  missedByRobot?: number;
  robotCount?: number;
}

export interface NotRoutedBreakdown {
  period: string;
  age_verification: number;
  high_value: number;
  new_address: number;
  bulky: number;
  barista: number;
  customer_id: number;
  exceeds_capacity: number;
  cod: number;
  leave_at_door: number;
  did_not_opt_in: number;
  outside_window: number;
}

export interface PeriodMetric {
  d1: number;
  l7d: number;
  l30d: number;
  total: number;
}

export interface DeliveryTimeSeries {
  date: string;
  robotPrimary: number;
  riderPrimary: number;
  robotDelivery: number;
  riderDelivery: number;
  robotP95: number;
  riderP95: number;
}

export interface HourlyDeliveryTime {
  hour: number;
  robotPrimary: number;
  riderPrimary: number;
  robotDelivery: number;
  riderDelivery: number;
}

export interface OptInPoint {
  date: string;
  pct: number;
}

export interface SummaryMetrics {
  liveGeofences: number;
  d1RobotDeliveries: number;
  d1TotalDeliveries: number;
}

export interface Anomaly {
  id: string;
  type: 'high_complaints' | 'high_refunds' | 'low_deliveries' | 'high_delivery_time' | 'low_routing';
  solution: SolutionType;
  geofence?: string;
  message: string;
  severity: 'warning' | 'critical';
  value: number;
  baseline: number;
}

export interface DigestData {
  generatedAt: string;
  date: string;
  allTimeDeliveries: number;
  currentMonthDeliveries: number;
  currentMonthLabel: string;
  lastMonthDeliveries: number;
  lastMonthLabel: string;
  solutions: {
    solution: SolutionType;
    d1TotalOrders: number;
    deliveries: number;
    complaints: number;
    refundAmount: number;
    deliveryTimeVsBaseline: number;
    topGeofence: string;
  }[];
  anomalies: Anomaly[];
}
