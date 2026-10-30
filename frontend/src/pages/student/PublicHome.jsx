import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useReports } from "../../context/ReportContext";
import { isActive } from "../../utils/reportRules";
import PublicCards from "../../components/reports/PublicCards";

export default function PublicHome({ onView }) {
  const { actor, user } = useAuth(),
    { reports } = useReports(),
    navigate = useNavigate(),
    [query, setQuery] = useState("");

  const recent = reports
    .filter((report) => report.moderation === "Approved" && isActive(report))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 3);
  const ownReports = reports.filter((report) => report.reporterId === actor.id);
  const needsAttention = ownReports.filter(
    (report) =>
      report.moderation === "Pending Review" && report.outcome === "Open",
  ).length;

  function search(event) {
    event.preventDefault();
    navigate(`/browse?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="public-dashboard">
      <section className="public-dashboard-intro">
        <p className="public-eyebrow">CAMPUS LOST &amp; FOUND</p>
        <h1>What do you need today?</h1>
        <p>Find an item or report something lost or found.</p>
      </section>

      <section className="public-dashboard-tasks" aria-label="Get started">
        <div className="dashboard-task-card">
          <div className="dashboard-task-heading">
            <span aria-hidden="true">1</span>
            <div>
              <h2>Find an item</h2>
              <p>Search reports from campus.</p>
            </div>
          </div>
          <form className="public-search" onSubmit={search}>
            <label className="sr-only" htmlFor="home-search">
              Find a reported item
            </label>
            <input
              id="home-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Item name, category, or location"
            />
            <button type="submit">Search</button>
          </form>
          <Link className="dashboard-secondary-link" to="/browse">
            Browse all reports
          </Link>
        </div>

        <div className="dashboard-task-card">
          <div className="dashboard-task-heading">
            <span aria-hidden="true">2</span>
            <div>
              <h2>Report an item</h2>
              <p>Tell OSA where and when you lost or found it.</p>
            </div>
          </div>
          <div className="dashboard-report-options">
            <Link className="report-option-lost" to="/report?type=Lost">
              I lost something
            </Link>
            <Link className="report-option-found" to="/report?type=Found">
              I found something
            </Link>
          </div>
        </div>
      </section>

      {ownReports.length > 0 && (
        <section
          className="dashboard-progress"
          aria-label="Your report progress"
        >
          <div>
            <strong>
              {needsAttention
                ? `${needsAttention} report${needsAttention === 1 ? "" : "s"} awaiting review`
                : "Your reports are up to date"}
            </strong>
            <p>Check decisions and updates from OSA.</p>
          </div>
          <Link to="/my-reports">Track my reports</Link>
        </section>
      )}

      <section className="public-recent">
        <div className="public-section-heading">
          <div>
            <h2>Recently reported items</h2>
          </div>
          <Link to="/browse">See all items →</Link>
        </div>
        <PublicCards reports={recent} onView={onView} />
      </section>

      {!user && ownReports.length > 0 && (
        <p className="dashboard-guest-note">
          Guest reports are saved in this browser. Use the same device and
          browser to check their progress.
        </p>
      )}
    </div>
  );
}
