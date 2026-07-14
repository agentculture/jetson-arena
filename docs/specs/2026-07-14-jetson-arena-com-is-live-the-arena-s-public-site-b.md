# jetson-arena.com is live: the arena's public site, built on Astro static with org's exact design system, deployed to Cloudflare Pages on the existing jetson-arena.com zone, wired via cultureflare

> jetson-arena.com is live: the arena's public site, built on Astro static with org's exact design system, deployed to Cloudflare Pages on the existing jetson-arena.com zone, wired via cultureflare
> instruction: Build site-astro/ by citing org/site-astro (styles, layout, components, data pattern), rebrand for jetson-arena, verify the build is pure-static, then wire hosting: cultureflare for DNS + deploy triggers, documented fallback for Pages project + custom domains, until <https://jetson-arena.com> and www serve the site

## Audience

- Visitors evaluating Jetson model stacks (humans and agents reading the arena), plus the operator who deploys and maintains the site
  - instruction: Write the homepage for stack-evaluators: lead with the worked example, plain answer to 'what is this' above the fold; nav labels legible to humans and agents alike

## Before → After

- Before: The repo has no site: no site-astro/ directory, nothing served. The jetson-arena.com zone exists in the Cloudflare account (operator confirmed in issue #1) but points at nothing
  - instruction: Before wiring, verify the starting state: cultureflare zones list shows jetson-arena.com; curl against the apex confirms nothing is served yet
- After: <https://jetson-arena.com> (apex and www) serves a pure-static Astro build at the domain root: a homepage that leads with the Orin Nano Super 8GB voice-loop worked example as the arena's canonical first target, an arena page in an honest empty state (no runs yet), and org's look and feel throughout
  - instruction: Build site-astro/ with pages for home and arena (empty state), styled from the org copy; astro build must emit a pure-static dist/ served at the domain root

## Why it matters

- The site is the arena's public face; shipping the skeleton first gives later run records a place to land and makes the project visible before the benchmark harness exists — issue #1's own build order (site skeleton before arena view, worker, CLI)
  - instruction: Keep the leg scoped to the skeleton so it ships before the benchmark harness exists; the arena page's empty state states plainly that run records land later

## Requirements

- Style is cited from org/site-astro (cite-don't-import): copy global.css, Layout.astro, Header/Footer/HeroMesh/Mark/PageHero, and the data/site.ts + types.ts pattern into site-astro/ here, then own the copy and rebrand for jetson-arena
  - instruction: Copy global.css, Layout.astro, Header/Footer/HeroMesh/Mark/PageHero and the data/site.ts + types.ts pattern from org/site-astro at a pinned commit into site-astro/; record file-by-file provenance (org commit hash) in a docs note; then rebrand
  - honesty: Every copied file is listed with its org commit of origin in a provenance note (mirroring docs/skill-sources.md practice), so the divergence from org is auditable rather than silent
- astro.config.mjs pins site: '<https://jetson-arena.com>', output: 'static', and no base prefix — jetson-arena owns its domain root (issue #1 contrasts this with learn-cli's /learn prefix)
  - instruction: Author astro.config.mjs with exactly site: '<https://jetson-arena.com>' and output: 'static'; run astro build and spot-check that internal links in dist/ resolve at the root
  - honesty: astro.config.mjs contains exactly site + output:'static' and no base/adapter keys; internal links resolve at the domain root in the built dist/
- The two contracts in org's design system survive the copy: every text/background pair stays WCAG AA >= 4.5:1 in both themes, and the prefers-reduced-motion kill switch keeps disabling all animation site-wide
  - instruction: After any palette change, re-measure every text/background pair in both themes (>= 4.5:1) and smoke-check prefers-reduced-motion disables all animation
  - honesty: Contrast is re-verified on the rebranded palette (not assumed from org) — every text/background pair measured >= 4.5:1 in both themes after any color change, and a reduced-motion check shows zero animation
- No fabricated numbers anywhere: the worked example on the homepage is presented as the arena's first target ('what we will measure'), never as results. An honest empty state beats a fake row — the arena's credibility is the whole asset (issue #1 section 1)
  - instruction: Before every deploy, grep dist/ for latency/memory/quality figures; each hit must trace to a real measurement artifact in the repo or the copy is reworded to 'not yet measured'
  - honesty: grep the built dist/ for latency/memory/quality figures: any number shown traces to a real measurement artifact in the repo, or the page says 'not yet measured' in so many words
- Cloudflare wiring goes through cultureflare wherever it has verbs — whoami to verify the token, zones list to confirm the zone, dns create for apex + www, pages deployments create for build triggers — always dry-run first, --apply to commit
  - instruction: Start with cultureflare whoami + zones list; run every dns create as dry-run, read the plan, then --apply; record each command and its output in the hosting runbook
  - honesty: Every cultureflare mutation appears twice in the session log: once as a dry-run whose plan was read, once with --apply — and steps cultureflare cannot do are done via a documented fallback, not silently in the dashboard

## Honesty conditions

- Live check passes end to end: both hostnames serve the Astro build over HTTPS, the styling is recognizably org's system, and the deploy is reproducible from a clean checkout by following the repo's own docs
- The homepage answers 'what is this and what will I find here' on its own — a visitor never needs issue #1 or mesh context to get it
- The pre-wiring state is verified, not assumed — zone listed, apex not serving, both recorded in the runbook
- The deployed site is byte-for-byte the static dist/ of astro build — view-source shows no SSR, and hitting a nonexistent path serves the static 404, not a function
- The empty arena page says explicitly that no runs are published yet — the site's visibility never gets ahead of its data
- The leg's PR diff contains no auth, consent, Worker, SSR, or run-data code — verified by reading the diff, not by intent
- The success checks are executed and their output recorded after the real deploy — never marked done from memory

## Success signals

- curl -sI <https://jetson-arena.com> and <https://www.jetson-arena.com> return the built site; npm run build in site-astro/ exits 0 with a static dist/ and no adapter; the copied pages pass the same contrast/reduced-motion contract org verifies
  - instruction: After deploy, run the checks and record output in the runbook: curl -sI both hostnames (expect 200 + HTML), confirm dist/ is static-only, re-run the contrast/reduced-motion checks on the shipped pages

## Scope / boundaries

- Site skeleton + hosting only. No GitHub OAuth, no consent/terms machinery, no arena-api Worker, no run data or benchmark harness, no gated reproduce path — those are the follow-up legs of issue #1. No SSR adapter, ever: dynamic behavior belongs to the future Worker
  - instruction: Enforce the boundary at review time: reject any diff in this leg adding OAuth, consent, Worker, SSR adapter, or run-schema code; astro.config.mjs carries no adapter

## Assumptions

- The jetson-arena.com zone is present and active in the Cloudflare account the operator's CLOUDFLARE_API_TOKEN reaches, and the token has Pages + DNS write scopes

## Decisions

- USER DECISION: deploy via a GitHub Actions workflow — on merge to main, CI builds site-astro/ and runs wrangler pages deploy dist/ with CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID as repo secrets. Authored fresh for this repo (org's warning: no workflow template to copy). cultureflare's 'pages deployments create' build-trigger verb is not used in this model
- USER DECISION: for the two steps cultureflare cannot do, use 'wrangler pages project create' for the Pages project and documented curl calls to the Pages custom-domains API for apex + www; both scripted/recorded in the repo's hosting runbook. File an upstream cultureflare issue to port these verbs
- USER DECISION: the CLI 'site' noun group (site overview / site build, org's site.py pattern) is deferred to a follow-up PR — this leg ships site-astro/ and hosting only

## Hard questions

- cultureflare's Python CLI has no verb for Pages project creation or custom-domain attach (README scope table: 'bash skills only'). What is the sanctioned path for those two steps — wrangler, direct API calls, or the Cloudflare dashboard as a documented operator step?

## Open / follow-up

- Issue #1 section 3 in full — GitHub OAuth, consent/terms machinery (learn-cli's worker pattern), terms/privacy/consent pages, and the gated reproduce path. Next leg after the skeleton is live
- Arena data pages driven by real run records (the section-1 run schema, compare views, detail pages). Blocked on the benchmark harness existing; the skeleton ships an honest empty state instead
- Upstream cultureflare gap: port 'pages project create' and Pages custom-domain attach into the Python CLI (today: bash only). File the issue on agentculture/cultureflare after this leg ships
