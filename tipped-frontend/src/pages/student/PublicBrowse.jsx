import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeading, Button, EmptyState } from "../../components/common/UI";
import FormField from "../../components/forms/FormField";
import PublicCards from "../../components/reports/PublicCards";
import { SITES, CATEGORIES } from "../../data/constants";
import { filterReports } from "../../utils/reportRules";
export default function PublicBrowse({ reports, user, onView }) {
  const [params] = useSearchParams();
  const empty = {
    query: "",
    type: "",
    site: "",
    category: "",
    from: "",
    to: "",
  };
  const [filters, setFilters] = useState({
      ...empty,
      query: params.get("q") || "",
      type: ["Lost", "Found"].includes(params.get("type"))
        ? params.get("type")
        : "",
      category: CATEGORIES.includes(params.get("category"))
        ? params.get("category")
        : "",
    }),
    [limit, setLimit] = useState(9);
  const set = (key, value) => {
    setFilters((v) => ({ ...v, [key]: value }));
    setLimit(9);
  };
  const results = filterReports(
    reports.filter((r) => r.moderation === "Approved"),
    user,
    { ...filters, query: "" },
  ).filter((r) =>
    `${r.id} ${r.title} ${r.category} ${r.site} ${r.location} ${r.description}`
      .toLowerCase()
      .includes(filters.query.trim().toLowerCase()),
  );
  const reset = () => {
    setFilters(empty);
    setLimit(9);
  };
  return (
    <>
      <PageHeading
        eyebrow="CAMPUS LOST & FOUND"
        title="Find an item"
        action={
          <Link className="btn" to="/report">
            Report an item →
          </Link>
        }
      >
        Search approved lost and found reports from Arlegui, Casal, and other
        locations.
      </PageHeading>
      <div className="public-filter-panel">
        <FormField
          label="Search reports"
          placeholder="Item, category, campus, location, or reference"
          value={filters.query}
          onChange={(e) => set("query", e.target.value)}
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            ["type", "Report type", ["Lost", "Found"]],
            ["site", "Site", SITES],
            ["category", "Category", CATEGORIES],
          ].map(([key, label, values]) => (
            <FormField
              key={key}
              label={label}
              as="select"
              value={filters[key]}
              onChange={(e) => set(key, e.target.value)}
            >
              <option value="">
                {key === "type"
                  ? "Lost & found"
                  : `All ${key === "category" ? "categories" : "sites"}`}
              </option>
              {values.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </FormField>
          ))}
        </div>
        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-semibold">
            Filter by item date
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField
              label="Item date from"
              type="date"
              value={filters.from}
              onChange={(e) => set("from", e.target.value)}
            />
            <FormField
              label="Item date to"
              type="date"
              min={filters.from}
              value={filters.to}
              onChange={(e) => set("to", e.target.value)}
            />
          </div>
        </details>
      </div>
      <div className="my-5 flex items-center justify-between gap-3">
        <p className="text-sm text-muted" role="status">
          {results.length} {results.length === 1 ? "report" : "reports"} found
        </p>
        <Button className="public-reset-filters" variant="text" onClick={reset}>
          Reset filters
        </Button>
      </div>
      <section aria-label="Active report results">
        {results.length ? (
          <PublicCards reports={results.slice(0, limit)} onView={onView} />
        ) : (
          <EmptyState
            title="No items found"
            action={
              <Button variant="secondary" onClick={reset}>
                Clear search
              </Button>
            }
          >
            Try another item name or a wider location. Haven’t reported your
            lost item yet?{" "}
            <Link to="/report?type=Lost" className="underline">
              Create a lost report.
            </Link>
          </EmptyState>
        )}
      </section>
      {limit < results.length && (
        <div className="mt-6 text-center">
          <Button variant="secondary" onClick={() => setLimit(limit + 9)}>
            Load more
          </Button>
        </div>
      )}
      <p className="mt-8 text-sm text-muted">
        Looking for a report you submitted?{" "}
        <Link className="font-semibold underline" to="/my-reports">
          Track it in My Reports →
        </Link>
      </p>
    </>
  );
}
