export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const dateLabel = (value) =>
  value
    ? new Date(
        value.length === 10 ? value + "T12:00:00+08:00" : value,
      ).toLocaleDateString("en-PH", {
        timeZone: "Asia/Manila",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not recorded";
export const timeLabel = (value) =>
  value
    ? new Date(value).toLocaleString("en-PH", { timeZone: "Asia/Manila" })
    : "Not recorded";
export const makeId = (prefix) =>
  `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
