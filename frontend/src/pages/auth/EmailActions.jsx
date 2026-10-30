import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, PageHeading } from "../../components/common/UI";
import FormField from "../../components/forms/FormField";
import { apiRequest } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const content = {
  verify: {
    title: "Verify your email",
    description: "Confirm your email address to activate your TIPPED account.",
    endpoint: "/auth/verify-email",
  },
  reset: {
    title: "Choose a new password",
    description: "Use at least 12 characters for your new password.",
    endpoint: "/auth/password-reset/complete",
  },
  guest: {
    title: "Open your private report link",
    description:
      "This one-time link will sign you in to securely follow your report.",
    endpoint: "/auth/guest-track",
  },
};

export default function EmailActions({ action }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { trackGuest } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const info = content[action];
  const token = params.get("token") || "";

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (!token) throw new Error("This link is missing its token.");
      if (action === "guest") {
        await trackGuest(token);
        navigate("/home", { replace: true });
        return;
      }
      const body = action === "reset" ? { token, password } : { token };
      const result = await apiRequest(info.endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setMessage(result.message);
      if (action === "verify" || action === "reset") {
        window.setTimeout(() => navigate("/login", { replace: true }), 1400);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[640px]">
      <PageHeading title={info.title}>{info.description}</PageHeading>
      <form className="panel space-y-4" onSubmit={submit}>
        {action === "reset" && (
          <FormField
            label="New password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        )}
        {error && (
          <p role="alert" className="text-rose-800">
            {error}
          </p>
        )}
        {message && <p role="status">{message}</p>}
        {!message && (
          <Button type="submit" disabled={busy}>
            {busy
              ? "Please wait…"
              : action === "guest"
                ? "Open report"
                : "Continue"}
          </Button>
        )}
        <Link to="/login" className="btn btn-secondary">
          Back to sign in
        </Link>
      </form>
    </div>
  );
}
