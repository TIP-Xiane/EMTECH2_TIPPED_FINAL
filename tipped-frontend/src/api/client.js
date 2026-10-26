export const API_MODE =
  import.meta.env.PROD || import.meta.env.VITE_API_MODE === "true";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: "same-origin",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.method && options.method !== "GET"
        ? { "X-TIPPED-Request": "1" }
        : {}),
      ...options.headers,
    },
  });
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : null;
  if (!response.ok) {
    throw new Error(body?.error || "The request could not be completed.");
  }
  return body;
}
