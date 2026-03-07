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
      <form onSubmit={handleSubmit} className="space-y-5">
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
        >
          <Toggle
            checked={isInternationalStudent}
            onChange={setIsInternationalStudent}
            label="Are you an international student?"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col items-center gap-3 pt-2"
        >
          <Button type="submit" className="w-full" isLoading={isSaving}>
            All Set!
          </Button>

          <button
            type="button"
            onClick={() => navigate('/dashboard', { replace: true })}
            className="text-[12px] font-medium text-[var(--color-neutral-300)] hover:text-[var(--color-neutral-500)] transition-colors"
          >
            Skip &rarr; You can set up later
          </button>
        </motion.div>
      </form>
    </AuthLayout>
  );
}
