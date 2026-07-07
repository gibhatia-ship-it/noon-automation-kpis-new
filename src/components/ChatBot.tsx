'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, HelpCircle } from 'lucide-react';
import { RawRow, SolutionType } from '@/types';
import {
  filterBySolution, filterByDateRange, filterByGeofenceCodes,
  getDaysAgoStr, getGSTDateStr, buildNameMap
} from '@/lib/transforms';
import { SOLUTION_LABELS } from '@/lib/constants';
import { MappingRow } from '@/types';

interface Message { role: 'user' | 'bot'; text: string; ts: number; }
interface Props { rows: RawRow[]; mapping: MappingRow[]; }

const fmtNum = (n: number, dp = 0) => n.toFixed(dp);
const s2d = (s: SolutionType) => SOLUTION_LABELS[s];

// ── Intent detection ───────────────────────────────────────────────────────────

const detectSolution = (q: string): SolutionType | null => {
  const l = q.toLowerCase();
  if (l.includes('dbot') || l.includes('ventureone') || l.includes('doorstep')) return 'ventureone';
  if (l.includes('sidewalk') || l.includes('yango')) return 'yango';
  if (l.includes('robovan') || l.includes('autonomous van') || l.includes('van')) return 'robovan';
  return null;
};

const detectDate = (q: string): string | null => {
  const patterns = [
    /(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/,
    /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* (\d{1,2})(?:,? (\d{4}))?/i,
  ];
  for (const p of patterns) {
    const m = q.match(p);
    if (m) {
      if (m[0].includes('/')) {
        const year = m[3] || '2026';
        return `${year}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
      }
      const months: Record<string, string> = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
      const mon = months[m[0].slice(0, 3).toLowerCase()];
      const year = m[2] || '2026';
      if (mon) return `${year}-${mon}-${m[1].padStart(2, '0')}`;
    }
  }
  return null;
};

const detectPeriodDays = (q: string): number => {
  const l = q.toLowerCase();
  if (l.includes('l120d') || l.includes('120 day')) return 120;
  if (l.includes('l60d') || l.includes('60 day')) return 60;
  if (l.includes('l30d') || l.includes('30 day') || l.includes('month')) return 30;
  if (l.includes('l7d') || l.includes('7 day') || l.includes('week')) return 7;
  if (l.includes('yesterday') || l.includes('d-1') || l.includes('d1')) return 1;
  return 7; // default
};

// Returns ALL geofence codes whose cleaned name matches the query (handles merged geofences)
const detectGeofence = (q: string, nameMap: Map<string, string>): string[] => {
  const ql = q.toLowerCase();
  let bestName: string | null = null;
  let bestLen = 0;
  for (const [, name] of nameMap.entries()) {
    const nameLower = name.toLowerCase();
    if (nameLower.length >= 3 && ql.includes(nameLower) && nameLower.length > bestLen) {
      bestName = name;
      bestLen = nameLower.length;
    }
  }
  if (!bestName) return [];
  return Array.from(nameMap.entries()).filter(([, name]) => name === bestName).map(([code]) => code);
};

// ── Diagnostic: full geofence/solution health check vs baseline ────────────────

const diagnose = (target: RawRow[], baseline30: RawRow[], label: string, d1Str: string): string => {
  const d1 = target.filter(r => r.date_ === d1Str);
  const b30Days = new Set(baseline30.map(r => r.date_)).size || 1;

  if (!d1.length) return `No data found for "${label}" on ${d1Str}.`;

  const d1Orders = d1.reduce((a, r) => a + r.total_orders, 0);
  const d1Robot = d1.reduce((a, r) => a + r.total_orders_delivered_by_robot, 0);
  const d1Routed = d1.reduce((a, r) => a + r.total_orders_routed_to_robot, 0);
  const d1Undelivered = d1.reduce((a, r) => a + r.undelivered_robot_orders, 0);
  const d1Complaints = d1.reduce((a, r) => a + r.ndr_complaints_robot + r.ona_complaints_robot + r.cx_complaints_robot, 0);
  const d1Forced = d1.reduce((a, r) => a + r.total_forced_assigned_robot_orders, 0);
  const d1RW = d1Robot || 1;
  const d1RiW = d1.reduce((a, r) => a + r.total_orders_delivered_by_rider, 0) || 1;
  const d1HoRobot = d1.reduce((a, r) => a + r.avg_ho_time_robot * r.total_orders_delivered_by_robot, 0) / d1RW;
  const d1LmRobot = d1.reduce((a, r) => a + r.avg_lm_time_robot * r.total_orders_delivered_by_robot, 0) / d1RW;
  const d1HoRider = d1.reduce((a, r) => a + r.avg_ho_time_rider * r.total_orders_delivered_by_rider, 0) / d1RiW;
  const d1LmRider = d1.reduce((a, r) => a + r.avg_lm_time_rider * r.total_orders_delivered_by_rider, 0) / d1RiW;

  const avgOrders = baseline30.reduce((a, r) => a + r.total_orders, 0) / b30Days;
  const avgRobot = baseline30.reduce((a, r) => a + r.total_orders_delivered_by_robot, 0) / b30Days;
  const avgRouted = baseline30.reduce((a, r) => a + r.total_orders_routed_to_robot, 0) / b30Days;
  const avgComplaints = baseline30.reduce((a, r) => a + r.ndr_complaints_robot + r.ona_complaints_robot + r.cx_complaints_robot, 0) / b30Days;
  const avgForced = baseline30.reduce((a, r) => a + r.total_forced_assigned_robot_orders, 0) / b30Days;
  const bRW = baseline30.reduce((a, r) => a + r.total_orders_delivered_by_robot, 0) || 1;
  const bRiW = baseline30.reduce((a, r) => a + r.total_orders_delivered_by_rider, 0) || 1;
  const avgHoRobot = baseline30.reduce((a, r) => a + r.avg_ho_time_robot * r.total_orders_delivered_by_robot, 0) / bRW;
  const avgLmRobot = baseline30.reduce((a, r) => a + r.avg_lm_time_robot * r.total_orders_delivered_by_robot, 0) / bRW;
  const avgLmRider = baseline30.reduce((a, r) => a + r.avg_lm_time_rider * r.total_orders_delivered_by_rider, 0) / bRiW;

  const pct = (a: number, b: number) => b > 0 ? ((a - b) / b) * 100 : 0;
  const sign = (n: number) => n >= 0 ? '+' : '';
  const fmt1 = (n: number) => n.toFixed(1);

  const orderDelta = pct(d1Orders, avgOrders);
  const robotDelta = pct(d1Robot, avgRobot);
  const routedDelta = pct(d1Routed, avgRouted);
  const complaintsDelta = pct(d1Complaints, avgComplaints);
  const hoTimeDelta = pct(d1HoRobot, avgHoRobot);
  const lmTimeDelta = pct(d1LmRobot, avgLmRobot);
  const forcedDelta = pct(d1Forced, avgForced);

  const utilRate = d1Routed > 0 ? (d1Robot / d1Routed) * 100 : null;
  const returnRate = d1Routed > 0 ? (d1Undelivered / d1Routed) * 100 : null;
  const missedOrders = Math.max(0, d1Routed - d1Robot);

  // Identify what went wrong (negatives are bad)
  const issues: string[] = [];
  const positives: string[] = [];

  if (Math.abs(orderDelta) > 5) {
    const more = orderDelta > 0;
    (more ? positives : issues).push(`${more ? 'More' : 'Fewer'} orders than usual: ${d1Orders} vs ${fmt1(avgOrders)} avg/day (${sign(orderDelta)}${fmt1(orderDelta)}%)`);
  } else {
    positives.push(`Order volume normal: ${d1Orders} (avg ${fmt1(avgOrders)}/day)`);
  }

  if (Math.abs(robotDelta) > 10) {
    const up = robotDelta > 0;
    (up ? positives : issues).push(`Robot deliveries ${up ? 'up' : 'down'}: ${d1Robot} vs ${fmt1(avgRobot)} avg (${sign(robotDelta)}${fmt1(robotDelta)}%)`);
  }

  if (utilRate !== null) {
    if (utilRate < 50) issues.push(`Low utilisation rate: ${fmt1(utilRate)}% (${d1Robot} delivered of ${d1Routed} routed)`);
    else positives.push(`Utilisation rate: ${fmt1(utilRate)}% (${d1Robot}/${d1Routed})`);
  }

  if (missedOrders > 0) issues.push(`Missed orders: ${missedOrders} (routed but not delivered by robot)`);
  if (returnRate !== null && returnRate > 0) issues.push(`Return rate: ${fmt1(returnRate)}% (${d1Undelivered} undelivered of ${d1Routed} routed)`);

  if (d1Complaints > 0) {
    if (complaintsDelta > 50 || d1Complaints > avgComplaints + 1) {
      issues.push(`Complaints spike: ${d1Complaints} (avg ${fmt1(avgComplaints)}/day, ${sign(complaintsDelta)}${fmt1(complaintsDelta)}%)`);
    } else {
      positives.push(`Complaints within range: ${d1Complaints}`);
    }
  }

  if (avgHoRobot > 0 && Math.abs(hoTimeDelta) > 10) {
    const slower = hoTimeDelta > 0;
    const ratio = slower ? (d1HoRobot / avgHoRobot) : (avgHoRobot / d1HoRobot);
    (slower ? issues : positives).push(`HO time ${slower ? 'longer' : 'shorter'} than usual: ${fmt1(d1HoRobot)} min vs ${fmt1(avgHoRobot)} avg (${ratio.toFixed(1)}x ${slower ? 'slower' : 'faster'})`);
  }
  if (avgLmRobot > 0 && Math.abs(lmTimeDelta) > 10) {
    const slower = lmTimeDelta > 0;
    const ratio = slower ? (d1LmRobot / avgLmRobot) : (avgLmRobot / d1LmRobot);
    (slower ? issues : positives).push(`LM time ${slower ? 'longer' : 'shorter'}: ${fmt1(d1LmRobot)} min robot vs ${fmt1(avgLmRider)} min rider (${ratio.toFixed(1)}x ${slower ? 'slower' : 'faster'})`);
  }

  if (d1Forced > 0 && forcedDelta > 20) {
    issues.push(`Elevated forced assignments: ${d1Forced} (avg ${fmt1(avgForced)}/day)`);
  }

  let out = `📊 Diagnostic — ${label} — ${d1Str}\n(vs L30D baseline of ${b30Days} days)\n`;
  if (issues.length) out += `\n🔴 Issues detected:\n${issues.map(i => `• ${i}`).join('\n')}`;
  if (positives.length) out += `\n\n✅ Normal / positive:\n${positives.map(p => `• ${p}`).join('\n')}`;
  if (!issues.length) out += '\n\n✅ No significant issues — performance within normal range.';
  return out;
};

// ── Query handlers ─────────────────────────────────────────────────────────────

const answer = (q: string, rows: RawRow[], nameMap: Map<string, string>): string => {
  const ql = q.toLowerCase();
  const today = getGSTDateStr();
  const d1 = getDaysAgoStr(1);

  // Detect entities
  const geofenceCodes = detectGeofence(q, nameMap);
  const geofenceName = geofenceCodes.length ? (nameMap.get(geofenceCodes[0]) ?? geofenceCodes[0]) : null;
  const solution = detectSolution(q);
  const dateStr = detectDate(q);
  const days = detectPeriodDays(q);
  const isYesterday = ql.includes('yesterday') || ql.includes('d-1') || ql.includes('d1');

  // Base subset — geofence first (all codes for that name), then solution
  let base = rows;
  if (geofenceCodes.length) base = filterByGeofenceCodes(base, geofenceCodes);
  else if (solution) base = filterBySolution(base, solution);

  const entityLabel = geofenceName ?? (solution ? s2d(solution) : 'All solutions');

  // ── Help ──
  if (ql.includes('help') || ql.includes('what can you') || ql.includes('how do i')) {
    return `I can answer questions about:\n\n• **Diagnostics** — "What went wrong yesterday with UNA Apartments?"\n• **Comparison** — "Did Semmer Villas do more or less than usual?"\n• **Orders & deliveries** — "How many orders did Una Apartments get yesterday?"\n• **Utilisation rate** — "What's the utilisation rate for DBOTs L7D?"\n• **Return rate** — "What's the return rate for sidewalk robots?"\n• **Forced assignments** — "How many forced assignments did Hayat have?"\n• **Missed orders** — "How many orders were missed at Hayat 2?"\n• **Complaints** — "Show me complaints for DBOTs"\n• **Delivery time** — "How fast are robots vs riders?"\n• **Distance** — "What's the avg distance for yango L30D?"\n• **Refunds** — "What are the refunds for sidewalk robots?"\n• **Opt-in rate** — "What's the opt-in rate for yango?"\n• **Trends** — "What changed since June 10?"\n\nYou can combine geofence names, solutions, periods and dates freely.`;
  }

  // ── Diagnostic: "what went wrong", "how did X do", "more or less than usual" ──
  if (ql.includes('went wrong') || ql.includes('what happened') || ql.includes('how did') || ql.includes('more or less') || ql.includes('better or worse') || ql.includes('unusual') || ql.includes('diagnose') || ql.includes('analyse') || ql.includes('analyze')) {
    const dateStr = detectDate(q);
    const targetDate = dateStr ?? d1;
    const from30 = getDaysAgoStr(30);
    let target = base;
    let baseline = base;
    if (geofenceCodes.length) {
      target = filterByGeofenceCodes(rows, geofenceCodes);
      baseline = filterByDateRange(target, from30, today);
    } else if (solution) {
      target = filterBySolution(rows, solution);
      baseline = filterByDateRange(target, from30, today);
    } else {
      target = rows;
      baseline = filterByDateRange(rows, from30, today);
    }
    return diagnose(target, baseline, entityLabel, targetDate);
  }

  // ── Return rate ──
  if (ql.includes('return rate') || ql.includes('returned') || ql.includes('undelivered') || ql.includes('success rate')) {
    const from = isYesterday ? d1 : getDaysAgoStr(days);
    const to = isYesterday ? d1 : today;
    const subset = filterByDateRange(base, from, to);
    const routed = subset.reduce((a, r) => a + r.total_orders_routed_to_robot, 0);
    const undelivered = subset.reduce((a, r) => a + r.undelivered_robot_orders, 0);
    const returnPct = routed > 0 ? (undelivered / routed) * 100 : null;
    const successPct = returnPct !== null ? 100 - returnPct : null;
    const period = isYesterday ? 'D-1' : `L${days}D`;
    return `Return & Success Rate (${period}) — ${entityLabel}:\n• Routed: ${routed.toLocaleString()}\n• Returned/undelivered: ${undelivered.toLocaleString()}\n• Return rate: ${returnPct !== null ? `${returnPct.toFixed(1)}%` : '—'}\n• Success rate: ${successPct !== null ? `${successPct.toFixed(1)}%` : '—'}\n• (Return + Success = ${returnPct !== null && successPct !== null ? (returnPct + successPct).toFixed(0) : '—'}%)`;
  }

  // ── Forced assignments ──
  if (ql.includes('forced') || ql.includes('force assign')) {
    const from = isYesterday ? d1 : getDaysAgoStr(days);
    const to = isYesterday ? d1 : today;
    const subset = filterByDateRange(base, from, to);
    const forced = subset.reduce((a, r) => a + r.total_forced_assigned_robot_orders, 0);
    const period = isYesterday ? 'D-1' : `L${days}D`;
    return `Forced Assignments (${period}) — ${entityLabel}:\n• Total forced: ${forced.toLocaleString()} orders`;
  }

  // ── Top performing geofence ──
  if (ql.includes('top') && (ql.includes('geofence') || ql.includes('building') || ql.includes('area') || ql.includes('perform'))) {
    const subset = solution ? filterBySolution(rows, solution) : rows;
    const period = filterByDateRange(subset, getDaysAgoStr(days), today);
    const byGeo = new Map<string, number>();
    for (const r of period) byGeo.set(r.geofence_code, (byGeo.get(r.geofence_code) ?? 0) + r.total_orders_delivered_by_robot);
    const sorted = Array.from(byGeo.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (!sorted.length) return 'No data found for that period.';
    const label = solution ? s2d(solution) : 'All';
    return `Top geofences by robot deliveries (L${days}D) — ${label}:\n${sorted.map(([code, del], i) => `${i + 1}. ${nameMap.get(code) ?? code}: ${del.toLocaleString()} deliveries`).join('\n')}`;
  }

  // ── Missed orders ──
  if (ql.includes('missed') || ql.includes('not delivered') || ql.includes('failed')) {
    const from = isYesterday ? d1 : getDaysAgoStr(days);
    const to = isYesterday ? d1 : today;
    const subset = filterByDateRange(base, from, to);
    const routed = subset.reduce((a, r) => a + r.total_orders_routed_to_robot, 0);
    const delivered = subset.reduce((a, r) => a + r.total_orders_delivered_by_robot, 0);
    const total = subset.reduce((a, r) => a + r.total_orders, 0);
    const missed = Math.max(0, routed - delivered);
    const denominator = Math.max(1, total - delivered);
    const period = isYesterday ? 'D-1' : `L${days}D`;
    return `Missed orders (${period}) — ${entityLabel}:\n• Routed to robot: ${routed.toLocaleString()}\n• Delivered by robot: ${delivered.toLocaleString()}\n• Missed (routed but not delivered): ${missed.toLocaleString()}\n• Missed %: ${fmtNum((missed / denominator) * 100, 1)}%`;
  }

  // ── Delivery time ──
  if (ql.includes('delivery time') || ql.includes('how fast') || ql.includes('how long') || ql.includes('ho time') || ql.includes('lm time')) {
    const from = isYesterday ? d1 : getDaysAgoStr(days);
    const to = isYesterday ? d1 : today;
    const subset = filterByDateRange(base, from, to);
    const rw = subset.reduce((a, r) => a + r.total_orders_delivered_by_robot, 0) || 1;
    const riw = subset.reduce((a, r) => a + r.total_orders_delivered_by_rider, 0) || 1;
    const useHO = solution === 'ventureone' || ql.includes('ho');
    const robotAvg = useHO
      ? subset.reduce((a, r) => a + r.avg_ho_time_robot * r.total_orders_delivered_by_robot, 0) / rw
      : subset.reduce((a, r) => a + r.avg_lm_time_robot * r.total_orders_delivered_by_robot, 0) / rw;
    const riderAvg = useHO
      ? subset.reduce((a, r) => a + r.avg_ho_time_rider * r.total_orders_delivered_by_rider, 0) / riw
      : subset.reduce((a, r) => a + r.avg_lm_time_rider * r.total_orders_delivered_by_rider, 0) / riw;
    const metric = useHO ? 'HO Time' : 'LM Time';
    const period = isYesterday ? 'D-1' : `L${days}D`;
    let direction = '🟡 equal';
    if (robotAvg > riderAvg && riderAvg > 0) direction = `🔴 robot is ${(robotAvg / riderAvg).toFixed(1)}x slower`;
    else if (robotAvg < riderAvg && robotAvg > 0) direction = `🟢 robot is ${(riderAvg / robotAvg).toFixed(1)}x faster`;
    return `${metric} (${period}) — ${entityLabel}:\n• Robot avg: ${fmtNum(robotAvg, 1)} min\n• Rider avg: ${fmtNum(riderAvg, 1)} min\n• Direction: ${direction}`;
  }

  // ── Opt-in rate ──
  if (ql.includes('opt') || ql.includes('routing rate')) {
    const sol = solution ?? 'yango';
    const subset = filterBySolution(rows, sol);
    const period = filterByDateRange(subset, getDaysAgoStr(days), today);
    const total = period.reduce((a, r) => a + r.total_orders, 0);
    const routed = period.reduce((a, r) => a + r.total_orders_routed_to_robot, 0);
    return `L${days}D Opt-in rate — ${s2d(sol)}: ${total > 0 ? fmtNum((routed / total) * 100, 1) : '—'}%\n(${routed.toLocaleString()} routed / ${total.toLocaleString()} total)`;
  }

  // ── Refunds ──
  if (ql.includes('refund')) {
    const from = dateStr ? dateStr : (isYesterday ? d1 : getDaysAgoStr(days));
    const to = dateStr ? dateStr : (isYesterday ? d1 : today);
    const subset = filterByDateRange(base, from, to);
    const orders = subset.reduce((a, r) => a + r.refund_orders_robot, 0);
    const amount = subset.reduce((a, r) => a + r.refund_amount_total_robot, 0);
    const period = dateStr ? dateStr : (isYesterday ? 'D-1' : `L${days}D`);
    return `Refunds (${period}) — ${entityLabel}:\n• Orders refunded: ${orders}\n• Amount: AED ${fmtNum(amount, 2)}`;
  }

  // ── Complaints ──
  if (ql.includes('complaint') || ql.includes('ndr') || ql.includes('cx')) {
    const from = dateStr ? dateStr : (isYesterday ? d1 : getDaysAgoStr(days));
    const to = dateStr ? dateStr : (isYesterday ? d1 : today);
    const subset = filterByDateRange(base, from, to);
    const ndr = subset.reduce((a, r) => a + r.ndr_complaints_robot, 0);
    const ona = subset.reduce((a, r) => a + r.ona_complaints_robot, 0);
    const cx = subset.reduce((a, r) => a + r.cx_complaints_robot, 0);
    const period = dateStr ? dateStr : (isYesterday ? 'D-1' : `L${days}D`);
    return `Complaints (${period}) — ${entityLabel}:\n• NDR: ${ndr}\n• ONA: ${ona}\n• CX: ${cx}\n• Total: ${ndr + ona + cx}`;
  }

  // ── Intervention / before-after comparison ──
  if (ql.includes('intervention') || ql.includes('improvement') || ql.includes('change') || ql.includes('since') || (ql.includes('before') && ql.includes('after'))) {
    const pivot = dateStr;
    if (!pivot) return "Please specify a date to compare — e.g. 'What changed since June 10?'";
    const before = filterByDateRange(base, getDaysAgoStr(60), pivot).filter(r => r.date_ < pivot);
    const after = filterByDateRange(base, pivot, today);
    if (!before.length || !after.length) return `Not enough data on both sides of ${pivot} to compare.`;
    const bDays = new Set(before.map(r => r.date_)).size || 1;
    const aDays = new Set(after.map(r => r.date_)).size || 1;
    const bRobot = before.reduce((a, r) => a + r.total_orders_delivered_by_robot, 0) / bDays;
    const aRobot = after.reduce((a, r) => a + r.total_orders_delivered_by_robot, 0) / aDays;
    const bComplaints = before.reduce((a, r) => a + r.ndr_complaints_robot + r.ona_complaints_robot + r.cx_complaints_robot, 0) / bDays;
    const aComplaints = after.reduce((a, r) => a + r.ndr_complaints_robot + r.ona_complaints_robot + r.cx_complaints_robot, 0) / aDays;
    const robotDelta = bRobot > 0 ? ((aRobot - bRobot) / bRobot * 100) : 0;
    const compDelta = bComplaints > 0 ? ((aComplaints - bComplaints) / bComplaints * 100) : 0;
    return `Since ${pivot} — ${entityLabel}:\n• Robot deliveries/day: ${fmtNum(bRobot, 1)} → ${fmtNum(aRobot, 1)} (${robotDelta >= 0 ? '+' : ''}${fmtNum(robotDelta, 1)}%)\n• Complaints/day: ${fmtNum(bComplaints, 2)} → ${fmtNum(aComplaints, 2)} (${compDelta >= 0 ? '+' : ''}${fmtNum(compDelta, 1)}%)`;
  }

  // ── Orders / deliveries ──
  const from = dateStr ? dateStr : (isYesterday ? d1 : getDaysAgoStr(days));
  const to = dateStr ? dateStr : (isYesterday ? d1 : today);
  const subset = filterByDateRange(base, from, to);
  const uniqueDays = new Set(subset.map(r => r.date_)).size;

  if (!subset.length) {
    if (geofenceName) return `No data found for "${geofenceName}" in that period. Try checking the geofence name or period.`;
    return `No data found for that query. Try: "How many orders did Una Apartments get yesterday?" or "DBOTs robot deliveries L7D"`;
  }

  const total = subset.reduce((a, r) => a + r.total_orders, 0);
  const robot = subset.reduce((a, r) => a + r.total_orders_delivered_by_robot, 0);
  const routed = subset.reduce((a, r) => a + r.total_orders_routed_to_robot, 0);
  const complaints = subset.reduce((a, r) => a + r.ndr_complaints_robot + r.ona_complaints_robot + r.cx_complaints_robot, 0);
  const period = dateStr ? dateStr : (isYesterday ? 'D-1' : `L${days}D`);
  const perDay = uniqueDays > 1 ? ` (avg ${fmtNum(total / uniqueDays, 0)}/day over ${uniqueDays} days)` : '';

  const utilRate = routed > 0 ? fmtNum((robot / routed) * 100, 1) : '—';
  const undelivered = subset.reduce((a, r) => a + r.undelivered_robot_orders, 0);
  const returnPct = routed > 0 ? fmtNum((undelivered / routed) * 100, 1) : null;
  const forced = subset.reduce((a, r) => a + r.total_forced_assigned_robot_orders, 0);

  let out = `${period} — ${entityLabel}:\n• Total orders: ${total.toLocaleString()}${perDay}\n• Routed to robot: ${routed.toLocaleString()} (${total > 0 ? fmtNum(routed / total * 100, 1) : 0}% opt-in)\n• Robot deliveries: ${robot.toLocaleString()} | Utilisation: ${utilRate}%\n• Complaints: ${complaints}`;
  if (returnPct !== null && undelivered > 0) out += `\n• Returned/undelivered: ${undelivered} (${returnPct}% return rate, ${fmtNum(100 - parseFloat(returnPct), 1)}% success)`;
  if (forced > 0) out += `\n• Forced assignments: ${forced}`;
  return out;
};

// ── Component ──────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  'What went wrong yesterday with UNA Apartments?',
  'How many orders did Semmer Villas get vs usual?',
  'Return rate for sidewalk robots L7D',
  'Forced assignments for DBOTs yesterday',
  'Top 5 geofences by deliveries',
];

export default function ChatBot({ rows, mapping }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: "Hi! Ask me anything about the dashboard — deliveries, missed orders, complaints, or specific geofences.\n\nTry: \"How many orders did Una Apartments get yesterday?\" or type **help** for all capabilities.", ts: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const nameMap = buildNameMap(mapping);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = (q?: string) => {
    const text = (q ?? input).trim();
    if (!text) return;
    setInput('');
    setShowSuggestions(false);
    const userMsg: Message = { role: 'user', text, ts: Date.now() };
    const botReply: Message = { role: 'bot', text: answer(text, rows, nameMap), ts: Date.now() + 1 };
    setMessages(prev => [...prev, userMsg, botReply]);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-6 w-80 md:w-[420px] z-50 card shadow-card-lg flex flex-col overflow-hidden"
            style={{ maxHeight: '75vh' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-2 bg-ink-primary">
              <div className="flex items-center gap-2">
                <Bot size={14} className="text-noon-yellow" />
                <span className="text-sm font-semibold text-surface-0">Data Assistant</span>
                <span className="text-[10px] bg-noon-yellow text-ink-primary px-1.5 py-0.5 rounded-full font-semibold">{rows.length.toLocaleString()} rows</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => send('help')} className="text-surface-3 hover:text-surface-0 transition-colors"><HelpCircle size={14} /></button>
                <button onClick={() => setOpen(false)} className="text-surface-3 hover:text-surface-0 transition-colors"><X size={14} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-surface-1">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-line ${m.role === 'user' ? 'bg-noon-yellow text-ink-primary' : 'bg-surface-0 text-ink-primary shadow-card'}`}>
                    {m.text}
                  </div>
                </div>
              ))}

              {showSuggestions && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] text-ink-tertiary px-1">Try asking:</p>
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-surface-0 hover:bg-noon-yellow-muted border border-surface-2 transition-colors text-ink-secondary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="flex items-center gap-2 p-3 border-t border-surface-2 bg-surface-0">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Ask about any geofence, solution, or metric…"
                className="flex-1 text-xs bg-surface-1 rounded-lg px-3 py-2 border border-surface-2 focus:outline-none focus:ring-2 focus:ring-noon-yellow text-ink-primary"
              />
              <button onClick={() => send()} className="p-2 bg-noon-yellow hover:bg-noon-yellow-light rounded-lg transition-colors">
                <Send size={12} className="text-ink-primary" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-ink-primary rounded-full shadow-card-lg flex items-center justify-center"
      >
        {open ? <X size={18} className="text-surface-0" /> : <MessageCircle size={18} className="text-noon-yellow" />}
      </motion.button>
    </>
  );
}
