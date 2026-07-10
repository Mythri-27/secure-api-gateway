"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import Spinner from "../../components/Spinner";

function Guard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return null;
  return <>{children}</>;
}

export default function AuthenticatedLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>
        <Guard>{children}</Guard>
      </main>
    </>
  );
}
