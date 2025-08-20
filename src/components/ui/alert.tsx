import type * as React from "react";

export function Alert({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded border border-red-300 bg-red-50 p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
export function AlertTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-1 font-bold">{children}</div>;
}
export function AlertDescription({ children }: { children: React.ReactNode }) {
  return <div className="text-sm">{children}</div>;
}
