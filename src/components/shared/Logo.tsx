import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LogoProps {
  to?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: { isu: 'text-base', qatalog: 'text-base', divider: 'h-4 mx-1.5' },
  md: { isu: 'text-xl', qatalog: 'text-lg', divider: 'h-6 mx-2.5' },
  lg: { isu: 'text-[var(--text-2xl)]', qatalog: 'text-[var(--text-2xl)]', divider: 'h-7 mx-3' },
};

export function Logo({ to = '/', size = 'md', className }: LogoProps) {
  const s = sizes[size];

  const content = (
    <span className={cn('inline-flex items-center', className)}>
      <span className={cn(s.isu, 'font-extrabold tracking-tight text-[var(--color-brand-dark)]')}>
        ISU
      </span>
      <span className={cn(s.divider, 'w-px bg-[var(--color-neutral-200)]')} />
      <span className={cn(s.qatalog, 'font-semibold tracking-tight text-[var(--color-neutral-500)]')}>
        Qatalog
      </span>
    </span>
  );

  return (
    <Link
      to={to}
      aria-label="ISU Qatalog home"
      className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-cardinal)]/20 focus-visible:ring-offset-2 rounded-lg"
    >
      {content}
    </Link>
  );
}
