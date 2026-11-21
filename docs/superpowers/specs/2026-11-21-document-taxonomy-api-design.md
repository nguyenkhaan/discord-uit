# Document Taxonomy API Design

## Intent

Implement the backend contract for Task 5.1 using the existing normalized
`collection` and `tag` schema. Administrators manage taxonomy; public clients
can read it for library browsing and later document filters.

## Goals

- Provide CRUD for collections and tags under admin-only endpoints.
- Provide paginated public read endpoints for collections and tags.
- Normalize names, descriptions, keywords, and lowercase kebab-case slugs at
  the service boundary.
- Return predictable `400`, `404`, `409`, and `403` errors.
- Refuse deletion when a collection or tag is referenced by an official
  document assignment or an AI classification suggestion.
- Keep document-to-collection many-to-many semantics from the existing
  `document_collection` join table.

## Non-goals

- No database redesign or migration for the already normalized taxonomy.
- No category model or category API.
- No upload, media, OCR, classification worker, moderation, or resubmission
  workflow.
- No automatic creation of taxonomy from AI output.

## Approaches

1. Add taxonomy endpoints inside the existing document controller/service. This
   keeps the file count small but mixes catalogue administration with document
   upload and makes authorization boundaries less clear.
2. Add a focused `modules.taxonomy` controller/service layer backed by the
   existing entities and repository package. This is the chosen approach: it
   keeps the API contract cohesive without introducing a new service or
   changing the schema.
3. Add a generic dynamic taxonomy framework. This is rejected because only two
   concrete entities exist and it would add indirection without a requirement.

## Contract decisions

- Public endpoints: `GET /collections`, `GET /collections/{slug}`,
  `GET /tags`, and `GET /tags/{slug}`.
- Admin endpoints mirror the resources under `/admin/collections` and
  `/admin/tags` with `GET`, `POST`, `PATCH`, and `DELETE`.
- List endpoints accept `page`, `size`, and optional `query`; responses carry
  `items`, `page`, `size`, `totalElements`, and `totalPages`.
- Collection payloads contain `name`, `description`, `slug`, and normalized
  `keywords`; tag payloads contain `name`, `description`, and `slug`.
- Duplicate name or slug conflicts return `409 CONFLICT`. Delete conflicts
  return `409 CONFLICT` and never cascade through association tables.

## Remaining work

Implement DTOs, repositories, service validation and conflict checks,
controllers, security annotations, focused backend tests, and update the
generated frontend contract only if this backend slice owns that artifact.
