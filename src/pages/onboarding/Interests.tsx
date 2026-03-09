import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Brain,
  Figma,
  Palette,
  Glasses,
  Rocket,
  ClipboardList,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const INTEREST_OPTIONS: { label: string; icon: LucideIcon }[] = [
  { label: 'Psychology', icon: Brain },
  { label: 'UI/UX', icon: Figma },
  { label: 'Graphics', icon: Palette },
  { label: 'AR/VR', icon: Glasses },
  { label: 'Entrepreneurship', icon: Rocket },
  { label: 'Qual Research', icon: ClipboardList },
  { label: 'Cognitive Psych', icon: Sparkles },
];

export default function Interests() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const toggleInterest = (label: string) => {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label],
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      console.log('Selected interests', selected);
      navigate('/onboarding/workload');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AuthLayout
      step={3}
      totalSteps={4}
      title="Unlock your personal interests"
      subtitle="Your interests would help us recommend courses better"
      onBack={() => navigate('/onboarding')}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <p className="text-[var(--text-2xs)] font-semibold text-[var(--color-neutral-400)] uppercase tracking-[var(--tracking-wider)] mb-3">
            Select any that apply
          </p>
          <div className="grid grid-cols-2 gap-2">
            {INTEREST_OPTIONS.map(({ label, icon: Icon }, i) => {
              const active = selected.includes(label);
              return (
                <motion.button
                  key={label}
                  type="button"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03, type: 'spring', stiffness: 400, damping: 25 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleInterest(label)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-[var(--text-sm)] font-medium transition-all duration-200 text-left',
                    active
                      ? 'bg-[var(--color-brand-cardinal)] text-white border-transparent shadow-sm shadow-[var(--color-brand-cardinal)]/15'
                      : 'bg-white/80 text-[var(--color-neutral-600)] border-[var(--color-border-default)] hover:border-[var(--color-border-hover)] hover:bg-white',
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
                  {label}
                </motion.button>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between pt-1"
        >
          <button
            type="button"
            onClick={() => navigate('/onboarding/workload')}
            className="text-[var(--text-xs)] font-medium text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)] transition-colors"
          >
            Skip for now
          </button>

          <Button type="submit" className="px-8" isLoading={isSaving} disabled={selected.length === 0}>
            Continue
          </Button>
        </motion.div>
      </form>
    </AuthLayout>
  );
}
