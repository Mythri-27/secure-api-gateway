"use client";

import { useState, useEffect, useCallback } from "react";
import api from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import Card from "../../../components/Card";
import Badge from "../../../components/Badge";
import Alert from "../../../components/Alert";
import Spinner from "../../../components/Spinner";

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value ?? "—"}</span>
    </div>
  );
}

function RateLimitBar({ count, max }) {
  const pct   = Math.min(100, Math.round((count / max) * 100));
  const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs text-slate-500">
        <span>{count} used</span>
        <span>{max - count} remaining</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-right text-xs text-slate-400">{pct}% of limit used</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [profile,    setProfile]    = useState(null);
  const [rateStatus, setRateStatus] = useState(null);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError("");
    try {
      const [profileRes, rateRes] = await Promise.all([
        api.get("/protected/profile"),
        api.get("/protected/rate-status"),
      ]);
      setProfile(profileRes.data);
      setRateStatus(rateRes.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Welcome back, {user?.email}</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <svg className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-6 sm:grid-cols-2">
        <Card title="Your Profile">
          <StatRow label="User ID"    value={<span className="font-mono text-xs">{user?.id}</span>} />
          <StatRow label="Email"      value={user?.email} />
          <StatRow label="Role"       value={<Badge variant={user?.role === "admin" ? "admin" : "user"}>{user?.role}</Badge>} />
          <StatRow label="Request ID" value={<span className="max-w-[180px] truncate font-mono text-xs">{profile?.requestId}</span>} />
        </Card>

        <Card title="Rate Limit">
          {rateStatus ? (
            <div className="space-y-4">
              <RateLimitBar count={rateStatus.requestsThisWindow} max={rateStatus.rateLimit?.max || 100} />
              <StatRow label="Your IP"              value={<span className="font-mono text-xs">{rateStatus.ip}</span>} />
              <StatRow label="Requests this window" value={rateStatus.requestsThisWindow} />
              <StatRow label="Window limit"         value={rateStatus.rateLimit?.max} />
              <StatRow
                label="Resets in"
                value={rateStatus.windowResetsInSeconds > 0 ? `${rateStatus.windowResetsInSeconds}s` : "Now"}
              />
            </div>
          ) : (
            <p className="text-sm text-slate-400">No data</p>
          )}
        </Card>
      </div>

      <Card title="Raw API Response — /api/protected/profile">
        <pre className="overflow-x-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-700">
          {JSON.stringify(profile, null, 2)}
        </pre>
      </Card>
    </div>
  );
}