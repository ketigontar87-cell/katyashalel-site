# Public interaction audit

Scope: all 71 public EN/RU HTML pages in `site_motion_manifest.json`, based on published main `9700a1720a4e3fdb36064775f7026665b31a074d`. The excluded noindex carousel export utility is unchanged. This is a targeted interaction repair, not a visual or editorial redesign.

## Confirmed defects and repairs

- The EN/RU homepage strategy paragraph named Legibi without linking it. Add a native, underlined contextual link to `https://legibi.ai/`, preserving paragraph typography. The nearby proof link already worked. All service-page Legibi mentions were already links.
- EN/RU mobile menu remained expanded after selecting About or Contact and obscured the destination. Close it before native anchor navigation, transfer focus to the destination, retain normal hash/history behavior, add sticky-header clearance and 44px menu touch targets. With JavaScript disabled an expanded menu scrolls with the page instead of covering the destination, and native anchor scrolling is immediate to avoid a smooth-scroll/font-loading race.
- External inbound `/#person` had no DOM target. Give the existing About heading `id="person"` on both homepages. Existing `#about`, all copy and canonical Person JSON-LD remain unchanged.
- Two visible essay links pointed to missing `/vocabulary/#indifference-test`. Point those anchors at the existing `#the-indifference-test` entry.
- Nine guide waitlist forms treated HTTP 200 with an application-level failure as success. Require explicit positive acknowledgement; failures keep the email and re-enable the button. No backend or destination changes.
- The EN Sprint lead form accepted HTTP errors if their body contained `ok:true`. Require successful HTTP status and announce feedback with the same status semantics as existing service forms.
- Normal Copy functionality works, including native clipboard round trips. A separate, reproduced permission-denied path previously raised an unhandled rejection. On denial or missing Clipboard API, select the prompt and say “Selected” / “Выделено”, without claiming it was copied. Preserve successful copying and reset repeated-click feedback correctly.

## Coverage and evidence

`interactions_browser.cjs` inventories all public routes at 390px and 1440px. It verifies native control hit targets, focusability, unexplained pointer-styled elements, every internal HTML/file/API source destination and known fragment, all native disclosures, every Copy button, denied/missing clipboard APIs, and mocked form outcomes: invalid input, success, HTTP error, negative acknowledgement, empty acknowledgement, invalid JSON and network failure. It includes actual browser clipboard write/read checks on EN/RU guides. Every POST is intercepted; external runtime requests are blocked.

Homepage navigation receives additional EN/RU checks at 390, 500, 768 and 1440px with motion, reduced motion and JavaScript disabled: menu touch-target size, keyboard/touch activation, collapsed-menu focus, destination clearance, contextual Legibi link and inbound `#person`. Screenshots and machine-readable results are uploaded in the exact-head website-browser CI artifact.

The existing 24-page-case browser suite, 18-case homepage motion suite and 426-case full-site motion suite remain. Historical baseline exceptions are limited to the two newly authorized contextual links and two corrected visible vocabulary hrefs. Layout, visible copy, metadata, schemas, images and existing motion are still compared with their original baselines. All 126 JSON-LD blocks parse and match published main.

## Existing limitations, deliberately not reauthored

- `/ru/guides/sprint/` declares EN and x-default alternates to `/guides/sprint/`, but the EN page has no reciprocal hreflang. No new translation or metadata was invented; AGENTS.md requires reporting metadata changes outside the design scope.
- The essay's JSON-LD still contains the pre-existing `https://katyashalel.com/vocabulary/#indifference-test` identity reference. Only the two visible navigable anchors were repaired; schema remains byte-for-byte unchanged.
- The public inventory is 42 EN and 29 RU pages, not 71 translated pairs. Existing absent translations remain absent.
- Forms and Copy require JavaScript; reading, links and native disclosures remain available without it. Mocked success establishes client behavior, not live email delivery. No real submission was made.
- Workspace live-site Chromium/HTTP access is blocked by the environment proxy. Browser evidence here is local and CI; independent live QA supplied the mobile menu and contextual-link reproductions. External destination availability and production backend delivery are not claimed as verified by this suite.
- The existing 2px overflow on `/essays/who-owns-the-recommendation/` at 390px is unchanged from the historical baseline.

## Release boundary

Draft PR / branch preview only. Main and production stay at the published release. No production promotion, merge, credentials, new dependencies, remote model calls, real leads, emails or purchases. The Legibi repository and the unrelated workspace repository are untouched.
