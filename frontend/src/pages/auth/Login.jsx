import { useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/common/UI";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import GoogleSignIn from "../../components/forms/GoogleSignIn";
const messages = {
  pending: "Your account is waiting for administrator approval.",
  failed: "Google sign-in could not be completed. Please try again.",
  cancelled: "Google sign-in was cancelled.",
  link_required:
    "An account already uses this email. Sign in with your TIPPED password, then link Google from your profile.",
  linked: "Google account linked. You can now continue with Google.",
  link_failed:
    "Unable to link Google. Use the same email as your TIPPED account and try again.",
};
export default function Login() {
  const { user, login } = useAuth();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [help, setHelp] = useState(false);
  if (user)
    return <Navigate to={user.role === "osa" ? "/osa" : "/home"} replace />;
  return (
    <div className="login-page tipped-access-layout">
      <section
        className="login-card tipped-signin-card"
        aria-labelledby="login-title"
      >
        <Link to="/home" className="tipped-card-brand" aria-label="TIPPED home">
          <span aria-hidden="true">T</span>
          <strong>
            TIPPED<small>CAMPUS LOST &amp; FOUND</small>
          </strong>
        </Link>
        <div className="login-heading">
          <p className="tipped-form-eyebrow">ACCOUNT ACCESS</p>
          <h1 id="login-title">Welcome back.</h1>
          <p>Sign in to follow your reports and updates.</p>
        </div>
        {messages[params.get("google")] && (
          <p role="status" className="notice my-4">
            {messages[params.get("google")]}
          </p>
        )}
        <form
          className="login-form"
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy) return;
            setBusy(true);
            setError("");
            try {
              await login(email, password, "student");
            } catch (err) {
              setError(err.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="auth-field">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>
          <div className="auth-field">
            <div className="auth-password-label">
              <label htmlFor="login-password">Password</label>
              <button type="button" onClick={() => setHelp(true)}>
                Forgot password?
              </button>
            </div>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>
          {error && (
            <p id="login-error" role="alert" className="login-error">
              {error}
            </p>
          )}
          <Button type="submit" className="login-submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <div className="login-divider">
          <span>or</span>
        </div>
        <div className="auth-provider">
          <GoogleSignIn />
        </div>
        <p className="login-register">
          New to TIPPED? <Link to="/register">Create an account</Link>
        </p>
        <p className="auth-admin-link">
          <a href="/admin/">Administrator panel</a>
        </p>
      </section>
      {help && (
        <ConfirmDialog
          title="Password assistance"
          onClose={() => setHelp(false)}
        >
          <p className="text-sm leading-7">
            Contact your TIPPED administrator to verify your identity and reset
            your TIPPED password. Email password reset is not available yet.
          </p>
          <p className="mt-3 text-sm leading-7">
            If you registered through Google, use Continue with Google. Never
            share your Google password with TIPPED.
          </p>
          <Button
            variant="secondary"
            className="mt-5"
            onClick={() => setHelp(false)}
          >
            Back to sign in
          </Button>
        </ConfirmDialog>
      )}
    </div>
  );
}
