import { lazy, Suspense, useEffect, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import PublicNavbar, {
  PublicFooter,
  WorkspaceNavbar,
} from "./components/layout/PublicNavbar";
import OSASidebar from "./components/layout/OSASidebar";
import Footer from "./components/layout/Footer";
import WorkflowDialogs from "./components/layout/WorkflowDialogs";
import { Button, LoadingState } from "./components/common/UI";
import { useAuth } from "./context/AuthContext";
import { useReports } from "./context/ReportContext";
import { useNotifications } from "./context/NotificationContext";
import useClock from "./hooks/useClock";
import { API_MODE } from "./api/client";
const Home = lazy(() => import("./pages/student/PublicHome"));
const PublicBrowse = lazy(() => import("./pages/student/PublicBrowse"));
const PublicReport = lazy(() => import("./pages/student/PublicReport"));
const Browse = lazy(() => import("./pages/student/Browse"));
const ReportItem = lazy(() => import("./pages/student/ReportItem"));
const MyReports = lazy(() => import("./pages/student/MyReports"));
const Profile = lazy(() => import("./pages/student/Profile"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const EmailActions = lazy(() => import("./pages/auth/EmailActions"));
const Overview = lazy(() => import("./pages/osa/Overview"));
const Reports = lazy(() => import("./pages/osa/Reports"));
const Records = lazy(() => import("./pages/osa/Records"));

export default function App() {
  const { user, actor, signOut, authLoading } = useAuth(),
    { reports, act, storageError, apiNotice, stateLoading } = useReports(),
    { unread } = useNotifications(),
    navigate = useNavigate(),
    location = useLocation();
  const loginView =
    (!user || user.role === "guest") && location.pathname === "/login";
  const publicView = user?.role !== "osa" && location.pathname !== "/login";
  const osaView = user?.role === "osa";
  const Header = osaView ? WorkspaceNavbar : publicView ? PublicNavbar : Navbar;
  const [dialog, setDialog] = useState(null),
    [message, setMessage] = useState("");
  useClock();
  useEffect(() => {
    if (publicView) window.scrollTo(0, 0);
  }, [location.pathname, publicView]);
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(""), 6000);
    return () => clearTimeout(id);
  }, [message]);
  if (authLoading || stateLoading) return <LoadingState />;
  const defaultPath = user?.role === "osa" ? "/osa" : "/home";
  function view(id) {
    setDialog({ type: user?.role === "osa" ? "review" : "details", id });
  }
  function openNotification(notification) {
    setDialog(null);
    if (user?.role === "osa") {
      const isClaim =
        notification.type === "claim_review" ||
        notification.message.startsWith("Ownership claim");
      navigate(isClaim ? "/osa/claims" : "/osa/reports");
      return;
    }
    view(notification.reportId);
  }
  function moderate(id, status) {
    if (status === "Rejected") {
      setDialog({ type: "reject", id });
      return;
    }
    Promise.resolve(act("MODERATE", { reportId: id, status }))
      .then(() =>
        setMessage(`Report marked ${status}. The reporter has been notified.`),
      )
      .catch((err) => setMessage(err.message));
  }
  const protectedPage = (role, element) =>
    !user ? (
      <Navigate to="/login" replace />
    ) : user.role !== role ? (
      <Navigate to={defaultPath} replace />
    ) : (
      element
    );
  const browse = <Browse reports={reports} user={user} onView={view} />;
  return (
    <div
      className={
        loginView
          ? "login-shell"
          : osaView
            ? "osa-portal"
            : publicView
              ? "public-portal"
              : undefined
      }
    >
      <Header
        minimal={loginView}
        user={user}
        unread={unread}
        onNotifications={() => setDialog({ type: "notifications" })}
        onSignOut={() => {
          signOut()
            .then(() => {
              setDialog(null);
              navigate("/login");
            })
            .catch((err) => setMessage(err.message));
        }}
      />
      <main
        id="main-content"
        className={`mx-auto max-w-[1260px] px-5 py-8 ${loginView ? "login-main" : ""} ${user?.role === "osa" ? "grid items-start gap-7 min-[760px]:grid-cols-[180px_minmax(0,1fr)] min-[1100px]:grid-cols-[220px_minmax(0,1fr)]" : ""}`}
      >
        {user?.role === "osa" && <OSASidebar />}
        <div className="min-w-0">
          {storageError && (
            <p role="alert" className="notice mb-5 text-rose-800">
              {storageError}
            </p>
          )}
          {apiNotice && (
            <p role="status" className="notice mb-5">
              {apiNotice}
            </p>
          )}
          <Suspense fallback={<LoadingState />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/verify-email"
                element={<EmailActions action="verify" />}
              />
              <Route
                path="/reset-password"
                element={<EmailActions action="reset" />}
              />
              <Route
                path="/guest-track"
                element={<EmailActions action="guest" />}
              />
              <Route
                path="/register"
                element={
                  !user || user.role === "guest" ? (
                    <Register />
                  ) : (
                    <Navigate to={defaultPath} replace />
                  )
                }
              />
              <Route
                path="/home"
                element={
                  user?.role === "osa" ? (
                    <Navigate to="/osa" replace />
                  ) : (
                    <Home onView={view} />
                  )
                }
              />
              <Route
                path="/browse"
                element={
                  user?.role === "osa" ? (
                    <Navigate to="/osa" replace />
                  ) : (
                    <PublicBrowse
                      reports={reports}
                      user={actor}
                      onView={view}
                    />
                  )
                }
              />
              <Route
                path="/report"
                element={
                  !user && API_MODE ? (
                    <Navigate to="/login" replace />
                  ) : user?.role === "osa" ? (
                    <Navigate to="/osa" replace />
                  ) : (
                    <PublicReport />
                  )
                }
              />
              <Route
                path="/my-reports"
                element={
                  !user && API_MODE ? (
                    <Navigate to="/login" replace />
                  ) : user?.role === "osa" ? (
                    <Navigate to="/osa" replace />
                  ) : (
                    <MyReports onView={view} />
                  )
                }
              />
              <Route
                path="/profile"
                element={protectedPage("student", <Profile />)}
              />
              <Route
                path="/osa"
                element={protectedPage("osa", <Overview onView={view} />)}
              />
              <Route
                path="/osa/reports"
                element={protectedPage(
                  "osa",
                  <Reports onView={view} onModerate={moderate} />,
                )}
              />
              {["claims", "turnover", "audit", "releases"].map((kind) => (
                <Route
                  key={kind}
                  path={`/osa/${kind}`}
                  element={protectedPage(
                    "osa",
                    <Records
                      kind={kind}
                      onView={view}
                      onReceipt={(id) => setDialog({ type: "receipt", id })}
                      onClaim={(claimId) =>
                        setDialog({ type: "claimReview", claimId })
                      }
                    />,
                  )}
                />
              ))}
              <Route
                path="/osa/registry"
                element={protectedPage("osa", browse)}
              />
              <Route
                path="/osa/create"
                element={protectedPage("osa", <ReportItem />)}
              />
              <Route
                path="/osa/account"
                element={protectedPage("osa", <Profile />)}
              />
              <Route path="*" element={<Navigate to={defaultPath} replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
      {loginView ? null : publicView || osaView ? (
        <PublicFooter workspace={osaView} />
      ) : (
        <Footer />
      )}
      {dialog && (
        <WorkflowDialogs
          key={`${dialog.type}-${dialog.id || dialog.claimId || ""}-${actor.id}`}
          dialog={dialog}
          setDialog={setDialog}
          onSuccess={setMessage}
          onModerate={moderate}
          onView={view}
          onOpenNotification={openNotification}
        />
      )}{" "}
      {message && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-xl items-start justify-between gap-3 rounded bg-ink p-4 text-sm leading-6 text-white"
        >
          <span>{message}</span>
          <Button
            variant="text"
            className="toast-dismiss-button"
            onClick={() => setMessage("")}
          >
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}
