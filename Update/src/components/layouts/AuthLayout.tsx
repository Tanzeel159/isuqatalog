import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

export function AuthLayout({ children, title, subtitle, className }: { children: React.ReactNode; title?: string; subtitle?: string; className?: string }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden bg-white">
      {/* Gradient Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-isu-cardinal/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-isu-gold/30 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={cn("w-full max-w-[400px] relative z-10", className)}
      >
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center mb-6">
            {/* Minimal Logo */}
            <div className="flex items-center gap-2">
               <span className="text-2xl font-bold tracking-tight text-isu-dark">ISU</span>
               <span className="h-6 w-px bg-gray-200 mx-1"></span>
               <span className="text-2xl font-medium tracking-tight text-gray-500">Qatalog</span>
            </div>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-8">
          {(title || subtitle) && (
            <div className="mb-6">
              {title && <h1 className="text-xl font-semibold text-gray-900 tracking-tight">{title}</h1>}
              {subtitle && <p className="mt-2 text-sm text-gray-500">{subtitle}</p>}
            </div>
          )}
          
          {children}
        </div>
        
        <div className="mt-8 text-center">
           <p className="text-[11px] text-gray-400 font-medium tracking-wide uppercase">
             Iowa State University &bull; Academic Co-pilot
           </p>
        </div>
      </motion.div>
    </div>
  );
}
