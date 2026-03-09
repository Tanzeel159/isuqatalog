import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, BookOpen, Award, Cog, Palette, Briefcase, FlaskConical, Sparkles, Library } from 'lucide-react';
import { motion } from 'motion/react';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

const ACADEMIC_LEVEL_ICONS = {
  Undergraduate: GraduationCap,
  Graduate: BookOpen,
  PhD: Award,
};

const AREA_OF_STUDY_ICONS = {
  Engineering: Cog,
  Design: Palette,
  Business: Briefcase,
  Sciences: FlaskConical,
};

const YEAR_OF_STUDY_ICONS = {
  Freshman: Sparkles,
  Sophomore: BookOpen,
  Junior: Library,
  Senior: GraduationCap,
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    academicLevel: '',
    areaOfStudy: '',
    yearOfStudy: '',
  });

  const allFilled = formData.academicLevel && formData.areaOfStudy && formData.yearOfStudy;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      console.log('Step 2 completed', formData);
      navigate('/onboarding/interests');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      step={2}
      totalSteps={4}
      title="Map your background"
      subtitle="Your background helps us match you with cross-disciplinary courses"
      onBack={() => navigate('/signup')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Select
            label="Academic Level"
            value={formData.academicLevel}
            onChange={(val) => setFormData({ ...formData, academicLevel: val })}
            options={['Undergraduate', 'Graduate', 'PhD']}
            optionIcons={ACADEMIC_LEVEL_ICONS}
            required
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Select
            label="Area of Study"
            value={formData.areaOfStudy}
            onChange={(val) => setFormData({ ...formData, areaOfStudy: val })}
            options={['Engineering', 'Design', 'Business', 'Sciences']}
            optionIcons={AREA_OF_STUDY_ICONS}
            required
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Select
            label="Year of Study"
            value={formData.yearOfStudy}
            onChange={(val) => setFormData({ ...formData, yearOfStudy: val })}
            options={['Freshman', 'Sophomore', 'Junior', 'Senior']}
            optionIcons={YEAR_OF_STUDY_ICONS}
            required
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex items-center justify-between pt-1"
        >
          <button
            type="button"
            onClick={() => navigate('/onboarding/interests')}
            className="text-[var(--text-xs)] font-medium text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)] transition-colors"
          >
            Skip for now
          </button>

          <Button type="submit" className="px-8" isLoading={isLoading} disabled={!allFilled}>
            Continue
          </Button>
        </motion.div>
      </form>
    </AuthLayout>
  );
}
