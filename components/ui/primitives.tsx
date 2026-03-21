import * as React from "react";
import { cn } from "@/lib/utils";

// Input
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-pikud-gray-light bg-white px-3 py-2 text-sm text-pikud-navy placeholder:text-pikud-gray-mid focus:outline-none focus:ring-2 focus:ring-pikud-navy focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

// Textarea
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-pikud-gray-light bg-white px-3 py-2 text-sm text-pikud-navy placeholder:text-pikud-gray-mid focus:outline-none focus:ring-2 focus:ring-pikud-navy focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

// Label
export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-sm font-medium text-pikud-navy leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
      {...props}
    />
  )
);
Label.displayName = "Label";

// Badge
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "orange" | "warning" | "success" | "destructive";
}
export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-pikud-navy text-white",
    orange: "bg-pikud-orange text-white",
    warning: "bg-amber-100 text-amber-800 border border-amber-300",
    success: "bg-green-100 text-green-800 border border-green-300",
    destructive: "bg-red-100 text-red-800 border border-red-300",
  };
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

// Card
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-pikud-gray-light bg-white shadow-sm", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-semibold text-pikud-navy", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

// Select (native styled)
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-pikud-gray-light bg-white px-3 py-2 text-sm text-pikud-navy focus:outline-none focus:ring-2 focus:ring-pikud-navy focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Select.displayName = "Select";

// Number input
export const NumberInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="number"
      min={0}
      className={cn(
        "flex h-10 w-full rounded-md border border-pikud-gray-light bg-white px-3 py-2 text-sm text-pikud-navy placeholder:text-pikud-gray-mid focus:outline-none focus:ring-2 focus:ring-pikud-navy focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
NumberInput.displayName = "NumberInput";
