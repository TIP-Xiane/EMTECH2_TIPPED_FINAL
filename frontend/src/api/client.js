export const API_MODE = true;
let access = null;
let csrfToken = null;
let refreshing = null;
export function clearAccess() {
  access = null;
}
export function setAccess(value) {
  access = value;
}
async function csrf() {
  if (!csrfToken) {
    const response = await fetch("/api/auth/csrf/", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok)
      throw new Error(
        "Cannot establish a secure connection to the account server.",
      );
    csrfToken = (await response.json()).csrfToken;
  }
  return csrfToken;
}
function errorMessage(body) {
  if (typeof body?.detail === "string") return body.detail;
  if (typeof body?.error === "string") return body.error;
  return (
    Object.entries(body || {})
      .map(
        ([key, value]) =>
          `${key}: ${Array.isArray(value) ? value.join(" ") : String(value)}`,
      )
      .join(" ") || "The request could not be completed."
  );
}
export async function refreshAccount() {
  if (!refreshing)
    refreshing = apiRequest("/auth/refresh", {
      method: "POST",
      noRefresh: true,
    })
      .then((result) => {
        access = result.access;
        return result;
      })
      .finally(() => {
        refreshing = null;
      });
  return refreshing;
}
export async function apiRequest(path, options = {}) {
  const { noRefresh = false, ...requestOptions } = options;
  const method = requestOptions.method || "GET";
  const token = method !== "GET" ? await csrf() : null;
  const response = await fetch(`/api${path.replace(/\/$/, "")}/`, {
    credentials: "same-origin",
    cache: "no-store",
    ...requestOptions,
    headers: {
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
      ...(requestOptions.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { "X-CSRFToken": token } : {}),
      ...requestOptions.headers,
    },
  });
  if (response.status === 401 && !noRefresh && !path.startsWith("/auth/")) {
    await refreshAccount();
    return apiRequest(path, { ...options, noRefresh: true });
  }
  if (response.status === 204) return null;
  const body = response.headers
    .get("content-type")
    ?.includes("application/json")
    ? await response.json()
    : null;
  if (!response.ok) {
    const error = new Error(errorMessage(body));
    error.status = response.status;
    error.fields = body;
    throw error;
  }
  return body;
}
