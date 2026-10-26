import assert from "node:assert/strict";
import test from "node:test";
import { getVisibleState } from "../src/state-store.js";

const tables = [
  "reports",
  "claims",
  "receipts",
  "releases",
  "audit_events",
  "notifications",
];
const iso = (offset) => new Date(Date.now() + offset).toISOString();

function statePool(state) {
  return {
    async connect() {
      return {
        async query(query) {
          const table = /^SELECT payload FROM ([a-z_]+)/.exec(query)?.[1];
          if (table)
            return { rows: state[table].map((payload) => ({ payload })) };
          return { rows: [], rowCount: 0 };
        },
        release() {},
      };
    },
  };
}

test("public state omits private images, reporter identifiers and hidden records", async () => {
  const report = {
    id: "public-report",
    reporterId: "student-1",
    reporter: { name: "Student One", email: "private@example.com" },
    image: "data:image/png;base64,private-image",
    publicPhoto: false,
    moderation: "Approved",
    outcome: "Open",
    expiresAt: iso(60000),
    site: "Arlegui",
  };
  const publicPhotoReport = {
    ...report,
    id: "public-photo-report",
    publicPhoto: true,
  };
  const hiddenReport = {
    ...report,
    id: "pending-report",
    moderation: "Pending Review",
  };
  const expiredReport = {
    ...report,
    id: "expired-report",
    expiresAt: iso(-60000),
  };
  const state = {
    reports: [report, publicPhotoReport, hiddenReport, expiredReport],
    claims: [
      {
        id: "private-claim",
        reportId: report.id,
        claimantId: "student-2",
        evidence: "private-evidence",
      },
    ],
    receipts: [{ reportId: report.id, note: "protected receipt" }],
    releases: [],
    audit_events: [
      {
        reportId: report.id,
        actorId: "osa-private-id",
        actorName: "OSA Staff",
        action: "Physical receipt recorded",
        remarks: "Office · Staff Member",
      },
      {
        reportId: report.id,
        actorId: "student-2",
        private: true,
        remarks: "private claim review",
      },
    ],
    notifications: [
      { id: "own", recipientId: "guest-1" },
      { id: "other", recipientId: "guest-2" },
    ],
  };
  const visible = await getVisibleState(statePool(state), {
    id: "guest-1",
    role: "guest",
    sites: [],
  });

  assert.deepEqual(visible.reports.map((item) => item.id).sort(), [
    "public-photo-report",
    "public-report",
  ]);
  const privateImage = visible.reports.find((item) => item.id === report.id);
  assert.equal(privateImage.image, "");
  assert.equal(privateImage.reporter, undefined);
  assert.equal(privateImage.reporterId, undefined);
  const publicImage = visible.reports.find(
    (item) => item.id === publicPhotoReport.id,
  );
  assert.equal(publicImage.image, "data:image/png;base64,private-image");
  assert.deepEqual(visible.claims, []);
  assert.deepEqual(visible.receipts, []);
  assert.deepEqual(
    visible.notifications.map((item) => item.id),
    ["own"],
  );
  assert.equal(visible.events.length, 1);
  assert.equal(visible.events[0].actorName, "TIPPED");
  assert.equal(visible.events[0].actorId, undefined);
  assert.equal(visible.events[0].remarks, "Physical receipt recorded.");
});

test("OSA state is site-scoped and may read protected records for assigned reports", async () => {
  const report = {
    id: "osa-report",
    reporterId: "student-1",
    reporter: { name: "Student One", email: "private@example.com" },
    image: "private-image",
    publicPhoto: false,
    moderation: "Pending Review",
    outcome: "Open",
    expiresAt: iso(60000),
    site: "Arlegui",
  };
  const otherSite = { ...report, id: "other-site", site: "Casal" };
  const state = {
    reports: [report, otherSite],
    claims: [
      {
        id: "claim",
        reportId: report.id,
        claimantId: "student-2",
        evidence: "evidence",
      },
    ],
    receipts: [{ reportId: report.id, note: "protected receipt" }],
    releases: [],
    audit_events: [
      { reportId: report.id, private: true, remarks: "review detail" },
    ],
    notifications: [
      { id: "assigned", recipientId: "osa-reviewer", reportId: report.id },
      { id: "unassigned", recipientId: "osa-reviewer", reportId: otherSite.id },
    ],
  };
  const visible = await getVisibleState(statePool(state), {
    id: "osa-1",
    role: "osa",
    sites: ["Arlegui"],
  });

  assert.deepEqual(
    visible.reports.map((item) => item.id),
    [report.id],
  );
  assert.equal(visible.reports[0].reporter.email, "private@example.com");
  assert.equal(visible.reports[0].image, "private-image");
  assert.equal(visible.claims[0].evidence, "evidence");
  assert.equal(visible.receipts[0].note, "protected receipt");
  assert.equal(visible.events[0].remarks, "review detail");
  assert.deepEqual(
    visible.notifications.map((item) => item.id),
    ["assigned"],
  );
});
