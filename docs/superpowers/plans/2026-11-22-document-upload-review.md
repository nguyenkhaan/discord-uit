# Document upload and admin review

## Goal

Implement phase 5.2 as a direct-to-MinIO upload flow. Malware scanning is intentionally out of scope for this slice.

## Flow

1. `POST /documents/upload-init` validates metadata, creates hidden document records, and returns a short-lived signed PUT URL.
2. The frontend uploads the selected file directly to MinIO with progress and one retry.
3. `POST /documents/{submissionId}/complete` verifies the object exists and matches the declared size/type, then moves media to `READY` and the submission to `PENDING_REVIEW`.
4. Admin preview/download uses a short-lived signed GET URL and does not expose the object key.
5. Admin approve changes the submission to `APPROVED` and document visibility to `PUBLIC`; reject changes the submission to `REJECTED` and keeps the document hidden.

## Verification

- Backend unit tests cover validation, completion mismatch/idempotency, signed URL access, and approve/reject transitions.
- Frontend tests cover upload status/progress helpers and the existing document filtering behavior.
- Run backend tests, frontend tests, type-check, build, and targeted lint before handoff.
