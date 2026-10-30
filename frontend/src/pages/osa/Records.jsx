import { PageHeading, Button, EmptyState } from "../../components/common/UI";
import CampusSelector from "../../components/forms/CampusSelector";
import StatusBadge from "../../components/common/StatusBadge";
import { timeLabel, dateLabel } from "../../utils/format";
import useOSAScope from "../../hooks/useOSAScope";
export default function Records({ kind, onReceipt, onClaim, onView }) {
  const ctx = useOSAScope(),
    { scopedReports: rs, site, setSite } = ctx;
  const headings = {
    claims: [
      "Ownership claims",
      "Private evidence is available only to the authorized reviewer.",
    ],
    turnover: [
      "Physical turnover log",
      "Confirm actual receipt separately from listing approval.",
    ],
    audit: [
      "Audit history",
      "Recorded workflow events for this workspace.",
    ],
    releases: [
      "Release records",
      "Completed physical handovers, recorded separately from claim verification.",
    ],
  };
  const [title, body] = headings[kind];
  const items =
    kind === "claims"
      ? ctx.scopedClaims
      : kind === "turnover"
        ? rs.filter((r) => r.type === "Found")
        : kind === "audit"
          ? ctx.scopedEvents
          : ctx.scopedReleases;
  return (
    <>
      <PageHeading
        title={title}
        action={<CampusSelector value={site} onChange={setSite} />}
      >
        {body}
      </PageHeading>
      {!items.length ? (
        <EmptyState title="No records in this view">
          Choose another site or complete the relevant report workflow.
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const r =
              kind === "turnover"
                ? item
                : rs.find((r) => r.id === item.reportId);
            return (
              <article key={item.id} className="panel">
                <h2 className="font-bold">
                  {kind === "audit" ? item.action : r?.title}
                </h2>
                <p className="my-2 break-all text-xs text-muted">
                  {kind === "turnover" ? r.id : item.reportId}{" "}
                  {kind === "claims" ? `· ${item.id}` : ""}
                </p>
                {kind === "claims" && (
                  <>
                    <StatusBadge status={item.status} />
                    <p className="my-3 text-xs">
                      Claimant: {item.claimantName}
                    </p>
                    <Button
                      variant="secondary"
                      onClick={() => onClaim(item.id)}
                    >
                      Review claim
                    </Button>
                  </>
                )}
                {kind === "turnover" && (
                  <>
                    <StatusBadge status={r.custody} />
                    {ctx.receipts
                      .filter((c) => c.reportId === r.id)
                      .map((c) => (
                        <p key={c.id} className="my-3 text-xs leading-6">
                          {c.office} · {c.staff}
                          <br />
                          {timeLabel(c.at)}
                        </p>
                      ))}
                    <div className="mt-3">
                      {r.custody === "Awaiting Turnover" ? (
                        <Button
                          className="osa-turnover-action"
                          onClick={() => onReceipt(r.id)}
                        >
                          Record receipt
                        </Button>
                      ) : (
                        <Button
                          variant="text"
                          className="osa-turnover-action"
                          onClick={() => onView(r.id)}
                        >
                          Review report →
                        </Button>
                      )}
                    </div>
                  </>
                )}
                {kind === "audit" && (
                  <p className="break-words text-xs leading-6">
                    {item.remarks}
                    <br />
                    {item.actorName} · {timeLabel(item.at)}
                    {item.private ? " · Private review event" : ""}
                  </p>
                )}
                {kind === "releases" && (
                  <p className="text-xs leading-6">
                    Verified claimant: {item.claimantName}
                    <br />
                    Handover: {dateLabel(item.date)} · {item.location}
                    <br />
                    Authorized staff: {item.staffName}
                    <br />
                    Claim reference: {item.claimId}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
