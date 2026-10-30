import { useAuth } from "../context/AuthContext";
import { useReports } from "../context/ReportContext";
import { osaCanAccess } from "../utils/reportRules";
export default function useOSAScope() {
  const { user } = useAuth(),
    context = useReports();
  const reports = context.reports.filter(
    (r) =>
      osaCanAccess(user, r) &&
      (context.site === "All sites" || r.site === context.site),
  );
  const ids = new Set(reports.map((r) => r.id));
  return {
    ...context,
    scopedReports: reports,
    scopedClaims: context.claims.filter((c) => ids.has(c.reportId)),
    scopedReleases: context.releases.filter((r) => ids.has(r.reportId)),
    scopedEvents: context.events.filter((e) => ids.has(e.reportId)),
  };
}
