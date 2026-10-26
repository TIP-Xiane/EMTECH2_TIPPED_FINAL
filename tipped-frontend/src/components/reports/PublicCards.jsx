import { dateLabel } from "../../utils/format";
import { EmptyState } from "../common/UI";
export default function PublicCards({ reports, onView }) {
  if (!reports.length)
    return (
      <EmptyState title="No items found">
        Try a different search or clear your filters. You can also report what
        you lost.
      </EmptyState>
    );
  return (
    <div className="public-cards">
      {reports.map((r) => (
        <article
          className="public-card"
          key={r.id}
          aria-label={`${r.title} report`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="public-reference">{r.id}</span>
            <span
              className={`public-type ${r.type === "Found" ? "is-found" : "is-lost"}`}
            >
              {r.type === "Found" ? "Found item" : "Lost item"}
            </span>
          </div>
          <h3>{r.title}</h3>
          <p className="public-card-location">
            <span aria-hidden="true">⌖</span> {r.site} · {r.location}
          </p>
          <p className="public-card-date">
            {dateLabel(r.itemDate)}
            {r.itemTime ? ` · ${r.itemTime}` : ""}
          </p>
          <button className="public-card-link" onClick={() => onView(r.id)}>
            View report <span aria-hidden="true">↗</span>
          </button>
        </article>
      ))}
    </div>
  );
}
