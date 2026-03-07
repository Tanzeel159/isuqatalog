import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/src/components/layouts/AuthLayout';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { motion } from 'motion/react';

export default function Signup() {
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
    <AuthLayout>
      <div className="mb-8 text-center">
        <div className="flex flex-col items-center justify-center mb-4">
          <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">Step 1</span>
          <div className="h-1 w-24 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "33%" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-isu-cardinal"
            />
          </div>
        </div>
        
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight mb-2">
          Start your Path to Academic Success
        </h1>
        <p className="text-sm text-gray-500">
          Let's create your unique QatalogID
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input 
          label="Your QatalogID" 
          placeholder="@ROSHAN" 
          type="text" 
          required 
        />
        
        <Input 
          label="Email" 
          placeholder="netid@iastate.edu" 
          type="email" 
          required 
        />

        <Input 
          label="Password" 
          placeholder="••••••••" 
          type="password" 
          required 
        />

        <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
          CONTINUE
        </Button>
      </form>
    </AuthLayout>
  );
}
