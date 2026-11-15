# Classification wait-progress design

## Intent

Make the wait after a user uploads a document feel understandable without changing the MVP's synchronous request architecture.

## Goals

- Replace the submit button state with a visible progress panel immediately after a valid file is submitted.
- Show clear stages: preparing document, extracting text/OCR, matching catalogue, and generating suggestions.
- Animate an estimated percentage from 0% to a capped 95% while the server processes the request.
- Preserve native form submission and the server-rendered result/error page.
- Respect reduced-motion preferences and keep the upload control accessible.

## Non-goals

- No background job, polling endpoint, WebSocket, persisted task state, or claim that the percentage is actual backend completion.

## Approaches

1. Real progress via background task and polling: accurate but adds request state, lifecycle handling, and more infrastructure.
2. Estimated client-side wait progress (chosen): lightweight, immediate, compatible with the synchronous FastAPI MVP, and explicitly presented as an estimate.
3. Spinner only: simplest but gives less insight into what is happening.

## Design

- `static/app.js` validates that a file is selected; then hides the normal submit control, reveals a `role="status"` panel, and advances through predefined stages on a timer.
- The bar progresses from 0 to 95% with easing and never displays 100% before the response replaces the page.
- The template provides semantic progress markup, and CSS supplies the visual treatment plus reduced-motion fallback.
- Server route behavior and analysis results remain unchanged.
