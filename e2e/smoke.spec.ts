import { expect, test } from "@playwright/test";

test("home page links to the main student and TPO routes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Raaha AI Mock Interview" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  await expect(page.getByRole("link", { name: "Parse a resume" })).toHaveAttribute("href", "/resumes");
  await expect(page.getByRole("link", { name: "Start an interview" })).toHaveAttribute("href", "/voice-interview");
  await expect(page.getByRole("link", { name: "Try live coding" })).toHaveAttribute("href", "/live-coding");
  await expect(page.getByRole("link", { name: "College dashboard (authorised TPOs)" })).toHaveAttribute("href", "/college-dashboard");
});

test("voice setup consumes validated resume project context", async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("raaha.interview.resumeContext", JSON.stringify({
      branch: "ECE",
      role: "Embedded Systems Intern",
      resumeProjects: [{
        name: "Smart Irrigation",
        techStack: ["C", "ESP32", "MQTT"],
        summary: "Sensor-based irrigation prototype.",
      }],
    }));
  });

  await page.goto("/voice-interview");
  await expect(page.getByLabel("B.Tech branch")).toHaveValue("ECE");
  await expect(page.getByLabel("Target role")).toHaveValue("Embedded Systems Intern");
  await expect(page.getByText(/Smart Irrigation/)).toBeVisible();
  await expect(page.getByLabel(/I consent to processing/)).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Start interview" })).toBeDisabled();
});

test("live coding page loads the public Two Sum challenge", async ({ page }) => {
  await page.goto("/live-coding");
  await expect(page.getByRole("heading", { name: "Live coding round" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Two Sum" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Code editor" })).not.toBeEmpty();
  await expect(page.getByRole("button", { name: "Run hidden tests" })).toBeEnabled();
});
