import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  children: ReactNode;
}

function Button({
  variant = "primary",
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "font-extrabold uppercase tracking-wide rounded-2xl transition-all active:translate-y-1";

  const variants = {
    primary: disabled
      ? "bg-yellow-200 text-yellow-400 border-b-4 border-yellow-300 cursor-not-allowed"
      : "bg-yellow-400 text-neutral-800 border-b-4 border-yellow-600 hover:brightness-105 active:border-b-0",
    secondary: disabled
      ? "bg-white/30 text-white/40 border-b-4 border-white/20 cursor-not-allowed"
      : "bg-white text-neutral-800 border-b-4 border-neutral-300 hover:brightness-95 active:border-b-0",
  };

  return (
    <button
      disabled={disabled}
      className={`${base} ${variants[variant]} px-6 py-3 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
