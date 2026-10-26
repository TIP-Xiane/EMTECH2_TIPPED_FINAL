import { createContext, useContext, useEffect, useState } from "react";
import { DEMO_USERS } from "../data/mockData";
import { makeId } from "../utils/format";
import { API_MODE, apiRequest } from "../api/client";
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
  const [user, setUser] = useState(() => (API_MODE ? null : savedSession()));
  const [authLoading, setAuthLoading] = useState(API_MODE);
  const [reporter] = useState(() => (API_MODE ? null : localReporter()));
  useEffect(() => {
    if (!API_MODE) return;
    let active = true;
    apiRequest("/auth/me")
      .then(({ user: nextUser }) => {
        if (active) setUser(nextUser);
      })
      .catch((error) => {
        if (active) setUser(null);
        console.error("Could not restore the signed-in session.", error);
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  function enter(next) {
    setUser(next);
    if (API_MODE) return;
    try {
      if (next) sessionStorage.setItem(KEY, JSON.stringify(next));
      else sessionStorage.removeItem(KEY);
    } catch {
      /* Session remains temporary if storage is unavailable. */
    }
  }
  function preview(id) {
    if (API_MODE)
      throw new Error("Demo accounts are disabled in production mode.");
    const mock = DEMO_USERS.find((u) => u.id === id);
    if (!mock) throw new Error("Unknown demo account.");
    const { password, ...profile } = mock;
    enter(profile);
  }
  function login(email, password, role) {
    if (API_MODE) {
      return apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, role }),
      }).then(({ user: nextUser }) => enter(nextUser));
    }
    const mock = DEMO_USERS.find(
      (u) =>
        u.email === email.trim().toLowerCase() &&
        u.password === password &&
        u.role === role,
    );
    if (!mock)
      throw new Error(
        "Check your email and password for the selected account type.",
      );
    preview(mock.id);
  }
  function register(input) {
    if (API_MODE) {
      return apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      });
    }
    const profile = { ...input, id: makeId("STUDENT"), role: "student" };
    delete profile.password;
    enter(profile);
  }
  function guestLogin() {
    if (!API_MODE) {
      enter({ id: makeId("GUEST"), name: "Guest", role: "student" });
      return Promise.resolve();
    }
    return apiRequest("/auth/guest", { method: "POST" }).then(
      ({ user: nextUser }) => enter(nextUser),
    );
  }
  function trackGuest(token) {
    if (!API_MODE) throw new Error("Guest tracking links require API mode.");
    return apiRequest("/auth/guest-track", {
      method: "POST",
      body: JSON.stringify({ token }),
    }).then(({ user: nextUser }) => enter(nextUser));
  }
  async function signOut() {
    if (API_MODE) await apiRequest("/auth/logout", { method: "POST" });
    enter(null);
  }
  return (
    <AuthContext.Provider
      value={{
        user,
        actor: user || reporter,
        authLoading,
        login,
        preview,
        register,
        guestLogin,
        trackGuest,
        signOut,
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
