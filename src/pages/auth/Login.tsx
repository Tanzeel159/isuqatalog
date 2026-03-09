import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailOrQatalogId, setEmailOrQatalogId] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsLoading(true);
    try {
      await login(emailOrQatalogId, password);
      toast('Welcome back!', 'success');
      navigate('/dashboard');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your academic portal">
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-red-100 bg-red-50/60 px-4 py-3 text-[var(--text-sm)] font-medium text-red-700 backdrop-blur-sm"
          >
            {formError}
          </motion.div>
        )}

        <Input
          label="Email or QatalogID"
          placeholder="netid@iastate.edu or @netid"
          type="text"
          required
          value={emailOrQatalogId}
          onChange={(e) => setEmailOrQatalogId(e.target.value)}
          autoComplete="email"
        />

        <div className="space-y-1.5">
          <Input
            label="Password"
            placeholder="••••••••"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-[var(--text-xs)] font-medium text-[var(--color-neutral-400)] hover:text-[var(--color-brand-cardinal)] transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3 pt-1"
        >
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign in
          </Button>

          <div className="relative flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-[var(--color-border-default)]" />
            <span className="text-[var(--text-2xs)] font-medium text-[var(--color-neutral-300)] uppercase tracking-[var(--tracking-wider)]">or</span>
            <div className="flex-1 h-px bg-[var(--color-border-default)]" />
          </div>

          <Link to="/signup" className="block">
            <Button variant="outline" className="w-full" type="button">
              New student? Create account
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="pt-1 text-center"
        >
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-[var(--text-xs)] font-medium text-[var(--color-neutral-400)] hover:text-[var(--color-brand-cardinal)] transition-colors underline underline-offset-4 decoration-[var(--color-neutral-200)] hover:decoration-[var(--color-brand-cardinal)]/30"
          >
            Browse catalog without signing in
          </Link>
        </motion.div>
      </form>
    </AuthLayout>
  );
}
