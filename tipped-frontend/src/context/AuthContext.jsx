import { createContext, useContext, useState } from "react";
import { DEMO_USERS } from "../data/mockData";
import { makeId } from "../utils/format";
const AuthContext = createContext(null),
  KEY = "tipped.react.session.v1";
function localReporter() {
  try {
    const saved = JSON.parse(localStorage.getItem("tipped.react.reporter.v1"));
    if (saved?.id)
      return { id: saved.id, name: "Local reporter", role: "student" };
  } catch {
    /* Use a temporary identity when storage is unavailable. */
  }
  const reporter = {
    id: makeId("REPORTER"),
    name: "Local reporter",
    role: "student",
  };
  try {
    localStorage.setItem(
      "tipped.react.reporter.v1",
      JSON.stringify({ id: reporter.id }),
    );
  } catch {
    /* Temporary identity. */
  }
  return reporter;
}
function savedSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(KEY));
    const demo = DEMO_USERS.find(
      (u) => u.id === session?.id && u.role === "osa",
    );
    return demo ? { ...session, sites: demo.sites } : session;
  } catch {
    return null;
  }
}
export function AuthProvider({ children }) {
  const [user, setUser] = useState(savedSession);
  const [reporter] = useState(localReporter);
  function enter(next) {
    setUser(next);
    try {
      if (next) sessionStorage.setItem(KEY, JSON.stringify(next));
      else sessionStorage.removeItem(KEY);
    } catch {
      /* Session remains temporary if storage is unavailable. */
    }
  }
  function preview(id) {
    const mock = DEMO_USERS.find((u) => u.id === id);
    if (!mock) throw new Error("Unknown demo account.");
    const { password, ...profile } = mock;
    enter(profile);
  }
  function login(email, password) {
    const mock = DEMO_USERS.find(
      (u) => u.email === email.trim().toLowerCase() && u.password === password,
    );
    if (!mock) throw new Error("Incorrect demo account or password.");
    preview(mock.id);
  }
  function register(input) {
    const profile = { ...input, id: makeId("STUDENT"), role: "student" };
    delete profile.password;
    enter(profile);
  }
  return (
    <AuthContext.Provider
      value={{
        user,
        actor: user || reporter,
        login,
        preview,
        register,
        signOut: () => enter(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider is required.");
  return value;
}
