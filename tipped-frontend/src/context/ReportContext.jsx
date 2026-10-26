import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createMockData } from "../data/mockData";
import { applyAction } from "../utils/transitions";
import { useAuth } from "./AuthContext";
import { API_MODE, apiRequest } from "../api/client";
const ReportContext = createContext(null);
export const DATA_KEY = "tipped.react.data.v1";
const valid = (data) =>
  data &&
  [
    "reports",
    "claims",
    "receipts",
    "releases",
    "events",
    "notifications",
  ].every((k) => Array.isArray(data[k]));
const emptyData = () => ({
  reports: [],
  claims: [],
  receipts: [],
  releases: [],
  events: [],
  notifications: [],
});
function load() {
  try {
    const stored = JSON.parse(localStorage.getItem(DATA_KEY));
    if (valid(stored)) return stored;
  } catch {
    /* Fall back to safe fixtures. */
  }
  return createMockData();
}
export function ReportProvider({ children }) {
  const { actor: user } = useAuth(),
    [data, setData] = useState(() => (API_MODE ? emptyData() : load())),
    latest = useRef(data),
    [site, setSite] = useState("All sites"),
    [storageError, setStorageError] = useState(""),
    [apiNotice, setApiNotice] = useState(""),
    [stateLoading, setStateLoading] = useState(API_MODE);
  useEffect(() => {
    if (API_MODE) {
      let active = true;
      if (!user) {
        latest.current = emptyData();
        setData(latest.current);
        setStateLoading(false);
        return () => {
          active = false;
        };
      }
      setStorageError("");
      setStateLoading(true);
      apiRequest("/state")
        .then((next) => {
          if (active && valid(next)) {
            latest.current = next;
            setData(next);
          }
        })
        .catch((error) => {
          if (active) setStorageError(error.message);
        })
        .finally(() => {
          if (active) setStateLoading(false);
        });
      return () => {
        active = false;
      };
    }
    try {
      if (!localStorage.getItem(DATA_KEY))
        localStorage.setItem(DATA_KEY, JSON.stringify(latest.current));
    } catch {
      setStorageError(
        "Browser persistence is unavailable; changes cannot be saved.",
      );
    }
    const listener = (e) => {
      if (e.key === DATA_KEY && e.newValue) {
        try {
          const next = JSON.parse(e.newValue);
          if (valid(next)) {
            latest.current = next;
            setData(next);
          }
        } catch {
          /* Ignore malformed external data. */
        }
      }
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, [user?.id]);
  function act(type, payload = {}) {
    if (API_MODE) {
      return apiRequest("/actions", {
        method: "POST",
        body: JSON.stringify({ type, payload }),
      }).then(({ result, state: next, emailNotice: notice }) => {
        if (!valid(next))
          throw new Error("The server returned invalid report data.");
        latest.current = next;
        setData(next);
        setApiNotice(notice || "");
        setStorageError("");
        return result;
      });
    }
    const next = applyAction(latest.current, { type, payload }, user);
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(next.state));
      setStorageError("");
    } catch {
      throw new Error(
        "This change could not be saved. Browser storage may be full; try a smaller image.",
      );
    }
    latest.current = next.state;
    setData(next.state);
    return next.result;
  }
  return (
    <ReportContext.Provider
      value={{
        ...data,
        act,
        site,
        setSite,
        storageError,
        apiNotice,
        stateLoading,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
}
export function useReports() {
  const value = useContext(ReportContext);
  if (!value) throw new Error("ReportProvider is required.");
  return value;
}
