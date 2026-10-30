import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import { Button } from "../common/UI";
export default function GoogleSignIn({ link = false }) {
  const [enabled, setEnabled] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    apiRequest("/auth/providers", { noRefresh: true })
      .then((data) => {
        if (active) setEnabled(data.google_enabled);
      })
      .catch(() => {
        if (active)
          setError("Sign-in options could not be loaded. Please reload.");
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className="my-4">
      <Button
        variant="secondary"
        className="w-full"
        disabled={!enabled || busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const result = await apiRequest(
              link ? "/auth/google/link" : "/auth/google/start",
              { method: "POST", noRefresh: true },
            );
            const url = new URL(result.url);
            if (url.origin !== "https://accounts.google.com")
              throw new Error("Invalid sign-in destination.");
            window.location.assign(url.href);
          } catch (err) {
            setError(err.message);
            setBusy(false);
          }
        }}
      >
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 48 48">
          <path
            fill="#4285F4"
            d="M43.6 20.1H24v8h11.3C33.7 32.8 29.3 36 24 36a12 12 0 1 1 0-24c3.1 0 5.9 1.2 8 3.1l5.7-5.7A19.8 19.8 0 0 0 24 4 20 20 0 1 0 44 24c0-1.3-.1-2.6-.4-3.9Z"
          />
          <path
            fill="#34A853"
            d="M6.3 33.3A20 20 0 0 0 24 44c5.4 0 10.3-2 13.9-5.3l-6.2-5.3A12 12 0 0 1 13.4 30Z"
          />
          <path
            fill="#FBBC05"
            d="M4 24c0 3.4.8 6.5 2.3 9.3l7.1-3.3a12 12 0 0 1 0-12L6.3 14.7A20 20 0 0 0 4 24Z"
          />
          <path
            fill="#EA4335"
            d="m6.3 14.7 7.1 3.3A12 12 0 0 1 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7A19.8 19.8 0 0 0 24 4 20 20 0 0 0 6.3 14.7Z"
          />
        </svg>
        {busy
          ? "Opening Google…"
          : link
            ? "Link your Google account"
            : "Continue with Google"}
      </Button>
      {!enabled && (
        <p className="mt-2 text-xs text-muted">
          Google sign-in is not available yet.
        </p>
      )}
      {error && (
        <p className="mt-2 text-sm text-rose-800" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
