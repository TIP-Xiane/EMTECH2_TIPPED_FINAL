import { NavLink, useLocation } from "react-router-dom";

const primaryLinks = [
  ["/osa", "Needs Attention"],
  ["/osa/reports", "Report Review"],
  ["/osa/claims", "Ownership Claims"],
];
const additionalLinks = [
  ["/osa/turnover", "Turnover log"],
  ["/osa/releases", "Release records"],
  ["/osa/audit", "Audit history"],
  ["/osa/registry", "Approved registry"],
  ["/osa/create", "Create report"],
  ["/osa/account", "OSA account"],
];

function NavigationLink({ path, label }) {
  return (
    <NavLink
      to={path}
      end={path === "/osa"}
      className={({ isActive }) =>
        `osa-sidebar-link ${isActive ? "osa-nav-active" : ""}`
      }
    >
      {label}
    </NavLink>
  );
}

export default function OSASidebar() {
  const { pathname } = useLocation(),
    additionalActive = additionalLinks.some(([path]) => pathname === path);

  return (
    <aside className="osa-sidebar">
      <p>OSA WORKSPACE</p>
      <nav aria-label="OSA navigation">
        {primaryLinks.map(([path, label]) => (
          <NavigationLink key={path} path={path} label={label} />
        ))}
        <details open={additionalActive}>
          <summary>Records &amp; tools</summary>
          <div className="osa-sidebar-secondary">
            {additionalLinks.map(([path, label]) => (
              <NavigationLink key={path} path={path} label={label} />
            ))}
          </div>
        </details>
      </nav>
    </aside>
  );
}
