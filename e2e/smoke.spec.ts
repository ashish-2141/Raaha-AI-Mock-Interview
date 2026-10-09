import { expect, test } from "@playwright/test";

test("home page links to the product's primary workflows", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Raaha AI Mock Interview" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  await expect(page.getByRole("link", { name: "Start with a resume" })).toHaveAttribute("href", "/resumes");
  await expect(page.getByRole("link", { name: "Start an interview" })).toHaveAttribute("href", "/voice-interview");
  await expect(page.getByRole("link", { name: "Live coding round" })).toHaveAttribute("href", "/live-coding");
});

test("login screen exposes account registration without submitting credentials", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await page.getByRole("button", { name: "Create an account" }).click();
  await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
  await expect(page.getByLabel("Password")).toHaveAttribute("autocomplete", "new-password");
});

test("resume profile in this tab personalises the interview setup", async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("raaha.resume.profile", JSON.stringify({
      fullName: "Test Candidate",
      branch: "ECE",
      cgpa: 8.4,
      skills: ["C", "MQTT"],
      projects: [{
        name: "Sensor Gateway",
        techStack: ["C", "MQTT"],
        summary: "A synthetic test fixture for browser-flow validation.",
      }],
    }));
  });

  await page.goto("/voice-interview");
  await expect(page.getByText(/Using the profile for Test Candidate/)).toBeVisible();
  await expect(page.getByLabel("B.Tech branch")).toHaveValue("ECE");
  await expect(page.getByLabel("Target role")).toHaveValue("Embedded/IoT Engineer");
  await page.getByText("Resume projects used to personalise questions").click();
  await expect(page.getByText(/Sensor Gateway/)).toBeVisible();
});

test("voice recognition submits a turn using the newly created interview ID", async ({ page }) => {
  const interviewId = "00000000-0000-7000-8000-000000000001";
  let receivedTurn: Record<string, unknown> | null = null;

  await page.addInitScript(() => {
    const browser = window as unknown as {
      SpeechRecognition: unknown;
      SpeechSynthesisUtterance: new (text: string) => unknown;
      speechSynthesis: { cancel: () => void; speak: (utterance: unknown) => void };
    };
    class MockRecognition {
      continuous = false;
      interimResults = false;
      lang = "en-IN";
      onend: (() => void) | null = null;
      onerror: ((event: unknown) => void) | null = null;
      onresult: ((event: unknown) => void) | null = null;

      start() {
        window.setTimeout(() => {
          this.onresult?.({
            results: [[{ transcript: "First I would validate the API request and test the database query." }]],
          });
          this.onend?.();
        }, 0);
      }
      stop() {}
      abort() {}
    }
    browser.SpeechRecognition = MockRecognition;
    browser.SpeechSynthesisUtterance = class {
      constructor(_text: string) {}
    };
    browser.speechSynthesis = { cancel() {}, speak() {} };
  });

  await page.route("**/api/interview/voice/start", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        interviewId,
        turnNumber: 0,
        nextQuestion: "First question",
        difficultyScore: 3,
        followUp: false,
        qualityScore: 0,
        latencyMs: 30,
        mode: "adaptive",
        pilotCohort: false,
      }),
    });
  });

  await page.route("**/api/interview/voice/turn", async (route) => {
    receivedTurn = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        interviewId,
        turnNumber: 1,
        nextQuestion: "Follow-up question received",
        difficultyScore: 4,
        followUp: true,
        qualityScore: 4,
        latencyMs: 45,
        mode: "adaptive",
      }),
    });
  });

  await page.goto("/voice-interview");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Start interview" }).click();
  await expect(page.getByText("First question")).toBeVisible();
  await page.getByRole("button", { name: "Speak answer" }).click();
  await expect(page.getByText("Follow-up question received")).toBeVisible();
  expect(receivedTurn).toMatchObject({
    interviewId,
    transcript: "First I would validate the API request and test the database query.",
  });
});

test("protected endpoints return a clear 503 when Supabase is not configured", async ({ page }) => {
  await page.goto("/");
  const response = await page.request.post("/api/resumes/parse");
  expect(response.status()).toBe(503);
  await expect(page.getByText("Supabase authentication is not configured on this deployment.")).toHaveCount(0);
  expect(await response.json()).toMatchObject({
    error: "Supabase authentication is not configured on this deployment.",
  });
});

test("live coding page loads a challenge without exposing hidden cases", async ({ page }) => {
  await page.goto("/live-coding");
  await expect(page.getByRole("heading", { name: "Live coding round" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Two Sum" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run hidden tests" })).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(1);
  await expect(page.getByRole("checkbox").first()).not.toBeChecked();
  await expect(page.getByText("Given an integer array nums and an integer target", { exact: false })).toBeVisible();
});
