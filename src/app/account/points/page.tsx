"use client";
import { useFirebaseUser } from "~/components/auth/useFirebaseUser";
import { LedgerTable } from "~/components/points/LedgerTable";
import { WalletWidget } from "~/components/points/WalletWidget";
import { features } from "~/config/features";

export default function PointsPage() {
  const { user } = useFirebaseUser();
  const on = features.pointsClient;

  if (!user?.uid) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <p className="text-center opacity-70">
          الرجاء تسجيل الدخول · Please sign in
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div className="space-y-1">
        <h1 className="font-semibold text-2xl">النقاط · Points</h1>
        <p className="text-sm opacity-70">
          {on
            ? "سجل رصيدك وحركاتك، بكل شفافية."
            : "النقاط غير مفعلة في هذه البيئة."}
        </p>
      </div>
      <WalletWidget />
      {on && (
        <section className="space-y-3">
          <h2 className="font-medium text-lg">السجل · Ledger</h2>
          <LedgerTable uid={user.uid} pageSize={20} />
        </section>
      )}
    </div>
  );
}

