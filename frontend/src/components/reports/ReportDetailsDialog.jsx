import ConfirmDialog from "../common/ConfirmDialog";
import StatusBadge from "../common/StatusBadge";
import { Button } from "../common/UI";
import { dateLabel, timeLabel } from "../../utils/format";
import { osaCanAccess } from "../../utils/reportRules";
export default function ReportDetailsDialog({
  report: r,
  user,
  events = [],
  onClose,
  onClaim,
  onRecover,
}) {
  const own = r.reporterId === user.id,
    permitted = own || osaCanAccess(user, r);
  const claimEligible =
    user.role === "student" &&
    !own &&
    r.type === "Found" &&
    r.moderation === "Approved" &&
    r.outcome === "Open" &&
    Date.parse(r.expiresAt) > Date.now();
  return (
    <ConfirmDialog title={r.title} onClose={onClose}>
      <p className="text-xs text-muted">
        {r.id} · {r.type} report
      </p>
      <div className="my-5 grid gap-2 sm:grid-cols-3">
        {[
          ["Moderation", r.moderation],
          ["Physical custody", r.custody],
          ["Outcome", r.outcome],
        ].map(([l, v]) => (
          <div key={l} className="rounded bg-slate-50 p-3">
            <p className="mb-2 text-xs text-muted">{l}</p>
            <StatusBadge status={v} />
          </div>
        ))}
      </div>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        {[
          [
            "Site",
            r.site === "Other" ? r.siteDetail || "Other location" : r.site,
          ],
          ["Location", r.location],
          ["Category", r.category],
          ["Item date", dateLabel(r.itemDate)],
          [
            "Listing expiry",
            r.expiresAt ? timeLabel(r.expiresAt) : "Not configured",
          ],
        ].map(([l, v]) => (
          <div key={l}>
            <dt className="text-xs text-muted">{l}</dt>
            <dd className="mt-1 break-words">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 break-words leading-7 text-muted">{r.description}</p>
      <section className="my-5">
        <h3 className="mb-3 font-bold">Item photo</h3>
        {r.image && (permitted || r.publicPhoto) ? (
          <>
            <img
              src={r.image}
              alt={`Photo of ${r.title}`}
              className="max-h-80 w-full rounded border border-line bg-canvas object-contain"
            />
            <p className="mt-2 text-xs text-muted">
              {r.publicPhoto
                ? "Reviewed listing photo"
                : "Private submitted photo · awaiting public-photo review"}
            </p>
          </>
        ) : (
          <div className="rounded border border-dashed border-slate-300 bg-canvas p-6 text-center text-muted">
            {r.image
              ? "Photo awaiting OSA permission for public display."
              : "No photo was uploaded for this report."}
          </div>
        )}
      </section>
      {permitted && r.reason && (
        <p className="notice">OSA reason: {r.reason}</p>
      )}
      {permitted && (
        <section>
          <h3 className="mt-5 font-bold">Case history</h3>
          <ul className="divide-y divide-line">
            {events
              .filter((e) => e.reportId === r.id && !e.private)
              .map((e) => (
                <li key={e.id} className="py-3 text-xs leading-6">
                  <strong>{e.action}</strong>
                  <p>{e.remarks}</p>
                  <small className="text-muted">
                    {e.actorName} · {timeLabel(e.at)}
                  </small>
                </li>
              ))}
          </ul>
        </section>
      )}
      <div className="my-4 flex flex-wrap gap-3">
        {claimEligible && (
          <Button onClick={() => onClaim(r.id)}>Request Claim</Button>
        )}
        {own &&
          user.role === "student" &&
          r.type === "Lost" &&
          r.moderation === "Approved" &&
          r.outcome === "Open" && (
            <Button onClick={() => onRecover(r.id)}>Mark recovered</Button>
          )}
      </div>
      {r.type === "Found" && (
        <p className="notice">
          Listing approval is not proof of custody. Ownership verification and
          physical release are separate. Confirm pickup arrangements with the
          receiving office.
        </p>
      )}
    </ConfirmDialog>
  );
}
