import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useReports } from "../../context/ReportContext";
import FormField from "../../components/forms/FormField";
import ImageUpload from "../../components/forms/ImageUpload";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { Button, PageHeading } from "../../components/common/UI";
import { CATEGORIES } from "../../data/constants";
import { today, dateLabel } from "../../utils/format";
import { validateReport } from "../../utils/reportRules";

const LOCATIONS = {
  Arlegui: {
    "Building A": ["1st Floor", "2nd Floor", "3rd Floor"],
    Library: ["1st Floor", "2nd Floor"],
    Gymnasium: ["Ground Floor", "2nd Floor"],
    "Math Department": ["1st Floor", "2nd Floor"],
    Other: ["Other / outdoor area"],
  },
  Casal: {
    "Main Building": ["Ground Floor", "1st Floor", "2nd Floor"],
    "Engineering Building": ["1st Floor", "2nd Floor", "3rd Floor"],
    Library: ["1st Floor", "2nd Floor"],
    "Computer Lab": ["1st Floor", "2nd Floor", "3rd Floor"],
    Other: ["Other / outdoor area"],
  },
};

export default function PublicReport() {
  const { user, actor } = useAuth(),
    { reports, act } = useReports(),
    [params] = useSearchParams(),
    navigate = useNavigate();
  const initialType = params.get("type") === "Found" ? "Found" : "Lost";
  const [v, setV] = useState({
    type: initialType,
    title: "",
    category: "",
    site: user?.site || "Arlegui",
    siteDetail: "",
    building: "",
    buildingDetail: "",
    floor: "",
    floorDetail: "",
    area: "",
    itemDate: "",
    itemTime: "",
    description: "",
    image: "",
    validDays: 4,
  });
  const [person, setPerson] = useState({
    type: user ? "affiliate" : "",
    name: user?.name || "",
    phone: "",
    email: user?.email || "",
    number: user?.number || "",
    department: user?.program || "",
    purpose: "",
    company: "",
    year: "",
  });
  const [errors, setErrors] = useState({}),
    [review, setReview] = useState(false),
    [saved, setSaved] = useState(""),
    [busy, setBusy] = useState(false);
  const submitted = useRef(false),
    formRef = useRef(null);
  useEffect(() => {
    setV((old) => ({ ...old, type: initialType }));
    setErrors({});
  }, [initialType]);
  const set = (key, value) => {
    setV((old) => ({
      ...old,
      [key]: value,
      ...(key === "site"
        ? {
            siteDetail: "",
            building: "",
            buildingDetail: "",
            floor: "",
            floorDetail: "",
            area: "",
          }
        : key === "building"
          ? { buildingDetail: "", floor: "", floorDetail: "" }
          : key === "floor"
            ? { floorDetail: "" }
            : {}),
    }));
    setErrors((old) => ({ ...old, [key]: "" }));
  };
  const who = (key, value) => {
    setPerson((old) => ({ ...old, [key]: value }));
    setErrors((old) => ({ ...old, [`person-${key}`]: "" }));
  };
  const outside = v.site === "Other";
  const location = (
    outside
      ? [v.siteDetail.trim(), v.area.trim()]
      : [
          v.building === "Other" ? v.buildingDetail.trim() : v.building,
          v.floor === "Other / specify" ? v.floorDetail.trim() : v.floor,
          v.area.trim(),
        ]
  )
    .filter(Boolean)
    .join(" · ");
  const payload = {
    ...v,
    location,
    reporter: {
      type: person.type,
      name: person.name.trim(),
      phone: person.phone,
      email: person.email.trim(),
      ...(person.type === "affiliate"
        ? {
            number: person.number,
            department: person.department,
            year: person.year,
          }
        : { purpose: person.purpose, company: person.company }),
    },
  };
  function check(e) {
    e.preventDefault();
    const next = validateReport(payload, reports, actor);
    if (!outside) {
      if (!v.building) next.building = "Choose a building or Other.";
      if (v.building === "Other" && !v.buildingDetail.trim())
        next.buildingDetail = "Specify the building or outdoor area.";
      if (v.building !== "Other" && !v.floor)
        next.floor = "Choose a floor or Other / specify.";
      if (v.floor === "Other / specify" && !v.floorDetail.trim())
        next.floorDetail = "Specify the floor or level.";
      if (!v.area.trim()) next.area = "Enter the room or nearby area.";
    }
    if (!v.itemTime) next.itemTime = "Enter the approximate time.";
    else if (
      v.itemDate === today() &&
      Date.parse(`${v.itemDate}T${v.itemTime}:00+08:00`) > Date.now()
    )
      next.itemTime = "The event time cannot be in the future.";
    if (!["affiliate", "visitor"].includes(person.type))
      next["person-type"] = "Choose TIP affiliated or Guest / visitor.";
    if (!person.name.trim()) next["person-name"] = "Enter your name.";
    if (!/^\d{11}$/.test(person.phone))
      next["person-phone"] = "Enter an 11-digit contact number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email))
      next["person-email"] = "Enter a valid email address.";
    if (person.type === "affiliate") {
      if (!person.number.trim())
        next["person-number"] = "Enter your school or faculty ID.";
      if (!person.department.trim())
        next["person-department"] = "Enter your department or office.";
    } else if (person.type === "visitor" && !person.purpose.trim())
      next["person-purpose"] = "Enter your purpose of visit.";
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        formRef.current?.querySelector('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    setReview(true);
  }
  function save() {
    if (submitted.current) return;
    submitted.current = true;
    try {
      const id = act("SUBMIT", payload);
      setSaved(id);
      setReview(false);
    } catch (err) {
      submitted.current = false;
      setErrors({ form: err.message });
      setReview(false);
    }
  }
  const field = (key, label, props = {}) => (
    <FormField
      label={label}
      required
      value={v[key]}
      error={errors[key]}
      onChange={(e) => set(key, e.target.value)}
      {...props}
    />
  );
  const personal = (key, label, props = {}) => (
    <FormField
      label={label}
      required
      value={person[key]}
      error={errors[`person-${key}`]}
      onChange={(e) => who(key, e.target.value)}
      {...props}
    />
  );
  const options = (items) => (
    <>
      <option value="">Select an option</option>
      {items.map((x) => (
        <option key={x}>{x}</option>
      ))}
    </>
  );
  return (
    <>
      <Link className="public-back" to="/home">
        ← Back to dashboard
      </Link>
      <PageHeading
        eyebrow="A LITTLE DETAIL GOES A LONG WAY"
        title={v.type === "Lost" ? "Report a lost item" : "Report a found item"}
      >
        Tell us about the item. OSA will review your report before it appears
        publicly.
      </PageHeading>
      <div className="public-form-layout">
        <form ref={formRef} noValidate onSubmit={check} className="public-form">
          <section>
            <div className="public-step">
              <span>01</span>
              <div>
                <h2>About the item</h2>
                <p>Start with details someone can recognize.</p>
              </div>
            </div>
            <div className="mb-5 grid grid-cols-2 gap-3">
              {["Lost", "Found"].map((type) => (
                <Button
                  key={type}
                  aria-pressed={v.type === type}
                  variant={v.type === type ? "primary" : "secondary"}
                  onClick={() => set("type", type)}
                >
                  {type} Item
                </Button>
              ))}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {field("title", "Item title", {
                maxLength: 90,
                placeholder: "e.g. Black wallet",
              })}
              {field("category", "Category", {
                as: "select",
                children: options(CATEGORIES),
              })}
            </div>
            <div className="mt-5">
              {field("description", "Public description", {
                as: "textarea",
                rows: 3,
                minLength: 10,
                placeholder: "Color, size, and general appearance…",
                hint: "At least 10 characters. Keep contact details and private ownership clues out of this description.",
              })}
            </div>
            <div className="mt-5">
              <ImageUpload
                value={v.image}
                onChange={(image) => set("image", image)}
                onBusy={setBusy}
              />
            </div>
          </section>
          <section>
            <div className="public-step">
              <span>02</span>
              <div>
                <h2>Where and when?</h2>
                <p>
                  {v.type === "Lost"
                    ? "Where did you last see it?"
                    : "Where did you find it?"}
                </p>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {field("site", "Campus", {
                as: "select",
                children: (
                  <>
                    {Object.keys(LOCATIONS).map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                    <option value="Other">Other / outside campus</option>
                  </>
                ),
              })}
              {outside ? (
                field("siteDetail", "Specify location", {
                  placeholder: "Place, street, or address",
                  maxLength: 200,
                  hint: "For example, a bus stop, nearby shop, or another campus.",
                })
              ) : (
                <>
                  {field("building", "Building", {
                    as: "select",
                    children: options(Object.keys(LOCATIONS[v.site])),
                  })}
                  {v.building === "Other" ? (
                    <>
                      {field("buildingDetail", "Specify building or area", {
                        placeholder: "e.g. Annex building or outdoor court",
                        maxLength: 120,
                      })}
                      {field("floor", "Floor / level (optional)", {
                        required: false,
                        placeholder:
                          "e.g. Ground floor; leave blank for outdoor areas",
                      })}
                    </>
                  ) : (
                    <>
                      {field("floor", "Floor", {
                        as: "select",
                        disabled: !v.building,
                        children: options([
                          ...(LOCATIONS[v.site][v.building] || []),
                          "Other / specify",
                        ]),
                      })}
                      {v.floor === "Other / specify" &&
                        field("floorDetail", "Specify floor or level", {
                          placeholder: "e.g. Basement or 4th floor",
                          maxLength: 80,
                        })}
                    </>
                  )}
                </>
              )}
              {field("area", v.type === "Lost" ? "Last seen at" : "Found at", {
                required: !outside,
                label: outside
                  ? "Nearby landmark / area (optional)"
                  : v.type === "Lost"
                    ? "Last seen at"
                    : "Found at",
                placeholder: outside
                  ? "e.g. Beside the entrance or near a bus stop"
                  : "e.g. Room 204 or library corridor",
              })}
              {field(
                "itemDate",
                v.type === "Lost" ? "Date last seen" : "Date found",
                { type: "date", max: today() },
              )}
              {field(
                "itemTime",
                v.type === "Lost"
                  ? "Approximate time lost"
                  : "Approximate time found",
                { type: "time" },
              )}
            </div>
          </section>
          <section>
            <div className="public-step">
              <span>03</span>
              <div>
                <h2>How can we reach you?</h2>
                <p>Contact details stay out of the public listing.</p>
              </div>
            </div>
            <fieldset>
              <legend className="mb-3 text-xs font-semibold">I am a… *</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["affiliate", "TIP affiliated"],
                  ["visitor", "Guest / visitor"],
                ].map(([type, label]) => (
                  <label
                    key={type}
                    className={`public-reporter-choice ${person.type === type ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="reporter-type"
                      value={type}
                      checked={person.type === type}
                      onChange={() => who("type", type)}
                    />
                    <span>
                      {label}
                      <small>
                        {type === "affiliate"
                          ? "Student, faculty, or staff"
                          : "Visiting from outside T.I.P."}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
              {errors["person-type"] && (
                <p role="alert" className="mt-2 text-xs text-rose-800">
                  {errors["person-type"]}
                </p>
              )}
            </fieldset>
            {person.type && (
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {personal("name", "Full name", { autoComplete: "name" })}
                {personal("phone", "Contact number", {
                  type: "tel",
                  inputMode: "numeric",
                  autoComplete: "tel-national",
                  placeholder: "09XXXXXXXXX",
                  hint: "11 digits. Used for follow-up, not to sign in.",
                  onChange: (e) =>
                    who(
                      "phone",
                      e.target.value.replace(/\D/g, "").slice(0, 11),
                    ),
                })}
                {personal(
                  "email",
                  person.type === "affiliate" ? "TIP email" : "Email",
                  { type: "email", autoComplete: "email" },
                )}
                {person.type === "affiliate" ? (
                  <>
                    {personal("number", "School ID / faculty ID")}
                    {personal("department", "Department / office")}
                    {personal("year", "Year level (optional)", {
                      required: false,
                      as: "select",
                      children: options([
                        "1st Year",
                        "2nd Year",
                        "3rd Year",
                        "4th Year",
                        "5th Year",
                        "Graduate / Other",
                      ]),
                    })}
                  </>
                ) : (
                  <>
                    {personal("company", "Company / organization (optional)", {
                      required: false,
                    })}
                    <div className="sm:col-span-2">
                      {personal("purpose", "Purpose of visiting TIP", {
                        as: "textarea",
                        rows: 2,
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
          <section>
            <details>
              <summary className="cursor-pointer text-xs font-semibold">
                Listing options
              </summary>
              <div className="mt-4">
                {field("validDays", "Listing validity", {
                  as: "select",
                  children: [2, 3, 4].map((x) => (
                    <option value={x} key={x}>
                      {x} days
                    </option>
                  )),
                  hint: "After expiry, your report stays in My Reports.",
                })}
              </div>
            </details>
            <p className="mt-5 text-xs leading-6 text-muted">
              Review your details before sending. Submitted reports cannot be
              edited here.
            </p>
            {Object.values(errors).some(Boolean) && (
              <p className="my-3 text-sm text-rose-800" role="alert">
                {errors.form || "Please check the highlighted fields."}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="submit" disabled={busy || !!saved}>
                {busy ? "Reading photograph…" : "Review report →"}
              </Button>
              <Link className="btn btn-secondary" to="/home">
                Cancel
              </Link>
            </div>
          </section>
        </form>
        <aside className="public-form-aside">
          <div className="public-aside-mark" aria-hidden="true">
            {v.type === "Found" ? "＋" : "⌕"}
          </div>
          <h2>
            {v.type === "Found"
              ? "Thanks for looking out for someone."
              : "Let’s help it find its way back."}
          </h2>
          <p>
            {v.type === "Found"
              ? outside
                ? "This item was found outside the listed campuses. Ask OSA for guidance on the appropriate receiving office; reporting does not confirm acceptance or custody."
                : `After reporting, ask OSA or Campus Security at ${v.site} about turning over the item. Staff will confirm physical receipt.`
              : "Check the found-item reports too. Someone may already have reported your belonging."}
          </p>
          {v.type === "Lost" && (
            <Link to="/browse?type=Found">Browse found items →</Link>
          )}
          <hr />
          <h3>What happens next?</h3>
          <ol>
            <li>
              <strong>1. Review</strong>Check your details, then confirm.
            </li>
            <li>
              <strong>2. OSA checks</strong>Your report starts Pending Review.
            </li>
            <li>
              <strong>3. Follow updates</strong>Keep your reference and open My
              Reports.
            </li>
          </ol>
          <p className="text-xs">
            Local demo: use fictional details. Reports remain in this browser;
            no message is sent to your phone or email.
          </p>
        </aside>
      </div>
      {review && (
        <ConfirmDialog
          title="Review before submitting"
          onClose={() => setReview(false)}
        >
          <span className="public-type">{v.type} report</span>
          <h3 className="my-4 text-lg font-bold">{v.title}</h3>
          <dl className="public-review">
            {[
              ["Category", v.category],
              ["Campus / place", outside ? `Other · ${v.siteDetail}` : v.site],
              ["Location", location],
              ["Date & time", `${dateLabel(v.itemDate)} · ${v.itemTime}`],
              [
                "Reporter",
                `${person.name} · ${person.type === "visitor" ? "Guest / visitor" : "TIP affiliated"}`,
              ],
              ["Contact", person.phone],
              ["Email", person.email],
              [
                "Photo",
                v.image
                  ? "1 attached (private until reviewed)"
                  : "None attached",
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="my-4 break-words text-sm leading-6">{v.description}</p>
          {v.image && (
            <img
              src={v.image}
              alt="Report photo preview"
              className="mb-4 max-h-40 w-full object-contain"
            />
          )}
          <p className="notice mb-4">
            Your reference is created when the report is saved.{" "}
            {v.type === "Found"
              ? "Submitting does not confirm physical turnover."
              : "Keep private evidence for the ownership check."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={save}>Confirm and submit</Button>
            <Button variant="secondary" onClick={() => setReview(false)}>
              Back to edit
            </Button>
          </div>
        </ConfirmDialog>
      )}
      {saved && (
        <ConfirmDialog
          title="Report received"
          onClose={() => navigate("/my-reports")}
        >
          <p className="text-sm text-muted">
            Keep this reference for follow-up with OSA.
          </p>
          <div className="public-receipt">
            <small>YOUR REPORT REFERENCE</small>
            <strong>{saved}</strong>
            <span>Pending Review</span>
          </div>
          <p className="my-5 leading-6">
            Your report is saved in this browser and waiting for OSA review.
            {v.type === "Found"
              ? outside
                ? " Ask OSA for guidance on the appropriate receiving office for an item found outside campus. Physical receipt is not confirmed."
                : ` Ask OSA or Campus Security at ${v.site} about physical turnover.`
              : " You can follow its progress in My Reports."}
          </p>
          <Button onClick={() => navigate("/my-reports")}>
            Track my report
          </Button>
        </ConfirmDialog>
      )}
    </>
  );
}
