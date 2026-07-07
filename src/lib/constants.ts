import { SolutionType } from '@/types';

export const SHEET_ID = '1G8t1MwO75JpG7Maw1YSmz-ll9U2xJp696HVOGvYzFQY';
export const SHEET_NAME = 'Extract 1';
export const REFRESH_INTERVAL_MS = 3 * 60 * 60 * 1000; // 3 hours
export const GST_OFFSET_MS = 4 * 60 * 60 * 1000; // UTC+4
export const DIGEST_HOUR_GST = 10; // 10 AM GST

export const SOLUTION_LABELS: Record<SolutionType, string> = {
  ventureone: 'DBOTs',
  yango: 'Sidewalk Robots',
  robovan: 'Autonomous Vans',
};

export const SOLUTION_DESCRIPTIONS: Record<SolutionType, string> = {
  ventureone: 'Doorstep Delivery Robots',
  yango: 'Sidewalk Delivery Robots',
  robovan: 'Autonomous Vans',
};

export const SOLUTION_ICONS: Record<SolutionType, string> = {
  ventureone: '🤖',
  yango: '🦾',
  robovan: '🚐',
};

export const NOON_YELLOW = '#D4E600';
export const NOON_RED = '#DA291C';

export const NOT_ROUTED_LABELS: Record<string, string> = {
  outside_window: 'Outside Op. Window',
  age_verification: 'Age Verification',
  high_value: 'High Value',
  new_address: 'New Address',
  bulky: 'Bulky',
  barista: 'Barista',
  customer_id: 'Customer ID',
  exceeds_capacity: 'Exceeds Capacity',
  cod: 'COD',
  leave_at_door: 'Leave at Door',
  did_not_opt_in: 'Did Not Opt In',
};

export const NOT_ROUTED_COLORS: Record<string, string> = {
  outside_window: '#DA291C',
  age_verification: '#6366F1',
  high_value: '#F59E0B',
  new_address: '#8B5CF6',
  bulky: '#10B981',
  barista: '#EC4899',
  customer_id: '#3B82F6',
  exceeds_capacity: '#EF4444',
  cod: '#14B8A6',
  leave_at_door: '#6B7280',
  did_not_opt_in: '#D4E600',
};

export const DELIVERY_TIME_COLORS = {
  robotPrimary: '#D4E600',
  riderPrimary: '#DA291C',
  robotDelivery: 'rgba(212,230,0,0.7)',
  riderDelivery: 'rgba(218,41,28,0.7)',
  robotP95: 'rgba(212,230,0,0.4)',
  riderP95: 'rgba(218,41,28,0.4)',
};

// Anomaly thresholds: multiples of std deviation above/below mean
export const ANOMALY_STDDEV_THRESHOLD = 2;
export const LOW_DELIVERY_STDDEV_THRESHOLD = 1.5;
