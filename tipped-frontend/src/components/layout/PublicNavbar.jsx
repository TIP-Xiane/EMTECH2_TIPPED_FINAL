import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import NotificationButton from "../notifications/NotificationButton";
export default function PublicNavbar({
  user,
  unread,
  onNotifications,
  onSignOut,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="public-header">
      <div className="public-header-inner">
        <Link to="/home" className="public-brand" aria-label="TIPPED home">
          <span className="public-logo">T</span>
          <span>
            TIPPED<small>LOST & FOUND</small>
          </span>
        </Link>
        <button
          className="public-menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="public-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? "Close menu" : "Menu"}
        </button>
        <nav
          id="public-navigation"
          aria-label="Student and visitor navigation"
          className={menuOpen ? "public-navigation-open" : ""}
        >
          {[
            ["/home", "Home"],
            ["/browse", "Find an item"],
            ["/report", "Report an item"],
            ["/my-reports", "My Reports"],
          ].map(([path, label]) => (
            <NavLink key={path} to={path} onClick={() => setMenuOpen(false)}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="public-header-actions">
          <NotificationButton unread={unread} onClick={onNotifications} />
          {user ? (
            <>
              <Link to="/profile">Profile</Link>
              <button onClick={onSignOut}>Sign out</button>
            </>
          ) : (
            <Link to="/login">Sign in</Link>
          )}
        </div>
      </div>
    </header>
  );
}
export function WorkspaceNavbar({ unread, onNotifications, onSignOut }) {
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
