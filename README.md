# MediKiosk backend

## Local setup

```bash
npm install
cp .env.example .env
# Set DATABASE_URL, JWT_SECRET, and GEMINI_API_KEY in .env.
# For local Aiven development, use sslmode=no-verify in DATABASE_URL when its CA is unavailable.
npx prisma generate
npm run dev
```

The server runs on `http://localhost:3000` by default. Set `FRONTEND_ORIGIN` to
the Vite URL when it differs from `http://localhost:5173`.

## Gemini Live handoff

`POST /app/voice/live-token` takes one of these payloads:

```json
{ "purpose": "input-translation", "language": "hi" }
```

```json
{ "purpose": "question-speech", "language": "hi" }
```

It returns a short-lived Gemini token and locked model configuration. The
browser uses the `input-translation` session for patient audio. It sends the
Hindi transcript and English translation to the controlled interview route:

```text
POST /app/interviews/:id/voice-answer
```

The server validates the current question, advances the fixed interview state,
and returns the next server-owned question. A breathing-related answer creates
a critical red flag while continuing to the next question.

The `question-speech` token is constrained to translate and speak only the
question supplied by the backend. It must not conduct the clinical interview.

## Checks

```bash
npm test
npx tsc --noEmit
```

Create a local interview with:

```bash
curl -X POST http://localhost:3000/app/interviews \
  -H 'Content-Type: application/json' \
  -d '{"patientId":"demo-patient","mode":"general"}'
```

Use the returned `interviewId`, then test a red flag:

```bash
curl -X POST http://localhost:3000/app/interviews/INTERVIEW_ID/voice-answer \
  -H 'Content-Type: application/json' \
  -d '{"questionId":"chief_complaint","spokenTranscript":"मुझे सांस लेने में परेशानी है","translatedAnswer":"I have difficulty breathing","language":"hi"}'
```
