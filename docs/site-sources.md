# Site upstream sources

`site-astro/` is **cited, not imported**, from
[`agentculture/org`](https://github.com/agentculture/org)'s `site-astro/`
Astro project — the same cite-don't-import model `docs/skill-sources.md`
uses for `.claude/skills/`. Every file listed below was copied byte-verbatim
(sha256-checked at copy time) from the sibling checkout `../org` at commit

```text
2e4357772332db4c84b598efddb855b4638f04fc
```

That commit is `org`'s `HEAD` at the time this ledger was written — it was
verified with `git -C ../org rev-parse HEAD` and matched the commit this task
was pinned to, so no substitution was needed. Once cited, these files are
owned by jetson-arena: they are edited here freely, and `org` moving on does
not change them. A future re-sync (see below) is a deliberate, reviewed pull,
never an automatic one.

## Why cite, not import

Astro components and data files are project source, not a package
dependency — there is no npm registry entry for "org's site shell" to
install. Citing means jetson-arena gets a working copy it can diverge from
(different site content, different pages) without waiting on upstream or
carrying a version constraint. The trade-off is the one cite-don't-import
always makes: no automatic updates, so drift is tracked by hand in this file
instead of by a lockfile.

## Copied files

Still byte-verbatim against the `org` commit above — safe to re-sync:

| Local path | Upstream path (`../org/site-astro/`) | Notes |
|---|---|---|
| `site-astro/src/styles/global.css` | `src/styles/global.css` | Verbatim. Design tokens (colors, type, motion) for the whole site — "First light over the mesh" theme. |
| `site-astro/src/components/HeroMesh.astro` | `src/components/HeroMesh.astro` | Verbatim. The hand-placed constellation SVG used on the home hero. No lobes dependency. |
| `site-astro/src/components/Mark.astro` | `src/components/Mark.astro` | Verbatim. The three-node wordmark glyph used in `Header`/`Footer`. |
| `site-astro/src/components/PageHero.astro` | `src/components/PageHero.astro` | Verbatim. Sub-page title + intro block; not wired into any page yet since only `index.astro` was copied. |
| `site-astro/tsconfig.json` | `tsconfig.json` | Verbatim. |
| `site-astro/public/apple-touch-icon.png` | `public/apple-touch-icon.png` | Verbatim. Referenced by `Layout.astro` (`<link rel="apple-touch-icon">`). |

`package.json`, `astro.config.mjs`, and `package-lock.json` are **not**
cited — they are written fresh for jetson-arena (different `name`, different
`site` URL, no `base`/`adapter`). See [Fresh (non-cited) files](#fresh-non-cited-files).

## Not copied

Per task scope, the following `org`-only surface was deliberately **not**
copied, since jetson-arena is not building the AgentCulture org site:

- `src/pages/framework.astro`, `src/pages/engage.astro`, `src/pages/agents.astro`,
  `src/pages/agents/` — org-only pages.
- `src/data/lobes.ts`, `src/data/lobes-captures.ts` — lobes-cli capture data,
  not used by anything copied here.
- `src/components/LobesDiagram.astro`, `src/components/LobesTerminal.astro` —
  lobes-cli demo components, not used by anything copied here.
- `public/favicon.ico` — exists in `org/site-astro/public/` but is not
  referenced by any copied file (`Layout.astro` only links `favicon.svg` and
  `apple-touch-icon.png`); left out under the "only what's referenced" rule.
  A follow-up can add it back if browser-default `/favicon.ico` requests
  matter later.

## Divergences

At copy time, none were required — all 13 files were copied byte-for-byte
(verified by `sha256sum` against the `org` source), and the task's
contingency ("if `index.astro` imports lobes components, strip those
imports/sections minimally") did not trigger.

The **jetson-arena rebrand** (task t3) then intentionally diverged the
files below from the `org` copy. Per this ledger's own convention they have
graduated out of the cited set: they are jetson-arena's own now, and are
**never re-synced verbatim** from `org` again (a future re-sync must be a
reviewed, by-hand merge).

### Diverged — no longer re-synced

| Local path | What changed, relative to the `org` copy |
|---|---|
| `site-astro/src/data/site.ts` | Content fully rewritten for jetson-arena: `name`/`url`/`description`, `nav` = Home (`/`) + Arena (`/arena/`) only, and a jetson-arena hero. The org's framework/agents/engage content is gone. No value states or implies a measured result — nothing is measured yet. |
| `site-astro/src/data/types.ts` | Shape reshaped for jetson-arena: `SiteData` is now `name`/`url`/`description`/`nav`/`hero` (plus `NavLink`); the org's `framework`/`agents`/`engage` interfaces were dropped. Strictly necessary — the org shape had no site identity or nav for the shared components to read. |
| `site-astro/src/components/Header.astro` | Wordmark and nav now read `site.name` / `site.nav` from the data layer; hard-coded links to `/learn/`, `/framework/`, `/agents/`, `/engage/` removed. Styles byte-identical to the org copy. |
| `site-astro/src/components/Footer.astro` | Same data-layer switch as `Header.astro`, plus a GitHub link to `https://github.com/agentculture/jetson-arena` and a rebranded operator note. Styles byte-identical to the org copy. |
| `site-astro/src/pages/index.astro` | Rewritten as jetson-arena's home page: hero leads with the first target (Jetson Orin Nano Super 8GB, realtime voice loop VAD → STT → LLM → TTS), the three axes as *what will be measured*, and the reproducible-by-design note. Reuses the org hero/scroll-hint/card CSS verbatim; new sections (target chip, pipeline chain, axis grid) use only existing tokens and the existing motion system. Zero numeric performance figures. |
| `site-astro/src/layouts/Layout.astro` | One meta change: `og:site_name` reads `site.name` instead of `site.hero.title` (the org shape's field). Everything else byte-identical. |
| `site-astro/public/favicon.svg` | XML comment retitled from AgentCulture to Jetson Arena so no AgentCulture string ships in `dist/`. The drawn mark (paths, colors) is byte-identical. |

### Known gap: nav link to the not-yet-built arena page

`site.nav` links to `/arena/`, but `src/pages/arena.astro` is owned by a
later task and does not exist yet, so that nav link 404s in the built
`dist/` until it lands. This is deliberate — the nav contract (Home +
Arena) is fixed here; the page follows.

## Fresh (non-cited) files

- `site-astro/package.json` — written fresh: `name: "jetson-arena-site"`,
  `private: true`, `dev`/`build`/`preview` scripts, and the same `astro`
  major version `org/site-astro/package.json` pins (`astro@^7.0.7`, pinned
  from `org`'s exact `7.0.7`). Also carries `@fontsource-variable/albert-sans`
  and `@fontsource-variable/fraunces`, because the cited `Layout.astro`
  imports both directly — dropping them would break the build.
- `site-astro/astro.config.mjs` — written fresh, intentionally minimal:
  `site: 'https://jetson-arena.com'` and `output: 'static'` only. No `base`
  (this site owns its domain root, unlike a path-mounted subsite) and no
  `adapter` (pure static `dist/`, no SSR).
- `site-astro/package-lock.json` — generated by `npm install` against the
  fresh `package.json`; committed for reproducible installs.

## Verification performed

- Every cited file's sha256 was diffed against the `org` source at copy
  time; all 13 matched exactly.
- `npm install && npm run build` inside `site-astro/` exits `0` and emits
  `dist/index.html` plus the referenced fonts, CSS, and icons.
- `dist/index.html`'s internal `href`/`src` attributes all resolve at the
  site root (`/`, `/favicon.svg`, `/_astro/...`) with no path prefix, and the
  canonical `<link>` resolves to `https://jetson-arena.com/` — confirming
  `astro.config.mjs`'s `site` + `output: 'static'` (no `base`) is wired
  correctly.

## Re-sync procedure

```bash
# Diff a cited file against upstream before pulling a refresh:
diff -u ../org/site-astro/src/styles/global.css site-astro/src/styles/global.css

# Pull one file fresh (verbatim citations only — the diverged files above,
# plus package.json, astro.config.mjs, and package-lock.json, are
# jetson-arena's own and are never overwritten from org):
cp ../org/site-astro/src/components/HeroMesh.astro site-astro/src/components/HeroMesh.astro

# Re-verify the build still exits 0 after any re-sync:
cd site-astro && npm run build
```

If a re-sync would lose a jetson-arena-specific edit, that file graduates
out of the cited set — drop its row from "Copied files" into the
[Diverged — no longer re-synced](#diverged--no-longer-re-synced) table
rather than silently overwriting it next time. That is exactly what
happened to `site.ts`, `types.ts`, `Header.astro`, `Footer.astro`,
`index.astro`, `Layout.astro`, and `favicon.svg` in the t3 rebrand.

## Tooling prerequisites

- **Node** `>=22.12.0` (matches `org/site-astro/.nvmrc`, pinned to `24` in
  this environment) and **npm** on `PATH` to install and build.
- No Python-side dependency changes — this ledger and `site-astro/` are
  additive; `jetson_arena/` and `pyproject.toml` are untouched.
