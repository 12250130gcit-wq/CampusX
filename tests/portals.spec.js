import { test, expect } from "@playwright/test";

const gatePages = [
  "index",
  "verification",
  "outside-students",
  "overdue",
  "movement-logs",
  "visitor-register",
  "visitors",
  "leave-lookup",
  "students",
  "event-mode",
  "manual-record",
  "notifications",
  "reports",
  "profile",
  "settings",
].map((name) => name + ".html");
const sessions = {
  student: {
    role: "student",
    id: "STU-2024-014",
    name: "Karma Wangchuk",
    email: "12250052gcit@rub.edu.bt",
  },
  sso: { role: "sso", id: "ADM-SSO-001", name: "Karma Wangdi" },
  gatekeeper: { role: "gatekeeper", id: "GK-001", name: "Nima Dorji" },
};

test.beforeEach(async ({ page }) => {
  // Exercise the documented offline fallback without depending on a running API.
  await page.route("**/api/**", (route) => route.abort());
  await page.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ contentType: "text/css", body: "" }),
  );
});

for (const [role, paths] of Object.entries({
  student: ["index.html"],
  sso: ["index.html"],
  gatekeeper: gatePages,
})) {
  for (const file of paths) {
    test(`${role}/${file} renders and initializes`, async ({ page }) => {
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (
          message.type() === "error" &&
          !message.text().includes("net::ERR_FAILED")
        )
          errors.push(message.text());
      });
      await page.addInitScript(
        (session) =>
          localStorage.setItem("campusx_session_v1", JSON.stringify(session)),
        sessions[role],
      );
      await page.goto(`/${role}/${file}`);
      await expect(page.locator("#root")).not.toBeEmpty();
      if (role === "gatekeeper")
        await expect(page.locator("main.page h2").first()).toBeVisible();
      await expect(
        page.locator(
          role === "student"
            ? "#helloName"
            : role === "sso"
              ? "#sidebarName"
              : "#sidebar-root",
        ),
      ).not.toBeEmpty();
      await expect
        .poll(() =>
          page
            .locator("img")
            .evaluateAll((images) =>
              images.every((image) => image.complete && image.naturalWidth > 0),
            ),
        )
        .toBe(true);
      expect(errors).toEqual([]);
    });
  }
}

test("protected pages redirect to login", async ({ page }) => {
  await page.goto("/student/index.html");
  await expect(page).toHaveURL(/index\.html\?denied=student/);
  await expect(page.locator("#loginForm")).toBeVisible();
});

test("student can log in and log out", async ({ page }) => {
  await page.goto("/");
  await page.locator("#lg-id").fill("STU-2024-014");
  await page.locator("#lg-pw").fill("student123");
  await page.locator("#loginForm button[type=submit]").click();
  await expect(page).toHaveURL(/student\/index.html/);
  await expect(page.locator("#helloName")).toContainText("Karma");
  await page.locator("[data-view=profile]").click();
  await page.locator("#logoutBtn").click();
  await expect(page).toHaveURL(/\/index.html$/);
  expect(
    await page.evaluate(() => localStorage.getItem("campusx_session_v1")),
  ).toBeNull();
});

test("leave request passes from student to SSO approval and gatekeeper lookup", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.evaluate(
    (session) =>
      localStorage.setItem("campusx_session_v1", JSON.stringify(session)),
    sessions.student,
  );
  await page.goto("/student/index.html");
  await page.locator("#applyBtnHome").click();
  await page.locator("#fDate").fill("2026-12-10");
  await page.locator("#fExit").fill("17:00");
  await page.locator("#fReturn").fill("20:00");
  await page.locator("#fDest").selectOption({ label: "Thimphu Town" });
  await page.locator("#fReason").fill("React migration workflow verification");
  await page.locator("#leaveForm button[type=submit]").click();
  await expect(page.locator("#statusLabel")).toHaveText("PENDING");
  await page.evaluate(
    (session) =>
      localStorage.setItem("campusx_session_v1", JSON.stringify(session)),
    sessions.sso,
  );
  await page.goto("/sso/index.html#leave");
  await page
    .getByRole("button", { name: "Approve", exact: true })
    .first()
    .click();
  await expect(page.locator("#content")).toContainText("Approved");
  await page.evaluate(
    (session) =>
      localStorage.setItem("campusx_session_v1", JSON.stringify(session)),
    sessions.gatekeeper,
  );
  await page.goto("/gatekeeper/leave-lookup.html");
  await page.getByRole("searchbox").fill("STU-2024-014");
  await page.getByRole("button", { name: "Look Up", exact: true }).click();
  await expect(page.locator("article")).toContainText("APPROVED");
  await expect(page.locator("article")).toContainText("Thimphu Town");
  expect(errors).toEqual([]);
});
