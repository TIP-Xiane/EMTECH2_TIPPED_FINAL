import FormField from "../forms/FormField";
import { SITES, CATEGORIES } from "../../data/constants";
export const EMPTY_FILTERS = {
  query: "",
  type: "",
  site: "",
  category: "",
  from: "",
  to: "",
};
export default function ReportFilters({ value, onChange }) {
  const set = (key, v) => onChange({ ...value, [key]: v });
  return (
    <div className="panel mb-5 grid gap-4 sm:grid-cols-2 min-[1100px]:grid-cols-3">
      <FormField
        label="Search reports"
        placeholder="Item, description or location"
        value={value.query}
        onChange={(e) => set("query", e.target.value)}
      />
      {[
        ["type", "Report type", ["Lost", "Found"]],
        ["site", "Site", SITES],
        ["category", "Category", CATEGORIES],
      ].map(([key, label, values]) => (
        <FormField
          key={key}
          label={label}
          as="select"
          value={value[key]}
          onChange={(e) => set(key, e.target.value)}
        >
          <option value="">All {label.toLowerCase()}s</option>
          {values.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </FormField>
      ))}
      <FormField
        label="Item date from"
        type="date"
        value={value.from}
        onChange={(e) => set("from", e.target.value)}
      />
      <FormField
        label="Item date to"
        type="date"
        value={value.to}
        onChange={(e) => set("to", e.target.value)}
      />
    </div>
  );
}
