import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getServerUser } from '~/server/auth/getServerUser';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getServerUser();
  if (!user) redirect('/login');
  return <>{children}</>;
}
