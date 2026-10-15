import { Link } from "react-router-dom";
import { DashboardCounter, PageHeading } from "../../components/common/UI";
import CampusSelector from "../../components/forms/CampusSelector";
import Registry from "../../components/reports/Registry";
import useOSAScope from "../../hooks/useOSAScope";
export default function Overview({ onView }) {
  const {
    scopedReports: rs,
    scopedClaims,
    scopedReleases,
    site,
    setSite,
  } = useOSAScope();
  return (
    <>
      <PageHeading
        eyebrow="OSA WORKSPACE / DEMONSTRATION"
        title="Campus overview"
        action={<CampusSelector value={site} onChange={setSite} />}
      >
        Review reports, verify physical receipt and keep ownership checks
        separate from release.
      </PageHeading>
      <p className="notice mb-6">
        Illustrative records only. Your demo reviewer is assigned to Arlegui and
        Casal. Approval controls listing visibility, not custody.
      </p>
      <div className="panel mb-7 grid gap-5 sm:grid-cols-2 min-[1100px]:grid-cols-4">
        {[
          [
            "Pending Review",
            rs.filter(
              (r) => r.moderation === "Pending Review" && r.outcome === "Open",
            ).length,
          ],
          ["Approved", rs.filter((r) => r.moderation === "Approved").length],
          [
            "Claims to verify",
            scopedClaims.filter((c) => c.status === "Pending Review").length,
          ],
          ["Returned items", scopedReleases.length],
        ].map(([label, value]) => (
          <DashboardCounter key={label} label={label} value={value} />
        ))}
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Submission review queue</h2>
        <Link to="/osa/reports" className="btn btn-text">
          All reports →
        </Link>
      </div>
      <Registry
        reports={rs.filter(
          (r) => r.moderation === "Pending Review" && r.outcome === "Open",
        )}
        onView={onView}
      />
    </>
  );
}
