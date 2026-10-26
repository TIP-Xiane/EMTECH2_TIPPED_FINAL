import StatusBadge from "../common/StatusBadge";
import { Button } from "../common/UI";
import { dateLabel } from "../../utils/format";
export default function ReportRow({
  report: r,
  onView,
  actions,
  history = false,
}) {
  const expired = Date.now() >= Date.parse(r.expiresAt);
  const moderationStyle =
    {
      "Pending Review": "pending",
      Approved: "approved",
      Rejected: "rejected",
    }[r.moderation] || "pending";
  return (
    <article
      className={`report-row report-row-${moderationStyle} grid min-w-0 gap-3 border-b border-line bg-white px-5 py-5 last:border-b-0 ${actions ? "min-[1100px]:grid-cols-[1.3fr_1fr_1fr]" : "min-[760px]:grid-cols-[1.7fr_1fr_1fr_auto]"} items-center`}
      aria-label={`${r.title} report`}
    >
      <div className="min-w-0">
        <h3 className="break-words text-sm font-bold">{r.title}</h3>
        <p className="my-2 break-all text-xs text-muted">{r.id}</p>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={r.type} />
          <StatusBadge status={r.moderation} />
          {r.outcome !== "Open" && <StatusBadge status={r.outcome} />}
        </div>
        {history && r.reason && (
          <p className="mt-2 text-xs text-rose-800">OSA: {r.reason}</p>
        )}
      </div>
      <div className="text-xs leading-6">
        <p className="break-words">
          {r.site === "Other" ? r.siteDetail || "Other location" : r.site}
        </p>
        <p className="break-words text-muted">{r.location}</p>
        {r.type === "Found" && <p>{r.custody}</p>}
      </div>
      <div className="text-xs leading-6 text-muted">
        <p>{dateLabel(r.itemDate)} · item date</p>
        <p>
          {expired
            ? "Listing expired · history retained"
            : `Expires ${dateLabel(r.expiresAt)} · ${r.validDays} days`}
        </p>
      </div>
      <div
        className={`report-row-controls ${actions ? "has-review-actions min-[1100px]:col-span-3" : ""}`}
      >
        <Button
          variant="secondary"
          className="report-view-button"
          onClick={() => onView(r.id)}
        >
          View report →
        </Button>
        {actions && (
          <div className="report-row-decision-actions">{actions}</div>
        )}
      </div>
    </article>
  );
}
