# Day 3 - Adaptive Interview Engine

## Implemented

- LangGraph.js state graph for an explicit evaluate -> question workflow.
- State includes interviewId, turnNumber, difficultyScore, questionHistory and evaluatedConcepts.
- Resume-aware project context.
- Last-three-turn context builder, with older turns summarized as a count to avoid token growth.
- Heuristic evaluator with a 1-5 quality score.
- Follow-up probing for vague or shallow answers.
- Difficulty rises after strong answers and drops after weak answers.
- Anti-repetition by filtering questions already asked.
- Redis 24-hour state storage utility using node-redis.

LangGraph provides stateful graph execution and conditional workflow building, which fits the conversation-state requirements for this feature. The current npm release is 1.4.18. Redis documents node-redis as the recommended Node.js client and supports Redis 8.0.z. citeturn824823search0turn824823search1

## Acceptance evidence

Three automated test interviews are implemented:
1. Initial question is grounded in a resume project.
2. A vague answer triggers a follow-up.
3. A strong answer increases difficulty.

These tests verify the core Day 3 behavior without requiring paid model calls.