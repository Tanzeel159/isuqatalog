import * as React from 'react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'draw-outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-isu-cardinal text-white hover:bg-[#A60C26] shadow-sm border border-transparent',
      secondary: 'bg-isu-gold text-isu-dark hover:bg-[#E0AC30] shadow-sm border border-transparent',
      outline: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300',
      ghost: 'hover:bg-gray-100 text-gray-600 hover:text-gray-900',
      link: 'text-isu-cardinal hover:text-[#A60C26] underline-offset-4 hover:underline p-0 h-auto font-normal',
      'draw-outline': 'group relative text-gray-500 hover:text-isu-cardinal transition-colors duration-[400ms] bg-transparent rounded-none',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    };

    const isDrawOutline = variant === 'draw-outline';

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-isu-cardinal/20 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          // Override rounded-full for draw-outline to ensure lines meet at corners
          isDrawOutline && 'rounded-none',
          className
        )}
        disabled={isLoading || props.disabled}
        {...(props as any)}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            children
          )}
        </span>

        {isDrawOutline && (
          <>
            {/* TOP */}
            <span className="absolute left-0 top-0 h-[2px] w-0 bg-gradient-to-r from-isu-cardinal to-isu-gold transition-all duration-300 ease-in-out group-hover:w-full" />

            {/* RIGHT */}
            <span className="absolute right-0 top-0 h-0 w-[2px] bg-gradient-to-b from-isu-gold to-isu-cardinal transition-all delay-300 duration-300 ease-in-out group-hover:h-full" />

            {/* BOTTOM */}
            <span className="absolute bottom-0 right-0 h-[2px] w-0 bg-gradient-to-l from-isu-cardinal to-isu-gold transition-all delay-[600ms] duration-300 ease-in-out group-hover:w-full" />

            {/* LEFT */}
            <span className="absolute bottom-0 left-0 h-0 w-[2px] bg-gradient-to-t from-isu-gold to-isu-cardinal transition-all delay-[900ms] duration-300 ease-in-out group-hover:h-full" />
          </>
        )}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
