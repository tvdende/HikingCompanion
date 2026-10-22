import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'destructive';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[#eaf3ed] text-[#24583d] border border-[#cbe4d4]',
    secondary: 'bg-[#eeece6] text-[#4a554e] border border-[#dfdcd3]',
    outline: 'border border-[#d5d2c8] text-[#1b261e] bg-white',
    success: 'bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]',
    destructive: 'bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca]',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none select-none',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
