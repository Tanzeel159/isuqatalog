import * as React from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, id: externalId, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const autoId = React.useId();
    const id = externalId || autoId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;
    const isPassword = type === 'password';

    const describedBy = [error ? errorId : null, hint && !error ? hintId : null]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={id} className="text-[var(--text-sm)] font-medium text-[var(--color-neutral-700)]">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={id}
            type={isPassword ? (showPassword ? 'text' : 'password') : type}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={cn(
              'flex h-[var(--input-h-md)] w-full rounded-2xl border bg-white/90 px-4 py-2 text-sm',
              'transition-all duration-200',
              'placeholder:text-[var(--color-neutral-400)]',
              'focus-visible:outline-none focus-visible:border-[var(--color-border-focus)] focus-visible:ring-4 focus-visible:ring-[var(--color-brand-cardinal)]/5 focus-visible:bg-white',
              'hover:border-[var(--color-border-hover)]',
              'disabled:cursor-not-allowed disabled:opacity-50',
              isPassword && 'pr-11',
              error
                ? 'border-[var(--color-border-error)] focus-visible:border-[var(--color-border-error)] focus-visible:ring-[var(--color-error)]/10'
                : 'border-[var(--color-border-default)]',
              className,
            )}
            ref={ref}
            {...props}
          />

          {isPassword && (
            <motion.button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              whileTap={{ scale: 0.9 }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-cardinal)]/30 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </motion.button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              id={errorId}
              key="error"
              role="alert"
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              className="text-[var(--text-xs)] text-[var(--color-error)] font-medium"
            >
              {error}
            </motion.p>
          )}
          {hint && !error && (
            <motion.p
              id={hintId}
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[var(--text-xs)] text-[var(--color-neutral-400)]"
            >
              {hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
