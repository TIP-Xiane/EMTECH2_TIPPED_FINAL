import { createContext, useContext, useEffect, useState } from "react";
import {
  apiRequest,
  refreshAccount,
  setAccess,
  clearAccess,
} from "../api/client";
const AuthContext = createContext(null);
const visitor = {
  id: "anonymous",
  name: "Visitor",
  role: "visitor",
  sites: [],
};
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [authLoading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    refreshAccount()
      .then((result) => {
        if (active) setUser(result.user);
      })
      .catch(() => {
        clearAccess();
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  async function login(email, password, role) {
    if (role !== "student")
      throw new Error(
        "OSA website sign-in is not connected yet. Authorized administrators can use the separate Django admin panel.",
      );
    const result = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      noRefresh: true,
    });
    setAccess(result.access);
    setUser(result.user);
  }
  function register(input) {
    return apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
      noRefresh: true,
    });
  }
  async function signOut() {
    await apiRequest("/auth/signout", { method: "POST", noRefresh: true });
    clearAccess();
    setUser(null);
  }
  async function guestLogin() {
    clearAccess();
    setUser(null);
  }
  function unavailable() {
    throw new Error(
      "This account operation is not available yet. Contact the administrator.",
    );
  }
  return (
    <AuthContext.Provider
      value={{
        user,
        actor: user || visitor,
        authLoading,
        login,
        register,
        signOut,
        guestLogin,
        preview: unavailable,
        trackGuest: unavailable,
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
