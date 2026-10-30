import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, PageHeading, EmptyState } from "../../components/common/UI";
import ReportFilters, {
  EMPTY_FILTERS,
} from "../../components/reports/ReportFilters";
import Registry from "../../components/reports/Registry";
import { filterReports } from "../../utils/reportRules";
export default function Browse({ reports, user, onView }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS),
    [limit, setLimit] = useState(8);
  const active = filterReports(reports, user, filters),
    own = reports.filter((r) => r.reporterId === user.id);
  return (
    <>
      <PageHeading
        title="Search lost & found reports"
        action={
          <Link
            className="btn"
            to={user.role === "osa" ? "/osa/create" : "/report"}
          >
            File a report
          </Link>
        }
      >
        Approved active reports and your eligible pending submissions. Photos
        require separate review.
      </PageHeading>
      <ReportFilters
        value={filters}
        onChange={(v) => {
          setFilters(v);
          setLimit(8);
        }}
      />
      <p className="mb-4 text-xs text-muted">
        {active.length} active reports · Pending records are restricted to their
        reporter and OSA
      </p>
      <section aria-label="Active report results">
        {active.length ? (
          <Registry reports={active.slice(0, limit)} onView={onView} />
        ) : (
          <EmptyState
            title="No items found"
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setFilters(EMPTY_FILTERS);
                  setLimit(8);
                }}
              >
                Reset filters
              </Button>
            }
          >
            No active reports match all selected filters.
          </EmptyState>
        )}
      </section>
      {limit < active.length && (
        <div className="mt-5 text-center">
          <Button variant="secondary" onClick={() => setLimit(limit + 8)}>
            Load more
          </Button>
        </div>
      )}
      {user.role === "student" && (
        <section
          className="mt-9 border-t border-line pt-6"
          aria-label="Your submitted reports"
        >
          <h2 className="text-xl font-bold">Your submitted reports</h2>
          <p className="my-3 leading-6 text-muted">
            All your submissions, including rejected and expired records. This
            history is separate from the filters above.
          </p>
          <Registry reports={own} onView={onView} history />
        </section>
      )}
    </>
  );
}
