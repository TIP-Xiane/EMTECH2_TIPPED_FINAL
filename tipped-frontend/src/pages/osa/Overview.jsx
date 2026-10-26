import { Link } from "react-router-dom";
import { EmptyState, PageHeading } from "../../components/common/UI";
import CampusSelector from "../../components/forms/CampusSelector";
import Registry from "../../components/reports/Registry";
import useOSAScope from "../../hooks/useOSAScope";

export default function Overview({ onView }) {
  const { scopedReports, scopedClaims, site, setSite } = useOSAScope();
  const pendingReports = scopedReports.filter(
    (report) =>
      report.moderation === "Pending Review" && report.outcome === "Open",
  );
  const pendingClaims = scopedClaims.filter(
    (claim) => claim.status === "Pending Review",
  );
  const awaitingTurnover = scopedReports.filter(
    (report) =>
      report.type === "Found" &&
      report.custody === "Awaiting Turnover" &&
      report.outcome === "Open",
  );
  const tasks = [
    {
      count: pendingReports.length,
      title: "Reports to review",
      description: "Check details and approve or reject submissions.",
      path: "/osa/reports",
      action: "Review reports",
    },
    {
      count: pendingClaims.length,
      title: "Ownership claims",
      description: "Review claim details and private evidence.",
      path: "/osa/claims",
      action: "Review claims",
    },
    {
      count: awaitingTurnover.length,
      title: "Items awaiting receipt",
      description: "Record physical handover to the office.",
      path: "/osa/turnover",
      action: "Record receipt",
    },
  ];
  const hasTasks = tasks.some((task) => task.count > 0);

  return (
    <>
      <PageHeading
        eyebrow="OSA WORKSPACE"
        title="Needs attention"
        action={<CampusSelector value={site} onChange={setSite} />}
      >
        Your next OSA tasks for this campus.
      </PageHeading>

      {hasTasks ? (
        <section className="osa-task-list" aria-label="OSA tasks">
          {tasks.map((task) => (
            <article className="osa-task-card" key={task.path}>
              <span
                className="osa-task-count"
                aria-label={`${task.count} ${task.count === 1 ? "task" : "tasks"}`}
              >
                {task.count}
              </span>
              <div>
                <h2>{task.title}</h2>
                <p>{task.description}</p>
              </div>
              <Link to={task.path}>{task.action} →</Link>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState title="All caught up">
          There are no reports, claims, or found items waiting for action at
          this campus.
        </EmptyState>
      )}

      {pendingReports.length > 0 && (
        <section className="osa-pending-preview">
          <div className="public-section-heading">
            <h2>Reports waiting for review</h2>
            <Link to="/osa/reports">Open full queue →</Link>
          </div>
          <Registry reports={pendingReports.slice(0, 4)} onView={onView} />
        </section>
      )}
    </>
  );
}
