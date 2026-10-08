# Day 6: Fair scoring and anti-cheat

## Goal
Replace opaque raw model scoring with a deterministic, evidence-based rubric and treat integrity anomalies as review signals rather than automatic punishment.

## Scoring model
The evaluator observes four dimensions:

- Evidence (30%): concrete examples, measurements, tests, implementations, metrics.
- Reasoning (30%): causal explanation, trade-offs, sequencing, conditions and alternatives.
- Specificity (20%): relevant technical concepts instead of generic statements.
- Clarity (20%): structured answer signals plus a minimum useful length.

The output includes the component scores, a 0-100 evidence score, and the existing 1-5 qualityScore used by the interview graph.

This is a consistency rubric, not a truth detector. Production use should pair it with question-specific answer keys, testable facts or human review before making high-stakes decisions.

## Anti-cheat policy
The automated layer flags four signals:

1. Prompt-injection language.
2. Requests to reveal or provide the answer.
3. Exact duplicate answers across turns.
4. Unusually fast long answers.

Integrity flags are review signals and do not directly subtract from the candidate score. This reduces the chance that a noisy detector becomes an unfair penalty.

## API
POST /api/interview/evaluate

Authenticated JSON body:

{
  "answer": "string",
  "previousAnswers": ["string"],
  "responseDurationMs": 1500
}

The response includes qualityScore, scoreBreakdown and antiCheat.

## Known limitations
- No browser clipboard, tab-focus or proctoring telemetry is collected by this API.
- Timing anomalies can have benign causes such as rehearsed answers or accessibility tools.
- Semantic correctness still requires question-specific evidence or an assessor; the rubric intentionally does not pretend lexical signals can prove factual correctness.
- Any flagged case should be reviewed under the same rubric as unflagged responses.

## Verification
Run: pnpm check && pnpm build