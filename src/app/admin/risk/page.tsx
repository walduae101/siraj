"use client";

import { useEffect, useState } from "react";
import type { RiskEvent } from "~/server/services/riskManagement";

type RiskQueueProps = {};

export default function RiskQueuePage(props: RiskQueueProps) {
  const [riskHolds, setRiskHolds] = useState<RiskEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">(
    "all",
  );
  const [selectedHold, setSelectedHold] = useState<RiskEvent | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRiskHolds();
  }, []);

  const fetchRiskHolds = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would be a server action or API call
      const response = await fetch("/api/admin/risk/holds");
      if (response.ok) {
        const data = await response.json();
        setRiskHolds(data.holds);
      }
    } catch (error) {
      console.error("Failed to fetch risk holds:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    holdId: string,
    action: "release" | "reverse" | "ban",
  ) => {
    try {
      setActionLoading(true);
      const response = await fetch("/api/admin/risk/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          holdId,
          action,
          reason: `Admin ${action} action`,
        }),
      });

      if (response.ok) {
        // Refresh the list
        await fetchRiskHolds();
        setSelectedHold(null);
      }
    } catch (error) {
      console.error(`Failed to ${action} risk hold:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const getRiskLevel = (score: number) => {
    if (score >= 70) return "high";
    if (score >= 30) return "medium";
    return "low";
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const filteredHolds = riskHolds.filter((hold) => {
    if (filter === "all") return true;
    const level = getRiskLevel(hold.riskScore);
    return level === filter;
  });

  const exportCSV = () => {
    const headers = [
      "ID",
      "User ID",
      "Event Type",
      "Risk Score",
      "Reasons",
      "Created At",
      "Amount",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredHolds.map((hold) =>
        [
          hold.id,
          hold.uid,
          hold.eventType,
          hold.riskScore,
          hold.riskReasons.join(";"),
          hold.createdAt.toDate().toISOString(),
          hold.metadata.amount || 0,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `risk-holds-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="mb-6 h-8 w-1/4 rounded bg-gray-200" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 rounded bg-gray-200" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-bold text-3xl text-gray-900">Risk Queue</h1>
          <p className="mt-2 text-gray-600">
            Review and manage suspicious transactions and activities
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="font-bold text-2xl text-gray-900">
              {riskHolds.length}
            </div>
            <div className="text-gray-600 text-sm">Total Holds</div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="font-bold text-2xl text-red-600">
              {
                riskHolds.filter((h) => getRiskLevel(h.riskScore) === "high")
                  .length
              }
            </div>
            <div className="text-gray-600 text-sm">High Risk</div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="font-bold text-2xl text-yellow-600">
              {
                riskHolds.filter((h) => getRiskLevel(h.riskScore) === "medium")
                  .length
              }
            </div>
            <div className="text-gray-600 text-sm">Medium Risk</div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow">
            <div className="font-bold text-2xl text-green-600">
              {
                riskHolds.filter((h) => getRiskLevel(h.riskScore) === "low")
                  .length
              }
            </div>
            <div className="text-gray-600 text-sm">Low Risk</div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`rounded px-3 py-1 ${
                  filter === "all"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("high")}
                className={`rounded px-3 py-1 ${
                  filter === "high"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                High Risk
              </button>
              <button
                onClick={() => setFilter("medium")}
                className={`rounded px-3 py-1 ${
                  filter === "medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Medium Risk
              </button>
              <button
                onClick={() => setFilter("low")}
                className={`rounded px-3 py-1 ${
                  filter === "low"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Low Risk
              </button>
            </div>
            <button
              onClick={exportCSV}
              className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Risk Holds List */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Risk Score
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredHolds.map((hold) => {
                  const riskLevel = getRiskLevel(hold.riskScore);
                  return (
                    <tr key={hold.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="font-medium text-gray-900 text-sm">
                          {hold.uid}
                        </div>
                        <div className="text-gray-500 text-sm">
                          {hold.metadata.ip || "No IP"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-gray-900 text-sm capitalize">
                          {hold.eventType.replace("_", " ")}
                        </div>
                        <div className="text-gray-500 text-sm">
                          {hold.metadata.source || "Unknown"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${getRiskLevelColor(riskLevel)}`}
                        >
                          {hold.riskScore}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-gray-900 text-sm">
                        {hold.metadata.amount || 0} points
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-gray-500 text-sm">
                        {hold.createdAt.toDate().toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedHold(hold)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleAction(hold.id, "release")}
                            disabled={actionLoading}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            Release
                          </button>
                          <button
                            onClick={() => handleAction(hold.id, "reverse")}
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            Reverse
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredHolds.length === 0 && (
          <div className="py-12 text-center">
            <div className="text-gray-400 text-lg">No risk holds found</div>
            <div className="mt-2 text-gray-500">
              {filter === "all" ? "All clear!" : `No ${filter} risk holds`}
            </div>
          </div>
        )}
      </div>

      {/* Risk Hold Detail Modal */}
      {selectedHold && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white">
            <div className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <h2 className="font-bold text-gray-900 text-xl">
                  Risk Hold Details
                </h2>
                <button
                  onClick={() => setSelectedHold(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-medium text-gray-700 text-sm">
                    User ID
                  </label>
                  <div className="mt-1 text-gray-900 text-sm">
                    {selectedHold.uid}
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 text-sm">
                    Event Type
                  </label>
                  <div className="mt-1 text-gray-900 text-sm capitalize">
                    {selectedHold.eventType.replace("_", " ")}
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 text-sm">
                    Risk Score
                  </label>
                  <div className="mt-1">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${getRiskLevelColor(getRiskLevel(selectedHold.riskScore))}`}
                    >
                      {selectedHold.riskScore}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 text-sm">
                    Risk Reasons
                  </label>
                  <div className="mt-1">
                    <ul className="list-inside list-disc text-gray-900 text-sm">
                      {selectedHold.riskReasons.map((reason, index) => (
                        <li key={index}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 text-sm">
                    Amount
                  </label>
                  <div className="mt-1 text-gray-900 text-sm">
                    {selectedHold.metadata.amount || 0} points
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 text-sm">
                    IP Address
                  </label>
                  <div className="mt-1 text-gray-900 text-sm">
                    {selectedHold.metadata.ip || "Not available"}
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 text-sm">
                    Created At
                  </label>
                  <div className="mt-1 text-gray-900 text-sm">
                    {selectedHold.createdAt.toDate().toLocaleString()}
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 text-sm">
                    Account Age
                  </label>
                  <div className="mt-1 text-gray-900 text-sm">
                    {selectedHold.metadata.accountAge
                      ? `${selectedHold.metadata.accountAge} minutes`
                      : "Not available"}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => handleAction(selectedHold.id, "release")}
                  disabled={actionLoading}
                  className="flex-1 rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Release
                </button>
                <button
                  onClick={() => handleAction(selectedHold.id, "reverse")}
                  disabled={actionLoading}
                  className="flex-1 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Reverse
                </button>
                <button
                  onClick={() => handleAction(selectedHold.id, "ban")}
                  disabled={actionLoading}
                  className="flex-1 rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  Ban User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

