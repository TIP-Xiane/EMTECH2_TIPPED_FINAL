import { useAuth } from "../../context/AuthContext";
import { PageHeading } from "../../components/common/UI";
import GoogleSignIn from "../../components/forms/GoogleSignIn";
export default function Profile() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-[760px]">
      <PageHeading title="My profile">
        Your account details and assigned access.
      </PageHeading>
      <div className="panel">
        <h2 className="text-xl font-bold">{user.name}</h2>
        <dl className="my-6 grid gap-5 sm:grid-cols-2">
          {[
            ["Email", user.email],
            ["Role", user.role === "osa" ? "OSA reviewer" : "Student"],
            ["Site", user.site],
            ["Program", user.program],
            ["Student number", user.number],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="mt-2 break-words">{value || "Not provided"}</dd>
            </div>
          ))}
        </dl>
        <h3 className="font-semibold">Google account</h3>
        <p className="mt-2 text-sm text-muted">
          Link the Google account with the same email to use Google sign-in.
          Linking does not change your permissions.
        </p>
        <GoogleSignIn link />
        <p className="notice mt-5">
          Contact your administrator for account corrections or password
          assistance.
        </p>
      </div>
    </div>
  );
}
