import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sunrise, Sun, Moon, Check, type LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';
import { useToast } from '@/contexts/ToastContext';

const CLASS_TIMINGS_OPTIONS = ['Morning Classes', 'Afternoon Classes', 'Evening Classes', 'All of the above'];
const CLASS_TIMINGS_ICONS: Record<string, LucideIcon> = {
  'Morning Classes': Sunrise,
  'Afternoon Classes': Sun,
  'Evening Classes': Moon,
  'All of the above': Check,
};

const CREDIT_OPTIONS = ['2', '3', '4', "Doesn't matter"];

export default function WorkloadPreferences() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [classTimings, setClassTimings] = useState('');
  const [creditPreference, setCreditPreference] = useState('');
  const [isInternationalStudent, setIsInternationalStudent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      console.log('Step 4 completed', { classTimings, creditPreference, isInternationalStudent });
      toast('Profile setup complete! Welcome to ISU Qatalog.', 'success');
      navigate('/dashboard', { replace: true });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AuthLayout
      step={4}
      totalSteps={4}
      title="Workload and Preferences"
      subtitle="This helps us recommend classes based on your time and workload preferences."
      onBack={() => navigate('/onboarding/interests')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Select
            label="Class Timings"
            value={classTimings}
            onChange={setClassTimings}
            options={CLASS_TIMINGS_OPTIONS}
            optionIcons={CLASS_TIMINGS_ICONS}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Select
            label="Credit preferences/semester"
            value={creditPreference}
            onChange={setCreditPreference}
            options={CREDIT_OPTIONS}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-neutral-50)]/60 px-4 py-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[var(--text-sm)] font-semibold text-[var(--color-neutral-800)]">International student?</p>
              <p className="text-[var(--text-xs)] text-[var(--color-neutral-400)] leading-relaxed">
                Helps us account for visa enrollment requirements and prerequisite guidance for international credentials.
              </p>
            </div>
            <div className="pt-0.5 shrink-0">
              <Toggle
                checked={isInternationalStudent}
                onChange={setIsInternationalStudent}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col items-center gap-3 pt-1"
        >
          <Button type="submit" className="w-full" isLoading={isSaving}>
            Complete Setup
          </Button>

          <button
            type="button"
            onClick={() => navigate('/dashboard', { replace: true })}
            className="text-[var(--text-xs)] font-medium text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)] transition-colors"
          >
            Skip for now
          </button>
        </motion.div>
      </form>
    </AuthLayout>
  );
}
