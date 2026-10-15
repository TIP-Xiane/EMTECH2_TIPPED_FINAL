import { SITES } from "../../data/constants";
export default function CampusSelector({
  value,
  onChange,
  all = true,
  id = "site-selector",
  label = "Review site",
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-semibold">
        {label}
      </label>
      <select
        id={id}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {all && <option value="All sites">All sites</option>}
        {SITES.map((site) => (
          <option key={site}>{site}</option>
        ))}
      </select>
    </div>
  );
}
