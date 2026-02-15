import { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'border border-border text-text-primary hover:bg-bg-elevated disabled:opacity-50 disabled:cursor-not-allowed',
  ghost:
    'text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-50 disabled:cursor-not-allowed',
};

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
