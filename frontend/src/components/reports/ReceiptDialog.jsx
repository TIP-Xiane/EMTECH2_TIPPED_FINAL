import { useState } from "react";
import ConfirmDialog from "../common/ConfirmDialog";
import FormField from "../forms/FormField";
import { Button } from "../common/UI";
import { useReports } from "../../context/ReportContext";
export default function ReceiptDialog({ report, onClose, onSuccess }) {
  const { act } = useReports(),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await act("RECEIVE", {
        reportId: report.id,
        office: v.office,
        staff: v.staff,
        note: v.note,
        at: new Date(v.at).toISOString(),
        confirmed: v.confirmed === "on",
      });
      onSuccess(
        "Physical receipt recorded. Custody is In Custody; moderation is unchanged.",
      );
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <ConfirmDialog title="Record physical receipt" onClose={onClose}>
      <p className="mb-4 text-xs text-muted">
        {report.id} · {report.title} · {report.site}
      </p>
      <form onSubmit={submit} className="space-y-4">
        <p className="notice">
          Enter the actual receiving office and staff. Confirm pickup
          policy is implied.
        </p>
        <FormField label="Receiving office" name="office" required />
        <FormField
          label="Receiving staff name / reference"
          name="staff"
          required
        />
        <FormField
          label="Turnover date and time (your local time)"
          name="at"
          type="datetime-local"
          required
        />
        <FormField
          label="Protected identifying notes"
          name="note"
          as="textarea"
          minLength={10}
          rows={4}
          required
          hint="Private to OSA review. Describe distinguishing characteristics or receipt condition."
        />
        <label className="flex items-center gap-3">
          <input
            className="size-5 shrink-0"
            type="checkbox"
            name="confirmed"
            required
          />{" "}
          I confirm the office physically received the item.
        </label>
        {error && (
          <p role="alert" className="text-rose-800">
            {error}
          </p>
        )}
        <Button type="submit">Confirm receipt</Button>
      </form>
    </ConfirmDialog>
  );
}
