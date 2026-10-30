import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useReports } from "../../context/ReportContext";
import FormField from "../../components/forms/FormField";
import ImageUpload from "../../components/forms/ImageUpload";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import StatusBadge from "../../components/common/StatusBadge";
import { Button, PageHeading } from "../../components/common/UI";
import { SITES, CATEGORIES } from "../../data/constants";
import { today } from "../../utils/format";
import { validateReport } from "../../utils/reportRules";
export default function ReportItem() {
  const { user } = useAuth(),
    { reports, act } = useReports(),
    navigate = useNavigate(),
    [params] = useSearchParams();
  const [values, setValues] = useState({
    type: params.get("type") === "Found" ? "Found" : "Lost",
    title: "",
    category: "",
    site: user.site || "Arlegui",
    siteDetail: "",
    location: "",
    itemDate: "",
    description: "",
    image: "",
    validDays: 4,
  });
  const [errors, setErrors] = useState({}),
    [busy, setBusy] = useState(false),
    [submitted, setSubmitted] = useState(null);
  const set = (key, value) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };
  async function submit(e) {
    e.preventDefault();
    if (busy || submitted) return;
    const failure = validateReport(values, reports, user);
    setErrors(failure);
    if (Object.keys(failure).length) return;
    try {
      const id = await act("SUBMIT", values);
      setSubmitted(id);
    } catch (err) {
      setErrors({ form: err.message });
    }
  }
  const field = (key, label, props = {}) => (
    <FormField
      label={label}
      required
      error={errors[key]}
      value={values[key]}
      onChange={(e) => set(key, e.target.value)}
      {...props}
    />
  );
  return (
    <div className="mx-auto max-w-[820px]">
      <PageHeading title="Report an item">
        Give OSA clear general details. Keep private ownership clues out of your
        public description.
      </PageHeading>
      <form onSubmit={submit} noValidate className="panel space-y-7">
        <section>
          <h2 className="mb-4 font-bold">
            01 · What would you like to report?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {["Lost", "Found"].map((type) => (
              <Button
                key={type}
                variant={values.type === type ? "primary" : "secondary"}
                aria-pressed={values.type === type}
                onClick={() => set("type", type)}
              >
                {type} Item
              </Button>
            ))}
          </div>
        </section>
        <section className="border-t border-line pt-6">
          <h2 className="mb-4 font-bold">02 · Item information</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {field("title", "Item title", {
              maxLength: 90,
              placeholder: "e.g. Black wallet",
            })}
            {field("category", "Category", {
              as: "select",
              children: (
                <>
                  <option value="">Select a category</option>
                  {CATEGORIES.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </>
              ),
            })}
            {field("site", "Site", {
              as: "select",
              children: SITES.map((v) => (
                <option key={v} value={v}>
                  {v === "Other" ? "Other / outside campus" : v}
                </option>
              )),
            })}
            {values.site === "Other" &&
              field("siteDetail", "Specify location", {
                placeholder: "Place, street, or address",
              })}
          </div>
        </section>
        <section className="border-t border-line pt-6">
          <h2 className="mb-4 font-bold">03 · Location and date</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {field(
              "location",
              values.type === "Found" ? "Found at" : "Last seen at",
              { placeholder: "Building, hallway, floor or outdoor area" },
            )}
            {field(
              "itemDate",
              values.type === "Found" ? "Date found" : "Date last seen",
              { type: "date", max: today() },
            )}
          </div>
        </section>
        <section className="space-y-5 border-t border-line pt-6">
          <h2 className="font-bold">04 · Description and photograph</h2>
          {field("description", "Public description", {
            as: "textarea",
            minLength: 10,
            rows: 5,
            hint: "At least 10 characters. Do not include contact details, student IDs or secret ownership clues.",
          })}
          <ImageUpload
            value={values.image}
            onChange={(image) => set("image", image)}
            onBusy={setBusy}
          />
        </section>
        <section className="space-y-4 border-t border-line pt-6">
          <h2 className="font-bold">05 · Review and submit</h2>
          {field("validDays", "Listing validity", {
            as: "select",
            children: [2, 3, 4].map((days) => (
              <option key={days} value={days}>
                {days} days
              </option>
            )),
          })}
          <p className="text-xs leading-6 text-muted">
            Reporting as {user.name} · {values.site}. Reports are locked after
            submission. OSA controls moderation; expiry preserves your history.
          </p>
          <p className="notice">
            Every report starts Pending Review. Physical turnover is separate
            from report approval. Receiving offices and pickup arrangements
            require stakeholder confirmation.
          </p>
          {errors.form && (
            <p role="alert" className="text-rose-800">
              {errors.form}
            </p>
          )}
          {Object.values(errors).some(Boolean) && (
            <p role="alert" className="text-xs text-rose-800">
              Please correct the identified fields before submitting.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={busy || !!submitted}>
              {busy ? "Reading photograph…" : "Submit for review"}
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                navigate(user.role === "osa" ? "/osa/reports" : "/my-reports")
              }
            >
              Cancel
            </Button>
          </div>
        </section>
      </form>
      {submitted && (
        <ConfirmDialog
          title="Report received"
          onClose={() =>
            navigate(user.role === "osa" ? "/osa/reports" : "/my-reports")
          }
        >
          <p className="mb-3">
            Reference: <strong>{submitted}</strong>
          </p>
          <StatusBadge status="Pending Review" />
          <p className="my-4 leading-6 text-muted">
            OSA has a new-report notification. Your report is visible in
            personal history while awaiting review.
          </p>
          <Button
            onClick={() =>
              navigate(user.role === "osa" ? "/osa/reports" : "/my-reports")
            }
          >
            Track my report
          </Button>
        </ConfirmDialog>
      )}
    </div>
  );
}
