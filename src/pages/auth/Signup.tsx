import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: 'var(--color-error)' };
  if (score <= 2) return { score: 2, label: 'Fair', color: 'var(--color-warning)' };
  if (score <= 3) return { score: 3, label: 'Good', color: 'var(--color-info)' };
  if (score <= 4) return { score: 4, label: 'Strong', color: 'var(--color-success)' };
  return { score: 5, label: 'Excellent', color: 'var(--color-success)' };
}

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [qatalogId, setQatalogId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const strength = password ? getPasswordStrength(password) : null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsLoading(true);
    try {
      await signup(email, password, qatalogId);
      toast('Account created! Let\'s set up your profile.', 'success');
      navigate('/onboarding');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Signup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      className="max-w-[520px]"
      step={1}
      totalSteps={4}
      title="Start your Path to Academic Success"
      subtitle="Let's create your unique QatalogID"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {formError && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-red-100 bg-red-50/60 px-4 py-3 text-[var(--text-sm)] font-medium text-red-700 backdrop-blur-sm"
          >
            {formError}
          </motion.div>
        )}

        <Input
          label="Your QatalogID"
          placeholder="@netid"
          type="text"
          required
          value={qatalogId}
          onChange={(e) => setQatalogId(e.target.value)}
          hint="This is your unique identifier in ISU Qatalog"
          autoComplete="username"
        />

        <Input
          label="Email"
          placeholder="netid@iastate.edu"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <div className="space-y-2">
          <Input
            label="Password"
            placeholder="••••••••"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          {strength && (
            <motion.div
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-1.5"
            >
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="h-1 flex-1 rounded-full transition-colors duration-300"
                    style={{
                      backgroundColor: i < strength.score ? strength.color : 'var(--color-neutral-200)',
                    }}
                  />
                ))}
              </div>
              <p className="text-[var(--text-2xs)] font-medium" style={{ color: strength.color }}>
                {strength.label}
              </p>
            </motion.div>
          )}
        </div>

        <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
          Continue
        </Button>
      </form>
    </AuthLayout>
  );
}
