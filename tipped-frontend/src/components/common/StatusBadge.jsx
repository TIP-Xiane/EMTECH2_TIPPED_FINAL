export default function StatusBadge({ status }) {
  const color = ["Approved", "Verified", "In Custody", "Found"].includes(status)
    ? "bg-emerald-50 text-emerald-800"
    : ["Rejected", "Lost"].includes(status)
      ? "bg-rose-50 text-rose-800"
      : ["Pending Review", "Awaiting Turnover"].includes(status)
        ? "bg-amber-50 text-amber-900"
        : "bg-slate-100 text-slate-700";
  return (
    <span
      className={`inline-block rounded px-2 py-1 text-xs font-semibold ${color}`}
    >
      {status}
    </span>
  );
}
