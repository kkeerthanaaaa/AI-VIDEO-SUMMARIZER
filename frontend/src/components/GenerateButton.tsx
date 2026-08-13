import { Loader2, Wand2 } from 'lucide-react';

interface GenerateButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function GenerateButton({ onClick, disabled, loading }: GenerateButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="btn-primary w-full sm:w-auto sm:min-w-[220px] text-base py-3.5"
    >
      {loading ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Wand2 size={18} />
          Generate Summary
        </>
      )}
    </button>
  );
}
