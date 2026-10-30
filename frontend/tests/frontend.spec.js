import { test, expect } from "@playwright/test";
const DATA = "tipped.react.data.v1";
test("credential login, keyboard dialog dismissal and registration stay frontend-only", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("OSA administrator").check();
  await page.getByLabel("Account email").fill("osa@example.invalid");
  await page.getByLabel("Password").fill("DemoOSA2026");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Needs attention" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Reports to review" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ownership claims" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Items awaiting receipt" }),
  ).toBeVisible();
  await expect(page.getByLabel("1 task")).toBeVisible();
  const viewReportButton = page
    .locator(".osa-pending-preview")
    .getByRole("button", { name: "View report →" });
  await expect(viewReportButton).toBeVisible();
  await expect(viewReportButton).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await expect(viewReportButton).toHaveCSS("border-color", "rgb(36, 118, 111)");
  await expect(viewReportButton).toHaveCSS("color", "rgb(29, 93, 88)");
  await viewReportButton.hover();
  await expect(viewReportButton).toHaveCSS(
    "background-color",
    "rgb(233, 243, 241)",
  );
  await page.getByRole("heading", { name: "Needs attention" }).hover();
  await expect(viewReportButton).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await expect(viewReportButton).toHaveCSS("min-width", "116px");
  await expect(viewReportButton).toHaveCSS("padding", "9px 14px");
  await viewReportButton.click();
  const reviewDialog = page.getByRole("dialog");
  const closeReviewDialog = reviewDialog.getByRole("button", {
    name: "Close dialog",
  });
  await expect(closeReviewDialog).toBeVisible();
  await expect(closeReviewDialog).toHaveCSS("border-radius", "50%");
  await expect(closeReviewDialog).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await closeReviewDialog.click();
  await expect(page.getByRole("link", { name: "Report Review" })).toHaveCSS(
    "color",
    "rgb(214, 224, 226)",
  );
  await page.getByText("Records & tools").click();
  await expect(page.getByRole("link", { name: "Turnover log" })).toBeVisible();
  await page.getByText("Records & tools").click();
  await page.getByRole("button", { name: /^Notifications/ }).click();
  const notifications = page.getByRole("dialog");
  await expect(notifications).toBeVisible();
  await expect(notifications).toContainText(
    "New reports and ownership claims appear here.",
  );
  await expect(
    notifications.getByRole("button", { name: "Close dialog" }),
  ).toBeVisible();
  await expect(
    notifications.locator(".notification-state").first(),
  ).toHaveAttribute("aria-label", "Unread");
  await expect(
    notifications.getByRole("button", { name: "Open report queue →" }).first(),
  ).toBeVisible();
  await expect(
    notifications.getByRole("button", { name: "Approve" }),
  ).toHaveCount(0);
  await notifications
    .getByRole("button", { name: "Open report queue →" })
    .first()
    .click();
  await expect(page).toHaveURL(/\/osa\/reports$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(row(page, "Graphing calculator")).toContainText(
    "Pending Review",
  );
  await page.goto("/osa");
  await page.getByRole("button", { name: /^Notifications/ }).click();
  const refreshedNotifications = page.getByRole("dialog");
  await refreshedNotifications
    .getByRole("button", { name: "Mark all as read" })
    .click();
  await expect(
    refreshedNotifications.locator(".notification-state").first(),
  ).toHaveAttribute("aria-label", "Read");
  await expect(page.getByLabel("1 task")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(refreshedNotifications).toHaveCount(0);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.getByRole("link", { name: "Create an account" }).click();
  await page.getByLabel("Full name").fill("Fictional test student");
  await page
    .getByLabel("School identifier / email")
    .fill("fictional@example.invalid");
  await page.getByLabel("Student number").fill("DEMO-ONLY");
  await page.getByLabel("Program").fill("Sample program");
  await page.getByLabel("Password", { exact: false }).fill("TemporaryDemo2026");
  await page.getByRole("button", { name: "Create demo profile" }).click();
  await expect(
    page.getByRole("heading", { name: "What do you need today?" }),
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
  await page.getByText("Demo account details").click();
  await page
    .getByRole("button", {
      name:
        role === "osa"
          ? "Use OSA demo reviewer"
          : role === "bea"
            ? "Use Bea · demo student"
            : "Use Alex · demo student",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

test("sign-in separates roles, retains demo accounts, and offers guest access", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByText("Mock records")).toHaveCount(0);
  await expect(page.locator(".login-shell")).toHaveCSS(
    "background-color",
    "rgb(243, 246, 247)",
  );
  await expect(page.locator(".login-submit")).toHaveCSS(
    "background-color",
    "rgb(240, 190, 36)",
  );
  await expect(page.locator(".login-card")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await expect(
    page.getByRole("button", { name: "Continue as guest" }),
  ).toBeVisible();
  await page.getByLabel("OSA administrator").check();
  await page.getByLabel("Account email").fill("student@example.invalid");
  await page.getByLabel("Password").fill("DemoStudent2026");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("selected account type");

  await page.getByLabel("Student", { exact: true }).check();
  await page.getByText("Demo account details").click();
  await page.getByRole("button", { name: "Use Alex · demo student" }).click();
  await expect(page.getByLabel("Account email")).toHaveValue(
    "student@example.invalid",
  );
  await expect(page.getByLabel("Password")).toHaveValue("DemoStudent2026");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/home$/);

  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.goto("/login");
  await page.getByRole("button", { name: "Continue as guest" }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(
    page.getByRole("heading", { name: "What do you need today?" }),
  ).toBeVisible();
});
const row = (p, title) =>
  p.getByRole("article", { name: `${title} report`, exact: true });
async function submit(page, title, { type = "Lost", image = false } = {}) {
  await page.goto("/report");
  await page.getByRole("button", { name: `${type} Item`, exact: true }).click();
  await page.getByLabel("Item title").fill(title);
  await page.getByLabel("Category").selectOption("Electronics");
  await page.getByLabel("Building").selectOption("Library");
  await page.getByLabel("Floor").selectOption("1st Floor");
  await page
    .getByLabel(
      type === "Lost" ? "Approximate time lost" : "Approximate time found",
    )
    .fill("10:30");
  await page.getByLabel("Contact number").fill("09123456789");
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
  await page.getByRole("button", { name: "Review & submit" }).click();
  await page.getByRole("button", { name: "Confirm and submit" }).click();
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
  const osaReport = row(osa, "Cross-tab report");
  const rowControls = osaReport.locator(".report-row-controls");
  await expect(rowControls).toHaveCSS("display", "flex");
  await expect(osaReport).toHaveCSS("border-left-color", "rgb(226, 184, 63)");
  await expect(
    osaReport.getByRole("button", { name: "View report →" }),
  ).toBeVisible();
  await expect(osaReport.getByRole("button", { name: "Approve" })).toHaveCSS(
    "background-color",
    "rgb(40, 116, 75)",
  );
  await expect(osaReport.getByRole("button", { name: "Approve" })).toHaveCSS(
    "min-height",
    "36px",
  );
  await expect(
    osaReport.getByRole("button", { name: "View report →" }),
  ).toHaveCSS("min-height", "40px");
  await expect(osaReport.getByRole("button", { name: "Reject" })).toHaveCSS(
    "background-color",
    "rgb(179, 67, 75)",
  );
  await expect(osaReport.getByRole("button", { name: "Pending" })).toHaveCSS(
    "background-color",
    "rgb(194, 122, 24)",
  );
  const decisionButtons = osaReport.locator(
    ".report-row-decision-actions .btn",
  );
  await expect(decisionButtons).toHaveCount(3);
  for (const width of [390, 320]) {
    await osa.setViewportSize({ width, height: 844 });
    const buttonRects = await rowControls
      .locator(".btn")
      .evaluateAll((buttons) =>
        buttons.map((button) => {
          const { x, y, width, height } = button.getBoundingClientRect();
          return { x, y, width, height };
        }),
      );
    for (let i = 0; i < buttonRects.length; i++) {
      for (let j = i + 1; j < buttonRects.length; j++) {
        const a = buttonRects[i];
        const b = buttonRects[j];
        expect(
          a.x + a.width <= b.x ||
            b.x + b.width <= a.x ||
            a.y + a.height <= b.y ||
            b.y + b.height <= a.y,
        ).toBeTruthy();
      }
    }
  }
  await osa.setViewportSize({ width: 1440, height: 900 });
  await osaReport.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(row(student, "Cross-tab report")).toContainText("Approved");
  await osa.getByRole("button", { name: /^Notifications/ }).click();
  const osaWorkAlerts = osa.getByRole("dialog");
  await expect(osaWorkAlerts).not.toContainText(
    "OSA marked Cross-tab report Approved",
  );
  await osa.getByRole("button", { name: "Close dialog" }).click();
  const moderationToast = osa.getByRole("status");
  const dismissToast = moderationToast.getByRole("button", { name: "Dismiss" });
  await expect(dismissToast).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(dismissToast).toHaveCSS("padding", "7px 12px");
  await dismissToast.click();
  await student.getByRole("button", { name: /^Notifications/ }).click();
  const studentUpdates = student.getByRole("dialog");
  await expect(studentUpdates).toContainText(
    "OSA marked Cross-tab report Approved",
  );
  await expect(studentUpdates).toContainText(
    "Updates about your report, item receipt, and ownership claims appear here.",
  );
  await expect(
    studentUpdates.getByRole("button", { name: "View report →" }),
  ).toBeVisible();
  await studentUpdates
    .getByRole("button", { name: "View report →" })
    .first()
    .click();
  await expect(student.getByRole("dialog")).toContainText("Approved");
  await student.getByRole("button", { name: "Close dialog" }).click();
  await osaReport.getByRole("button", { name: "Reject", exact: true }).click();
  const rejectionDialog = osa.getByRole("dialog");
  const closeRejectionDialog = rejectionDialog.getByRole("button", {
    name: "Close dialog",
  });
  await expect(closeRejectionDialog).toBeVisible();
  await expect(closeRejectionDialog).toHaveCSS("border-radius", "50%");
  await osa
    .getByLabel("Reason for rejection")
    .fill("Please describe the general appearance more precisely.");
  await osa.getByRole("button", { name: "Confirm rejection" }).click();
  await expect(row(student, "Cross-tab report")).toContainText("Rejected");
  await expect(row(student, "Cross-tab report")).toContainText(
    "more precisely",
  );
  await osaReport
    .getByRole("button", { name: "Undo review", exact: true })
    .click();
  await expect(osa.getByRole("dialog")).toContainText(
    "The reporter will be notified, and the decision will remain in the activity history.",
  );
  await osa
    .getByRole("button", { name: "Undo review", exact: true })
    .last()
    .click();
  await expect(row(student, "Cross-tab report")).toContainText(
    "Pending Review",
  );
  await expect(osaReport).toContainText("Pending Review");
  await student.getByRole("button", { name: /^Notifications/ }).click();
  await expect(student.getByRole("dialog")).toContainText(
    "OSA marked Cross-tab report Pending Review",
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
  const myReportViewButton = row(alex, "Private photo report").getByRole(
    "button",
    { name: "View report →" },
  );
  await expect(myReportViewButton).toBeVisible();
  await expect(myReportViewButton).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await expect(myReportViewButton).toHaveCSS("color", "rgb(29, 93, 88)");
  await expect(myReportViewButton).toHaveCSS("min-width", "116px");
  await expect(myReportViewButton).toHaveCSS("padding", "9px 14px");
  await myReportViewButton.hover();
  await expect(myReportViewButton).toHaveCSS(
    "background-color",
    "rgb(233, 243, 241)",
  );
  await alex.mouse.down();
  await expect(myReportViewButton).toHaveCSS(
    "background-color",
    "rgb(216, 234, 231)",
  );
  await alex.mouse.up();
  await expect(alex.getByRole("dialog")).toBeVisible();
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
  await osa.goto("/osa/turnover");
  const reviewReportButton = osa
    .getByRole("article")
    .filter({ hasText: "Black everyday backpack" })
    .getByRole("button", { name: "Review report →" });
  await expect(reviewReportButton).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(reviewReportButton).toHaveCSS("padding", "10px 16px");
  await expect(reviewReportButton).toHaveCSS("border-radius", "8px");
  await reviewReportButton.click();
  await expect(osa.getByRole("dialog")).toBeVisible();
  await osa.getByRole("button", { name: "Close dialog" }).click();
  await student.goto("/browse");
  await row(student, "Blue insulated tumbler")
    .getByRole("button", { name: "View report" })
    .click();
  await student.getByRole("button", { name: "Request Claim" }).click();
  await student
    .getByLabel("Private ownership explanation")
    .fill("I can identify the circular mark on the underside.");
  await student.getByRole("button", { name: "Submit private claim" }).click();
  await osa.getByRole("button", { name: /^Notifications/ }).click();
  const claimAlerts = osa.getByRole("dialog");
  await expect(claimAlerts).toContainText("Ownership claim");
  await expect(
    claimAlerts.getByRole("button", { name: "Open claims queue →" }),
  ).toBeVisible();
  await claimAlerts
    .getByRole("button", { name: "Open claims queue →" })
    .first()
    .click();
  await expect(osa).toHaveURL(/\/osa\/claims$/);
  await expect(osa.getByRole("dialog")).toHaveCount(0);
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
  await page.getByRole("button", { name: "Review & submit" }).click();
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
  await page.goto("/my-reports");
  await expect(row(page, "Green notebook")).toContainText("Listing expired");
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
