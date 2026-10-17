import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useReports } from "../../context/ReportContext";
import { isActive } from "../../utils/reportRules";
import PublicCards from "../../components/reports/PublicCards";
export default function PublicHome({ onView }) {
  const { reports } = useReports(),
    navigate = useNavigate();
  const [query, setQuery] = useState("");
  const approved = reports.filter((r) => r.moderation === "Approved"),
    active = approved.filter((r) => isActive(r));
  const recent = [...active]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 6);
  return (
    <>
      <section className="public-hero">
        <div className="public-eyebrow">
          <span /> FOR STUDENTS & VISITORS
        </div>
        <h1>
          Find what matters.
          <br />
          <span>Reconnect what is lost.</span>
        </h1>
        <p>
          Lost something on campus? Found something that belongs to someone
          else?
          <br className="hidden sm:block" /> Start here. No account needed.
        </p>
        <form
          className="public-search"
          onSubmit={(e) => {
            e.preventDefault();
            navigate(`/browse?q=${encodeURIComponent(query)}`);
          }}
        >
          <label className="sr-only" htmlFor="home-search">
            Search campus reports
          </label>
          <span aria-hidden="true">⌕</span>
          <input
            id="home-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by item, category, or location…"
          />
          <button type="submit">
            Search <span aria-hidden="true">→</span>
          </button>
        </form>
        <div className="public-quick-links">
          <span>Looking for something?</span>
          {["Electronics", "ID/Cards", "School Supplies"].map((c) => (
            <Link key={c} to={`/browse?category=${encodeURIComponent(c)}`}>
              {c} ↗
            </Link>
          ))}
        </div>
      </section>
      <section
        className="public-action-grid"
        aria-label="Report a lost or found item"
      >
        <Link className="public-action" to="/report?type=Lost">
          <span className="public-action-icon" aria-hidden="true">
            ⌕
          </span>
          <div>
            <h2>I lost something</h2>
            <p>Tell us what’s missing and where you last saw it.</p>
            <strong>Report Lost Item →</strong>
          </div>
        </Link>
        <Link
          className="public-action public-action-found"
          to="/report?type=Found"
        >
          <span className="public-action-icon" aria-hidden="true">
            ＋
          </span>
          <div>
            <h2>I found something</h2>
            <p>Help it get back to its owner. Start with a report.</p>
            <strong>Report Found Item →</strong>
          </div>
        </Link>
      </section>
      <div className="public-stats" aria-label="Campus report totals">
        {[
          [
            active.filter((r) => r.type === "Lost").length,
            "Active lost reports",
          ],
          [
            active.filter((r) => r.type === "Found").length,
            "Found items to claim",
          ],
          [
            approved.filter((r) =>
              ["Returned", "Recovered"].includes(r.outcome),
            ).length,
            "Resolved reports",
          ],
        ].map(([n, label]) => (
          <div key={label}>
            <strong>{String(n).padStart(2, "0")}</strong>
            <span>{label}</span>
          </div>
        ))}
        <p>
          From approved reports
          <br />
          in this local demo
        </p>
      </div>
      <section className="public-recent">
        <div className="public-section-heading">
          <div>
            <span className="public-eyebrow">AROUND CAMPUS</span>
            <h2>Recent campus reports</h2>
          </div>
          <Link to="/browse">View all reports →</Link>
        </div>
        <PublicCards reports={recent} onView={onView} />
      </section>
      <section className="public-help">
        <div>
          <span className="public-help-symbol" aria-hidden="true">
            i
          </span>
          <div>
            <h2>Found an item? A report is the first step.</h2>
            <p>
              Ask OSA or Campus Security at the selected campus about physical
              turnover. Staff must confirm receipt.
            </p>
          </div>
        </div>
        <Link to="/report?type=Found">Start a found report →</Link>
      </section>
    </>
  );
}
