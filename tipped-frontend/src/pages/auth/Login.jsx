import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { DEMO_USERS } from "../../data/mockData";
import { Button, PageHeading } from "../../components/common/UI";
import FormField from "../../components/forms/FormField";
import ConfirmDialog from "../../components/common/ConfirmDialog";
export default function Login() {
  const { user, login, preview } = useAuth(),
    navigate = useNavigate(),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [reset, setReset] = useState(false),
    [sent, setSent] = useState(false);
  if (user)
    return <Navigate to={user.role === "osa" ? "/osa" : "/home"} replace />;
  function enter(id) {
    preview(id);
    navigate(id === "osa-reviewer" ? "/osa" : "/home");
  }
  return (
    <div className="mx-auto max-w-[540px]">
      <PageHeading title="Sign in to TIPPED">
        Student reporting and OSA review · Front-end demonstration only.
      </PageHeading>
      <div className="panel">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            try {
              login(email, password);
            } catch (err) {
              setError(err.message);
            }
          }}
        >
          <FormField
            label="Demo account identifier"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FormField
            label="Demo password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p role="alert" className="text-rose-800">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button type="submit">Sign in</Button>
            <Button
              variant="text"
              onClick={() => {
                setReset(true);
                setSent(false);
              }}
            >
              Forgot password?
            </Button>
          </div>
        </form>
        <p className="notice my-5">
          Public preview credentials only. Direct role switching is not secure
          authentication. Do not use real personal details.
        </p>
        <h2 className="mb-4 font-bold">Choose a demonstration account</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => enter("student-alex")}>
            Open Student account
          </Button>
          <Button onClick={() => enter("osa-reviewer")}>
            Open OSA account
          </Button>
          <Button variant="secondary" onClick={() => enter("student-bea")}>
            Second student (Bea)
          </Button>
        </div>
        <dl className="my-5 space-y-4 text-xs leading-6">
          {DEMO_USERS.map((u) => (
            <div key={u.id}>
              <dt className="font-semibold">{u.name}</dt>
              <dd className="break-all text-muted">
                {u.email}
                <br />
                {u.password}
              </dd>
            </div>
          ))}
        </dl>
        <Link className="text-burgundy underline" to="/register">
          Create a demo student profile
        </Link>
        <p className="mt-3 text-xs text-muted">No public OSA registration.</p>
      </div>
      {reset && (
        <ConfirmDialog
          title="Password reset preview"
          onClose={() => setReset(false)}
        >
          {sent ? (
            <p role="status">Preview completed. No email was sent.</p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <FormField label="Account identifier" required />
              <p className="notice my-4">
                This demonstrates the interface only.
              </p>
              <Button type="submit">Preview request</Button>
            </form>
          )}
        </ConfirmDialog>
      )}
    </div>
  );
}
