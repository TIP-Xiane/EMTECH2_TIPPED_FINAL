import { Link, NavLink } from "react-router-dom";
import NotificationButton from "../notifications/NotificationButton";
export default function PublicNavbar({
  user,
  unread,
  onNotifications,
  onSignOut,
  onSwitch,
}) {
  return (
    <header className="public-header">
      <div className="public-header-inner">
        <Link to="/home" className="public-brand" aria-label="TIPPED home">
          <span className="public-logo">T</span>
          <span>
            TIPPED<small>LOST & FOUND</small>
          </span>
        </Link>
        <nav aria-label="Student and visitor navigation">
          {[
            ["/home", "Dashboard"],
            ["/browse", "Find an item"],
            ["/report", "Report an item"],
            ["/my-reports", "My Reports"],
          ].map(([path, label]) => (
            <NavLink key={path} to={path}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="public-header-actions">
          <NotificationButton unread={unread} onClick={onNotifications} />
          {user ? (
            <>
              <button onClick={onSwitch}>OSA account</button>
              <Link to="/profile">Profile</Link>
              <button onClick={onSignOut}>Sign out</button>
            </>
          ) : (
            <Link to="/login">Staff / demo sign in ↗</Link>
          )}
        </div>
      </div>
    </header>
  );
}
export function WorkspaceNavbar({
  unread,
  onNotifications,
  onSwitch,
  onSignOut,
}) {
  return (
    <header className="public-header">
      <div className="public-header-inner osa-header-inner">
        <Link to="/osa" className="public-brand" aria-label="TIPPED OSA home">
          <span className="public-logo">T</span>
          <span>
            TIPPED<small>LOST & FOUND</small>
          </span>
        </Link>
        <span className="osa-workspace-label">OSA workspace</span>
        <div className="public-header-actions">
          <NotificationButton unread={unread} onClick={onNotifications} />
          <button onClick={onSwitch}>Student account</button>
          <button onClick={onSignOut}>Sign out</button>
        </div>
      </div>
    </header>
  );
}
export function PublicFooter({ workspace = false }) {
  return (
    <footer className="public-footer">
      <div>
        <Link className="public-brand" to={workspace ? "/osa" : "/home"}>
          <span className="public-logo">T</span>TIPPED
        </Link>
        <p>Helping belongings find their way back.</p>
      </div>
      <div>
        <strong>T.I.P. Manila · Arlegui & Casal</strong>
        <p>
          {workspace
            ? "OSA · Review, custody & recovery"
            : "Student & visitor lost and found"}
        </p>
        <small>
          Local prototype · Use fictional contact details. No SMS or email is
          sent.
        </small>
      </div>
    </footer>
  );
}
