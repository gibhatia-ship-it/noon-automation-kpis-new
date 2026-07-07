import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import { parseRow } from '@/lib/transforms';
import { MappingRow, OperationalWindowRow, FleetSizeRow, SolutionType } from '@/types';
import { GST_OFFSET_MS } from '@/lib/constants';

// Single source of truth: new sheet has all solutions + Mapping + Operational Window
const NEW_SHEET_ID = '1G8t1MwO75JpG7Maw1YSmz-ll9U2xJp696HVOGvYzFQY';

const fetchTab = async (sheetId: string, sheet: string) => {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Sheet fetch failed for "${sheet}" (${sheetId.slice(0, 8)}…): ${res.status}`);
  return res.text();
};

const parseTimeStr = (t: string): number => {
  const [time, period] = t.trim().split(' ');
  const hours = parseInt(time.split(':')[0]);
  if (period === 'PM' && hours !== 12) return hours + 12;
  if (period === 'AM' && hours === 12) return 0;
  return hours;
};

const getCutoffDate = (): string => {
  const d = new Date(Date.now() + GST_OFFSET_MS - 120 * 86400000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export async function GET() {
  try {
    const [extractCsv, mappingCsv, opWindowCsv, fleetCsv] = await Promise.all([
      fetchTab(NEW_SHEET_ID, 'Extract 1'),
      fetchTab(NEW_SHEET_ID, 'Mapping'),
      fetchTab(NEW_SHEET_ID, 'Operational Window'),
      fetchTab(NEW_SHEET_ID, 'Fleet Size'),
    ]);

    const { data: extractRaw } = Papa.parse<Record<string, string>>(extractCsv, { header: true, skipEmptyLines: true, transformHeader: h => h.trim() });
    const { data: mappingRaw } = Papa.parse<Record<string, string>>(mappingCsv, { header: true, skipEmptyLines: true, transformHeader: h => h.trim() });
    const { data: opWindowRaw } = Papa.parse<Record<string, string>>(opWindowCsv, { header: true, skipEmptyLines: true, transformHeader: h => h.trim() });
    const { data: fleetRaw } = Papa.parse<Record<string, string>>(fleetCsv, { header: true, skipEmptyLines: true, transformHeader: h => h.trim() });

    const cutoff = getCutoffDate();

    const rows = extractRaw
      .map(parseRow)
      .filter(Boolean)
      .filter((r: any) => r.date_ >= cutoff);

    const mapping: MappingRow[] = mappingRaw.map(r => ({
      geofence_code: r['geofence_code']?.trim() ?? '',
      service_provider: r['service provider']?.trim() ?? '',
      solution: r['Solution']?.trim() ?? '',
      area: r['area']?.trim() ?? '',
      total_robots: parseFloat(r['total robots']) || 0,
      cleaned_name: r['cleaned name']?.trim() ?? '',
    })).filter(r => r.geofence_code);

    const operationalWindows: OperationalWindowRow[] = opWindowRaw.map(r => {
      const timings = r['Timings']?.trim() ?? '';
      const parts = timings.split(' - ');
      return {
        geofence_code: r['geofence_code']?.trim() ?? '',
        cleaned_name: r['cleaned name']?.trim() ?? '',
        timings,
        start_hour: parts.length === 2 ? parseTimeStr(parts[0]) : 0,
        end_hour: parts.length === 2 ? parseTimeStr(parts[1]) : 24,
      };
    }).filter(r => r.geofence_code);

    const allDates = Array.from(new Set(rows.map((r: any) => r?.date_).filter(Boolean))).sort() as string[];
    const dateRange = {
      min: allDates[0] ?? null,
      max: allDates[allDates.length - 1] ?? null,
      distinctDates: allDates.length,
    };

    const solutionMap: Record<string, SolutionType> = {
      'dbots': 'ventureone',
      'sidewalk delivery robots': 'yango',
      'autonomous vans': 'robovan',
    };
    const fleetSize: FleetSizeRow[] = fleetRaw
      .map(r => {
        const sol = solutionMap[(r['Solution'] ?? '').trim().toLowerCase()];
        if (!sol) return null;
        return { solution: sol, totalLive: parseInt(r['Total live']) || 0, areasLive: (r['Areas live'] ?? '').trim() };
      })
      .filter(Boolean) as FleetSizeRow[];

    return NextResponse.json(
      { rows, mapping, operationalWindows, fleetSize, fetchedAt: new Date().toISOString(), dateRange },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('Data fetch error:', err);
    return NextResponse.json({ error: 'Failed to load data', rows: [], mapping: [], operationalWindows: [] }, { status: 500 });
  }
}
