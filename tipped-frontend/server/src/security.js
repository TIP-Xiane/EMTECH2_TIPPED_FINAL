import { createHash, randomBytes } from "node:crypto";

export function createToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export function matchesTipDomain(email, domains) {
  const domain = email.slice(email.lastIndexOf("@") + 1).toLowerCase();
  return domains.some((allowed) => domain === allowed);
}
