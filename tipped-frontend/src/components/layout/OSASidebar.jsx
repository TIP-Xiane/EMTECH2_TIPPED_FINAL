import { NavLink } from "react-router-dom";
import { OSA_NAV } from "../../data/constants";
export default function OSASidebar() {
  return (
    <aside className="osa-sidebar min-w-0 self-start rounded border border-line bg-white p-3 min-[760px]:sticky min-[760px]:top-28">
      <p className="mb-4 hidden px-3 text-xs font-bold tracking-widest text-burgundy min-[760px]:block">
        OSA WORKSPACE
      </p>
      <nav
        aria-label="OSA navigation"
        className="flex gap-1 overflow-x-auto min-[760px]:flex-col"
      >
        {OSA_NAV.map(([path, label]) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/osa"}
            className={({ isActive }) =>
              `shrink-0 whitespace-nowrap rounded px-3 py-3 text-xs ${isActive ? "osa-nav-active font-semibold" : ""}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
