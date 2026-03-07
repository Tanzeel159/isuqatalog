import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/shared/Logo';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  step?: number;
  totalSteps?: number;
  onBack?: () => void;
}

export function AuthLayout({ children, title, subtitle, className, step, totalSteps, onBack }: AuthLayoutProps) {
  const showProgress = typeof step === 'number' && typeof totalSteps === 'number' && totalSteps > 0;
  const clampedStep = showProgress ? Math.min(Math.max(step!, 1), totalSteps!) : undefined;
  const progressPct = showProgress ? (clampedStep! / totalSteps!) * 100 : 0;

  return (
    <div className="min-h-screen w-full flex flex-col relative overflow-hidden bg-[var(--color-surface-page)]">
      <AnimatedBackground variant="auth" />

      <header className="relative z-10 w-full px-6 pt-6">
        <Logo to="/" size="lg" />
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={cn('w-full max-w-[var(--card-w-sm)]', className)}
        >
          {showProgress && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-6"
            >
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-2xs)] font-bold tracking-widest text-[var(--color-neutral-400)] uppercase">
                  Step {clampedStep} of {totalSteps}
                </span>
                <span className="text-[var(--text-2xs)] font-bold tracking-widest text-[var(--color-neutral-400)] uppercase tabular-nums">
                  {Math.round(progressPct)}%
                </span>
              </div>

              <div className="mt-2.5 flex gap-1.5">
                {Array.from({ length: totalSteps! }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 flex-1 rounded-[var(--radius-full)] bg-[var(--color-neutral-200)]/60 overflow-hidden"
                  >
                    {i < clampedStep! && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.4, delay: i * 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                        className="h-full rounded-[var(--radius-full)] bg-[var(--color-brand-cardinal)]"
                      />
                    )}
                  </div>
                ))}
              </div>

            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="glass-panel-strong rounded-[var(--radius-3xl)] p-8"
          >
            {(onBack || title || subtitle) && (
              <div className="mb-6">
                {onBack && (
                  <motion.button
                    type="button"
                    onClick={onBack}
                    whileHover={{ x: -3 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-1.5 text-[var(--text-sm)] font-medium text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-900)] transition-colors mb-4 group"
                  >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                    Back
                  </motion.button>
                )}
                {title && (
                  <motion.h1
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-[var(--text-xl)] font-bold text-[var(--color-neutral-900)] tracking-tight"
                  >
                    {title}
                  </motion.h1>
                )}
                {subtitle && (
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="mt-2 text-[var(--text-base)] text-[var(--color-neutral-500)] leading-relaxed"
                  >
                    {subtitle}
                  </motion.p>
                )}
              </div>
            )}

            {children}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="text-[var(--text-xs)] text-[var(--color-neutral-300)] font-medium tracking-wide uppercase">
              Iowa State University &bull; Academic Co-pilot
            </p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
