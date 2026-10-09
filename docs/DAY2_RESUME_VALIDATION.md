# Day 2 Resume Validation

The Day 2 implementation supports authenticated PDF upload, PDF text extraction, structured AI extraction, and Zod validation. After a successful parse, the client stores only the validated profile in the current tab's `sessionStorage`; the interview setup reads its branch and project details. The raw PDF is not stored in browser storage, and the profile is cleared when the tab session ends or when the user clears it.

Schema validation is covered with 14 synthetic profiles representing CSE, IT, ECE, EEE, MECH, CIVIL, AI/ML, Data Science, Cybersecurity, Chemical, Metallurgy, Mining, Biotech and Other.

Synthetic fixture validation: 14/14 pass schema validation in automated tests. This checks the schema only; it is not evidence of real resume extraction accuracy.
Invalid-CGPA negative test: passed.

The plan's acceptance criterion asks for 10 real resumes with fewer than 10% field errors. No real resumes were supplied in this task, so this criterion is pending. The report must not claim 10 real resumes were parsed.

Production validation:
1. Provide 10 consented, non-sensitive test PDFs.
2. Run each PDF through POST /api/resumes/parse.
3. Compare extracted fields with a human-checked reference profile.
4. Count field-level errors and require <10%.