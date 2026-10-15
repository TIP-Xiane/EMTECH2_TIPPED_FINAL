import { useState } from "react";
import ConfirmDialog from "../common/ConfirmDialog";
import FormField from "../forms/FormField";
import ImageUpload from "../forms/ImageUpload";
import { Button } from "../common/UI";
import { useReports } from "../../context/ReportContext";
export default function ClaimDialog({ report, onClose, onSuccess }) {
  const { act } = useReports(),
    [explanation, setExplanation] = useState(""),
    [evidence, setEvidence] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const id = act("CLAIM", { reportId: report.id, explanation, evidence });
      onSuccess(`Claim ${id} submitted · Pending Review`);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <ConfirmDialog title="Request ownership claim" onClose={onClose}>
      <p className="mb-4 text-muted">
        {report.title} · {report.id}
      </p>
      <form onSubmit={submit}>
        <FormField
          as="textarea"
          label="Private ownership explanation"
          required
          minLength={15}
          rows={5}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          hint="Use distinguishing details only an owner would know. This explanation stays out of public listings."
        />
        <div className="my-5">
          <ImageUpload
            label="Supporting evidence (optional)"
            value={evidence}
            onChange={setEvidence}
            onBusy={setBusy}
          />
        </div>
        <p className="notice">
          OSA must verify evidence and custody. A matching description does not
          automatically establish ownership or release the item.
        </p>
        {error && (
          <p role="alert" className="my-3 text-rose-800">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy} className="mt-4">
          {busy ? "Reading evidence…" : "Submit private claim"}
        </Button>
      </form>
    </ConfirmDialog>
  );
}
