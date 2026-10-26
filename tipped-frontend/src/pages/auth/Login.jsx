import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { DEMO_USERS } from "../../data/mockData";
import { Button } from "../../components/common/UI";
import FormField from "../../components/forms/FormField";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { API_MODE, apiRequest } from "../../api/client";

export default function Login() {
  const { user, login, guestLogin } = useAuth(),
    navigate = useNavigate(),
    [role, setRole] = useState("student"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [reset, setReset] = useState(false),
    [resetMessage, setResetMessage] = useState(""),
    [resetError, setResetError] = useState(""),
    [verificationMessage, setVerificationMessage] = useState("");

  if (user && user.role !== "guest")
    return <Navigate to={user.role === "osa" ? "/osa" : "/home"} replace />;

  function fillAccount(account) {
    setRole(account.role);
    setEmail(account.email);
    setPassword(account.password);
    setError("");
  }

  return (
    <div className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-heading">
          <h1 id="login-title">Sign in</h1>
          <p>Choose your account type to continue.</p>
        </div>

        <fieldset className="login-role-picker">
          <legend>Sign in as</legend>
          <div className="login-role-options">
            <label className={role === "student" ? "selected" : ""}>
              <input
                type="radio"
                name="account-type"
                value="student"
                checked={role === "student"}
                onChange={() => {
                  setRole("student");
                  setError("");
                }}
              />
              <span>Student</span>
            </label>
            <label className={role === "osa" ? "selected" : ""}>
              <input
                type="radio"
                name="account-type"
                value="osa"
                checked={role === "osa"}
                onChange={() => {
                  setRole("osa");
                  setError("");
                }}
              />
              <span>OSA administrator</span>
            </label>
          </div>
        </fieldset>

        <form
          className="login-form"
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              await login(email, password, role);
            } catch (err) {
              setError(err.message);
            }
          }}
        >
          <FormField
            label="Account email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <FormField
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && (
            <p role="alert" className="login-error">
              {error}
            </p>
          )}
          <Button type="submit" className="login-submit">
            Sign in
          </Button>
        </form>

        <button
          type="button"
          className="login-text-button"
          onClick={() => {
            setReset(true);
            setResetMessage("");
            setResetError("");
          }}
        >
          Forgot password?
        </button>
        {API_MODE && (
          <button
            type="button"
            className="login-text-button"
            onClick={async () => {
              setVerificationMessage("");
              setError("");
              try {
                const result = await apiRequest("/auth/resend-verification", {
                  method: "POST",
                  body: JSON.stringify({ email }),
                });
                setVerificationMessage(result.message);
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            Resend verification email
          </button>
        )}
        {verificationMessage && <p role="status">{verificationMessage}</p>}

        <div className="login-divider">
          <span>or</span>
        </div>
        <Button
          variant="secondary"
          className="login-guest"
          onClick={async () => {
            setError("");
            try {
              await guestLogin();
              navigate("/home");
            } catch (err) {
              setError(err.message);
            }
          }}
        >
          Continue as guest
        </Button>
        <p className="login-guest-hint">
          Browse and report without an account.
        </p>

        {!API_MODE && (
          <details className="login-demo">
            <summary>Demo account details</summary>
            <div className="login-demo-list">
              {DEMO_USERS.map((account) => (
                <div className="login-demo-account" key={account.id}>
                  <div>
                    <strong>
                      {account.role === "osa"
                        ? "OSA administrator"
                        : account.id === "student-alex"
                          ? "Student"
                          : "Second student"}
                    </strong>
                    <p>{account.email}</p>
                    <p>Password: {account.password}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fillAccount(account)}
                    aria-label={`Use ${account.name}`}
                  >
                    Use account
                  </button>
                </div>
              ))}
            </div>
          </details>
        )}

        <p className="login-register">
          New student? <Link to="/register">Create an account</Link>
        </p>
      </section>

      {reset && (
        <ConfirmDialog title="Reset password" onClose={() => setReset(false)}>
          {API_MODE ? (
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                setResetError("");
                setResetMessage("");
                try {
                  const result = await apiRequest(
                    "/auth/password-reset/request",
                    {
                      method: "POST",
                      body: JSON.stringify({ email }),
                    },
                  );
                  setResetMessage(result.message);
                } catch (err) {
                  setResetError(err.message);
                }
              }}
            >
              <p>
                Enter your account email. If an account exists, we will send a
                reset link.
              </p>
              <FormField
                label="Account email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              {resetError && <p role="alert">{resetError}</p>}
              {resetMessage && <p role="status">{resetMessage}</p>}
              <Button type="submit">Send reset link</Button>
            </form>
          ) : (
            <p>Password reset is available after backend setup.</p>
          )}
        </ConfirmDialog>
      )}
    </div>
  );
}
