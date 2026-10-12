import { test, expect } from "@playwright/test";
const gateSession = { id: "GK-001", name: "Nima Dorji", role: "gatekeeper" };
test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", (route) => route.abort());
  await page.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ contentType: "text/css", body: "" }),
  );
});
async function asGate(page) {
  await page.addInitScript(
    (session) =>
      localStorage.setItem("campusx_session_v1", JSON.stringify(session)),
    gateSession,
  );
  await page.goto("/gatekeeper/index.html");
  await expect(page.locator("main.page h2").first()).toBeVisible();
}
test("React navigation preserves the document and supports browser Back", async ({
  page,
}) => {
  await asGate(page);
  await page.evaluate(() => (window.reactNavigationMarker = "same-document"));
  await page
    .getByRole("link", { name: "Student Directory", exact: true })
    .click();
  await expect(page.locator("main h2")).toHaveText("Student Directory");
  expect(await page.evaluate(() => window.reactNavigationMarker)).toBe(
    "same-document",
  );
  await page.goBack();
  await expect(page.locator("main h2").first()).toContainText("Nima");
  expect(await page.evaluate(() => window.reactNavigationMarker)).toBe(
    "same-document",
  );
});
test("visitor registration and checkout persist across React routes", async ({
  page,
}) => {
  await asGate(page);
  await page
    .getByRole("link", { name: "Register Visitor", exact: true })
    .click();
  for (const [id, value] of Object.entries({
    "v-name": "React Visitor",
    "v-contact": "17123456",
    "v-cid": "12345678901",
    "v-visiting": "Test Student",
    "v-visitingId": "12250052",
    "v-purpose": "Family visit",
  }))
    await page.locator("#" + id).fill(value);
  await page.getByRole("button", { name: "Register & Issue Pass" }).click();
  await expect(page.locator("section")).toContainText("React Visitor");
  await page
    .getByRole("link", { name: "Visitors Inside", exact: true })
    .click();
  await page.getByRole("button", { name: "Check Out", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "React Visitor", exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Include checked-out visitors").check();
  await expect(
    page.getByRole("cell", { name: "React Visitor", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "CHECKED OUT", exact: true }),
  ).toBeVisible();
});
test("approved student can exit and return with offline persistence", async ({
  page,
}) => {
  await asGate(page);
  await page.evaluate(() => {
    localStorage.setItem(
      "campusx_leaves",
      JSON.stringify([
        {
          id: "test-leave",
          studentId: "12250052",
          studentName: "NIMA SEDON",
          status: "approved",
          date: "2026-09-10",
          exitTime: "08:00",
          returnTime: "20:00",
          destination: "Town",
          decidedBy: "SSO",
        },
      ]),
    );
  });
  await page.getByRole("link", { name: "Scan / Verify", exact: true }).click();
  await page.locator("#search-input").fill("12250052");
  await page.locator("#search-results button").first().click();
  await page.getByRole("button", { name: "Record Exit", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Record Return", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.locator("#search-input").fill("12250052");
  await page.locator("#search-results button").first().click();
  await page
    .getByRole("button", { name: "Record Return", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Record Exit", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("cx_logs")).map((r) => r.action),
    ),
  ).toEqual(["ENTRY", "EXIT"]);
});
test("event settings persist when navigating away and back", async ({
  page,
}) => {
  await asGate(page);
  await page.getByRole("link", { name: "Event Mode", exact: true }).click();
  await page.getByLabel("Event name").fill("Campus Festival");
  await page.getByLabel("Enable event mode").check();
  await page.getByRole("button", { name: "Save Event Settings" }).click();
  await expect(
    page.getByRole("heading", { name: "EVENT MODE ACTIVE", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Event Mode active", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Event Mode", exact: true }).click();
  await expect(page.getByLabel("Event name")).toHaveValue("Campus Festival");
});
test("student registration validates the college email and creates an account", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Register", exact: true }).click();
  await page.locator("#rg-name").fill("React Student");
  await page.locator("#rg-id").fill("REACT-001");
  await page.locator("#rg-email").fill("student@example.com");
  await page.locator("#rg-pw").fill("testPassword123");
  await page.locator("#rg-cpw").fill("testPassword123");
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page.getByRole("alert")).toContainText("gcit@rub.edu.bt");
  await page.locator("#rg-email").fill("12345678gcit@rub.edu.bt");
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page.locator("#loginForm")).toBeVisible();
  await expect(page.locator("#lg-id")).toHaveValue("REACT-001");
  await page.locator("#lg-pw").fill("testPassword123");
  await page.locator("#loginForm button[type=submit]").click();
  await expect(page.locator("#helloName")).toContainText("React");
});
