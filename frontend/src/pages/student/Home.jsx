import { Link } from "react-router-dom";
import { PageHeading, DashboardCounter } from "../../components/common/UI";
import Registry from "../../components/reports/Registry";
import { useReports } from "../../context/ReportContext";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { isActive } from "../../utils/reportRules";
export default function Home({ onView }) {
  const { user } = useAuth(),
    { reports } = useReports(),
    { notifications } = useNotifications(),
    own = reports.filter((r) => r.reporterId === user.id);
  return (
    <>
      <PageHeading title="Campus lost & found">
        Report a missing belonging. Help return a found item. Track updates from
        OSA.
      </PageHeading>
      <div className="mb-6 grid gap-4 min-[760px]:grid-cols-2">
        {[
          [
            "Lost",
            "I lost something",
            "Describe the item and where you last saw it.",
          ],
          [
            "Found",
            "I found something",
            "File a report; physical turnover is confirmed separately.",
          ],
        ].map(([type, title, body]) => (
          <Link
            key={type}
            to={`/report?type=${type}`}
            className="panel flex items-center justify-between gap-4 hover:border-burgundy"
          >
            <div>
              <h2 className="text-base font-bold">{title}</h2>
              <p className="mt-2 text-xs leading-6 text-muted">{body}</p>
            </div>
            <span aria-hidden="true" className="text-xl text-burgundy">
              →
            </span>
          </Link>
        ))}
      </div>
      <div className="mb-7 flex flex-wrap gap-5 border-b border-line pb-6">
        {[
          ["My reports", own.length],
          [
            "Waiting for OSA",
            own.filter((r) => r.moderation === "Pending Review").length,
          ],
          ["Approved", own.filter((r) => r.moderation === "Approved").length],
          ["Rejected", own.filter((r) => r.moderation === "Rejected").length],
        ].map(([label, value]) => (
          <DashboardCounter key={label} label={label} value={value} />
        ))}
      </div>
      <div className="grid items-start gap-6 min-[1100px]:grid-cols-[2.2fr_1fr]">
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Approved report registry</h2>
            <Link to="/browse" className="btn btn-text">
              Search reports →
            </Link>
          </div>
          <p className="mb-4 text-xs leading-6 text-muted">
            Only approved, active listings. Approval is not a physical custody
            receipt.
          </p>
          <Registry
            reports={reports
              .filter((r) => r.moderation === "Approved" && isActive(r))
              .slice(0, 5)}
            onView={onView}
          />
        </section>
        <aside className="space-y-5">
          <div className="panel">
            <h2 className="font-bold">How recovery works</h2>
            <ol className="mt-4 space-y-5 text-xs leading-6 text-muted">
              {[
                ["Submit", "Your report begins Pending Review."],
                [
                  "Review & turnover",
                  "Report approval and physical receipt are separate.",
                ],
                [
                  "Verify & release",
                  "OSA checks private evidence before a separate handover.",
                ],
              ].map(([title, body], i) => (
                <li key={title}>
                  <strong className="block text-ink">
                    {i + 1}. {title}
                  </strong>
                  {body}
                </li>
              ))}
            </ol>
          </div>
          <div className="panel">
            <h2 className="font-bold">Updates from OSA</h2>
            {notifications.slice(0, 3).map((n) => (
              <p
                key={n.id}
                className="mt-4 break-words border-t border-line pt-3 text-xs leading-6"
              >
                {n.message}
              </p>
            ))}
            {!notifications.length && (
              <p className="mt-3 text-xs text-muted">No updates yet.</p>
            )}
            <Link className="btn btn-text mt-3" to="/my-reports">
              View my progress →
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
