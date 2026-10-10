# Day 4: Real-time voice interview

The Day 4 coding target is a browser-first real-time interview slice with an explicit fallback path.

## Flow

```text
Start interview
   |
   v
POST /api/interview/voice/start
   |
   v
Adaptive question from existing interview graph
   |
   v
Browser SpeechRecognition -> transcript
   |
   v
POST /api/interview/voice/turn
   |
   v
Adaptive follow-up / next question
   |
   +--> SpeechSynthesis reads the response
   |
   +--> Text fallback when voice is unsupported or a request fails
   |
   +--> Interrupt cancels speech and returns the UI to idle/listening
```

## API contract

### Start

`POST /api/interview/voice/start`

Request:
- `interviewId`
- `branch`
- `role`
- `difficultyScore`
- `resumeProjects`

The API authenticates the user and persists the interview state in Redis with the existing 24-hour TTL utility.

### Turn

`POST /api/interview/voice/turn`

Request:
- `interviewId`
- `transcript`

The route loads the persisted state, sends the transcript through the existing adaptive interview graph, persists the next state, and returns the next question plus timing metadata.

## Browser behavior

- SpeechRecognition captures a final transcript.
- SpeechSynthesis reads the next question.
- Interrupt cancels speech immediately.
- Text input stays available as a graceful fallback.
- The UI records response latency for every round.
- The client uses a deterministic text-safe question when the network request fails.
- The resume page transfers only the validated branch and project name/technology/summary into tab-scoped session storage. The interview page revalidates that context and sends it as `resumeProjects`; name, CGPA and the general skill list are not copied.

## Acceptance checklist

| Check | Implementation | Acceptance evidence |
|---|---|---|
| Voice input | Browser SpeechRecognition | Code + unit tests |
| Voice output | SpeechSynthesis | Code inspection |
| Adaptive turn | Existing interview graph + Redis session state | Code + API contract |
| Interruption | Speech cancellation + recognition abort | Code inspection |
| Unsupported voice browser | Text textarea fallback | Code inspection |
| Network failure | Deterministic local fallback question | Unit test |
| Response timing | `performance.now()` + API latency | UI instrumentation |
| Android weak-network <2s | Not measured in this environment | Requires real device/network |
| Hosted staging | Free Render service is live; health/Redis smoke check passed | Does not prove authentication, AI feature operation, production durability, or real-device acceptance |
