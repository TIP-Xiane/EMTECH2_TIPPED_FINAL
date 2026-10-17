import { useState } from "react";
import { Link } from "react-router-dom";
import { useReports } from "../../context/ReportContext";
import { useAuth } from "../../context/AuthContext";
import Registry from "../../components/reports/Registry";
import StatusBadge from "../../components/common/StatusBadge";
import { Button, PageHeading, EmptyState } from "../../components/common/UI";
export default function MyReports({ onView }) {
  const { actor: user } = useAuth(),
    { reports, claims } = useReports(),
    [tab, setTab] = useState("All");
  const own = reports.filter(
    (r) =>
      r.reporterId === user.id &&
      (tab === "All" || tab === "Closed"
        ? tab === "All" || r.outcome !== "Open"
        : r.moderation === tab),
  );
  const mine = claims.filter((c) => c.claimantId === user.id);
  return (
    <>
      <PageHeading
        title="My reports"
        action={
          <Link to="/report" className="btn">
            New report
          </Link>
        }
      >
        Follow your reports and ownership claims. Open a report to see its
        updates.
      </PageHeading>
      <p className="notice mb-5">
        Reports are linked to this browser or your demo account. Keep your TIP
        reference for follow-up with OSA. Contact numbers are callback details,
        not sign-in credentials.
      </p>
      <div
        className="mb-5 flex flex-wrap gap-2"
        aria-label="Report status filters"
      >
        {["All", "Pending Review", "Approved", "Rejected", "Closed"].map(
          (t) => (
            <Button
              key={t}
              variant={t === tab ? "primary" : "secondary"}
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
            >
              {t}
            </Button>
          ),
        )}
      </div>
      <Registry reports={own} onView={onView} history />
      <h2 className="mb-4 mt-9 text-xl font-bold">My ownership claims</h2>
      {mine.length ? (
        <div className="grid gap-4">
          {mine.map((c) => (
            <article key={c.id} className="panel">
              <div className="flex flex-wrap justify-between gap-3">
                <h3 className="font-bold">
                  {reports.find((r) => r.id === c.reportId)?.title}
                </h3>
                <StatusBadge status={c.status} />
              </div>
              <p className="my-3 text-xs text-muted">{c.id}</p>
              <p className="break-words text-sm">
                {c.remarks || "Waiting for OSA review."}
              </p>
              <Button variant="text" onClick={() => onView(c.reportId)}>
                View associated report →
              </Button>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No ownership claims">
          Open an approved Found report belonging to another student to request
          a claim.
        </EmptyState>
      )}
    </>
  );
}
