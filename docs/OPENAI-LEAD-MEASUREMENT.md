# OpenAI lead measurement

Sources read on 2026-10-30: https://developers.openai.com/ads/measurement-pixel and https://developers.openai.com/ads/supported-events.

## Behavior

The optional checkbox is unchecked on each page load. It is outside and before the form, so choosing or refusing tracking never changes validation, the lead payload, or the idempotency fingerprint. It remains available after confirmation for withdrawal. New request resets consent to false.

No third-party SDK, preconnect, initialization, or measurement request occurs before opt-in. On opt-in the local measure.js sets consent false before init, loads the documented OpenAI SDK and enables consent on load. Withdrawal clears waiting receipts and denies SDK consent. An epoch prevents a revoked receipt from being sent when the SDK loads later. Timeout or SDK errors disable measurement for this page without interrupting the quote request.

Only an HTTP-success response with success=true, stored=true and receipt matching the submission UUID triggers the hook, after the lead confirmation is displayed. Only the first locally confirmed receipt is eligible: an already confirmed record from session storage is not replayed after reload. An ambiguous timeout remains eligible when its first valid durable receipt arrives, including duplicate=true responses. Event ID is the stable receipt UUID. Per-page seen IDs prevent repeated attempts; SDK/vendor deduplication uses the same pixel, event and event ID.

The sole event is lead_created, type customer_action, options event_id and opt_out=true. No manual user object, form coordinates, project text, email, address, amount or location is passed. There is no automatic page view call. opt_out does not disable current automatic advanced matching: when enabled in pixel configuration, the SDK may detect and hash customer coordinates. The consent notice explicitly mentions cookies and hashed coordinates; it does not promise anonymity. SDK consent false removes its documented cookies. Refusing measurement never prevents a lead being stored.

## Scope and verification

This change prepares browser measurement. It does not create an Ads conversion-event setting, attach an optimization goal, change targeting, creative, budget or objective, or prove any event was received by OpenAI. It creates no production test lead, SMS or notification. No server-side personal data is sent to OpenAI by this integration.

The CSP allowlist adds only bzrcdn.openai.com to script-src, bzr.openai.com and bzrcdn.openai.com to connect-src, and bzr.openai.com to img-src. All other directives and the existing intake endpoint remain restricted. No unsafe-inline or unsafe-eval is added.

Tests use synthetic receipts and transports; no production request is sent. They cover default refusal, false-before-init ordering, minimal payload, receipt validation, retry and duplicate receipts, revocation while loading, late loading and timeout, SDK exceptions, optional new-request reset, prior stored receipts after reload, and consent after earlier refusal. The backend HTTP test stubs only the lead service to avoid opening a database; Express and GET asset delivery are real.

Deployment verification must read the published HTML, measure.js and CSP, verify no third-party network before opt-in, and verify an approved test protocol separately if required. A successful local SDK call alone is not a vendor acknowledgement. Browser blockers, lack of consent and attribution gaps limit coverage. Remove the new measurement script/checkbox, hook, route and CSP sources together to roll back; retain existing lead intake and UUID fallback.
