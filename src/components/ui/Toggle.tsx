import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Toggle({ checked, onChange, label, disabled, className }: ToggleProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-3 cursor-pointer select-none',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      onClick={disabled ? undefined : () => onChange(!checked)}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label || undefined}
        disabled={disabled}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) onChange(!checked);
          }
        }}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-cardinal)]/30 focus-visible:ring-offset-2',
          checked
            ? 'bg-[var(--color-brand-cardinal)]'
            : 'bg-[var(--color-neutral-200)] hover:bg-[var(--color-neutral-300)]',
        )}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 700, damping: 30 }}
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </button>
      {label && (
        <span className="text-[var(--text-sm)] font-medium text-[var(--color-neutral-700)]">
          {label}
        </span>
      )}
    </div>
  );
}
