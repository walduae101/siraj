import * as React from "react";

export function Table({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return <table className="min-w-full divide-y divide-gray-200" {...props}>{children}</table>;
}
export function TableHeader({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className="bg-gray-50" {...props}>{children}</thead>;
}
export function TableRow({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr {...props}>{children}</tr>;
}
export function TableHead({ children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props}>{children}</th>;
}
export function TableBody({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className="bg-white divide-y divide-gray-200" {...props}>{children}</tbody>;
}
export function TableCell({ children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className="px-6 py-4 whitespace-nowrap" {...props}>{children}</td>;
}
