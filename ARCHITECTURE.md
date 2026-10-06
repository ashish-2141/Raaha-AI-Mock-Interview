# Architecture

Day 3 adds an explicit adaptive-interview state machine:

```text
START
  |
  v
evaluate answer
  |
  +---- vague/shallow ----> follow-up probe
  |
  +---- strong ------------> difficulty +1
  |
  +---- weak --------------> difficulty -1
  |
  v
select next non-repeated question
  |
  v
END
```

The graph keeps state keys explicit and serializable so the workflow is easy to test and persist.