# Build Plan — jetson-arena.com is live: the arena's public site, built on Astro static with org's exact design system, deployed to Cloudflare Pages on the existing jetson-arena.com zone, wired via cultureflare

slug: `jetson-arena-com-is-live-the-arena-s-public-site-b` · status: `exported` · from frame: `jetson-arena-com-is-live-the-arena-s-public-site-b`

> jetson-arena.com is live: the arena's public site, built on Astro static with org's exact design system, deployed to Cloudflare Pages on the existing jetson-arena.com zone, wired via cultureflare

## Tasks

### t1 — Verify the pre-wiring state and start the hosting runbook

- instruction: Run: cultureflare whoami; cultureflare zones list; curl -sI <https://jetson-arena.com>. Paste each command + verbatim output into a new docs/hosting-runbook.md with a short preamble saying what the runbook is. Expect the zone present and the apex unserved (parking/522/NXDOMAIN all fine — record what it actually says). Requires CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID in the environment; if missing, stop and report rather than fake output
- covers: c3, h9
- acceptance:
  - docs/hosting-runbook.md exists and records: cultureflare whoami output (token valid), zones list output showing jetson-arena.com, and a curl against the apex showing nothing served yet
  - every recorded command appears with its actual output, not a paraphrase

### t2 — Scaffold site-astro/ citing org/site-astro at a pinned commit, with provenance

- instruction: Pin the org commit: git -C /home/spark/git/org rev-parse HEAD. Copy from /home/spark/git/org/site-astro: src/styles/global.css, src/layouts/Layout.astro, src/components/{Header,Footer,HeroMesh,Mark,PageHero}.astro, src/data/{site.ts,types.ts}, plus package.json/tsconfig.json adapted for this repo. Copy verbatim — rebranding is t3's job. Author astro.config.mjs with exactly site: '<https://jetson-arena.com>' and output: 'static'. npm install && npm run build must exit 0. Write docs/site-sources.md listing every copied file with the pinned org commit hash, modeled on docs/skill-sources.md
- covers: c7, h2, c8, h3
- acceptance:
  - site-astro/ contains global.css, Layout.astro, Header/Footer/HeroMesh/Mark/PageHero, and the data/site.ts + types.ts pattern copied from org/site-astro; npm run build exits 0
  - docs/site-sources.md lists every copied file with the org commit hash it came from
  - astro.config.mjs contains exactly site: '<https://jetson-arena.com>' and output: 'static' — no base, no adapter; internal links in dist/ resolve at the root

### t3 — Rebrand and build the homepage: worked example as the hook, nav owned here

- instruction: Own every shared-file edit so t4 stays disjoint: rebrand src/data/site.ts (name, url, description, nav = home + arena), Header/Footer strings, and rewrite src/pages/index.astro. Above the fold: what jetson-arena is (the arena for whole model stacks on Jetson devices), then the hook — Orin Nano Super 8GB realtime voice loop VAD -> STT -> LLM -> TTS as the canonical first target, phrased as what will be measured (latency / memory signature / quality). Zero numeric results anywhere. Keep org's palette and motion system untouched; drop org-only pages (framework/engage/agents) from nav and delete their copied .astro files if t2 brought them
- depends on: t2
- covers: c2, h8, c10
- acceptance:
  - src/data/site.ts and the nav (Header) carry jetson-arena branding and the full nav including the arena entry — this task owns all shared-component edits so siblings stay file-disjoint
  - index.astro leads with the Orin Nano Super 8GB voice-loop (VAD -> STT -> LLM -> TTS) presented as the arena's first target, with an above-the-fold plain answer to 'what is this site'
  - no latency/memory/quality number appears anywhere on the page; the worked example reads as 'what we will measure', not results

### t4 — Arena page in an honest empty state

- instruction: Create src/pages/arena.astro and touch nothing else (nav already links to it via t3). Use PageHero + the org visual language. Copy states plainly: no runs are published yet; a run = one (device x stack) measurement with latency, memory signature, and quality; run records land here when the benchmark harness ships. Link to the GitHub repo and issue #1 for the roadmap
- depends on: t3
- covers: c4, c5, h10
- acceptance:
  - src/pages/arena.astro exists and states in plain copy that no runs are published yet and that run records land here later
  - this task touches only src/pages/arena.astro (nav entry already owned by t3)

### t5 — Contrast and reduced-motion verification on the rebranded palette

- instruction: Write site-astro/scripts/check-contrast.mjs: parse the theme custom-property pairs out of src/styles/global.css (both light and dark blocks), compute WCAG contrast for every text/background pair used, fail below 4.5. Run it and record the output table in docs/site-sources.md. For reduced motion: verify the prefers-reduced-motion block in global.css still zeroes every animation/transition and record the check. If any pair fails, fix the token and re-run — the recorded result must be from the final palette
- depends on: t3, t4
- covers: c9, h4
- acceptance:
  - a repeatable check (script under site-astro/scripts/ or a recorded procedure in docs/site-sources.md) measures every text/background pair in both themes at >= 4.5:1 on the final palette
  - a prefers-reduced-motion smoke check shows zero animation site-wide; both results are recorded, not asserted

### t6 — GitHub Actions deploy workflow: build site-astro/, wrangler pages deploy dist/

- instruction: Author .github/workflows/deploy-site.yml fresh: on push to main with paths site-astro/** (plus workflow_dispatch); steps: checkout, setup-node 22 with npm cache on site-astro/package-lock.json, npm ci, npm run build, then npx wrangler pages deploy dist --project-name jetson-arena using secrets.CLOUDFLARE_API_TOKEN and secrets.CLOUDFLARE_ACCOUNT_ID. Touch no existing workflow file. Note in the workflow comments that the Pages project is created by the t7 runbook, not by CI
- depends on: t2
- acceptance:
  - .github/workflows/deploy-site.yml builds site-astro/ and runs wrangler pages deploy on push to main touching site-astro/**, using CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID repo secrets
  - the workflow is authored fresh (not templated from org, which deliberately has none) and touches no other workflow file

### t7 — Cloudflare wiring: Pages project, custom domains, DNS — recorded in the runbook

- instruction: All commands + verbatim output append to docs/hosting-runbook.md. Steps: (1) wrangler pages project create jetson-arena --production-branch main; (2) attach both custom domains via curl POST accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/jetson-arena/domains for jetson-arena.com and <www.jetson-arena.com>; (3) cultureflare dns create for apex and www CNAMEs to jetson-arena.pages.dev — dry-run first, read the plan, then --apply. Decide www: serve or 301 (risk r2) and record the decision. Nothing via dashboard; every step scripted and reproducible
- depends on: t1
- covers: c11, h6
- acceptance:
  - wrangler pages project create output, the curl calls attaching jetson-arena.com + www as Pages custom domains, and cultureflare dns create for apex + www (dry-run first, then --apply) are all recorded verbatim in docs/hosting-runbook.md
  - no step is done silently in the dashboard; anything cultureflare cannot do appears as a documented scripted fallback

### t8 — Pre-PR boundary and no-fabrication audit of the leg's diff

- instruction: Read the full branch diff (git diff main...HEAD). Confirm zero OAuth/consent/Worker/SSR-adapter/run-schema code and astro.config.mjs still has no adapter. Build, then grep dist/ for numeric latency/memory/quality figures (regex for ms, GB, tok/s, percentages near metric words) — every hit must trace to a real measurement artifact or get reworded to 'not yet measured'. Record both results in the PR description
- depends on: t3, t4, t5, t6, t7
- covers: c6, h11, h5
- acceptance:
  - the full branch diff is read and verifiably contains no OAuth, consent, Worker, SSR-adapter, or run-schema code; astro.config.mjs still has no adapter
  - grep of the built dist/ finds no latency/memory/quality figure that lacks a real measurement artifact in the repo

### t9 — Go-live verification: deploy is live, static, and recorded

- instruction: Post-merge, after the deploy workflow succeeds: curl -sI <https://jetson-arena.com> and <https://www.jetson-arena.com> (expect 200 + text/html); curl a nonexistent path (expect the static 404 page, not a function response); spot-check view-source matches dist/. Re-run scripts/check-contrast.mjs against the shipped CSS. Append all outputs verbatim to docs/hosting-runbook.md in a follow-up commit. If any check fails, file it as a bug immediately — do not record success from memory
- depends on: t8
- covers: c1, h7, h1, c12, h12
- acceptance:
  - after the merge-triggered deploy, curl -sI <https://jetson-arena.com> and <https://www.jetson-arena.com> both return 200 with the built HTML; output recorded in docs/hosting-runbook.md
  - a nonexistent path serves the static 404 (no function); view-source shows the static dist/ content
  - the contrast/reduced-motion checks re-run against the shipped pages and their output is recorded — nothing marked done from memory

## Risks

- [unknown_nonblocking] CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID must be set as repo secrets and exported locally by the operator — a credentialed step the agent cannot do; t1's whoami is the first check that the token works and reaches the zone (task t7)
- [unknown_nonblocking] Whether www serves the site directly or 301s to the apex — decidable during t7 without changing the frame (task t7)
- [unknown_nonblocking] t9 verifies a merge-triggered deploy, so it completes only after the PR merges — the one task that outlives the branch (task t9)
