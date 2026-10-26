import { useState } from "react";
import { PageHeading, Button } from "../../components/common/UI";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import CampusSelector from "../../components/forms/CampusSelector";
import Registry from "../../components/reports/Registry";
import useOSAScope from "../../hooks/useOSAScope";
export default function Reports({ onView, onModerate }) {
  const { scopedReports, site, setSite } = useOSAScope(),
    [tab, setTab] = useState("All"),
    [query, setQuery] = useState(""),
    [undoReport, setUndoReport] = useState(null);
  const reports = scopedReports.filter(
    (r) =>
      (tab === "All" || r.moderation === tab) &&
      `${r.title} ${r.id}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        title="Report review"
        action={<CampusSelector value={site} onChange={setSite} />}
      >
        Use the visible actions below. Rejection requires a reason; verified
        claims block moderation reversals.
      </PageHeading>
      <input
        className="input mb-5"
        aria-label="Search administrative reports"
        placeholder="Search item title or reference"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {["All", "Pending Review", "Approved", "Rejected"].map((t) => (
          <Button
            key={t}
            variant={tab === t ? "primary" : "secondary"}
            aria-pressed={tab === t}
            onClick={() => setTab(t)}
          >
            {t}
          </Button>
        ))}
      </div>
      <Registry
        reports={reports}
        onView={onView}
        history
        renderActions={(r) =>
          r.outcome === "Open" && (
            <div className="flex flex-wrap gap-2">
              {["Approved", "Rejected", "Pending Review"].map((status) => (
                <Button
                  key={status}
                  className={`decision-action decision-action-${status === "Approved" ? "approved" : status === "Rejected" ? "rejected" : "pending"}`}
                  disabled={r.moderation === status}
                  onClick={() =>
                    status === "Pending Review" &&
                    r.moderation !== "Pending Review"
                      ? setUndoReport(r)
                      : onModerate(r.id, status)
                  }
                >
                  {status === "Approved"
                    ? "Approve"
                    : status === "Rejected"
                      ? "Reject"
                      : r.moderation === "Pending Review"
                        ? "Pending"
                        : "Undo review"}
                </Button>
              ))}
            </div>
          )
        }
      />
      {undoReport && (
        <ConfirmDialog
          title="Undo report review?"
          onClose={() => setUndoReport(null)}
          actions={
            <>
              <Button variant="secondary" onClick={() => setUndoReport(null)}>
                Keep current decision
              </Button>
              <Button
                className="decision-action decision-action-pending"
                onClick={() => {
                  onModerate(undoReport.id, "Pending Review");
                  setUndoReport(null);
                }}
              >
                Undo review
              </Button>
            </>
          }
        >
          <p>
            Return <strong>{undoReport.title}</strong> to Pending Review? The
            reporter will be notified, and the decision will remain in the
            activity history.
          </p>
        </ConfirmDialog>
      )}
    </>
  );
}
