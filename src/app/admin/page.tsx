"use client";

import { getApps, initializeApp } from "firebase/app";
import { type User, getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { api } from "~/trpc/react";

// guarded init for client
function getClientAuthSafely() {
  const cfg = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
  if (!cfg.apiKey || !cfg.authDomain || !cfg.projectId || !cfg.appId)
    return null;
  const app = getApps()[0] ?? initializeApp(cfg);
  return getAuth(app);
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState<{
    uid: string;
    email: string;
    displayName?: string;
    createdAt: string;
  } | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  const auth = getClientAuthSafely();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ?? null);
      setLoading(false);
    });
    return () => unsub();
  }, [auth]);

  // Search user
  const searchUser = api.admin.searchUser.useQuery(
    { email: searchEmail },
    { enabled: false },
  );

  // Get user wallet and ledger
  const userWallet = api.admin.getUserWallet.useQuery(
    { uid: selectedUser?.uid ?? "", limit: 50 },
    { enabled: !!selectedUser?.uid },
  );

  // Manual adjustment mutation
  const adjustWallet = api.admin.adjustWallet.useMutation({
    onSuccess: () => {
      toast.success("Wallet adjusted successfully");
      setAdjustmentAmount("");
      setAdjustmentReason("");
      userWallet.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to adjust wallet: ${error.message}`);
    },
  });

  // Products and promotions
  const products = api.admin.getProducts.useQuery();
  const promotions = api.admin.getPromotions.useQuery();

  // Early returns after all hooks
  if (!auth) {
    return (
      <div className="container mx-auto p-6">
        Firebase client config missing or invalid.
      </div>
    );
  }

  if (loading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        Please sign in to access admin panel.
      </div>
    );
  }

  const handleSearch = () => {
    if (searchEmail) {
      searchUser.refetch();
    }
  };

  const handleAdjustment = () => {
    if (!selectedUser?.uid || !adjustmentAmount || !adjustmentReason) {
      toast.error("Please fill in all fields");
      return;
    }

    const amount = Number.parseFloat(adjustmentAmount);
    if (Number.isNaN(amount) || amount === 0) {
      toast.error("Please enter a valid non-zero amount");
      return;
    }

    adjustWallet.mutate({
      uid: selectedUser.uid,
      amount,
      reason: adjustmentReason,
    });
  };

  const exportLedger = async () => {
    if (!selectedUser?.uid) return;

    try {
      const data = await fetch(
        `/api/trpc/admin.exportLedger?input=${encodeURIComponent(JSON.stringify({ uid: selectedUser.uid, limit: 1000 }))}`,
      ).then((r) => r.json());
      const ledgerData = data.result?.data || [];
      const csv = [
        [
          "ID",
          "Created At",
          "Kind",
          "Amount",
          "Balance After",
          "Currency",
          "Order ID",
          "Product ID",
          "Product Version",
          "Reversal Of",
          "Reason",
          "Created By",
        ],
        ...ledgerData.map((entry: any) => [
          entry.id,
          entry.createdAt,
          entry.kind,
          entry.amount,
          entry.balanceAfter,
          entry.currency,
          entry.orderId,
          entry.productId,
          entry.productVersion,
          entry.reversalOf,
          entry.reason,
          entry.createdBy,
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ledger_${selectedUser.uid}_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export ledger:", error);
      alert("Failed to export ledger");
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-3xl">Admin Panel</h1>
        <Badge variant="outline">Admin</Badge>
      </div>

      {/* User Search */}
      <Card>
        <CardHeader>
          <CardTitle>User Search</CardTitle>
          <CardDescription>
            Search for a user by email to view their wallet and ledger
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter user email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={searchUser.isLoading}>
              {searchUser.isLoading ? "Searching..." : "Search"}
            </Button>
          </div>

          {searchUser.error && (
            <div className="text-red-500 text-sm">
              {searchUser.error.message}
            </div>
          )}

          {searchUser.data && (
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-semibold">User Found:</h3>
              <p>
                <strong>UID:</strong> {searchUser.data.uid}
              </p>
              <p>
                <strong>Email:</strong> {searchUser.data.email}
              </p>
              <p>
                <strong>Display Name:</strong>{" "}
                {searchUser.data.displayName || "N/A"}
              </p>
              <p>
                <strong>Created:</strong>{" "}
                {new Date(searchUser.data.createdAt).toLocaleString()}
              </p>
              <Button
                onClick={() =>
                  setSelectedUser({
                    uid: searchUser.data.uid,
                    email: searchUser.data.email || "",
                    displayName: searchUser.data.displayName,
                    createdAt: searchUser.data.createdAt,
                  })
                }
                className="mt-2"
              >
                View Wallet & Ledger
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected User Wallet */}
      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle>Wallet & Ledger - {selectedUser.email}</CardTitle>
            <CardDescription>
              Current balance and transaction history
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Wallet Balance */}
            {userWallet.data?.wallet && (
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">Current Balance</h3>
                <div className="font-bold text-2xl">
                  {userWallet.data.wallet.paidBalance} Points
                </div>
                <p className="text-gray-500 text-sm">
                  Last updated:{" "}
                  {userWallet.data.wallet.updatedAt.toDate().toLocaleString()}
                </p>
              </div>
            )}

            {/* Manual Adjustment */}
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 font-semibold">Manual Adjustment</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount (+/-)"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Input
                    id="reason"
                    placeholder="Reason for adjustment"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleAdjustment}
                    disabled={adjustWallet.isPending}
                    className="w-full"
                  >
                    {adjustWallet.isPending ? "Processing..." : "Adjust Wallet"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Export */}
            <div className="flex justify-end">
              <Button onClick={exportLedger} variant="outline">
                Export Ledger (CSV)
              </Button>
            </div>

            {/* Ledger Entries */}
            <div>
              <h3 className="mb-4 font-semibold">Recent Transactions</h3>
              {userWallet.isLoading ? (
                <div>Loading ledger...</div>
              ) : userWallet.data?.ledger ? (
                <div className="space-y-2">
                  {userWallet.data.ledger.map((entry) => (
                    <div key={entry.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">
                            {entry.kind.replace("_", " ").toUpperCase()}
                          </div>
                          <div className="text-gray-500 text-sm">
                            {entry.createdAt.toDate().toLocaleString()}
                          </div>
                          {entry.source.reason && (
                            <div className="text-gray-600 text-sm">
                              Reason: {entry.source.reason}
                            </div>
                          )}
                          {entry.source.orderId && (
                            <div className="text-gray-600 text-sm">
                              Order: {entry.source.orderId}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-bold ${entry.amount >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {entry.amount >= 0 ? "+" : ""}
                            {entry.amount} Points
                          </div>
                          <div className="text-gray-500 text-sm">
                            Balance: {entry.balanceAfter}
                          </div>
                        </div>
                      </div>
                      {entry.source.reversalOf && (
                        <div className="mt-2 text-blue-600 text-sm">
                          Reversal of: {entry.source.reversalOf}
                        </div>
                      )}
                    </div>
                  ))}
                  {userWallet.data.hasMore && (
                    <Button
                      onClick={() => userWallet.refetch()}
                      variant="outline"
                      className="w-full"
                    >
                      Load More
                    </Button>
                  )}
                </div>
              ) : (
                <div>No ledger entries found.</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products */}
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>Active products in the catalog</CardDescription>
        </CardHeader>
        <CardContent>
          {products.isLoading ? (
            <div>Loading products...</div>
          ) : products.data ? (
            <div className="space-y-2">
              {products.data.map((product) => (
                <div key={product.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{product.title}</div>
                      <div className="text-gray-500 text-sm">
                        {product.points} points • ${product.priceUSD} •{" "}
                        {product.type}
                      </div>
                    </div>
                    <Badge variant={product.active ? "default" : "secondary"}>
                      {product.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>No products found.</div>
          )}
        </CardContent>
      </Card>

      {/* Promotions */}
      <Card>
        <CardHeader>
          <CardTitle>Promotions</CardTitle>
          <CardDescription>Active promotions</CardDescription>
        </CardHeader>
        <CardContent>
          {promotions.isLoading ? (
            <div>Loading promotions...</div>
          ) : promotions.data ? (
            <div className="space-y-2">
              {promotions.data.map((promotion) => (
                <div key={promotion.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Code: {promotion.code}</div>
                      <div className="text-gray-500 text-sm">
                        {promotion.discountPercent
                          ? `${promotion.discountPercent}% off`
                          : `${promotion.bonusPoints} bonus points`}
                      </div>
                      <div className="text-gray-500 text-sm">
                        Usage: {promotion.usageCount}/{promotion.usageLimit}
                      </div>
                    </div>
                    <Badge variant={promotion.active ? "default" : "secondary"}>
                      {promotion.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>No promotions found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
