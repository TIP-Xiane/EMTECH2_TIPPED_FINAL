import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "./AuthContext";
export const DATA_KEY = "tipped.react.data.v1";
const Context = createContext(null);
const empty = () => ({
  reports: [],
  claims: [],
  receipts: [],
  releases: [],
  events: [],
  notifications: [],
});
export function ReportProvider({ children }) {
  const { user } = useAuth();
  const [data, setData] = useState(empty),
    [site, setSite] = useState("All sites"),
    [stateLoading, setLoading] = useState(true),
    [storageError, setError] = useState("");
  useEffect(() => {
    let active = true;
    setData(empty());
    setLoading(true);
    setError("");
    async function load() {
      const [campuses, categories] = await Promise.all([
        apiRequest("/campuses"),
        apiRequest("/categories"),
      ]);
      const pages = await Promise.all([
        apiRequest("/reports"),
        ...(user ? [apiRequest("/reports/mine")] : []),
      ]);
      const map = new Map();
      pages
        .flatMap((page) => page.results)
        .forEach((r) =>
          map.set(r.id, {
            id: r.id,
            title: r.title,
            type: r.report_type === "FOUND" ? "Found" : "Lost",
            category:
              categories.results.find((c) => c.id === r.category)?.name ||
              "Unknown category",
            site:
              campuses.results.find((c) => c.id === r.campus)?.name ||
              "Unknown campus",
            location: r.location,
            itemDate: r.item_date,
            description: r.description,
            moderation: {
              PENDING_REVIEW: "Pending Review",
              APPROVED: "Approved",
              REJECTED: "Rejected",
            }[r.review_status],
            outcome: "Open",
            custody: "Not recorded",
            image: "",
            publicPhoto: false,
            createdAt: r.created_at,
            expiresAt: null,
            reporterId: null,
          }),
        );
      if (user)
        pages[1].results.forEach((r) => {
          map.get(r.id).reporterId = user.id;
        });
      if (active) setData({ ...empty(), reports: [...map.values()] });
    }
    load()
      .catch((error) => {
        if (active) setError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);
  async function act() {
    throw new Error(
      "Account registration and sign-in are connected. Report submission and OSA workflows are not connected yet; no data was saved. Please contact the administrator.",
    );
  }
  return (
    <Context.Provider
      value={{
        ...data,
        act,
        site,
        setSite,
        storageError,
        stateLoading,
        apiNotice: "",
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useReports() {
  return useContext(Context);
}
