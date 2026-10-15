import { useState } from "react";
import ConfirmDialog from "../common/ConfirmDialog";
import FormField from "../forms/FormField";
import StatusBadge from "../common/StatusBadge";
import { Button } from "../common/UI";
import { useReports } from "../../context/ReportContext";
export default function ClaimReviewDialog({
  claim: c,
  report: r,
  onClose,
  onSuccess,
  onRelease,
}) {
  const { receipts, act } = useReports(),
    [error, setError] = useState("");
  const receipt = receipts.find((x) => x.reportId === r.id);
  function submit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      act("CLAIM_DECIDE", {
        reportId: r.id,
        claimId: c.id,
        status: e.nativeEvent.submitter.value,
        remarks: form.get("remarks"),
        confirmed: form.get("confirmed") === "on",
      });
      onSuccess("Claim decision recorded. Physical release remains separate.");
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <ConfirmDialog title="Private ownership review" onClose={onClose}>
      <p className="mb-4 text-xs text-muted">
        {c.id} · {r.id} · {r.title}
      </p>
      <StatusBadge status={c.status} />
      <div className="notice my-4">
        <strong>Protected receipt record</strong>
        <p className="break-words">
          {receipt
            ? receipt.note
            : "No physical receipt is recorded. Verification must wait for turnover."}
        </p>
        <p>{r.custody}</p>
      </div>
      <h3 className="font-bold">Private claimant explanation</h3>
      <p className="my-4 break-words leading-7">{c.explanation}</p>
      {c.evidence ? (
        <img
          src={c.evidence}
          alt="Private claim supporting evidence"
          className="mb-4 max-h-64 w-full object-contain"
        />
      ) : (
        <p className="mb-4 text-xs text-muted">No supporting image attached.</p>
      )}
      {c.status === "Pending Review" ? (
        <form onSubmit={submit} className="space-y-4">
          <FormField
            label="Reviewer remarks"
            name="remarks"
            as="textarea"
            rows={4}
            minLength={10}
            required
          />
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="confirmed"
              className="mt-1 size-5 shrink-0"
            />{" "}
            I compared the private evidence with the protected receipt record.
            Required for verification.
          </label>
          {error && (
            <p role="alert" className="text-rose-800">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" name="decision" value="Verified">
              Verify claim
            </Button>
            <Button
              type="submit"
              name="decision"
              value="Rejected"
              variant="secondary"
            >
              Reject claim
            </Button>
          </div>
        </form>
      ) : (
        <>
          <p className="mb-4 break-words text-muted">{c.remarks}</p>
          {c.status === "Verified" && (
            <Button onClick={() => onRelease(c.id)}>
              Record physical release
            </Button>
          )}
        </>
      )}
    </ConfirmDialog>
  );
}
