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

| Local path | Upstream path (`../org/site-astro/`) | Notes |
|---|---|---|
| `site-astro/src/styles/global.css` | `src/styles/global.css` | Verbatim. Design tokens (colors, type, motion) for the whole site — "First light over the mesh" theme. |
| `site-astro/src/layouts/Layout.astro` | `src/layouts/Layout.astro` | Verbatim. Shared HTML shell: head, fonts, `Header`/`Footer`, scroll-reveal script. |
| `site-astro/src/components/Header.astro` | `src/components/Header.astro` | Verbatim. Nav links to `/learn/`, `/framework/`, `/agents/`, `/engage/` are copied as-is — see [Known gap](#known-gap-nav-links-to-uncopied-pages) below. |
| `site-astro/src/components/Footer.astro` | `src/components/Footer.astro` | Verbatim. Same nav-link set as `Header.astro`. |
| `site-astro/src/components/HeroMesh.astro` | `src/components/HeroMesh.astro` | Verbatim. The hand-placed constellation SVG used on the home hero. No lobes dependency. |
| `site-astro/src/components/Mark.astro` | `src/components/Mark.astro` | Verbatim. The three-node wordmark glyph used in `Header`/`Footer`. |
| `site-astro/src/components/PageHero.astro` | `src/components/PageHero.astro` | Verbatim. Sub-page title + intro block; not wired into any page yet since only `index.astro` was copied. |
| `site-astro/src/data/site.ts` | `src/data/site.ts` | Verbatim, **content included**. This is `org`'s own copy (hero/framework/agents/engage strings describing AgentCulture, not jetson-arena) — a follow-up task must replace the content with jetson-arena's own, while keeping the shape `types.ts` defines. Flagged here so nobody mistakes the AgentCulture copy for finished jetson-arena content. |
| `site-astro/src/data/types.ts` | `src/data/types.ts` | Verbatim. The `SiteData` shape contract `site.ts` must satisfy. |
| `site-astro/src/pages/index.astro` | `src/pages/index.astro` | Verbatim, **temporary placeholder**. Copied only so `astro build` has an entrypoint; a later task rewrites it for jetson-arena's own home page. Confirmed to import only `Layout`, `HeroMesh`, and `site` data — no `lobes` import, so no strip was needed (see [Divergences](#divergences)). |
| `site-astro/tsconfig.json` | `tsconfig.json` | Verbatim. |
| `site-astro/public/favicon.svg` | `public/favicon.svg` | Verbatim. Referenced by `Layout.astro` (`<link rel="icon">`). |
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

**None required.** The task's contingency — "if `index.astro` imports lobes
components, strip those imports/sections minimally and note it here" — did
not trigger: `index.astro`'s frontmatter imports only `Layout.astro`,
`HeroMesh.astro`, and `../data/site`, none of which touch `lobes.ts`,
`lobes-captures.ts`, `LobesDiagram.astro`, or `LobesTerminal.astro`. All 13
files above were copied byte-for-byte with no edits (verified by `sha256sum`
against the `org` source at copy time).

### Known gap: nav links to uncopied pages

`Header.astro` and `Footer.astro` were copied verbatim, and both contain
plain `<a href>` nav links to `/learn/`, `/framework/`, `/agents/`, and
`/engage/`. These are **hrefs, not imports** — they don't affect the Astro
build (`npm run build` exits 0; no missing-module error) — but none of those
routes exist in this site yet, since only `index.astro` was copied. Visiting
those links in the built `dist/` will 404 until a later task adds the
corresponding pages or trims the nav. This is not a divergence from the
`org` source (the files are copied verbatim) — it's a known gap in the
scaffold, left for the task that builds out the rest of the site.

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
diff -u ../org/site-astro/src/layouts/Layout.astro site-astro/src/layouts/Layout.astro

# Pull one file fresh (verbatim citations only — package.json,
# astro.config.mjs, and package-lock.json are jetson-arena's own and are
# never overwritten from org):
cp ../org/site-astro/src/components/Header.astro site-astro/src/components/Header.astro

# Re-verify the build still exits 0 after any re-sync:
cd site-astro && npm run build
```

If a re-sync would lose a jetson-arena-specific edit (e.g. `site.ts` content
once it's rewritten for jetson-arena), that file graduates out of the cited
set — drop its row above into a new "diverged, no longer re-synced" note
rather than silently overwriting it next time.

## Tooling prerequisites

- **Node** `>=22.12.0` (matches `org/site-astro/.nvmrc`, pinned to `24` in
  this environment) and **npm** on `PATH` to install and build.
- No Python-side dependency changes — this ledger and `site-astro/` are
  additive; `jetson_arena/` and `pyproject.toml` are untouched.
