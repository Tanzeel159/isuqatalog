import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/src/components/layouts/AuthLayout';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      navigate('/onboarding');
    }, 1000);
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your academic portal">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input 
          label="Email or User ID" 
          placeholder="netid@iastate.edu" 
          type="email" 
          required 
        />
        
        <div className="space-y-1.5">
          <Input 
            label="Password" 
            placeholder="••••••••" 
            type="password" 
            required 
          />
          <div className="flex justify-end">
            <Link 
              to="/forgot-password" 
              className="text-[12px] font-medium text-gray-500 hover:text-isu-cardinal transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Sign in
        </Button>

        <div className="pt-2">
          <Link to="/signup">
            <Button variant="draw-outline" className="w-full" type="button">
              New student? Create account
            </Button>
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
