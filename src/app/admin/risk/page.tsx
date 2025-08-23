"use client";

import { useState, useEffect } from "react";
import { RiskEvent } from "~/server/services/riskManagement";

interface RiskQueueProps {
  // Props for server-side data fetching
}

export default function RiskQueuePage(props: RiskQueueProps) {
  const [riskHolds, setRiskHolds] = useState<RiskEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");
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

  const handleAction = async (holdId: string, action: "release" | "reverse" | "ban") => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/risk/action`, {
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

  const filteredHolds = riskHolds.filter(hold => {
    if (filter === "all") return true;
    const level = getRiskLevel(hold.riskScore);
    return level === filter;
  });

  const exportCSV = () => {
    const headers = ["ID", "User ID", "Event Type", "Risk Score", "Reasons", "Created At", "Amount"];
    const csvContent = [
      headers.join(","),
      ...filteredHolds.map(hold => [
        hold.id,
        hold.uid,
        hold.eventType,
        hold.riskScore,
        hold.riskReasons.join(";"),
        hold.createdAt.toDate().toISOString(),
        hold.metadata.amount || 0,
      ].join(","))
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
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Risk Queue</h1>
          <p className="text-gray-600 mt-2">
            Review and manage suspicious transactions and activities
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{riskHolds.length}</div>
            <div className="text-sm text-gray-600">Total Holds</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">
              {riskHolds.filter(h => getRiskLevel(h.riskScore) === "high").length}
            </div>
            <div className="text-sm text-gray-600">High Risk</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">
              {riskHolds.filter(h => getRiskLevel(h.riskScore) === "medium").length}
            </div>
            <div className="text-sm text-gray-600">Medium Risk</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {riskHolds.filter(h => getRiskLevel(h.riskScore) === "low").length}
            </div>
            <div className="text-sm text-gray-600">Low Risk</div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded ${
                  filter === "all" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("high")}
                className={`px-3 py-1 rounded ${
                  filter === "high" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                }`}
              >
                High Risk
              </button>
              <button
                onClick={() => setFilter("medium")}
                className={`px-3 py-1 rounded ${
                  filter === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"
                }`}
              >
                Medium Risk
              </button>
              <button
                onClick={() => setFilter("low")}
                className={`px-3 py-1 rounded ${
                  filter === "low" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                }`}
              >
                Low Risk
              </button>
            </div>
            <button
              onClick={exportCSV}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Risk Holds List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHolds.map((hold) => {
                  const riskLevel = getRiskLevel(hold.riskScore);
                  return (
                    <tr key={hold.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{hold.uid}</div>
                        <div className="text-sm text-gray-500">
                          {hold.metadata.ip || "No IP"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">
                          {hold.eventType.replace("_", " ")}
                        </div>
                        <div className="text-sm text-gray-500">
                          {hold.metadata.source || "Unknown"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(riskLevel)}`}>
                          {hold.riskScore}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {hold.metadata.amount || 0} points
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {hold.createdAt.toDate().toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">No risk holds found</div>
            <div className="text-gray-500 mt-2">
              {filter === "all" ? "All clear!" : `No ${filter} risk holds`}
            </div>
          </div>
        )}
      </div>

      {/* Risk Hold Detail Modal */}
      {selectedHold && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">Risk Hold Details</h2>
                <button
                  onClick={() => setSelectedHold(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">User ID</label>
                  <div className="mt-1 text-sm text-gray-900">{selectedHold.uid}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Event Type</label>
                  <div className="mt-1 text-sm text-gray-900 capitalize">
                    {selectedHold.eventType.replace("_", " ")}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Risk Score</label>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(getRiskLevel(selectedHold.riskScore))}`}>
                      {selectedHold.riskScore}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Risk Reasons</label>
                  <div className="mt-1">
                    <ul className="list-disc list-inside text-sm text-gray-900">
                      {selectedHold.riskReasons.map((reason, index) => (
                        <li key={index}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {selectedHold.metadata.amount || 0} points
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">IP Address</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {selectedHold.metadata.ip || "Not available"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Created At</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {selectedHold.createdAt.toDate().toLocaleString()}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Age</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {selectedHold.metadata.accountAge ? `${selectedHold.metadata.accountAge} minutes` : "Not available"}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => handleAction(selectedHold.id, "release")}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Release
                </button>
                <button
                  onClick={() => handleAction(selectedHold.id, "reverse")}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Reverse
                </button>
                <button
                  onClick={() => handleAction(selectedHold.id, "ban")}
                  disabled={actionLoading}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
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
