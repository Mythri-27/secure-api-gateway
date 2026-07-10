"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Badge from "./Badge";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const linkClass = (href) =>
    `text-sm font-medium transition-colors ${
      pathname === href ? "text-indigo-600" : "text-slate-600 hover:text-slate-900"
    }`;

  return (
    <nav className="border-b border-slate-200 bg-white px-6 py-3">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 font-bold text-indigo-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="hidden sm:inline">Secure API Gateway</span>
          <span className="sm:hidden">Gateway</span>
        </Link>

        {/* Nav links */}
        {user && (
          <div className="flex items-center gap-5">
            <Link href="/dashboard" className={linkClass("/dashboard")}>Dashboard</Link>
            {isAdmin && (
              <Link href="/admin" className={linkClass("/admin")}>Admin</Link>
            )}
          </div>
        )}

        {/* User info + logout */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-sm text-slate-500">{user.email}</span>
              <Badge variant={isAdmin ? "admin" : "user"}>{user.role}</Badge>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
