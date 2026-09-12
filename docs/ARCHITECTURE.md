# AIP foundation architecture

## Data flow

1. Discover accepts an adult portrait after permission acknowledgement. Browser normalization constrains dimensions, converts to JPEG, and strips original metadata from the encoded output.
2. The original image remains in browser memory. Manual framing aligns the image to the fixed editing coordinates. WebGL applies bounded texture displacement for four appearance controls.
3. A saved study stores validated preference settings under the authenticated account. A separate opt-in uploads the normalized original to private R2 storage. Settings-only studies explicitly require the original image to be uploaded again.
4. Consultation drafts can reference only studies owned by the same account. Drafts and notes remain private; changing review status does not send a message or book an appointment.
5. Connect shows the same account's draft pipeline and persists a clinic configuration. `/embed` is a functional private preview. It does not transmit facial data to its embedding parent.

## Server boundaries

Every data route checks Sites identity server-side. Every write checks the request Origin against its request URL. Queries use bound parameters and owner predicates. Photo reads resolve the storage key through an owned study instead of accepting an arbitrary object key. Responses containing records or portraits use `private, no-store`; photos are served as JPEG with `nosniff`.

The dispatcher must strip untrusted identity headers. The compiled local Worker intentionally has no independent identity provider and must never be exposed as an unprotected production origin.

Requests have bounded streamed bodies, validated fields, and limited stored records (100 studies and 100 drafts per account in this initial release). These limits are basic bounds, not a complete public-service abuse-control system. Public release needs transactional quotas, rate limiting, audit and incident controls, and a completed security assessment.

## Persistence model

| Table | Ownership and contents |
| --- | --- |
| studies | Account ID, title, validated settings JSON, optional R2 key, creation time |
| consultations | Account ID, contact details, nullable owned study, stated goal, future follow-up preference, draft/reviewed/archived status, notes |
| clinics | Account ID and clinic preview configuration |

Indexes support account-scoped recency queries and consultation unlinking. Drizzle-generated migrations are the only schema-creation mechanism. No runtime schema creation is used.

Deleting a study removes the R2 object when present, unlinks associated consultations, and deletes the study row. Deleting a consultation removes its contact details and notes. Provider-level backup lifecycle, legal retention, consent revocation across actual clinics, and operational recovery need launch policies before real clinical use.

## Appearance renderer

`components/aip/portrait.tsx` draws a 750 × 1000 WebGL surface. Four Gaussian texture deformations change cheek contour, jaw contour, lip appearance, and brow expression. The original remains available through a split-view uniform. A bounded artistic progression envelope has zero effect at both endpoints and maximum effect at the midpoint.

Archetypes set visual-edit defaults only. They do not encode biological response. Percentage labels refer to image-editing strength, never units or milliliters. No landmark detector, depth estimator, segmentation model, muscle model, pharmacology model, or trained outcome model is included. If WebGL is unavailable, the original stays visible with an explicit error.

## API surface

| Route | Behavior |
| --- | --- |
| GET/POST /api/studies | List or create own study; POST is bounded multipart data with separate photo consent |
| DELETE /api/studies/:id | Delete owned study and stored photo; unlink own consultation drafts |
| GET /api/studies/:id/photo | Read an owned stored portrait |
| GET/POST /api/consultations | List or create own consultation drafts |
| PATCH/DELETE /api/consultations/:id | Update review status/notes or delete own draft |
| GET/PUT /api/clinic | Read or save own clinic preview configuration |

WebMCP, where available, exposes only read/configure appearance settings. It cannot save, delete, upload, message, or create a consultation. Inputs use the same validation and visible state as the UI. The tool registration is optional and does not block ordinary browsers.

## Operational limits

This is a private foundation release, not a complete clinical SaaS deployment. It has no practitioner verification, clinic membership roles, cross-account sharing, live appointment provider, notification sender, payment/referral ledger, formal compliance attestation, or clinically validated prediction. The roadmap keeps those features visible without pretending they are active.
