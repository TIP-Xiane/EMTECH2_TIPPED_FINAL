import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button, PageHeading } from "../../components/common/UI";
import FormField from "../../components/forms/FormField";
import { SITES } from "../../data/constants";
export default function Register() {
  const { register } = useAuth(),
    navigate = useNavigate(),
    [error, setError] = useState("");
  return (
    <div className="mx-auto max-w-[820px]">
      <PageHeading title="Student registration preview">
        Use fictional details. No institutional identity verification or
        permanent login account is created.
      </PageHeading>
      <form
        className="panel"
        onSubmit={(e) => {
          e.preventDefault();
          const values = Object.fromEntries(new FormData(e.currentTarget));
          if (values.password.length < 8) {
            setError("Use at least eight characters.");
            return;
          }
          register(values);
          navigate("/home");
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
            minLength={8}
            autoComplete="new-password"
            required
          />
        </div>
        <p className="notice my-5">
          Creates a tab-session mock profile with a distinct ID; its password is
          discarded. Use the supplied demo credentials for later sign-ins.
        </p>
        {error && (
          <p role="alert" className="text-rose-800">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button type="submit">Create demo profile</Button>
          <Link to="/login" className="btn btn-secondary">
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}
