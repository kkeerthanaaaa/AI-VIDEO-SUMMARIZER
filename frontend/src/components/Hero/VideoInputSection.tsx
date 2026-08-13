import { Link2, UploadCloud } from 'lucide-react';
import { UploadCard } from './UploadCard';
import { UrlInputCard } from './UrlInputCard';

export type InputMode = 'file' | 'url';

interface VideoInputSectionProps {
  inputMode: InputMode;
  onInputModeChange: (mode: InputMode) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  url: string;
  onUrlChange: (url: string) => void;
  disabled?: boolean;
}

export function VideoInputSection({
  inputMode,
  onInputModeChange,
  file,
  onFileChange,
  url,
  onUrlChange,
  disabled,
}: VideoInputSectionProps) {
  return (
    <div className="card p-4 sm:p-6">
      <div
        role="tablist"
        aria-label="Video input method"
        className="mb-4 inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1"
      >
        <button
          role="tab"
          aria-selected={inputMode === 'file'}
          onClick={() => onInputModeChange('file')}
          disabled={disabled}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            inputMode === 'file'
              ? 'bg-white dark:bg-surface-dark-card text-brand-600 dark:text-brand-400 shadow-soft'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <UploadCloud size={16} />
          Upload Video
        </button>
        <button
          role="tab"
          aria-selected={inputMode === 'url'}
          onClick={() => onInputModeChange('url')}
          disabled={disabled}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            inputMode === 'url'
              ? 'bg-white dark:bg-surface-dark-card text-brand-600 dark:text-brand-400 shadow-soft'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Link2 size={16} />
          Paste Video Link
        </button>
      </div>

      {inputMode === 'file' ? (
        <UploadCard file={file} onFileChange={onFileChange} disabled={disabled} />
      ) : (
        <UrlInputCard url={url} onUrlChange={onUrlChange} disabled={disabled} />
      )}
    </div>
  );
}
