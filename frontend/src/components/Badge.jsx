const STYLES = {
  admin:   "bg-purple-100 text-purple-800 ring-purple-200",
  user:    "bg-blue-100 text-blue-800 ring-blue-200",
  success: "bg-green-100 text-green-800 ring-green-200",
  warning: "bg-yellow-100 text-yellow-800 ring-yellow-200",
  danger:  "bg-red-100 text-red-800 ring-red-200",
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
};

export default function Badge({ variant = "neutral", children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STYLES[variant]}`}>
      {children}
    </span>
  );
}
