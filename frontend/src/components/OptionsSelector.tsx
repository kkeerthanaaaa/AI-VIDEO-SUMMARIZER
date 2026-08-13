import { Check, FileText, Layers, ListChecks, Sparkles } from 'lucide-react';
import {
  ALL_OUTPUT_TYPES,
  OUTPUT_DESCRIPTIONS,
  OUTPUT_LABELS,
  OutputType,
} from '../types';

const ICONS: Record<OutputType, JSX.Element> = {
  summary: <FileText size={18} />,
  flashcards: <Layers size={18} />,
  keyPoints: <ListChecks size={18} />,
  highlights: <Sparkles size={18} />,
};

interface OptionsSelectorProps {
  selected: OutputType[];
  onChange: (next: OutputType[]) => void;
  disabled?: boolean;
}

export function OptionsSelector({ selected, onChange, disabled }: OptionsSelectorProps) {
  const allSelected = selected.length === ALL_OUTPUT_TYPES.length;

  const toggle = (type: OutputType) => {
    if (selected.includes(type)) {
      onChange(selected.filter((t) => t !== type));
    } else {
      onChange([...selected, type]);
    }
  };

  const toggleAll = () => {
    onChange(allSelected ? [] : [...ALL_OUTPUT_TYPES]);
  };

  return (
    <div className="card p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-slate-800 dark:text-slate-100">
          Choose your output formats
        </h3>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-brand-600 dark:text-brand-400">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            disabled={disabled}
            className="sr-only"
          />
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors ${
              allSelected
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-slate-300 dark:border-slate-600'
            }`}
          >
            {allSelected && <Check size={13} strokeWidth={3} />}
          </span>
          Select All
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ALL_OUTPUT_TYPES.map((type) => {
          const isSelected = selected.includes(type);
          return (
            <label
              key={type}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition-all duration-150 ${
                isSelected
                  ? 'border-brand-300 bg-brand-50/70 dark:border-brand-700 dark:bg-brand-950/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-brand-200 dark:hover:border-brand-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggle(type)}
                disabled={disabled}
                className="sr-only"
              />
              <span
                className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                  isSelected
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {ICONS[type]}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {OUTPUT_LABELS[type]}
                </span>
                <span className="mt-0.5 block text-xs text-slate-400">
                  {OUTPUT_DESCRIPTIONS[type]}
                </span>
              </span>
              <span
                className={`mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                  isSelected
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {isSelected && <Check size={13} strokeWidth={3} />}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
