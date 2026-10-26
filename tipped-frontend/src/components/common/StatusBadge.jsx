export default function StatusBadge({ status }) {
  const color = ["Pending Review", "Awaiting Turnover"].includes(status)
    ? "status-pending"
    : status === "Rejected"
      ? "status-rejected"
      : [
            "Approved",
            "Verified",
            "In Custody",
            "Released",
            "Returned",
            "Recovered",
          ].includes(status)
        ? "status-complete"
        : status === "Found"
          ? "status-found"
          : status === "Lost"
            ? "status-lost"
            : "status-neutral";
  return <span className={`status-badge ${color}`}>{status}</span>;
}
