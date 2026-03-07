import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'draw-outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const VARIANTS = {
  primary: cn(
    'bg-[var(--color-brand-cardinal)] text-white shadow-sm border border-transparent',
    'hover:bg-[var(--color-brand-cardinal-hover)] hover:shadow-md',
    'active:shadow-inner',
  ),
  secondary: cn(
    'bg-[var(--color-brand-gold)] text-[var(--color-brand-dark)] shadow-sm border border-transparent',
    'hover:bg-[var(--color-brand-gold-hover)] hover:shadow-md',
  ),
  outline: cn(
    'bg-white/80 border border-[var(--color-border-default)] text-[var(--color-neutral-700)]',
    'hover:bg-[var(--color-neutral-50)] hover:border-[var(--color-border-hover)] hover:shadow-sm',
  ),
  ghost: cn(
    'hover:bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]',
    'hover:text-[var(--color-neutral-900)]',
  ),
  link: cn(
    'text-[var(--color-brand-cardinal)] hover:text-[var(--color-brand-cardinal-hover)]',
    'underline-offset-4 hover:underline p-0 h-auto font-normal',
  ),
  'draw-outline': cn(
    'group relative text-[var(--color-neutral-500)]',
    'hover:text-[var(--color-brand-cardinal)] bg-transparent rounded-none',
  ),
} as const;

const SIZES = {
  sm: 'h-[var(--input-h-sm)] px-3.5 text-xs gap-1.5',
  md: 'h-[var(--input-h-md)] px-5 text-sm gap-2',
  lg: 'h-[var(--input-h-lg)] px-7 text-base gap-2.5',
} as const;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const isDrawOutline = variant === 'draw-outline';

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        whileHover={isDrawOutline ? undefined : { scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn(
          'inline-flex items-center justify-center font-semibold',
          'rounded-[var(--radius-full)]',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-cardinal)]/20 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          VARIANTS[variant],
          SIZES[size],
          isDrawOutline && 'rounded-none',
          className,
        )}
        disabled={isLoading || props.disabled}
        {...(props as any)}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            children
          )}
        </span>

        {isDrawOutline && (
          <>
            <span className="absolute left-0 top-0 h-[2px] w-0 bg-gradient-to-r from-[var(--color-brand-cardinal)] to-[var(--color-brand-gold)] transition-all duration-300 ease-in-out group-hover:w-full" />
            <span className="absolute right-0 top-0 h-0 w-[2px] bg-gradient-to-b from-[var(--color-brand-gold)] to-[var(--color-brand-cardinal)] transition-all delay-300 duration-300 ease-in-out group-hover:h-full" />
            <span className="absolute bottom-0 right-0 h-[2px] w-0 bg-gradient-to-l from-[var(--color-brand-cardinal)] to-[var(--color-brand-gold)] transition-all delay-[600ms] duration-300 ease-in-out group-hover:w-full" />
            <span className="absolute bottom-0 left-0 h-0 w-[2px] bg-gradient-to-t from-[var(--color-brand-gold)] to-[var(--color-brand-cardinal)] transition-all delay-[900ms] duration-300 ease-in-out group-hover:h-full" />
          </>
        )}
      </motion.button>
    );
  },
);
Button.displayName = 'Button';

export { Button };
