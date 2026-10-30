import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../api/client";
import { Button, PageHeading } from "../../components/common/UI";
import FormField from "../../components/forms/FormField";
import GoogleSignIn from "../../components/forms/GoogleSignIn";
import { SITES } from "../../data/constants";
export default function Register() {
  const { register } = useAuth();
  const [params] = useSearchParams();
  const google = params.get("google") === "complete";
  const [identity, setIdentity] = useState(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (google)
      apiRequest("/auth/google/complete", { noRefresh: true })
        .then(setIdentity)
        .catch((err) => setError(err.message));
  }, [google]);
  return (
    <div className="mx-auto max-w-[820px]">
      <PageHeading
        title={
          google ? "Complete your student profile" : "Create a student account"
        }
      >
        Your account requires eligibility review before it is activated.
      </PageHeading>
      {!google && <GoogleSignIn />}
      <form
        className="panel"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy || message) return;
          setBusy(true);
          setError("");
          const values = Object.fromEntries(new FormData(event.currentTarget));
          try {
            const result = google
              ? await apiRequest("/auth/google/complete", {
                  method: "POST",
                  body: JSON.stringify(values),
                  noRefresh: true,
                })
              : await register(values);
            setMessage(result.message);
          } catch (err) {
            setError(err.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Full name"
            name="name"
            required
            defaultValue={identity?.name}
            key={identity?.name || "name"}
          />
          {google ? (
            <div>
              <p className="text-xs font-semibold">Google account email</p>
              <p className="mt-3 break-words">
                {identity?.email || "Loading account…"}
              </p>
            </div>
          ) : (
            <FormField
              label="Account email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          )}
          <FormField label="Student number" name="number" required />
          <FormField label="Program" name="program" required />
          <FormField label="Site" name="site" as="select">
            {SITES.map((site) => (
              <option key={site}>{site}</option>
            ))}
          </FormField>
          {!google && (
            <FormField
              label="TIPPED password"
              name="password"
              type="password"
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              required
              hint="At least 12 characters. Use a unique password; do not enter your Google password."
            />
          )}
        </div>
        <p className="notice my-5">
          Registration does not grant OSA or administrator access. An authorized
          administrator must confirm your eligibility.
        </p>
        {error && (
          <p role="alert" className="text-rose-800">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="notice my-5">
            {message}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={busy || !!message || (google && !identity)}
          >
            {busy ? "Submitting…" : "Request account"}
          </Button>
          <Link to="/login" className="btn btn-secondary">
            Back to sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
