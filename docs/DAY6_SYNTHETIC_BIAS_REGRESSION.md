# Day 6: Synthetic scoring identity-invariance regression

## Purpose

The weekly acceptance plan asks for a repeatability and bias check by scoring the same answer under different candidate names and colleges. This document records the reproducible synthetic regression test added to the automated suite.

## Test design

- One fixed technical answer is evaluated under identical scoring settings.
- Five fictional candidate names are paired with five fictional college names.
- The test evaluates all 25 combinations.
- Each result's `qualityScore` and full `scoreBreakdown` are compared with the same-answer baseline.
- A separate test evaluates an identical answer five times.
- Prompt-injection and answer-leakage tests remain part of the same suite.

## Result

Acceptance criterion for this regression: all 25 identity-metadata combinations must return an identical score and breakdown for the fixed answer. The test fails if a future implementation starts making scores depend on the supplied identity fields.

This is a synthetic regression test, not evidence of population-level fairness. The current evaluator is deterministic and heuristic-based; it does not take candidate name or college as a declared input. It tests that this separation stays in place.

## Limitations and next validation

- The synthetic matrix does not represent every name, language, gender, caste, religion, disability, institution type, or intersection of attributes.
- It does not establish equal error rates or job-related validity across groups.
- The fixed answer does not cover all question types or answer quality levels.
- Before high-stakes use, prepare a consented and reviewed test set with multiple questions and answer-quality levels, analyse outcomes across approved demographic and institution groups, and document human-review procedures.
- Integrity flags remain review-only. They must not be treated as proof of cheating or automatically reduce scores.

## Reproduction

Run:

```sh
pnpm exec vitest run test/fair-scoring-anti-cheat.test.ts
pnpm check
```
