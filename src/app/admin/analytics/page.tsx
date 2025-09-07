import { requireAdmin } from '~/server/auth/admin';
import AdminAnalyticsClient from './AdminAnalyticsClient';

export const runtime = 'nodejs';

export default async function AdminAnalyticsPage() {
  try {
    const admin = await requireAdmin();
    return <AdminAnalyticsClient admin={admin} />;
  } catch (error) {
    return (
      <main className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Admin access required to view this page.</p>
        </div>
      </main>
    );
  }
}