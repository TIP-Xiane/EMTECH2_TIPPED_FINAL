import { useState } from "react";
import ConfirmDialog from "../common/ConfirmDialog";
import StatusBadge from "../common/StatusBadge";
import { Button } from "../common/UI";
import { useReports } from "../../context/ReportContext";
import { dateLabel } from "../../utils/format";
export default function ReportReviewDialog({
  report: r,
  onClose,
  onModerate,
  onReceipt,
  onSuccess,
}) {
  const { act } = useReports(),
    [publicPhoto, setPublicPhoto] = useState(r.publicPhoto),
    [error, setError] = useState("");
  return (
    <ConfirmDialog title="OSA report review" onClose={onClose}>
      <p className="text-xs text-muted">
        {r.id} ·{" "}
        {r.site === "Other" ? r.siteDetail || "Other location" : r.site}
      </p>
      <h3 className="my-4 text-lg font-bold">{r.title}</h3>
      <div className="mb-4 flex flex-wrap gap-2">
        <StatusBadge status={r.moderation} />
        <StatusBadge status={r.custody} />
        <StatusBadge status={r.outcome} />
      </div>
      <p className="text-xs text-muted">
        {r.category} · {r.location} · {dateLabel(r.itemDate)}
      </p>
      <p className="my-4 break-words leading-7">{r.description}</p>
      {r.image && (
        <section>
          <h3 className="mb-3 font-bold">Private submitted photograph</h3>
          <img
            src={r.image}
            alt={`Submitted photograph of ${r.title}`}
            className="max-h-72 w-full object-contain"
          />
          <p className="notice mt-3">
            Check for IDs, contact details and identifying clues. Unsafe photos
            must remain private.
          </p>
          <label className="my-4 flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="size-5"
              checked={publicPhoto}
              onChange={(e) => setPublicPhoto(e.target.checked)}
            />{" "}
            Photo is safe for the approved listing
          </label>
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                await act("PHOTO", { reportId: r.id, publicPhoto });
                onSuccess("Photo visibility saved.");
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            Save photo visibility
          </Button>
        </section>
      )}
      {r.reason && <p className="notice my-4">Rejection reason: {r.reason}</p>}
      {r.outcome === "Open" && (
        <>
          <h3 className="mb-3 mt-6 font-bold">OSA moderation decision</h3>
          <div className="flex flex-wrap gap-2">
            {["Approved", "Rejected", "Pending Review"].map((status) => (
              <Button
                key={status}
                className={`decision-action decision-action-${status === "Approved" ? "approved" : status === "Rejected" ? "rejected" : "pending"}`}
                disabled={r.moderation === status}
                onClick={() => onModerate(r.id, status)}
              >
                {status === "Approved"
                  ? "Approve"
                  : status === "Rejected"
                    ? "Reject"
                    : "Pending"}
              </Button>
            ))}
          </div>
        </>
      )}
      {r.type === "Found" &&
        r.custody === "Awaiting Turnover" &&
        r.outcome === "Open" && (
          <div className="mt-6 border-t border-line pt-4">
            <p className="mb-3 text-xs text-muted">
              Approval does not confirm physical possession.
            </p>
            <Button variant="secondary" onClick={() => onReceipt(r.id)}>
              Record physical receipt
            </Button>
          </div>
        )}
      {error && (
        <p role="alert" className="mt-3 text-rose-800">
          {error}
        </p>
      )}
    </ConfirmDialog>
  );
}
