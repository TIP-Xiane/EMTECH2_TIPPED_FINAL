import ReportRow from "./ReportRow";
import { EmptyState } from "../common/UI";
export default function Registry({
  reports,
  onView,
  history = false,
  renderActions,
}) {
  if (!reports.length)
    return (
      <EmptyState title="No reports in this view">
        Try a different filter or submit a lost/found report.
      </EmptyState>
    );
  return (
    <div className="report-registry overflow-hidden rounded border border-line">
      {reports.map((r) => (
        <ReportRow
          key={r.id}
          report={r}
          history={history}
          onView={onView}
          actions={renderActions?.(r)}
        />
      ))}
    </div>
  );
}
