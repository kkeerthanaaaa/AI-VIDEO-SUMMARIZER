import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import { FileVideo, UploadCloud, X } from 'lucide-react';

const ALLOWED_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
const ALLOWED_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/webm',
];

const MAX_FILE_SIZE_MB = Number(import.meta.env.VITE_MAX_FILE_SIZE_MB) || 200;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

interface UploadCardProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

export function UploadCard({ file, onFileChange, disabled }: UploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = (selected: File | null) => {
    if (!selected) {
      onFileChange(null);
      return;
    }

    const ext = `.${selected.name.split('.').pop()?.toLowerCase() ?? ''}`;
    const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);
    const isMimeAllowed = ALLOWED_MIME_TYPES.includes(selected.type.toLowerCase());

    if (!isExtAllowed && !isMimeAllowed) {
      setError(
        `Unsupported file type. Please upload one of: ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()}`
      );
      onFileChange(null);
      return;
    }

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setError(`File is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`);
      onFileChange(null);
      return;
    }

    setError(null);
    onFileChange(selected);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    validateAndSet(e.target.files?.[0] ?? null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    validateAndSet(e.dataTransfer.files?.[0] ?? null);
  };

  const handleClear = () => {
    setError(null);
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) inputRef.current?.click();
        }}
        className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-200 ${
          isDragging
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
            : 'border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700 bg-slate-50/60 dark:bg-slate-800/30'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_MIME_TYPES.concat(ALLOWED_EXTENSIONS).join(',')}
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled}
        />

        {file ? (
          <div className="flex w-full max-w-sm items-center gap-3 rounded-xl bg-white dark:bg-surface-dark-card border border-slate-200 dark:border-slate-700 px-4 py-3 text-left shadow-soft">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
              <FileVideo size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                {file.name}
              </p>
              <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              aria-label="Remove file"
              className="flex-shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
              <UploadCloud size={24} />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                <span className="text-brand-600 dark:text-brand-400">Click to upload</span> or
                drag and drop
              </p>
              <p className="mt-1 text-xs text-slate-400">
                MP4, MOV, AVI, MKV, or WEBM &middot; up to {MAX_FILE_SIZE_MB} MB
              </p>
            </div>
          </>
        )}
      </div>

      {error && <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
