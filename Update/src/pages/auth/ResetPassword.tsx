import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/src/components/layouts/AuthLayout';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      navigate('/');
    }, 1000);
  };

  return (
    <AuthLayout title="Set new password" subtitle="Please choose a strong password">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input 
          label="New password" 
          placeholder="••••••••" 
          type="password" 
          required 
        />

        <Input 
          label="Confirm password" 
          placeholder="••••••••" 
          type="password" 
          required 
        />

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
