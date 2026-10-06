# Day 2 Resume Validation

The Day 2 implementation supports authenticated PDF upload, PDF text extraction, structured AI extraction, and Zod validation.

Validation completed locally against 10 synthetic resume profiles covering CSE, IT, ECE, EEE, MECH, CIVIL, AI/ML, Data Science, Cybersecurity and Other.

Synthetic fixture validation: 10/10 passed schema validation.
Invalid-CGPA negative test: passed.

The plan's acceptance criterion asks for 10 real resumes with fewer than 10% field errors. No real resumes were supplied in this task, so this criterion is pending. The report must not claim 10 real resumes were parsed.

Production validation:
1. Provide 10 consented, non-sensitive test PDFs.
2. Run each PDF through POST /api/resumes/parse.
3. Compare extracted fields with a human-checked reference profile.
4. Count field-level errors and require <10%.