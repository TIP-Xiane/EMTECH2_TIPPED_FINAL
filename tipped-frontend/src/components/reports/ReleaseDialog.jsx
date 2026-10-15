import { useState } from "react";
import ConfirmDialog from "../common/ConfirmDialog";
import FormField from "../forms/FormField";
import { Button } from "../common/UI";
import { useReports } from "../../context/ReportContext";
import { today } from "../../utils/format";
export default function ReleaseDialog({ claim, report, onClose, onSuccess }) {
  const { receipts, act } = useReports(),
    [error, setError] = useState("");
  return (
    <ConfirmDialog title="Confirm physical handover" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const v = Object.fromEntries(new FormData(e.currentTarget));
          try {
            act("RELEASE", {
              reportId: report.id,
              claimId: claim.id,
              date: v.date,
              location: v.location,
              confirmed: v.confirmed === "on",
            });
            onSuccess(
              "Physical release recorded. Custody is Released and outcome is Returned.",
            );
          } catch (err) {
            setError(err.message);
          }
        }}
      >
        <p className="notice">
          Verified claimant: {claim.claimantName}. Confirm that the physical
          item was handed over. Verification alone does not record release.
        </p>
        <FormField
          label="Handover date"
          type="date"
          name="date"
          defaultValue={today()}
          max={today()}
          required
        />
        <FormField
          label="Confirmed pickup location"
          name="location"
          defaultValue={
            receipts.find((c) => c.reportId === report.id)?.office || ""
          }
          required
        />
        <label className="flex items-start gap-3">
          <input
            name="confirmed"
            type="checkbox"
            className="mt-1 size-5 shrink-0"
            required
          />{" "}
          I confirm the verified claimant received the item.
        </label>
        {error && (
          <p role="alert" className="text-rose-800">
            {error}
          </p>
        )}
        <Button type="submit">Confirm release</Button>
      </form>
    </ConfirmDialog>
  );
}
