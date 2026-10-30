import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button, PageHeading } from "../../components/common/UI";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import FormField from "../../components/forms/FormField";
import { API_MODE, apiRequest } from "../../api/client";
export default function Profile() {
  const { user } = useAuth(),
    [reset, setReset] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="mx-auto max-w-[760px]">
      <PageHeading title={user.role === "osa" ? "OSA account" : "My profile"}>
        {API_MODE
          ? "Your account details and assigned access."
          : "Demonstration identity. Institutional verification is not connected."}
      </PageHeading>
      <div className="panel">
        <h2 className="text-xl font-bold">{user.name}</h2>
        <dl className="my-6 grid gap-5 sm:grid-cols-2">
          {[
            ["Identifier", user.email],
            ["Role", user.role === "osa" ? "OSA reviewer" : "Student"],
            ["Assigned site(s)", user.sites?.join(" & ") || user.site],
            [
              "Program / account",
              user.program || "Provisioned reviewer preview",
            ],
            ...(user.number ? [["Student number", user.number]] : []),
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="mt-2 break-words">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="notice">
          {API_MODE
            ? "Contact OSA if your account details or assigned access need to change."
            : "Official account provisioning, brand assets, receiving offices, verification criteria and retention policies require stakeholder confirmation. No official logo or deployment is asserted."}
        </p>
        <Button
          variant="secondary"
          className="mt-5"
          onClick={() => {
            setReset(true);
            setSent(false);
            setError("");
          }}
        >
          {API_MODE ? "Request password reset" : "Password reset preview"}
        </Button>
      </div>
      {reset && (
        <ConfirmDialog
          title={API_MODE ? "Request password reset" : "Password reset preview"}
          onClose={() => setReset(false)}
        >
          {sent ? (
            <p role="status">
              {API_MODE
                ? "If an active account exists, a reset email will be sent."
                : "Preview request completed. No email was sent."}
            </p>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!API_MODE) {
                  setSent(true);
                  return;
                }
                try {
                  throw new Error(
                    "Contact the administrator for password reset. Email reset is not connected yet.",
                  );
                } catch (error) {
                  setError(error.message);
                }
              }}
            >
              <FormField
                label="Account email"
                type="email"
                required
                defaultValue={user.email}
              />
              {!API_MODE && (
                <p className="notice my-4">No email service is connected.</p>
              )}
              {error && (
                <p role="alert" className="my-4 text-rose-800">
                  {error}
                </p>
              )}
              <Button type="submit">
                {API_MODE ? "Send reset link" : "Preview reset request"}
              </Button>
            </form>
          )}
        </ConfirmDialog>
      )}
    </div>
  );
}
