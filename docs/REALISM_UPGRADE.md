# Realism and connected workflow upgrade

## Implementation plan

The current approved direction is a more realistic AIP across all portals. Preserve the existing editor and introduce an explicitly generated photographic concept, not a medical prediction. Keep original capture and treatment evidence distinct.

- [x] Add a consent-gated server image-edit adapter and shared photographic rendering UI. Preserve original pixels outside the requested region, reject large framing/landmark drift, invalidate renders when controls/source change, bound requests and avoid saving photographs on the server. Provide clearly labeled pre-rendered fictional samples, not fabricated live generation.
- [x] Improve the local beard preview's natural boundary and growth variation; make photographic comparison the higher-quality path.
- [x] Add a guided multi-angle photo viewer alongside recorded video, with local handling and explicit captured-angle labels. Unseen anatomy is not reconstructed.
- [x] Add Clinical Studio comparison of actual follow-up photographs with baseline, date and observation notes. No automatic dose-to-image inference.
- [x] Connect a clinic-supplied secure booking URL and practitioner registry link through saved clinic configuration. Do not fabricate verification, appointments, referral payments or messages. Public embedding continues to respect the site's audience.
- [x] Test state invalidation, regional restrictions, photo request validation, unconfigured-provider handling, privacy boundaries, all portals and production build; review, push and deploy.

## External requirements

The site has no configured rendering API credentials. Live photographic generation requires an owner-provided, funded OpenAI API connection stored as the server runtime secret OPENAI_API_KEY and explicit AIP_PHOTO_RENDER_ENABLED=true. No credential should be pasted into chat or committed. Defaults cap each account at 10 requests/day.

Clinical validation requires qualified clinical leadership, consented longitudinal data and prospective evaluation. A single frontal photo does not provide complete personal 360-degree anatomy. Live practitioner verification, appointment status and referral settlement require actual clinic/jurisdiction/provider inputs. The user has been asked for the first clinic's name, region and booking URL.

## Sources

- https://developers.openai.com/api/docs/guides/image-generation — image editing API, current model and output behavior, checked 2026-09-12.
- Existing docs/NEXT_MILESTONES.md — clinical response evaluation and launch gates.

## Delivered and verified

Photographic fictional male beard variants and a female Natural balance lip sample are composited regionally. Other portraits continue to use the instant renderer until the external image service is connected. Original restoration, region selection, and render invalidation remain shared across Discover, Clinical Studio and Connect. Existing face and hair edits are retained when a photographic beard sample is present. Local synthetic beards use a lighter base coat and varied growth density.

The personal-photo API adapter is implemented but inactive: no credential is configured, so no successful live personal-photo generation has been claimed or tested. Provider request/response handling is covered with mocked tests. Runtime requires OPENAI_API_KEY and AIP_PHOTO_RENDER_ENABLED=true. Use the OpenAI Developers plugin to provision a funded key through approved setup; never paste it into chat. The user has been asked to enable it. Each attempted render reserves one of ten daily account slots; request IDs prevent duplicate submission, including failed attempts. Only request ID, owner and UTC day are stored for quota enforcement; images are not stored by this endpoint.

Guided five-angle uploads and a recorded-turn viewer show actual captures, not personal 3D reconstruction. Clinical actual-outcome export requires an uploaded baseline, permission, and ordered capture dates. Comparison photographs and notes remain local and must be exported before leaving. Capture pose and lighting are not automatically standardized.

Connect saves a secure clinic booking URL, registry URL and location. Links open the clinic-supplied destination; no credentials are declared verified, no appointment confirmation is inferred, no referral revenue is fabricated, and no follow-up messages are sent. Existing consultation draft review remains available. Public embedding and practitioner verification still need clinic details and production integrations.

Validation: 48 automated tests passed, including regional masks, intensity endpoints, source invalidation, provider failure handling, URL restrictions and the actual quota SQL. Eight compiled-worker API checks passed for authentication, CSRF, disabled provider, saved links and owner isolation. TypeScript and production build passed. Independent review findings were corrected. Browser checks cover photographic male beards, Original restoration, female lips and switching among all three portals; local upload/export and the live paid provider still need device/service acceptance testing.

No competitive superiority or dose-response validation has been established. Personal 3D reconstruction, product/tissue-specific response models, longitudinal wear-off prediction, clinician validation, live referral settlement and public onboarding remain explicit external/development milestones.
