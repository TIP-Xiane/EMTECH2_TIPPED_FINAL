import { CATEGORIES, SITES } from "../data/constants.js";
import { today } from "./format.js";
export const isExpired = (r, now = Date.now()) =>
  now >= Date.parse(r.expiresAt);
export const isActive = (r, now = Date.now()) =>
  !isExpired(r, now) && r.outcome === "Open";
export const osaCanAccess = (user, r) =>
  user?.role === "osa" && user.sites.includes(r.site);
export const canViewReport = (user, r) =>
  !!user &&
  (osaCanAccess(user, r) ||
    r.reporterId === user.id ||
    r.moderation === "Approved");
export const canViewPhoto = (user, r) =>
  canViewReport(user, r) &&
  (r.publicPhoto || r.reporterId === user.id || osaCanAccess(user, r));
export const canRequestClaim = (user, r, now = Date.now()) =>
  user?.role === "student" &&
  r.reporterId !== user.id &&
  r.type === "Found" &&
  r.moderation === "Approved" &&
  isActive(r, now);
export function filterReports(reports, user, filters = {}, now = Date.now()) {
  const q = (filters.query || "").trim().toLowerCase();
  return reports.filter(
    (r) =>
      isActive(r, now) &&
      (r.moderation === "Approved" ||
        (r.moderation === "Pending Review" &&
          (r.reporterId === user.id || osaCanAccess(user, r)))) &&
      (!q ||
        `${r.title} ${r.description} ${r.location}`
          .toLowerCase()
          .includes(q)) &&
      (!filters.type || r.type === filters.type) &&
      (!filters.site || r.site === filters.site) &&
      (!filters.category || r.category === filters.category) &&
      (!filters.from || r.itemDate >= filters.from) &&
      (!filters.to || r.itemDate <= filters.to),
  );
}
export function validateReport(input, reports, user) {
  const errors = {};
  if (!["Lost", "Found"].includes(input.type))
    errors.type = "Choose Lost or Found.";
  if (!input.title.trim()) errors.title = "Enter an item title.";
  else if (input.title.trim().length > 90)
    errors.title = "Use at most 90 characters.";
  if (!CATEGORIES.includes(input.category))
    errors.category = "Select a category.";
  if (!SITES.includes(input.site))
    errors.site = "Select Arlegui, Casal, or Other.";
  if (input.site === "Other" && !input.siteDetail?.trim())
    errors.siteDetail =
      "Specify the place or address outside the listed campuses.";
  if (!input.location.trim()) errors.location = "Enter a general location.";
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.itemDate) ||
    Number.isNaN(Date.parse(input.itemDate))
  )
    errors.itemDate = "Enter the item date.";
  else if (input.itemDate > today())
    errors.itemDate = "The item date cannot be in the future.";
  if (input.description.trim().length < 10)
    errors.description = "Provide a description of at least 10 characters.";
  if (![2, 3, 4].includes(Number(input.validDays)))
    errors.validDays = "Choose 2, 3 or 4 days.";
  if (
    reports.some(
      (r) =>
        r.reporterId === user.id &&
        r.moderation !== "Rejected" &&
        r.title.toLowerCase() === input.title.trim().toLowerCase() &&
        r.type === input.type &&
        r.itemDate === input.itemDate &&
        r.location.toLowerCase() === input.location.trim().toLowerCase(),
    )
  )
    errors.form = "An equivalent report already exists in My Reports.";
  return errors;
}
export function imageError(file) {
  return !file
    ? ""
    : !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      ? "Choose a JPEG, PNG or WebP image."
      : file.size > 5 * 1024 * 1024
        ? "Image must be at most 5 MB."
        : "";
}
export function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () =>
      reject(new Error("The image could not be read. Choose another file."));
    reader.readAsDataURL(file);
  });
}
