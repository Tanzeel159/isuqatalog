import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/src/components/layouts/AuthLayout';
import { Button } from '@/src/components/ui/Button';
import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';

// Custom Select Component to match design
const Select = ({ label, value, onChange, options }: { label: string, value: string, onChange: (val: string) => void, options: string[] }) => (
  <div className="w-full space-y-1.5">
    <label className="text-[13px] font-bold text-gray-800">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 pl-4 pr-10 bg-white border-2 border-gray-400 rounded-xl text-sm font-bold text-gray-800 appearance-none focus:outline-none focus:border-isu-cardinal focus:ring-0 transition-colors cursor-pointer"
      >
        <option value="" disabled>Select</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-800 pointer-events-none" strokeWidth={3} />
    </div>
  </div>
);

export default function Onboarding() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    academicLevel: '',
    areaOfStudy: '',
    yearOfStudy: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Navigate to next step (Step 3) - for now just log
      console.log('Step 2 completed', formData);
    }, 1000);
  };

  return (
    <AuthLayout className="max-w-2xl">
      <div className="mb-8 text-center">
        <div className="flex flex-col items-center justify-center mb-4">
          <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">Step 2</span>
          <div className="h-1 w-32 bg-gray-200 rounded-full overflow-hidden flex">
            <motion.div 
              initial={{ width: "33%" }}
              animate={{ width: "66%" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-isu-dark"
            />
            <div className="h-full flex-1 bg-gray-300/50"></div>
          </div>
        </div>
        
        <h1 className="text-xl font-bold text-gray-900 tracking-tight mb-2">
          Map your background
        </h1>
        <p className="text-[11px] font-bold text-gray-600">
          Your background helps us match you with cross-disciplinary courses
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-3 gap-3">
          <Select 
            label="Academic Level" 
            value={formData.academicLevel}
            onChange={(val) => setFormData({...formData, academicLevel: val})}
            options={['Undergraduate', 'Graduate', 'PhD']}
          />
          <Select 
            label="Area of Study" 
            value={formData.areaOfStudy}
            onChange={(val) => setFormData({...formData, areaOfStudy: val})}
            options={['Engineering', 'Design', 'Business', 'Sciences']}
          />
          <Select 
            label="Year of Study" 
            value={formData.yearOfStudy}
            onChange={(val) => setFormData({...formData, yearOfStudy: val})}
            options={['Freshman', 'Sophomore', 'Junior', 'Senior']}
          />
        </div>

        <div className="flex justify-start">
          <Button 
            type="submit" 
            className="bg-isu-dark text-white hover:bg-black px-8 py-2 h-auto text-[11px] font-bold tracking-wide uppercase rounded-lg shadow-none" 
            isLoading={isLoading}
          >
            CONTINUE
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
