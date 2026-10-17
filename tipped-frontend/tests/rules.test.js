import test from "node:test";
import assert from "node:assert/strict";
import { createMockData, DEMO_USERS } from "../src/data/mockData.js";
import {
  filterReports,
  canViewPhoto,
  isExpired,
  validateReport,
} from "../src/utils/reportRules.js";
import { imageError } from "../src/utils/reportRules.js";
import { today } from "../src/utils/format.js";
import { applyAction } from "../src/utils/transitions.js";

test("outside locations require a specified place and are reviewable by assigned OSA", () => {
  for (const type of ["Lost", "Found"]) {
    const payload = {
      type,
      title: `Outside ${type} item`,
      category: "Electronics",
      site: "Other",
      siteDetail: "",
      location: "Sample street",
      itemDate: today(),
      description: "A plain black item for a demonstration.",
      validDays: 4,
    };
    assert.ok(validateReport(payload, [], DEMO_USERS[0]).siteDetail);
    payload.siteDetail = "Sample bus stop";
    const submitted = applyAction(
      createMockData(),
      { type: "SUBMIT", payload },
      DEMO_USERS[0],
    );
    assert.equal(submitted.state.reports[0].siteDetail, "Sample bus stop");
    const review = {
      type: "MODERATE",
      payload: { reportId: submitted.result, status: "Approved" },
    };
    assert.throws(() =>
      applyAction(submitted.state, review, {
        ...DEMO_USERS[2],
        sites: ["Arlegui"],
      }),
    );
    assert.equal(
      applyAction(submitted.state, review, DEMO_USERS[2]).state.reports[0]
        .moderation,
      "Approved",
    );
    assert.equal(
      submitted.state.receipts.some((r) => r.reportId === submitted.result),
      false,
    );
  }
});
test("verification and physical release are distinct, with invalid reversals blocked", () => {
  let data = createMockData();
  const osa = DEMO_USERS[2],
    alex = DEMO_USERS[0];
  const claim = applyAction(
    data,
    {
      type: "CLAIM",
      payload: {
        reportId: "TIP-0001",
        explanation:
          "I can identify the stitched mark inside the front pocket.",
      },
    },
    alex,
  );
  data = claim.state;
  const payload = {
    reportId: "TIP-0001",
    claimId: claim.result,
    status: "Verified",
    remarks: "Private receipt details checked against the explanation.",
    confirmed: true,
  };
  assert.throws(() =>
    applyAction(data, { type: "CLAIM_DECIDE", payload }, alex),
  );
  data = applyAction(data, { type: "CLAIM_DECIDE", payload }, osa).state;
  assert.equal(data.releases.length, 0);
  assert.equal(data.reports[0].custody, "In Custody");
  assert.throws(() =>
    applyAction(
      data,
      {
        type: "MODERATE",
        payload: { reportId: "TIP-0001", status: "Pending Review" },
      },
      osa,
    ),
  );
  assert.throws(() =>
    applyAction(
      data,
      {
        type: "RELEASE",
        payload: { reportId: "TIP-0001", claimId: claim.result },
      },
      osa,
    ),
  );
  data = applyAction(
    data,
    {
      type: "RELEASE",
      payload: {
        reportId: "TIP-0001",
        claimId: claim.result,
        date: data.reports[0].itemDate,
        location: "Demo desk",
        confirmed: true,
      },
    },
    osa,
  ).state;
  assert.equal(data.reports[0].outcome, "Returned");
  assert.equal(data.reports[0].custody, "Released");
  assert.equal(data.releases.length, 1);
  assert.equal(data.claims[0].status, "Returned");
});
test("report decisions require OSA, rejection reason and preserve expiry", () => {
  const data = createMockData(),
    r = data.reports[4],
    osa = DEMO_USERS[2];
  assert.throws(() =>
    applyAction(
      data,
      { type: "MODERATE", payload: { reportId: r.id, status: "Approved" } },
      DEMO_USERS[0],
    ),
  );
  assert.throws(() =>
    applyAction(
      data,
      {
        type: "MODERATE",
        payload: { reportId: r.id, status: "Rejected", reason: "no" },
      },
      osa,
    ),
  );
  const next = applyAction(
    data,
    { type: "MODERATE", payload: { reportId: r.id, status: "Approved" } },
    osa,
  ).state;
  assert.equal(next.reports[4].expiresAt, r.expiresAt);
  assert.equal(next.notifications[0].recipientId, r.reporterId);
  assert.equal(data.reports[4].moderation, "Pending Review");
});
test("browse combines filters and hides other students’ pending/rejected reports", () => {
  const { reports } = createMockData(),
    alex = DEMO_USERS[0],
    bea = DEMO_USERS[1];
  assert.deepEqual(
    filterReports(reports, alex, {
      query: "padded",
      site: "Casal",
      type: "Lost",
      category: "Electronics",
    }).map((r) => r.id),
    ["TIP-0002"],
  );
  assert.ok(filterReports(reports, alex).some((r) => r.id === "TIP-0005"));
  assert.ok(!filterReports(reports, bea).some((r) => r.id === "TIP-0005"));
  assert.ok(
    !filterReports(reports, alex).some((r) => r.moderation === "Rejected"),
  );
});
test("expiry hides active discovery and photos need owner/reviewer or explicit public permission", () => {
  const { reports } = createMockData(),
    r = reports[0];
  assert.equal(canViewPhoto(DEMO_USERS[0], r), false);
  assert.equal(canViewPhoto(DEMO_USERS[1], r), true);
  assert.equal(canViewPhoto(DEMO_USERS[2], r), true);
  r.expiresAt = new Date(Date.now() - 1).toISOString();
  assert.equal(isExpired(r), true);
  assert.ok(!filterReports(reports, DEMO_USERS[0]).some((x) => x.id === r.id));
  assert.equal(reports.length, 12);
});
test("report validation rejects duplicate submissions and invalid validity", () => {
  const { reports } = createMockData(),
    r = reports[4];
  const input = { ...r, validDays: 7 };
  assert.ok(validateReport(input, reports, DEMO_USERS[0]).form);
  assert.ok(validateReport(input, reports, DEMO_USERS[0]).validDays);
});
test("image and field limits reject unsupported, oversized, short or future inputs", () => {
  assert.ok(imageError({ type: "text/plain", size: 10 }));
  assert.ok(imageError({ type: "image/png", size: 5 * 1024 * 1024 + 1 }));
  assert.equal(imageError({ type: "image/webp", size: 100 }), "");
  const future = new Date(Date.parse(today() + "T12:00:00Z") + 86400000)
    .toISOString()
    .slice(0, 10);
  const input = {
    title: "X".repeat(91),
    type: "Lost",
    category: "Electronics",
    site: "Arlegui",
    location: "Hallway",
    itemDate: future,
    description: "short",
    validDays: 2,
  };
  const errors = validateReport(input, [], DEMO_USERS[0]);
  assert.ok(errors.title && errors.description && errors.itemDate);
});
test("missing custody blocks verification and rejected claims leave moderation unchanged", () => {
  let data = createMockData();
  const claimed = applyAction(
    data,
    {
      type: "CLAIM",
      payload: {
        reportId: "TIP-0003",
        explanation: "Private explanation identifying the item in detail.",
      },
    },
    DEMO_USERS[0],
  );
  data = claimed.state;
  const payload = {
    reportId: "TIP-0003",
    claimId: claimed.result,
    status: "Verified",
    remarks: "Checked the evidence and identifying details.",
    confirmed: true,
  };
  assert.throws(() =>
    applyAction(data, { type: "CLAIM_DECIDE", payload }, DEMO_USERS[2]),
  );
  data = applyAction(
    data,
    { type: "CLAIM_DECIDE", payload: { ...payload, status: "Rejected" } },
    DEMO_USERS[2],
  ).state;
  assert.equal(data.claims[0].status, "Rejected");
  assert.equal(data.reports[2].moderation, "Approved");
  assert.equal(data.releases.length, 0);
});
test("read state is recipient-specific and wrong-site review is denied", () => {
  const data = createMockData();
  data.notifications.push({
    id: "TEST",
    recipientId: "student-alex",
    read: false,
  });
  const next = applyAction(
    data,
    { type: "READ_NOTIFICATIONS" },
    DEMO_USERS[2],
  ).state;
  assert.equal(next.notifications.find((n) => n.id === "TEST").read, false);
  assert.equal(next.notifications[0].read, true);
  assert.throws(() =>
    applyAction(
      data,
      {
        type: "MODERATE",
        payload: { reportId: "TIP-0005", status: "Approved" },
      },
      { ...DEMO_USERS[2], sites: ["Casal"] },
    ),
  );
});
