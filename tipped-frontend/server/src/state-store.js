import { isDeepStrictEqual } from "node:util";
import { applyAction } from "../../src/utils/transitions.js";
import {
  canViewPhoto,
  isActive,
  osaCanAccess,
} from "../../src/utils/reportRules.js";

const collections = [
  ["reports", "reports"],
  ["claims", "claims"],
  ["receipts", "receipts"],
  ["releases", "releases"],
  ["events", "audit_events"],
  ["notifications", "notifications"],
];

async function readState(client) {
  const state = {};
  for (const [collection, table] of collections) {
    const result = await client.query(
      `SELECT payload FROM ${table} ORDER BY created_at DESC, id DESC`,
    );
    state[collection] = result.rows.map((row) => row.payload);
  }
  return state;
}

function mapById(rows) {
  return new Map(rows.map((row) => [row.id, row]));
}

async function persistCollection(client, name, oldRows, newRows) {
  const oldById = mapById(oldRows);
  for (const row of newRows) {
    if (isDeepStrictEqual(oldById.get(row.id), row)) continue;
    const payload = JSON.stringify(row);
    if (name === "reports") {
      await client.query(
        `INSERT INTO reports (id, reporter_id, site, moderation, outcome, created_at, expires_at, payload)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
         ON CONFLICT (id) DO UPDATE SET reporter_id = EXCLUDED.reporter_id,
           site = EXCLUDED.site, moderation = EXCLUDED.moderation,
           outcome = EXCLUDED.outcome, expires_at = EXCLUDED.expires_at,
           payload = EXCLUDED.payload`,
        [
          row.id,
          row.reporterId,
          row.site,
          row.moderation,
          row.outcome,
          row.createdAt,
          row.expiresAt,
          payload,
        ],
      );
      continue;
    }
    if (name === "claims") {
      await client.query(
        `INSERT INTO claims (id, report_id, claimant_id, status, created_at, payload)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb)
         ON CONFLICT (id) DO UPDATE SET claimant_id = EXCLUDED.claimant_id,
           status = EXCLUDED.status, payload = EXCLUDED.payload`,
        [
          row.id,
          row.reportId,
          row.claimantId,
          row.status,
          row.createdAt,
          payload,
        ],
      );
      continue;
    }
    if (name === "receipts" || name === "releases" || name === "events") {
      const table =
        name === "events"
          ? "audit_events"
          : name === "receipts"
            ? "receipts"
            : "releases";
      await client.query(
        `INSERT INTO ${table} (id, report_id, created_at, payload)
         VALUES ($1, $2, $3, $4::jsonb)
         ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload`,
        [row.id, row.reportId, row.at || row.recordedAt || row.date, payload],
      );
      continue;
    }
    await client.query(
      `INSERT INTO notifications (id, recipient_id, report_id, created_at, is_read, payload)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       ON CONFLICT (id) DO UPDATE SET is_read = EXCLUDED.is_read,
         payload = EXCLUDED.payload`,
      [row.id, row.recipientId, row.reportId, row.at, row.read, payload],
    );
  }
}

async function persistState(client, before, after) {
  for (const [collection] of collections) {
    await persistCollection(
      client,
      collection,
      before[collection],
      after[collection],
    );
  }
}

export async function performAction(pool, actor, action, payload) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
      const before = await readState(client);
      let next;
      try {
        next = applyAction(before, { type: action, payload }, actor);
      } catch (error) {
        if (error.constructor === Error) error.status = 400;
        throw error;
      }
      if (action === "READ_NOTIFICATIONS" && actor.role === "osa") {
        const accessibleReportIds = new Set(
          next.state.reports
            .filter((report) => osaCanAccess(actor, report))
            .map((report) => report.id),
        );
        next.state.notifications.forEach((notification) => {
          if (
            notification.recipientId === "osa-reviewer" &&
            accessibleReportIds.has(notification.reportId)
          ) {
            notification.read = true;
          }
        });
      }
      await persistState(client, before, next.state);
      await client.query("COMMIT");
      return next;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      if (attempt < 2 && (error.code === "40001" || error.code === "40P01"))
        continue;
      throw error;
    } finally {
      client.release();
    }
  }
  throw new Error("The action could not be saved after concurrent updates.");
}

export async function getVisibleState(pool, actor) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const state = await readState(client);
    const reports = state.reports.filter(
      (report) =>
        report.reporterId === actor.id ||
        osaCanAccess(actor, report) ||
        (report.moderation === "Approved" && isActive(report)),
    );
    const reportIds = new Set(reports.map((report) => report.id));
    const visibleReports = reports.map((report) => {
      const visibleReport = canViewPhoto(actor, report)
        ? { ...report }
        : { ...report, image: "" };
      if (report.reporterId !== actor.id && !osaCanAccess(actor, report)) {
        delete visibleReport.reporter;
        delete visibleReport.reporterId;
      }
      return visibleReport;
    });
    const visibleClaims = state.claims.filter(
      (claim) =>
        claim.claimantId === actor.id ||
        (reportIds.has(claim.reportId) &&
          osaCanAccess(
            actor,
            state.reports.find((report) => report.id === claim.reportId),
          )),
    );
    const osaReportIds = new Set(
      reports
        .filter((report) => osaCanAccess(actor, report))
        .map((report) => report.id),
    );
    const visibleEvents = state.events
      .filter(
        (event) =>
          reportIds.has(event.reportId) &&
          (!event.private ||
            osaReportIds.has(event.reportId) ||
            event.actorId === actor.id),
      )
      .map((event) => {
        if (actor.role === "osa" || event.actorId === actor.id) return event;
        const publicEvent = { ...event, actorName: "TIPPED" };
        delete publicEvent.actorId;
        if (event.action === "Physical receipt recorded") {
          publicEvent.remarks = "Physical receipt recorded.";
        }
        return publicEvent;
      });
    const visible = {
      reports: visibleReports,
      claims: visibleClaims,
      receipts: state.receipts.filter((row) => osaReportIds.has(row.reportId)),
      releases: state.releases.filter((row) => osaReportIds.has(row.reportId)),
      events: visibleEvents,
      notifications: state.notifications.filter(
        (notification) =>
          notification.recipientId === actor.id ||
          (actor.role === "osa" &&
            notification.recipientId === "osa-reviewer" &&
            osaReportIds.has(notification.reportId)),
      ),
    };
    await client.query("COMMIT");
    return visible;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
