import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useReports } from "../../context/ReportContext";
import { canViewReport, osaCanAccess } from "../../utils/reportRules";
import ReportDetailsDialog from "../reports/ReportDetailsDialog";
import ReportReviewDialog from "../reports/ReportReviewDialog";
import ClaimDialog from "../reports/ClaimDialog";
import ClaimReviewDialog from "../reports/ClaimReviewDialog";
import ReceiptDialog from "../reports/ReceiptDialog";
import ReleaseDialog from "../reports/ReleaseDialog";
import NotificationsDialog from "../notifications/NotificationsDialog";
import ConfirmDialog from "../common/ConfirmDialog";
import FormField from "../forms/FormField";
import { Button } from "../common/UI";
export default function WorkflowDialogs({
  dialog,
  setDialog,
  onSuccess,
  onModerate,
  onView,
  onOpenNotification,
}) {
  const { actor: user } = useAuth(),
    { reports, claims, events, act } = useReports(),
    [error, setError] = useState("");
  if (!dialog || !user) return null;
  const close = () => setDialog(null),
    finish = (text) => {
      close();
      onSuccess(text);
    };
  if (dialog.type === "notifications")
    return <NotificationsDialog onClose={close} onOpen={onOpenNotification} />;
  const claim = claims.find((c) => c.id === dialog.claimId),
    r = reports.find((r) => r.id === (dialog.id || claim?.reportId));
  if (!r || !canViewReport(user, r))
    return (
      <ConfirmDialog title="Report unavailable" onClose={close}>
        <p>You do not have permission to view this record.</p>
      </ConfirmDialog>
    );
  const common = { onClose: close, report: r };
  if (dialog.type === "details")
    return (
      <ReportDetailsDialog
        {...common}
        user={user}
        events={events}
        onClaim={(id) => setDialog({ type: "claim", id })}
        onRecover={(id) => setDialog({ type: "recover", id })}
      />
    );
  if (dialog.type === "claim")
    return <ClaimDialog {...common} onSuccess={onSuccess} />;
  if (dialog.type === "recover")
    return (
      <ConfirmDialog title="Confirm item recovery" onClose={close}>
        <p className="mb-4">Have you recovered your {r.title.toLowerCase()}?</p>
        <Button
          onClick={async () => {
            try {
              await act("RECOVER", { reportId: r.id });
              finish("Report outcome updated to Recovered.");
            } catch (err) {
              setError(err.message);
            }
          }}
        >
          Confirm recovery
        </Button>
        {error && (
          <p role="alert" className="mt-4 text-rose-800">
            {error}
          </p>
        )}
      </ConfirmDialog>
    );
  if (!osaCanAccess(user, r)) return null;
  if (dialog.type === "review")
    return (
      <ReportReviewDialog
        {...common}
        onModerate={onModerate}
        onReceipt={(id) => setDialog({ type: "receipt", id })}
        onSuccess={onSuccess}
      />
    );
  if (dialog.type === "receipt")
    return <ReceiptDialog {...common} onSuccess={finish} />;
  if (dialog.type === "claimReview" && claim)
    return (
      <ClaimReviewDialog
        {...common}
        claim={claim}
        onSuccess={finish}
        onRelease={(claimId) => setDialog({ type: "release", claimId })}
      />
    );
  if (dialog.type === "release" && claim)
    return <ReleaseDialog {...common} claim={claim} onSuccess={finish} />;
  if (dialog.type === "reject")
    return (
      <ConfirmDialog title="Reject report with reason" onClose={close}>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await act("MODERATE", {
                reportId: r.id,
                status: "Rejected",
                reason: new FormData(e.currentTarget).get("reason"),
              });
              finish(
                "Report rejected. The reporter has a decision notification.",
              );
            } catch (err) {
              setError(err.message);
            }
          }}
        >
          <FormField
            label="Reason for rejection"
            name="reason"
            as="textarea"
            minLength={10}
            rows={4}
            required
            hint="At least 10 characters. The reporter will see this reason."
          />
          {error && (
            <p role="alert" className="my-4 text-rose-800">
              {error}
            </p>
          )}
          <Button type="submit" className="mt-4">
            Confirm rejection
          </Button>
        </form>
      </ConfirmDialog>
    );
  return null;
}
