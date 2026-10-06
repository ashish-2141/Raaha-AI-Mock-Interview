# Day 2 Tech Notes

Tech review focus: mobile view and page speed.

Current public-site audit:
- Public home returned HTTP 200.
- One browser performance run measured about 1.94s total navigation and about 1.93s DOMContentLoaded, below the plan's 3s target for this measured page.
- Mobile-mode scrapes returned current content and screenshots for the home page, Build90, Intensives, Java Backend, Sign in and Sign up.
- A reliable 390x844 DOM measurement was not obtained, so mobile timing/overflow is marked pending rather than guessed.
- Authenticated Build90 checks previously showed Dashboard and Internships load successfully. Today, Roadmap and Skills redirect to onboarding until the starting-level assessment is completed.
- Carryover defects: internship details can show no official application link; application-guide content can remain in a loading/preparing state.