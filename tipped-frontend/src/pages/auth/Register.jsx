import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button, PageHeading } from "../../components/common/UI";
import FormField from "../../components/forms/FormField";
import { SITES } from "../../data/constants";
import { API_MODE } from "../../api/client";
export default function Register() {
  const { register } = useAuth(),
    navigate = useNavigate(),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  return (
    <div className="mx-auto max-w-[820px]">
      <PageHeading
        title={
          API_MODE ? "Create a student account" : "Student registration preview"
        }
      >
        {API_MODE
          ? "Verify your TIP email to activate your account."
          : "Use fictional details. No institutional identity verification or permanent login account is created."}
      </PageHeading>
      <form
        className="panel"
        onSubmit={async (e) => {
          e.preventDefault();
          const values = Object.fromEntries(new FormData(e.currentTarget));
          const minimumLength = API_MODE ? 12 : 8;
          if (values.password.length < minimumLength) {
            setError(`Use at least ${minimumLength} characters.`);
            return;
          }
          try {
            const result = await register(values);
            if (API_MODE) setMessage(result.message);
            else navigate("/home");
          } catch (err) {
            setError(err.message);
          }
        }}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Full name" name="name" required />
          <FormField
            label="School identifier / email"
            name="email"
            type="email"
            required
          />
          <FormField label="Student number" name="number" required />
          <FormField label="Program" name="program" required />
          <FormField label="Site" name="site" as="select">
            {SITES.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </FormField>
          <FormField
            label="Password"
            name="password"
            type="password"
            minLength={API_MODE ? 12 : 8}
            autoComplete="new-password"
            required
          />
        </div>
        <p className="notice my-5">
          {API_MODE
            ? "Use your verified TIP email address. We will email a link before activating your account."
            : "Creates a tab-session demo profile with a distinct ID; its password is discarded. Use the supplied demo credentials for later sign-ins."}
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
          <Button type="submit">
            {API_MODE ? "Create account" : "Create demo profile"}
          </Button>
          <Link to="/login" className="btn btn-secondary">
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}
