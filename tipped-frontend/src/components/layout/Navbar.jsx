import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { STUDENT_NAV } from "../../data/constants";
import { Button } from "../common/UI";
import NotificationButton from "../notifications/NotificationButton";
export default function Navbar({
  user,
  onSwitch,
  onSignOut,
  unread,
  onNotifications,
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-4 px-5 py-4 min-[1230px]:px-8">
          <Link
            to={user?.role === "osa" ? "/osa" : user ? "/home" : "/login"}
            className="flex shrink-0 items-center gap-3"
          >
            <span className="grid size-11 place-items-center rounded bg-burgundy text-xs font-bold text-white">
              TIP
            </span>
            <span>
              <strong className="font-heading text-base font-extrabold tracking-wider">
                TIPPED
              </strong>
              <small className="mt-1 block text-[10px] tracking-widest text-muted">
                CAMPUS LOST & FOUND
              </small>
            </span>
          </Link>
          {user?.role === "student" && (
            <nav
              id="student-navigation"
              aria-label="Student navigation"
              className={`${open ? "flex" : "hidden"} order-last w-full flex-col gap-1 min-[900px]:order-none min-[900px]:flex min-[900px]:w-auto min-[900px]:flex-1 min-[900px]:flex-row`}
            >
              {STUDENT_NAV.map(([path, label]) => (
                <NavLink
                  key={path}
                  to={path}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `rounded px-3 py-3 text-xs font-semibold ${isActive ? "bg-rose-50 text-burgundy" : "text-muted"}`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {user ? (
              <>
                <span className="hidden text-xs text-burgundy min-[1230px]:inline">
                  {user.role === "osa" ? "OSA workspace" : "Student portal"}
                </span>
                <NotificationButton unread={unread} onClick={onNotifications} />
                <Button variant="secondary" onClick={onSwitch}>
                  {user.role === "osa" ? "Student account" : "OSA account"}
                </Button>
                <Button variant="text" onClick={onSignOut}>
                  Sign out
                </Button>
                {user.role === "student" && (
                  <Button
                    variant="secondary"
                    className="min-[900px]:hidden"
                    aria-label="Toggle navigation"
                    aria-expanded={open}
                    aria-controls="student-navigation"
                    onClick={() => setOpen(!open)}
                  >
                    ☰
                  </Button>
                )}
              </>
            ) : (
              <span className="text-xs text-muted">
                Front-end demonstration
              </span>
            )}
          </div>
        </div>
      </header>
      <div className="border-b border-line bg-slate-100 px-5 py-2 text-[11px] text-muted">
        <div className="mx-auto flex max-w-[1260px] flex-wrap justify-between gap-2">
          <span>T.I.P. Manila · Proposed Arlegui & Casal pilot</span>
          <span>
            Mock records · Verification required · No backend connected
          </span>
        </div>
      </div>
    </>
  );
}
