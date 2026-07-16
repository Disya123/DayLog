import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helper, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--color-text)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-11 w-full rounded-xl border bg-[var(--color-surface)] px-4 text-sm',
            'text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)]',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]/20'
              : 'border-[var(--color-border-strong)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent)]/20',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
        {helper && !error && (
          <p className="text-xs text-[var(--color-text-subtle)]">{helper}</p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';
