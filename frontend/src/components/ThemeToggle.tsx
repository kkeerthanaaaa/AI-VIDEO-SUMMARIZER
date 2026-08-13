import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark-card text-slate-500 dark:text-slate-300 transition-colors hover:text-brand-600 dark:hover:text-brand-400"
    >
      <Sun
        size={18}
        className={`absolute transition-all duration-300 ${
          isDark ? 'scale-0 opacity-0 rotate-90' : 'scale-100 opacity-100 rotate-0'
        }`}
      />
      <Moon
        size={18}
        className={`absolute transition-all duration-300 ${
          isDark ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 -rotate-90'
        }`}
      />
    </button>
  );
}
