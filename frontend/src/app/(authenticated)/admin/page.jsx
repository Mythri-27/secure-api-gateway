"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import Card from "../../../components/Card";
import Badge from "../../../components/Badge";
import Alert from "../../../components/Alert";
import Spinner from "../../../components/Spinner";

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value ?? "—"}</span>
    </div>
  );
}

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();

  const [data,    setData]    = useState(null);
  const [health,  setHealth]  = useState(null);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(true);

  // Redirect non-admin users
  useEffect(() => {
    if (user && !isAdmin) router.replace("/dashboard");
  }, [user, isAdmin, router]);

  const fetchData = useCallback(async () => {
    setError("");
    try {
      const [adminRes, healthRes] = await Promise.all([
        api.get("/protected/admin"),
        api.get("/test/health/ready"),
      ]);
      setData(adminRes.data);
      setHealth(healthRes.data);
    } catch (err) {
      setError(
        err.response?.status === 403
          ? "Access denied. Admin role required."
          : err.response?.data?.error || "Failed to load admin data."
      );
    } finally {
      setLoading(false);
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
          <svg className="h-5 w-5 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
          <p className="text-sm text-slate-500">Restricted to admin role only</p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {!error && (
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Identity */}
          <Card title="Admin Identity">
            <InfoRow label="User ID" value={<span className="font-mono text-xs">{user?.id}</span>} />
            <InfoRow label="Email"   value={user?.email} />
            <InfoRow label="Role"    value={<Badge variant="admin">{user?.role}</Badge>} />
            <InfoRow label="Access"  value={data ? <Badge variant="success">Granted</Badge> : <Badge variant="danger">Denied</Badge>} />
          </Card>

          {/* System health */}
          <Card title="System Health">
            {health ? (
              <>
                <InfoRow label="Gateway" value={<Badge variant="success">Online</Badge>} />
                <InfoRow
                  label="Redis"
                  value={
                    health.redis === "ok"
                      ? <Badge variant="success">Connected</Badge>
                      : <Badge variant="danger">Unavailable</Badge>
                  }
                />
                <InfoRow
                  label="Status"
                  value={<Badge variant={health.status === "ready" ? "success" : "warning"}>{health.status}</Badge>}
                />
              </>
            ) : (
              <p className="text-sm text-slate-400">Health data unavailable</p>
            )}
          </Card>
        </div>
      )}

      {data && (
        <Card title="Raw API Response — /api/protected/admin">
          <pre className="overflow-x-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-700">
            {JSON.stringify(data, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}
