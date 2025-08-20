"use client";
import { features } from '~/config/features';
import { WalletWidget } from '~/components/points/WalletWidget';
import { LedgerTable } from '~/components/points/LedgerTable';
import { useFirebaseUser } from '~/components/auth/useFirebaseUser';

export default function PointsPage() {
  const { user } = useFirebaseUser();
  const on = features.pointsClient;
  
  if (!user?.uid) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <p className="text-center opacity-70">الرجاء تسجيل الدخول · Please sign in</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">النقاط · Points</h1>
        <p className="text-sm opacity-70">
          {on ? 'سجل رصيدك وحركاتك، بكل شفافية.' : 'النقاط غير مفعلة في هذه البيئة.'}
        </p>
      </div>
      <WalletWidget />
      {on && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">السجل · Ledger</h2>
          <LedgerTable uid={user.uid} pageSize={20} />
        </section>
      )}
    </div>
  );
}
