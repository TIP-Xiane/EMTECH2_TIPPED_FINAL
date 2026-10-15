import { test, expect } from "@playwright/test";
const DATA = "tipped.react.data.v1";
test("credential login, keyboard dialog dismissal and registration stay frontend-only", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Demo account identifier").fill("osa@example.invalid");
  await page.getByLabel("Demo password").fill("DemoOSA2026");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Campus overview" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Notifications/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page
    .getByRole("link", { name: "Create a demo student profile" })
    .click();
  await page.getByLabel("Full name").fill("Fictional test student");
  await page
    .getByLabel("School identifier / email")
    .fill("fictional@example.invalid");
  await page.getByLabel("Student number").fill("DEMO-ONLY");
  await page.getByLabel("Program").fill("Sample program");
  await page.getByLabel("Password", { exact: false }).fill("TemporaryDemo2026");
  await page.getByRole("button", { name: "Create demo profile" }).click();
  await expect(
    page.getByRole("heading", { name: "Campus lost & found" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("tipped.react.session.v1")).password,
    ),
  ).toBeUndefined();
  await page.goto("/profile");
  await expect(page.getByRole("main")).toContainText("Fictional test student");
});
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
  "base64",
);
async function enter(page, role = "student") {
  await page.goto("/login");
  if (await page.getByRole("button", { name: "Sign out", exact: true }).count())
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page
    .getByRole("button", {
      name:
        role === "osa"
          ? "Open OSA account"
          : role === "bea"
            ? "Second student (Bea)"
            : "Open Student account",
      exact: true,
    })
    .click();
}
const row = (p, title) =>
  p.getByRole("article", { name: `${title} report`, exact: true });
async function submit(page, title, { type = "Lost", image = false } = {}) {
  await page.goto("/report");
  await page.getByRole("button", { name: `${type} Item`, exact: true }).click();
  await page.getByLabel("Item title").fill(title);
  await page.getByLabel("Category").selectOption("Electronics");
  await page
    .getByLabel(type === "Lost" ? "Last seen at" : "Found at")
    .fill("Demo library hallway");
  await page
    .getByLabel(type === "Lost" ? "Date last seen" : "Date found")
    .fill("2026-10-14");
  await page
    .getByLabel("Public description")
    .fill("Dark blue item with a plain cover and rounded edges.");
  if (image) {
    await page
      .getByLabel("Item photograph")
      .setInputFiles({ name: "demo.png", mimeType: "image/png", buffer: png });
    await expect(page.getByAltText("Selected image preview")).toBeVisible();
  }
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(
    page.getByRole("heading", { name: "Report received" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Track my report" }).click();
  await expect(row(page, title)).toContainText("Pending Review");
}
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
});
test("student submission, OSA decisions and recipient notifications synchronize across tabs", async ({
  page: student,
  context,
}) => {
  await enter(student);
  await submit(student, "Cross-tab report");
  const osa = await context.newPage();
  await enter(osa, "osa");
  await osa.getByRole("button", { name: /^Notifications/ }).click();
  await expect(osa.getByRole("dialog")).toContainText(
    "New lost report: Cross-tab report",
  );
  await osa.getByRole("button", { name: "Close dialog" }).click();
  await osa.getByRole("link", { name: "Report Review", exact: true }).click();
  await row(osa, "Cross-tab report")
    .getByRole("button", { name: "Approve", exact: true })
    .click();
  await expect(row(student, "Cross-tab report")).toContainText("Approved");
  await student.getByRole("button", { name: /^Notifications/ }).click();
  await expect(student.getByRole("dialog")).toContainText(
    "OSA marked Cross-tab report Approved",
  );
  await student.getByRole("button", { name: "Close dialog" }).click();
  await row(osa, "Cross-tab report")
    .getByRole("button", { name: "Reject", exact: true })
    .click();
  await osa
    .getByLabel("Reason for rejection")
    .fill("Please describe the general appearance more precisely.");
  await osa.getByRole("button", { name: "Confirm rejection" }).click();
  await expect(row(student, "Cross-tab report")).toContainText("Rejected");
  await expect(row(student, "Cross-tab report")).toContainText(
    "more precisely",
  );
  await row(osa, "Cross-tab report")
    .getByRole("button", { name: "Pending", exact: true })
    .click();
  await expect(row(student, "Cross-tab report")).toContainText(
    "Pending Review",
  );
  await student.reload();
  await expect(row(student, "Cross-tab report")).toContainText(
    "Pending Review",
  );
});
test("different mock students have separate pending/history visibility and photo permissions", async ({
  page: alex,
  context,
}) => {
  await enter(alex);
  await submit(alex, "Private photo report", { image: true });
  const bea = await context.newPage();
  await enter(bea, "bea");
  await bea.goto("/browse");
  await expect(row(bea, "Private photo report")).toHaveCount(0);
  await expect(row(bea, "Graphing calculator")).toHaveCount(0);
  const osa = await context.newPage();
  await enter(osa, "osa");
  await osa.goto("/osa/reports");
  await row(osa, "Private photo report")
    .getByRole("button", { name: "Approve", exact: true })
    .click();
  await row(bea, "Private photo report")
    .getByRole("button", { name: "View report" })
    .click();
  await expect(bea.getByRole("dialog")).toContainText(
    "Photo awaiting OSA permission",
  );
  await expect(bea.getByRole("dialog").getByRole("img")).toHaveCount(0);
  await row(osa, "Private photo report")
    .getByRole("button", { name: "View report" })
    .click();
  await osa.getByRole("checkbox", { name: "Photo is safe" }).check();
  await osa.getByRole("button", { name: "Save photo visibility" }).click();
  await expect(bea.getByAltText("Photo of Private photo report")).toBeVisible();
  await alex.goto("/my-reports");
  await row(alex, "Private photo report")
    .getByRole("button", { name: "View report" })
    .click();
  await expect(
    alex.getByAltText("Photo of Private photo report"),
  ).toBeVisible();
});
test("receipt, private claim verification and physical release remain separate", async ({
  page: student,
  context,
}) => {
  await enter(student);
  const osa = await context.newPage();
  await enter(osa, "osa");
  await osa.goto("/osa/turnover");
  await osa
    .getByRole("article")
    .filter({ hasText: "Blue insulated tumbler" })
    .getByRole("button", { name: "Record receipt" })
    .click();
  await osa.getByLabel("Receiving office").fill("Demo Arlegui receiving desk");
  await osa.getByLabel("Receiving staff").fill("Demo receiving staff");
  await osa.getByLabel("Turnover date and time").fill("2026-10-14T08:00");
  await osa
    .getByLabel("Protected identifying notes")
    .fill("A private circular mark appears on the underside.");
  await osa.getByRole("checkbox").check();
  await osa.getByRole("button", { name: "Confirm receipt" }).click();
  await student.goto("/browse");
  await row(student, "Blue insulated tumbler")
    .getByRole("button", { name: "View report" })
    .click();
  await student.getByRole("button", { name: "Request Claim" }).click();
  await student
    .getByLabel("Private ownership explanation")
    .fill("I can identify the circular mark on the underside.");
  await student.getByRole("button", { name: "Submit private claim" }).click();
  await osa.goto("/osa/claims");
  await osa.getByRole("button", { name: "Review claim" }).click();
  await osa
    .getByLabel("Reviewer remarks")
    .fill("Compared the private identifying marks with the receipt record.");
  await osa.getByRole("checkbox").check();
  await osa.getByRole("button", { name: "Verify claim" }).click();
  expect(
    await osa.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).releases.length,
      DATA,
    ),
  ).toBe(0);
  await osa.getByRole("button", { name: "Review claim" }).click();
  await osa.getByRole("button", { name: "Record physical release" }).click();
  await osa.getByRole("checkbox").check();
  await osa.getByRole("button", { name: "Confirm release" }).click();
  await student.goto("/my-reports");
  await expect(student.getByText("Returned", { exact: true })).toBeVisible();
  await osa.goto("/osa/releases");
  await expect(osa.getByRole("main")).toContainText(
    "Demo Arlegui receiving desk",
  );
  await osa.goto("/osa/audit");
  await expect(osa.getByRole("main")).toContainText(
    "Physical release confirmed",
  );
});
test("filters, Load more, validation and expired history behave consistently", async ({
  page,
}) => {
  await enter(page);
  await page.goto("/browse");
  await expect(page.getByRole("button", { name: "Load more" })).toBeVisible();
  await page.getByRole("button", { name: "Load more" }).click();
  await expect(page.getByRole("button", { name: "Load more" })).toHaveCount(0);
  await page.getByLabel("Search reports").fill("not-in-any-report");
  await expect(
    page.getByRole("heading", { name: "No items found" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page.getByLabel("Report type").selectOption("Lost");
  await page.getByLabel("Site", { exact: true }).selectOption("Casal");
  await page
    .getByLabel("Category", { exact: true })
    .selectOption("Electronics");
  await expect(
    page
      .getByRole("region", { name: "Active report results" })
      .getByRole("article"),
  ).toHaveCount(1);
  await page.goto("/report");
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("Enter an item title.")).toBeVisible();
  await page.getByLabel("Item photograph").setInputFiles({
    name: "bad.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("bad"),
  });
  await expect(
    page.getByRole("alert").filter({ hasText: "Choose a JPEG" }),
  ).toBeVisible();
  await page.evaluate((key) => {
    const data = JSON.parse(localStorage.getItem(key));
    data.reports.find((r) => r.id === "TIP-0006").expiresAt = new Date(
      Date.now() - 1,
    ).toISOString();
    localStorage.setItem(key, JSON.stringify(data));
  }, DATA);
  await page.reload();
  await page.goto("/browse");
  await expect(
    page
      .getByRole("region", { name: "Active report results" })
      .getByText("Green notebook", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Your submitted reports" }),
  ).toContainText("Green notebook");
  await expect(
    page.getByRole("region", { name: "Your submitted reports" }),
  ).toContainText("Listing expired");
});
test("all required routes and representative mobile/tablet/desktop layouts load", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await enter(page);
  for (const route of [
    "/home",
    "/browse",
    "/report",
    "/my-reports",
    "/profile",
  ]) {
    await page.goto(route);
    await expect(
      page.getByRole("main").getByRole("heading", { level: 1 }),
    ).toBeVisible();
  }
  await page.goto("/osa/reports");
  await expect(page).toHaveURL(/\/home$/);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/browse");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.goto("/report");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/home");
  await page.screenshot({
    path: "artifacts/react-student-desktop.png",
    fullPage: true,
  });
  await enter(page, "osa");
  for (const route of [
    "/osa",
    "/osa/reports",
    "/osa/claims",
    "/osa/turnover",
    "/osa/audit",
    "/osa/releases",
    "/osa/registry",
    "/osa/create",
    "/osa/account",
  ]) {
    await page.goto(route);
    await expect(
      page.getByRole("main").getByRole("heading", { level: 1 }),
    ).toBeVisible();
  }
  await page.goto("/osa/reports");
  await page.screenshot({
    path: "artifacts/react-osa-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "artifacts/react-osa-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
