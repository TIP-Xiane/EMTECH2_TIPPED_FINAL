import { test, expect } from "@playwright/test";

async function fillReport(page, type = "Found", reporter = "visitor") {
  await page.goto(`/report?type=${type}`);
  await page
    .getByLabel("Item title")
    .fill(`Visitor ${type.toLowerCase()} notebook`);
  await page.getByLabel("Category").selectOption("School Supplies");
  await page
    .getByLabel("Public description")
    .fill("A small notebook with a plain green cover.");
  await page.getByLabel("Campus").selectOption("Casal");
  await page.getByLabel("Building").selectOption("Library");
  await page.getByLabel("Floor").selectOption("1st Floor");
  await page
    .getByLabel(type === "Found" ? "Found at" : "Last seen at")
    .fill("Reading tables");
  await page
    .getByLabel(type === "Found" ? "Date found" : "Date last seen")
    .fill("2026-10-14");
  await page
    .getByLabel(
      type === "Found" ? "Approximate time found" : "Approximate time lost",
    )
    .fill("10:30");
  await page
    .getByRole("radio", {
      name: reporter === "visitor" ? "Guest / visitor" : "TIP affiliated",
    })
    .check();
  await page.getByLabel("Full name").fill("Fictional Reporter");
  await page.getByLabel("Contact number").fill("09123456789");
  await page
    .getByLabel(reporter === "visitor" ? "Email" : "TIP email")
    .fill("fictional@example.invalid");
  if (reporter === "visitor")
    await page
      .getByLabel("Purpose of visiting TIP")
      .fill("Demonstration campus visit");
  else {
    await page.getByLabel("School ID / faculty ID").fill("DEMO-ONLY");
    await page.getByLabel("Department / office").fill("Sample department");
  }
}

async function enterOSA(page) {
  await page.goto("/login");
  await page.getByText("Demo account details").click();
  await page.getByRole("button", { name: "Use OSA demo reviewer" }).click();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

test("public dashboard searches real fields and works on narrow screens without a login", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".public-header-actions .btn")).toHaveCSS(
    "background-color",
    "rgb(42, 65, 75)",
  );
  await expect(page).toHaveURL(/\/home$/);
  await expect(
    page.getByRole("heading", { name: "What do you need today?" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Find an item", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "I lost something" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "I found something" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "I lost something" })).toHaveCSS(
    "background-color",
    "rgb(255, 245, 229)",
  );
  await expect(page.getByRole("link", { name: "I found something" })).toHaveCSS(
    "background-color",
    "rgb(232, 244, 242)",
  );
  await expect(
    page.locator(".public-dashboard .public-search button"),
  ).toHaveCSS("background-color", "rgb(240, 190, 36)");
  await expect(page.locator(".public-type.is-found").first()).toHaveCSS(
    "background-color",
    "rgb(226, 241, 238)",
  );
  await expect(page.locator(".public-type.is-lost").first()).toHaveCSS(
    "background-color",
    "rgb(255, 242, 220)",
  );
  await expect(
    page.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Menu" }).click();
  const navigation = page.getByRole("navigation", {
    name: "Student and visitor navigation",
  });
  await expect(
    navigation.getByRole("link", { name: "Find an item" }),
  ).toBeVisible();
  await navigation.getByRole("link", { name: "Find an item" }).click();
  await expect(page).toHaveURL(/\/browse$/);
  await page.goto("/home");
  await page.getByLabel("Find a reported item").fill("TIP-0001");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(1);
  await page.getByLabel("Search reports").fill("NOT-A-MATCH");
  await expect(
    page.getByRole("heading", { name: "No items found" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await page.getByLabel("Search reports").fill("Casal");
  await expect(page.getByRole("article").first()).toContainText("Casal");
  await page
    .getByRole("article")
    .first()
    .getByRole("button", { name: "View report" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.goto("/browse?type=Found");
  await expect(page.getByLabel("Report type")).toHaveValue("Found");
  await expect(page.getByRole("button", { name: "Reset filters" })).toHaveCSS(
    "color",
    "rgb(37, 53, 64)",
  );
  await expect(
    page.locator(".public-card .public-type.is-found").first(),
  ).toHaveCSS("background-color", "rgb(226, 241, 238)");
  await expect(
    page.locator(".public-type").filter({ hasText: "Lost item" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.getByLabel("Report type")).toHaveValue("");
  await expect(
    page.locator(".public-card .public-type.is-lost").first(),
  ).toHaveCSS("background-color", "rgb(255, 242, 220)");
  await expect(
    page.locator(".public-card .public-type.is-found").first(),
  ).toHaveCSS("background-color", "rgb(226, 241, 238)");
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/home", "/browse", "/report", "/my-reports"]) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
    }
  }
});

test("visitor review preserves edits and confirmed reports persist privately with correct custody", async ({
  page,
  browser,
}) => {
  await fillReport(page);
  await page.getByRole("button", { name: "Review & submit" }).click();
  await expect(page.getByRole("dialog")).toContainText("Fictional Reporter");
  await expect(page.getByRole("dialog")).toContainText("Casal");
  await page.getByRole("button", { name: "Back to edit" }).click();
  await expect(page.getByLabel("Item title")).toHaveValue(
    "Visitor found notebook",
  );
  await page.getByRole("button", { name: "Review & submit" }).click();
  await page.getByRole("button", { name: "Confirm and submit" }).click();
  await expect(
    page.getByRole("heading", { name: "Report received" }),
  ).toBeVisible();
  const reference = await page.locator(".public-receipt strong").innerText();
  await page.getByRole("button", { name: "Track my report" }).click();
  await expect(
    page.getByRole("article", {
      name: "Visitor found notebook report",
      exact: true,
    }),
  ).toContainText(reference);
  await page.reload();
  await expect(
    page.getByRole("article", {
      name: "Visitor found notebook report",
      exact: true,
    }),
  ).toContainText("Pending Review");
  const data = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("tipped.react.data.v1")),
  );
  const report = data.reports.find((r) => r.id === reference);
  expect(report.custody).toBe("Awaiting Turnover");
  expect(report.reporter.type).toBe("visitor");
  expect(report.site).toBe("Casal");
  expect(data.receipts.some((r) => r.reportId === reference)).toBe(false);
  await page.goto("/browse");
  await expect(
    page.getByRole("article", {
      name: "Visitor found notebook report",
      exact: true,
    }),
  ).toHaveCount(0);
  const other = await browser.newContext();
  await other.addInitScript(
    (data) =>
      localStorage.setItem("tipped.react.data.v1", JSON.stringify(data)),
    data,
  );
  const outsider = await other.newPage();
  await outsider.goto("/my-reports");
  await expect(
    outsider.getByRole("article", {
      name: "Visitor found notebook report",
      exact: true,
    }),
  ).toHaveCount(0);
  await other.close();
});

test("affiliate form validates phone, changes location safely, and never needs an account", async ({
  page,
}) => {
  await fillReport(page, "Lost", "affiliate");
  await expect(page.locator(".public-step > span").first()).toHaveCSS(
    "background-color",
    "rgb(255, 244, 208)",
  );
  await expect(
    page.locator(".report-step-navigation a span").first(),
  ).toHaveCSS("background-color", "rgb(255, 244, 208)");
  await expect(page.locator(".public-aside-mark")).toHaveCSS(
    "background-color",
    "rgb(240, 190, 36)",
  );
  await expect(
    page.getByRole("button", { name: "Review & submit →" }),
  ).toHaveCSS("background-color", "rgb(240, 190, 36)");
  await page.getByLabel("Contact number").fill("123");
  await page.getByRole("button", { name: "Review & submit" }).click();
  await expect(
    page.getByText("Enter an 11-digit contact number."),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByLabel("Contact number").fill("09123abc456789");
  await expect(page.getByLabel("Contact number")).toHaveValue("09123456789");
  await page.getByLabel("Campus").selectOption("Arlegui");
  await expect(page.getByLabel("Building")).toHaveValue("");
  await expect(page.getByLabel("Floor")).toHaveValue("");
  await page.getByLabel("Building").selectOption("Building A");
  await page.getByLabel("Floor").selectOption("2nd Floor");
  await page.getByLabel("Last seen at").fill("Demo corridor");
  await page.getByRole("button", { name: "Review & submit" }).click();
  await page.getByRole("button", { name: "Confirm and submit" }).click();
  await expect(
    page.getByRole("heading", { name: "Report received" }),
  ).toBeVisible();
});

test("lost and found reports accept specified outside locations and reach OSA review", async ({
  page,
  context,
}) => {
  for (const type of ["Lost", "Found"]) {
    await fillReport(page, type);
    await page.getByLabel("Campus", { exact: false }).selectOption("Other");
    await expect(page.getByLabel("Building")).toHaveCount(0);
    await expect(page.getByLabel("Floor", { exact: false })).toHaveCount(0);
    await page.getByRole("button", { name: "Review & submit" }).click();
    await expect(
      page.getByText(
        "Specify the place or address outside the listed campuses.",
      ),
    ).toBeVisible();
    await page
      .getByLabel("Specify location")
      .fill(`Demo ${type.toLowerCase()} bus stop, sample street`);
    await page.getByRole("button", { name: "Review & submit" }).click();
    await expect(page.getByRole("dialog")).toContainText(
      `Demo ${type.toLowerCase()} bus stop`,
    );
    await page.getByRole("button", { name: "Confirm and submit" }).click();
    await page.getByRole("button", { name: "Track my report" }).click();
    await expect(
      page.getByRole("article", {
        name: `Visitor ${type.toLowerCase()} notebook report`,
        exact: true,
      }),
    ).toContainText(`Demo ${type.toLowerCase()} bus stop`);
  }
  const osa = await context.newPage();
  await enterOSA(osa);
  await osa.getByRole("link", { name: "Report Review", exact: true }).click();
  await osa.getByLabel("Review site").selectOption("Other");
  for (const type of ["Lost", "Found"]) {
    const report = osa.getByRole("article", {
      name: `Visitor ${type.toLowerCase()} notebook report`,
      exact: true,
    });
    await expect(report).toContainText(`Demo ${type.toLowerCase()} bus stop`);
    await report.getByRole("button", { name: "Approve", exact: true }).click();
    await expect(report).toContainText("Approved");
  }
});

test("unlisted buildings and floors can be specified; OSA shares the public theme", async ({
  page,
}) => {
  await fillReport(page);
  await page.getByLabel("Building").selectOption("Other");
  await page.getByRole("button", { name: "Review & submit" }).click();
  await expect(
    page.getByText("Specify the building or outdoor area."),
  ).toBeVisible();
  await page
    .getByLabel("Specify building or area")
    .fill("Demo outdoor courtyard");
  await page.getByRole("button", { name: "Review & submit" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Demo outdoor courtyard",
  );
  await page.getByRole("button", { name: "Back to edit" }).click();
  await page
    .getByRole("combobox", { name: /^Building/ })
    .selectOption("Library");
  await page
    .getByLabel("Floor", { exact: false })
    .selectOption("Other / specify");
  await page.getByRole("button", { name: "Review & submit" }).click();
  await expect(page.getByText("Specify the floor or level.")).toBeVisible();
  await page.getByLabel("Specify floor or level").fill("Demo mezzanine");
  await page.getByRole("button", { name: "Review & submit" }).click();
  await expect(page.getByRole("dialog")).toContainText("Demo mezzanine");
  await page.getByRole("button", { name: "Back to edit" }).click();
  await enterOSA(page);
  await page.goto("/osa/reports");
  await expect(page.getByRole("banner")).toHaveCSS(
    "background-color",
    "rgb(29, 48, 59)",
  );
  await expect(page.locator(".osa-nav-active")).toHaveCSS(
    "background-color",
    "rgb(240, 190, 36)",
  );
  await expect(page.locator(".status-pending").first()).toHaveCSS(
    "background-color",
    "rgb(255, 242, 216)",
  );
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  await page.screenshot({
    path: "artifacts/osa-professional-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "artifacts/osa-professional-mobile.png",
    fullPage: true,
  });
});
