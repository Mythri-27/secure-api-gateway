import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-7xl font-extrabold text-indigo-100">404</p>
      <h1 className="text-2xl font-bold text-slate-800">Page not found</h1>
      <p className="text-sm text-slate-500">That route doesn&apos;t exist.</p>
      <Link
        href="/"
        className="mt-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
      >
        Go home
      </Link>
    </div>
  );
}
