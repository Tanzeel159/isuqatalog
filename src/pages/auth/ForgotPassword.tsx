import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Mail } from 'lucide-react';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsLoading(true);
    try {
      // TODO: Replace with real API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSent(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset password" subtitle="Enter your email to receive instructions">
      <AnimatePresence mode="wait">
        {!isSent ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {formError && (
              <div
                role="alert"
                className="rounded-2xl border border-red-100 bg-red-50/60 px-4 py-3 text-[var(--text-sm)] font-medium text-red-700 backdrop-blur-sm"
              >
                {formError}
              </div>
            )}

            <Input
              label="Email address"
              placeholder="netid@iastate.edu"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Send reset link
            </Button>

            <div className="text-center mt-2">
              <Link
                to="/"
                className="inline-flex items-center text-[var(--text-sm)] font-medium text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-700)] transition-colors group"
              >
                <ArrowLeft className="w-3 h-3 mr-1.5 transition-transform group-hover:-translate-x-0.5" />
                Back to login
              </Link>
            </div>
          </motion.form>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="space-y-6"
          >
            <div
              role="alert"
              className="flex flex-col items-center text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4"
              >
                <Mail className="w-6 h-6 text-emerald-600" />
              </motion.div>
              <p className="text-[var(--text-sm)] leading-relaxed text-[var(--color-neutral-600)]">
                We've sent a password reset link to your email. Check your inbox (and spam folder).
              </p>
            </div>

            <Button
              onClick={() => setIsSent(false)}
              variant="outline"
              className="w-full"
            >
              Resend email
            </Button>

            <div className="text-center">
              <Link
                to="/"
                className="text-[var(--text-2xs)] text-[var(--color-neutral-300)] hover:text-[var(--color-neutral-500)] font-mono transition-colors"
              >
                Back to login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
