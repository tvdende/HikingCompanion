import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'default' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', type = 'button', disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24583d] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer leading-none text-center [&>svg]:shrink-0';

    const variants = {
      primary:
        'bg-[#24583d] hover:bg-[#1b4332] active:bg-[#143225] text-white shadow-xs border border-transparent',
      secondary:
        'bg-white hover:bg-[#f4f3ef] active:bg-[#eae8e1] text-[#1b261e] border border-[#d5d2c8] shadow-xs',
      outline:
        'bg-transparent hover:bg-[#24583d]/10 text-[#24583d] border border-[#24583d]/40',
      ghost:
        'bg-transparent hover:bg-black/5 text-[#1b261e]',
      danger:
        'bg-[#b91c1c] hover:bg-[#991b1b] active:bg-[#7f1d1d] text-white border border-transparent shadow-xs',
    };

    const sizes = {
      sm: 'h-8 px-3.5 text-xs',
      default: 'h-9 px-5 text-sm',
      lg: 'h-12 px-8 text-base font-bold',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
