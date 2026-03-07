import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export interface SelectProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  error?: string;
  optionIcons?: Record<string, LucideIcon>;
  required?: boolean;
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  function Select({ label, value, onChange, options, placeholder = 'Select', error, optionIcons, required }, forwardedRef) {
    const [open, setOpen] = React.useState(false);
    const [activeIdx, setActiveIdx] = React.useState(-1);
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const listId = React.useId();
    const labelId = React.useId();

    React.useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    React.useEffect(() => {
      if (open) {
        setActiveIdx(value ? options.indexOf(value) : 0);
      }
    }, [open, value, options]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIdx((i) => Math.min(i + 1, options.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIdx((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (activeIdx >= 0 && activeIdx < options.length) {
            onChange(options[activeIdx]);
            setOpen(false);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          break;
        case 'Home':
          e.preventDefault();
          setActiveIdx(0);
          break;
        case 'End':
          e.preventDefault();
          setActiveIdx(options.length - 1);
          break;
      }
    };

    return (
      <div ref={containerRef} className="w-full space-y-1.5 relative">
        {label && (
          <label id={labelId} className="text-[var(--text-sm)] font-medium text-[var(--color-neutral-700)]">
            {label}
            {required && <span className="text-[var(--color-error)] ml-0.5">*</span>}
          </label>
        )}

        <motion.button
          ref={forwardedRef}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={open ? listId : undefined}
          aria-labelledby={label ? labelId : undefined}
          aria-activedescendant={open && activeIdx >= 0 ? `${listId}-opt-${activeIdx}` : undefined}
          onClick={() => setOpen((v) => !v)}
          onKeyDown={handleKeyDown}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'flex h-[var(--input-h-md)] w-full items-center justify-between gap-2 rounded-2xl border bg-white/90 px-4 text-sm',
            'transition-all duration-200',
            'hover:border-[var(--color-border-hover)]',
            'focus-visible:outline-none focus-visible:border-[var(--color-border-focus)] focus-visible:ring-4 focus-visible:ring-[var(--color-brand-cardinal)]/5',
            error ? 'border-[var(--color-border-error)]' : 'border-[var(--color-border-default)]',
            value ? 'text-[var(--color-neutral-800)] font-medium' : 'text-[var(--color-neutral-400)]',
          )}
        >
          {(() => {
            const SelectedIcon = value ? optionIcons?.[value] : null;
            return (
              <span className="flex items-center gap-2 truncate">
                {SelectedIcon && <SelectedIcon className="w-4 h-4 shrink-0 text-[var(--color-neutral-500)]" strokeWidth={2} />}
                <span className="truncate">{value || placeholder}</span>
              </span>
            );
          })()}
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-[var(--color-neutral-400)] shrink-0" strokeWidth={2.5} />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.ul
              id={listId}
              role="listbox"
              aria-labelledby={label ? labelId : undefined}
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute left-0 right-0 z-30 mt-1.5 rounded-2xl border border-[var(--color-border-default)] bg-white py-1.5 shadow-[var(--shadow-dropdown)] max-h-56 overflow-auto"
            >
              {options.map((opt, i) => {
                const Icon = optionIcons?.[opt];
                const isActive = i === activeIdx;
                const isSelected = value === opt;
                return (
                  <motion.li
                    key={opt}
                    id={`${listId}-opt-${i}`}
                    role="option"
                    aria-selected={isSelected}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.15) }}
                    onClick={() => { onChange(opt); setOpen(false); }}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-[var(--color-brand-cardinal-light)] text-[var(--color-brand-cardinal)] font-medium'
                        : isActive
                          ? 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-800)]'
                          : 'text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-100)]',
                    )}
                  >
                    {Icon && <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />}
                    {opt}
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>

        {error && (
          <p role="alert" className="text-[var(--text-xs)] text-[var(--color-error)] font-medium">{error}</p>
        )}
      </div>
    );
  }
);
