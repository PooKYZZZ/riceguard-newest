import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const cardVariants = cva(
  'bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all duration-200 ease-in-out',
  {
    variants: {
      variant: {
        default: 'hover:shadow-xl hover:-translate-y-1',
        elevated: 'shadow-xl hover:shadow-2xl hover:-translate-y-2',
        outlined: 'border-2 border-gray-200 hover:border-rice-primary-300',
        glass: 'glass backdrop-blur-lg border-white/30 hover:bg-white/30',
        success: 'border-l-4 border-l-green-500 bg-green-50/50',
        warning: 'border-l-4 border-l-amber-500 bg-amber-50/50',
        error: 'border-l-4 border-l-red-500 bg-red-50/50',
        info: 'border-l-4 border-l-blue-500 bg-blue-50/50',
      },
      size: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
      interactive: {
        true: 'cursor-pointer active:scale-[0.98]',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      interactive: false,
    },
  }
);

const DashboardCard = React.forwardRef(({
  className,
  variant,
  size,
  interactive,
  children,
  onClick,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, size, interactive }), className)}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
      {...props}
    >
      {children}
    </div>
  );
});

DashboardCard.displayName = 'DashboardCard';

export { DashboardCard, cardVariants };