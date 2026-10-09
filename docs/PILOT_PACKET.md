# College pilot packet

Use these templates only after the service is deployed, the college has approved the pilot, and the privacy notice has been reviewed. Replace every bracketed field. Do not claim the service is live until its real URL and smoke test are recorded.

## 1. Email to a Training and Placement Officer

Subject: Request for a small voluntary AI mock-interview pilot for students

Hello [TPO name],

I am preparing a small pilot of Raaha AI Mock Interview, a practice tool intended to help students rehearse technical interview questions and identify areas for further study.

I would like to ask whether [college name] would consider reviewing the tool for a voluntary pilot with 10 students. The proposed pilot will gather feedback on interview practice, usability, response time and areas where students want more preparation support.

The college dashboard is designed to show aggregate skill and branch-level results only. It hides overall results until five consenting participants have contributed and suppresses branch or skill groups with fewer than five participants. It is a learning aid, not a hiring or grading system. Participants will receive a consent notice and are free to stop at any time without academic or placement consequences.

Before any students are invited, I will share the actual deployed URL, a short data-handling note, pilot dates, and the participation steps for your review. No participation is assumed until the college approves the pilot.

Would you be available for a short review?

Regards,
[Your name]
[Your contact details]

## 2. Student invitation

Subject: Voluntary technical mock-interview practice pilot

Hello,

You are invited to try a short pilot of Raaha AI Mock Interview at [verified HTTPS URL].

Participation is voluntary. The tool presents interview questions, processes the answer transcript, and provides practice feedback. The pilot team will review aggregated use, performance and feedback to improve the practice experience. The college dashboard does not show individual answers or student identifiers. Groups with fewer than five distinct participants are suppressed.

Interview session data is stored temporarily in the application session store and expires after 24 hours of inactivity. This is not a promise that all copies are deleted from every operational system; the team should verify provider logs and retention settings before launch. Do not enter information that you do not want processed.

You may decline or stop at any time. Participation will not affect your grades, academic standing, or eligibility for placements. Please read the in-app consent notice before beginning.

Pilot window: [start date] to [end date]
Contact for questions or withdrawal: [pilot contact]

Thank you,
[Your name / pilot team]

## 3. Pre-invitation checklist

- [ ] TPO or authorised college representative approves the pilot in writing.
- [ ] Final consent and data-handling wording is reviewed by the college.
- [ ] Actual production URL is recorded, and `/api/health` returns HTTP 200 with Redis healthy.
- [ ] Supabase sign-in and an authenticated mock interview are smoke-tested.
- [ ] An authorised TPO gets dashboard access. An unassigned account receives HTTP 403.
- [ ] Pilot invite code and TPO-to-college mapping are stored in hosting secrets, not source control.
- [ ] The invite code is delivered privately to the invited participants.
- [ ] The operations lead knows where the approved cost ceiling and stop conditions are documented.
- [ ] Participants understand the tool is for practice, not formal assessment.
- [ ] No real student data is used for acceptance testing before consent.

## 4. Pilot protocol

1. Recruit 10 distinct, consenting student accounts. Count distinct participants, not interviews.
2. Give each student the same instructions and access window.
3. Let each participant complete one interview, if they choose. Record non-completion without pressure to continue.
4. Invite students to complete the short feedback survey below.
5. Review aggregate dashboard results and operational logs. Do not copy raw answers, names, email addresses or authentication identifiers into the pilot report.
6. Stop the pilot if a privacy incident occurs, the app becomes unavailable, cost exceeds the approved limit, or the college withdraws approval.
7. Use only measured figures in the post-mortem. Do not fill missing figures with estimates presented as observations.

## 5. Post-session feedback survey

Keep the form anonymous unless there is an approved reason to collect contact details. Do not ask for grades, passwords, private resume details or personal identifiers.

1. Was it clear what to do to start and complete the interview? (1 = not clear, 5 = very clear)
2. Did the questions feel relevant to your target role? (1-5)
3. Was the feedback useful for deciding what to practise next? (1-5)
4. Did voice or text input work reliably on your device? (1-5, plus optional technical note)
5. What was the most useful part?
6. What should be fixed before a wider release?
7. Did you feel able to stop or decline without pressure? (Yes / No / Prefer not to answer)

## 6. One-page post-mortem template

### Pilot details
- College:
- Approved by / approval date:
- Deployed revision:
- Actual production URL:
- Pilot dates:
- Participants invited:
- Distinct consenting participants:
- Distinct participants who started:
- Distinct participants who completed:
- Participation denominator and completion-rate formula:

### Reliability and performance
- Health check at start and end:
- Authenticated load-test revision and JSON result:
- Observed request count:
- Observed server error count/rate:
- Observed p50/p95 latency:
- Observed interview start/turn failures:
- Known outages or device/network constraints:

### Cost
- Model name:
- Token-rate source/date:
- Input/output tokens:
- Estimated API cost and formula:
- Hosting cost for the pilot window:
- Unknown/unmeasured cost items:

### Student experience
- Survey response count:
- Average response for each 1-5 question:
- Common positive feedback:
- Common problems:
- Actions and owner for each issue:

### Privacy and safety
- Consent flow verified:
- TPO account access verified:
- Small-group suppression verified:
- Any data incident or withdrawal request:
- Retention/log review completed:

### Decision
- Proceed / fix and repeat / pause:
- Blocking fixes:
- Responsible owner and due date:
- Evidence links:

Do not publish this report until the partner college reviews it. Report aggregated results only and clearly identify missing measurements.
