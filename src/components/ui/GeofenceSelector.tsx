'use client';

interface Props { geofences: string[]; selected: string; onChange: (g: string) => void; }

export default function GeofenceSelector({ geofences, selected, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-ink-tertiary font-medium">Geofence</span>
      <select
        value={selected}
        onChange={e => onChange(e.target.value)}
        className="text-sm font-medium bg-surface-0 border border-surface-3 rounded-lg px-3 py-1.5 text-ink-primary focus:outline-none focus:ring-2 focus:ring-noon-yellow transition-all"
      >
        {geofences.map(g => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>
    </div>
  );
}
