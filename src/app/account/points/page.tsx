import { features } from '~/config/features';
import { WalletWidget } from '~/components/points/WalletWidget';
import { LedgerTable } from '~/components/points/LedgerTable';

export const metadata = { title: 'Points | الحساب' };

export default function PointsPage() {
  const on = features.pointsClient;
  // TODO: Replace 'me' with actual user UID from auth context/session
  const uid = 'me';
  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">النقاط · Points</h1>
        <p className="text-sm opacity-70">
          {on ? 'سجل رصيدك وحركاتك، بكل شفافية.' : 'النقاط غير مفعلة في هذه البيئة.'}
        </p>
      </div>
      <WalletWidget uid={uid} />
      {on && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">السجل · Ledger</h2>
          <LedgerTable uid={uid} pageSize={20} />
        </section>
      )}
    </div>
  );
}
