import type { LucideIcon } from 'lucide-react';
import { Monitor, Moon, Sun } from 'lucide-react';
import type { ThemePreference } from '../../lib/theme';
import { cn } from '../../lib/utils';
import { useTheme } from '../../hooks/useTheme';

const OPTIONS: Array<{ value: ThemePreference; label: string; Icon: LucideIcon }> = [
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        'flex items-center gap-0.5 p-1 rounded-xl border shadow-sm',
        'bg-white/50 dark:bg-white/5 border-white/20 dark:border-white/10'
      )}
      role="group"
      aria-label="Theme"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const isActive = theme === value;

        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={cn(
              'h-9 w-9 inline-flex items-center justify-center rounded-lg transition-all',
              'text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-white/10',
              'focus:outline-none focus:ring-2 focus:ring-primary/20',
              isActive && 'bg-primary/10 text-primary ring-1 ring-primary/20 shadow-sm'
            )}
            aria-pressed={isActive}
            title={`Theme: ${label}`}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}

