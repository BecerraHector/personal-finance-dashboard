import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-black/10 bg-[--surface-1] p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-[#2a78d6] text-white hover:bg-[#1c5cab] disabled:opacity-50",
    ghost: "text-[--ink-secondary] hover:bg-black/5",
    danger: "text-[#d03b3b] hover:bg-[#d03b3b]/10",
  }[variant];
  return (
    <button
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${styles} ${className}`}
      {...props}
    />
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-[--gridline] bg-white px-3 py-2 text-sm outline-none focus:border-[#2a78d6] focus:ring-2 focus:ring-[#2a78d6]/20 ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-lg border border-[--gridline] bg-white px-3 py-2 text-sm outline-none focus:border-[#2a78d6] focus:ring-2 focus:ring-[#2a78d6]/20 ${className}`}
      {...props}
    />
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-[--ink-secondary]">{label}</span>
      {children}
    </label>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="text-sm text-[#d03b3b]">{children}</p>;
}
