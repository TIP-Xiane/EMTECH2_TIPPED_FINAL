import { makeId, today } from "./format.js";
import {
  validateReport,
  osaCanAccess,
  canRequestClaim,
} from "./reportRules.js";

// Pure immutable transitions: the same rules can later be enforced by an API.
export function applyAction(
  previous,
  action,
  user,
  at = new Date().toISOString(),
) {
  if (!user) throw new Error("Choose a demonstration account first.");
  const state = structuredClone(previous),
    payload = action.payload || {};
  const report = state.reports.find((r) => r.id === payload.reportId);
  const requireRule = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const requireOSA = () =>
    requireRule(
      report && osaCanAccess(user, report),
      "OSA access for the report site is required.",
    );
  const event = (r, verb, remarks = "", isPrivate = false) =>
    state.events.unshift({
      id: makeId("EV"),
      reportId: r.id,
      action: verb,
      remarks,
      private: isPrivate,
      actorId: user.id,
      actorName: user.name,
      at,
    });
  const notify = (recipientId, r, message, type) =>
    state.notifications.unshift({
      id: makeId("NT"),
      recipientId,
      reportId: r.id,
      message,
      type,
      at,
      read: false,
    });
  const notifyOSA = (r, message, type) =>
    notify("osa-reviewer", r, message, type);
  let result;
  switch (action.type) {
    case "SUBMIT": {
      const errors = validateReport(payload, state.reports, user);
      requireRule(!Object.keys(errors).length, Object.values(errors).join(" "));
      const r = {
        id: makeId("TIP"),
        reporterId: user.id,
        title: payload.title.trim(),
        type: payload.type,
        category: payload.category,
        site: payload.site,
        ...(payload.site === "Other"
          ? { siteDetail: payload.siteDetail.trim() }
          : {}),
        location: payload.location.trim(),
        itemDate: payload.itemDate,
        description: payload.description.trim(),
        image: payload.image || "",
        ...(payload.reporter
          ? {
              reporter: structuredClone(payload.reporter),
              itemTime: payload.itemTime || "",
            }
          : {}),
        publicPhoto: false,
        moderation: "Pending Review",
        custody:
          payload.type === "Found" ? "Awaiting Turnover" : "Not applicable",
        outcome: "Open",
        reason: "",
        validDays: Number(payload.validDays),
        createdAt: at,
        updatedAt: at,
        expiresAt: new Date(
          Date.parse(at) + Number(payload.validDays) * 86400000,
        ).toISOString(),
      };
      state.reports.unshift(r);
      event(r, "Report submitted", "Waiting for OSA review.");
      notifyOSA(
        r,
        `New ${r.type.toLowerCase()} report: ${r.title} (${r.site}). Waiting for review.`,
        "report_review",
      );
      result = r.id;
      break;
    }
    case "MODERATE": {
      requireOSA();
      requireRule(
        report.outcome === "Open",
        "Closed reports cannot be moderated.",
      );
      requireRule(
        ["Pending Review", "Approved", "Rejected"].includes(payload.status),
        "Choose a valid moderation status.",
      );
      requireRule(
        report.moderation !== payload.status,
        "The report already has that status.",
      );
      requireRule(
        !state.claims.some(
          (c) =>
            c.reportId === report.id &&
            ["Verified", "Returned"].includes(c.status),
        ),
        "Resolve the verified claim before changing report moderation.",
      );
      requireRule(
        payload.status !== "Rejected" || payload.reason?.trim().length >= 10,
        "A rejection reason of at least 10 characters is required.",
      );
      report.moderation = payload.status;
      report.reason =
        payload.status === "Rejected" ? payload.reason.trim() : "";
      report.updatedAt = at;
      event(report, `Report ${payload.status.toLowerCase()}`, report.reason);
      notify(
        report.reporterId,
        report,
        `OSA marked ${report.title} ${payload.status}.${report.reason ? " Reason: " + report.reason : ""}`,
        "report_update",
      );
      break;
    }
    case "PHOTO":
      requireOSA();
      report.publicPhoto = !!payload.publicPhoto;
      event(
        report,
        "Photo visibility reviewed",
        report.publicPhoto
          ? "Photo allowed in approved listings."
          : "Photo remains private.",
      );
      break;
    case "RECEIVE": {
      requireOSA();
      requireRule(
        report.type === "Found" &&
          report.custody === "Awaiting Turnover" &&
          report.outcome === "Open",
        "Only an awaiting-turnover Found item may be received.",
      );
      requireRule(
        payload.office?.trim() &&
          payload.staff?.trim() &&
          payload.note?.trim().length >= 10 &&
          payload.confirmed,
        "Office, staff, protected notes and physical receipt confirmation are required.",
      );
      requireRule(
        Number.isFinite(Date.parse(payload.at)) &&
          Date.parse(payload.at) <= Date.parse(at),
        "Receipt date/time must be valid and cannot be in the future.",
      );
      state.receipts.push({
        id: makeId("RC"),
        reportId: report.id,
        office: payload.office.trim(),
        staff: payload.staff.trim(),
        at: payload.at,
        note: payload.note.trim(),
      });
      report.custody = "In Custody";
      event(
        report,
        "Physical receipt recorded",
        `${payload.office.trim()} · ${payload.staff.trim()}`,
      );
      notify(
        report.reporterId,
        report,
        `Physical receipt acknowledged for ${report.title} at ${payload.office.trim()}.`,
        "custody_update",
      );
      break;
    }
    case "CLAIM": {
      requireRule(
        report && canRequestClaim(user, report, Date.parse(at)),
        "This report is not eligible for an ownership claim.",
      );
      requireRule(
        payload.explanation?.trim().length >= 15,
        "Provide at least 15 characters of private ownership explanation.",
      );
      requireRule(
        !state.claims.some(
          (c) =>
            c.reportId === report.id &&
            ((c.claimantId === user.id && c.status !== "Rejected") ||
              ["Verified", "Returned"].includes(c.status)),
        ),
        "An active claim already exists for you, or another claim is verified.",
      );
      const c = {
        id: makeId("CL"),
        reportId: report.id,
        claimantId: user.id,
        claimantName: user.name,
        explanation: payload.explanation.trim(),
        evidence: payload.evidence || "",
        status: "Pending Review",
        remarks: "",
        createdAt: at,
      };
      state.claims.push(c);
      event(report, "Ownership claim submitted", c.id, true);
      notifyOSA(
        report,
        `Ownership claim ${c.id} needs review for ${report.title}.`,
        "claim_review",
      );
      notify(
        user.id,
        report,
        `Your ownership claim ${c.id} is Pending Review.`,
        "claim_update",
      );
      result = c.id;
      break;
    }
    case "CLAIM_DECIDE": {
      requireOSA();
      const c = state.claims.find(
        (c) => c.id === payload.claimId && c.reportId === report.id,
      );
      requireRule(
        c?.status === "Pending Review",
        "Only a pending claim can be reviewed.",
      );
      requireRule(
        ["Verified", "Rejected"].includes(payload.status),
        "Choose Verified or Rejected.",
      );
      requireRule(
        payload.remarks?.trim().length >= 10,
        "Review remarks must contain at least 10 characters.",
      );
      if (payload.status === "Verified") {
        requireRule(
          report.moderation === "Approved" &&
            report.custody === "In Custody" &&
            report.outcome === "Open",
          "Verification requires an approved report and confirmed custody.",
        );
        requireRule(
          state.receipts.some(
            (r) => r.reportId === report.id && r.note.length >= 10,
          ) && payload.confirmed,
          "Review protected receipt details and explicitly confirm the evidence check.",
        );
        requireRule(
          !state.claims.some(
            (other) =>
              other.reportId === report.id &&
              other.id !== c.id &&
              ["Verified", "Returned"].includes(other.status),
          ),
          "Another ownership claim is already verified.",
        );
      }
      c.status = payload.status;
      c.remarks = payload.remarks.trim();
      c.reviewerId = user.id;
      c.reviewedAt = at;
      event(
        report,
        `Claim ${c.status.toLowerCase()}`,
        `${c.id}: ${c.remarks}`,
        true,
      );
      notify(
        c.claimantId,
        report,
        `Claim ${c.id}: ${c.status}. ${c.remarks}`,
        "claim_update",
      );
      break;
    }
    case "RELEASE": {
      requireOSA();
      const c = state.claims.find(
        (c) => c.id === payload.claimId && c.reportId === report.id,
      );
      requireRule(
        c?.status === "Verified" &&
          report.moderation === "Approved" &&
          report.custody === "In Custody" &&
          report.outcome === "Open",
        "Release requires a verified claim, approved report and confirmed custody.",
      );
      requireRule(
        payload.confirmed &&
          payload.location?.trim() &&
          /^\d{4}-\d{2}-\d{2}$/.test(payload.date) &&
          !Number.isNaN(Date.parse(payload.date)) &&
          payload.date <= today(),
        "Confirm the handover, valid date and receiving location.",
      );
      state.releases.push({
        id: makeId("RL"),
        reportId: report.id,
        claimId: c.id,
        claimantId: c.claimantId,
        claimantName: c.claimantName,
        date: payload.date,
        location: payload.location.trim(),
        staffId: user.id,
        staffName: user.name,
        recordedAt: at,
      });
      report.custody = "Released";
      report.outcome = "Returned";
      report.updatedAt = at;
      c.status = "Returned";
      event(report, "Physical release confirmed", c.id);
      notify(
        c.claimantId,
        report,
        `${report.title} returned. Physical release recorded.`,
        "custody_update",
      );
      state.claims
        .filter(
          (other) =>
            other.reportId === report.id && other.status === "Pending Review",
        )
        .forEach((other) => {
          other.status = "Rejected";
          other.remarks = "Another claimant completed verified handover.";
          notify(
            other.claimantId,
            report,
            `Claim ${other.id} closed: ${other.remarks}`,
            "claim_update",
          );
          event(report, "Competing claim closed", other.id, true);
        });
      break;
    }
    case "RECOVER":
      requireRule(
        report &&
          user.role === "student" &&
          report.reporterId === user.id &&
          report.type === "Lost" &&
          report.moderation === "Approved" &&
          report.outcome === "Open",
        "Only the owner of an approved open Lost report can confirm recovery.",
      );
      report.outcome = "Recovered";
      event(report, "Reporter confirmed recovery");
      break;
    case "READ_NOTIFICATIONS":
      state.notifications.forEach((n) => {
        const notificationReport = state.reports.find(
          (item) => item.id === n.reportId,
        );
        if (
          (n.recipientId === user.id &&
            (user.role !== "osa" ||
              (notificationReport &&
                osaCanAccess(user, notificationReport)))) ||
          (user.role === "osa" &&
            n.recipientId === "osa-reviewer" &&
            notificationReport &&
            osaCanAccess(user, notificationReport))
        ) {
          n.read = true;
        }
      });
      break;
    default:
      throw new Error("Unknown demonstration action.");
  }
  return { state, result };
}
