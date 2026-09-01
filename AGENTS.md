# AGENTS.md — katyashalel.com

## What this site is

Personal entity hub for Ekaterina Shalel (Katya Shalel), founder and legibility strategist. The primary job of this codebase is to stay machine-readable and internally consistent for AI crawlers and retrieval systems. Visual polish is secondary to structured-data correctness.

## Identity constants, never change without an explicit instruction

- Canonical name (EN): Ekaterina Shalel. Alternate: Katya Shalel.
- Canonical name (RU): Екатерина Шалель. Alternate: Катя Шалель.
- Role string: "Founder and legibility strategist".
- Email everywhere: shalelekaterina@gmail.com. No other address appears in schema, footers, or contact pages.
- ORCID: 0009-0003-8973-6443
- Wikidata: Q138801513
- Zenodo concept DOI: 10.5281/zenodo.21840173
- Zenodo version DOI: 10.5281/zenodo.21840174
- homeLocation on the Person node: Paris, France.
- sameAs must never contain vc.ru. If it reappears in a diff, remove it.

## Structured data rules

1. The homepage Person node must declare an explicit @id. Every other reference to the person across the site points at that same @id, never at a duplicate inline Person object.
2. founderOf on the Person node and founder on the getmai.ai Organization node stay bidirectional. If one side changes, flag the other side as an open task in the PR description.
3. Every essay carries BlogPosting plus DefinedTerm plus FAQPage JSON-LD.
4. FAQPage question strings match the visible headline verbatim. No paraphrase, no punctuation drift.
5. Validate JSON-LD parses before commit. A malformed block is a blocking bug.

## Bilingual rules

- Full EN/RU parity. Every page has a counterpart.
- The translation graph is bidirectional. If A points to B as its alternate, B points back to A. Zero dangling references. Run a link check across all pairs after any page is added, renamed, or removed.
- hreflang tags on both sides, plus x-default.
- Do not machine-translate copy. New language versions are authored, not generated.

## Publishing infrastructure that must keep working

- robots.txt open to all AI crawlers. Never add a blanket disallow.
- sitemap.xml includes every live URL, both languages.
- llms.txt and agent-card.json stay in sync with the site. Bump the agent-card version on any material change.
- RSS and Atom feeds regenerate on new posts.
- IndexNow ping after deploy.

## Editorial rules

- Headlines in the question-first essay series are verbatim search queries. Do not rewrite them.
- Essays end on argument, not on navigation or a call to action.
- No new coined terms. Vocabulary is frozen until the September measurement window. If a draft introduces a new named concept, stop and flag it instead of shipping it.
- Never write an em dash. Use a comma, a colon, or a period.

## Design work

You may freely change: CSS, Tailwind classes, styled components, animation and transition code, layout structure inside a page component, typography scale, color tokens, shadows, borders, radii, images, icons, decorative SVG.

You may never change as part of a design task: any JSON-LD block in any file, hreflang tags, canonical tags, meta titles, meta descriptions, URLs, file names, route names, slugs, the visible text of headlines, body copy, or FAQ questions, llms.txt, agent-card.json, robots.txt, sitemap, feeds.

If a design change would require altering any of the above, stop and describe the conflict in the PR instead of doing it.

Every design task ships to its own branch and never to main. Include a short list in the PR description of exactly which files you touched.

## Commits

Commit author email must be shalelekaterina@gmail.com. Verify git config user.email before the first commit. Any other address breaks deployment.

## Working style

- Small, single-purpose commits. One concern per pull request.
- Before touching schema, read the existing JSON-LD on at least two neighboring pages and match the shape.
- When something looks wrong but the fix is ambiguous, open the PR with the diagnosis and no change, rather than guessing.
- Never invent dates, metrics, citations, or credentials. If a value is unknown, leave the field out.