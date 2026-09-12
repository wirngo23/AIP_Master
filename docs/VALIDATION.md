# Validation record — foundation release

## Landmark and dosage update — September 12, 2026

- All 18 tests and TypeScript checks passed, including shader syntax, detected-coordinate warp geometry and strict dosage record validation.
- Native inference using the bundled MediaPipe model detected both fictional sample faces and produced geometry accepted by the application.
- See [landmark and dosage release](LANDMARK_AND_DOSAGE_RELEASE.md) for the measured preset displacement, honest model boundaries and source references. Browser interaction/GPU appearance remain unverified.

## 360° update — September 12, 2026

- All 11 domain and spatial tests passed, including actual GLB surface coverage for every selectable muscle group and paired side, and saved-setting backward compatibility.
- TypeScript checking and the production build passed. The build reports a large JavaScript chunk warning for the graphics dependency; performance across target devices remains unmeasured.
- Independent source review identified missing side-face patches and a transparency shader update defect. Both were fixed and the reviewer confirmed the corrections.
- No browser interaction or visual QA was performed for this update. This does not verify photorealism, anatomical fidelity, or clinical dose response. See [spatial scope](SPATIAL_RELEASE.md).

## Earlier foundation checks

- Domain tests passed: 20 unique archetypes; bounded settings; invalid directions and non-finite inputs rejected; conceptual progression endpoints and bounds; contact consent/email validation; same-origin write checks.
- TypeScript type checking passed.
- Production Worker build passed, including the frontend, API routes, D1/R2 manifest, and generated schema migration.
- Local API integration checks passed against the compiled Worker: application routes, unauthenticated rejection, explicit photo-storage consent, cross-origin write rejection, durable study creation, private photo read, account isolation, consented draft creation, owned-study linking, consultation review, photo deletion, and consultation unlinking/deletion.
- Test records used synthetic names and a generated fictional sample portrait. The integration flow deleted its study and consultation fixtures.
- A focused independent source review found two study-state defects; both were corrected and re-reviewed: settings-only studies retain framing on re-upload, and deleting a photo clears dependent preview state even after controls have been adjusted.

## Validation limits

Browser interaction, visual layout, WebGL rendering across devices, mobile/keyboard/screen-reader behavior, and end-to-end hosted identity were not exercised in this turn. These require the hands-on experience-validation milestone. The local development preview was rendered successfully over HTTP.

The optional WebMCP tools were implemented with schemas, shared validation, state updates, and lifecycle cleanup. No supporting live WebMCP validation context was available, so registration and execution are **not verified**.

No clinical accuracy, dose-response accuracy, complication reduction, conversion improvement, or competitor superiority has been established. No security/compliance certification is claimed. This record describes a private application foundation, not clinical deployment readiness.
