'use client';
import clsx from 'clsx';

interface Option<T extends string> { id: T; label: string; }
interface Props<T extends string> { options: Option<T>[]; value: T; onChange: (v: T) => void; }

export default function Toggle<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <div className="flex items-center gap-1 bg-surface-2 rounded-lg p-0.5">
      {options.map(opt => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={clsx(
            'px-3 py-1 rounded-md text-xs font-medium transition-all duration-200',
            value === opt.id
              ? 'bg-noon-yellow text-ink-primary shadow-sm'
              : 'text-ink-secondary hover:text-ink-primary'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
