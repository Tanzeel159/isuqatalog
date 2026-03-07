import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/src/components/layouts/AuthLayout';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 1000);
  };

  return (
    <AuthLayout title="Reset password" subtitle="Enter your email to receive instructions">
      {!isSent ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input 
            label="Email address" 
            placeholder="netid@iastate.edu" 
            type="email" 
            required 
          />

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Send reset link
          </Button>

          <div className="text-center mt-2">
            <Link 
              to="/" 
              className="inline-flex items-center text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-3 h-3 mr-1.5" />
              Back to login
            </Link>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="bg-green-50/50 border border-green-100 text-green-800 p-4 rounded-lg text-sm leading-relaxed">
            We have sent a password reset link to your registered email. Please check your inbox (and spam folder).
          </div>
          
          <Button 
            onClick={() => setIsSent(false)} 
            variant="secondary"
            className="w-full"
          >
            Resend email
          </Button>

          <div className="text-center">
            <Link 
              to="/reset-password" 
              className="text-[11px] text-gray-400 hover:text-gray-600 font-mono"
            >
              (Dev: Go to Reset Screen)
            </Link>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
