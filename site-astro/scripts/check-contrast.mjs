#!/usr/bin/env node
// Repeatable WCAG 2.x contrast check for jetson-arena.com's palette.
//
// Zero new npm dependencies: parses CSS custom properties directly out of
// src/styles/global.css (both the light `:root` defaults and the dark
// theme, wherever it is declared — see resolveThemeTokens() below) and
// checks a documented list of text/background pairs actually used across
// src/**/*.astro and src/styles/global.css.
//
// The pairing *list* (PAIRS, below) is hand-maintained and cites the
// file:line evidence for each entry, because reliably inferring "what
// background does this `color:` declaration render on" from raw CSS text
// requires knowing component nesting (e.g. "this <p class=muted> sits
// inside a .card") that a zero-dependency regex pass cannot recover. What
// *is* automated: extracting every `color: var(--token)` declaration in
// the source tree and verifying its foreground token is accounted for by
// at least one PAIRS entry (see checkPairCoverage()) — so a new color
// token introduced by a future change that isn't in PAIRS fails loudly
// instead of silently going unchecked.
//
// Usage:   node scripts/check-contrast.mjs
// Exit 0 if every pair meets the WCAG AA normal-text threshold (4.5:1) in
// both themes; exit 1 otherwise.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.join(__dirname, "..");
const CSS_PATH = path.join(SITE_ROOT, "src/styles/global.css");
const SRC_DIR = path.join(SITE_ROOT, "src");

const AA_NORMAL_TEXT = 4.5;

// ---------------------------------------------------------------------------
// 1. Brace-aware CSS block extraction (handles nested @media { :root { } }).
// ---------------------------------------------------------------------------

/** Find the first block whose selector matches `selectorRegex`, brace-aware. */
function findBlock(css, selectorRegex, fromIndex = 0) {
  const re = new RegExp(selectorRegex.source, selectorRegex.flags.replace("g", ""));
  const rest = css.slice(fromIndex);
  const m = re.exec(rest);
  if (!m) return null;
  const matchStart = fromIndex + m.index;
  const openBrace = css.indexOf("{", matchStart);
  if (openBrace === -1) return null;
  let depth = 0;
  for (let i = openBrace; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) {
        return { content: css.slice(openBrace + 1, i), start: matchStart, end: i + 1 };
      }
    }
  }
  return null;
}

/** Parse `--token: value;` custom-property declarations out of a block body. */
function parseDeclarations(blockContent) {
  const tokens = {};
  const re = /--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(blockContent))) {
    tokens[m[1]] = m[2].trim();
  }
  return tokens;
}

/** Resolve `var(--x)` indirection within a single theme's token map. */
function resolveIndirection(tokens) {
  const resolved = {};
  const resolveOne = (name, seen = new Set()) => {
    if (resolved[name] !== undefined) return resolved[name];
    if (seen.has(name)) throw new Error(`circular token reference: --${name}`);
    seen.add(name);
    let value = tokens[name];
    const varMatch = /^var\(--([a-zA-Z0-9-]+)\)$/.exec(value ?? "");
    if (varMatch) {
      value = resolveOne(varMatch[1], seen);
    }
    resolved[name] = value;
    return value;
  };
  for (const name of Object.keys(tokens)) resolveOne(name);
  return resolved;
}

// ---------------------------------------------------------------------------
// 2. Locate the light and dark theme token blocks in global.css.
//
// Per the file's own header comment this palette declares dark only via
// `@media (prefers-color-scheme: dark) { :root { ... } }` — there is no
// `[data-theme="dark"]` attribute-selector block today. We still probe for
// one (and for the media query) independently so this script keeps working
// unmodified if a `[data-theme]` toggle is added later, and we report which
// mechanism(s) were actually found.
// ---------------------------------------------------------------------------

function resolveThemeTokens(css) {
  const mediaDark = findBlock(css, /@media\s*\(\s*prefers-color-scheme:\s*dark\s*\)\s*{/);
  const attrDark = findBlock(
    css,
    /(?::root)?\[\s*data-theme\s*=\s*["']?dark["']?\s*\]\s*{/
  );

  // Light tokens live in the top-level `:root { }` — find it in the CSS
  // with the dark @media block excised so the nested `:root {` inside it
  // isn't picked up by mistake.
  let cssWithoutMediaDark = css;
  if (mediaDark) {
    cssWithoutMediaDark = css.slice(0, mediaDark.start) + css.slice(mediaDark.end);
  }
  const lightRoot = findBlock(cssWithoutMediaDark, /:root\s*{/);
  if (!lightRoot) {
    throw new Error("could not find a top-level :root { } block for light-theme tokens");
  }
  const lightTokens = resolveIndirection(parseDeclarations(lightRoot.content));

  let darkOverrides = {};
  const mechanisms = [];
  if (mediaDark) {
    const nestedRoot = findBlock(mediaDark.content, /:root\s*{/);
    if (nestedRoot) {
      Object.assign(darkOverrides, parseDeclarations(nestedRoot.content));
      mechanisms.push("@media (prefers-color-scheme: dark) { :root { ... } }");
    }
  }
  if (attrDark) {
    // An explicit [data-theme="dark"] block, if present, is a deliberate
    // user override and takes precedence over the media query.
    Object.assign(darkOverrides, parseDeclarations(attrDark.content));
    mechanisms.push('[data-theme="dark"] { ... }');
  }
  if (mechanisms.length === 0) {
    throw new Error(
      "no dark-theme token block found (looked for @media (prefers-color-scheme: dark) " +
        'and [data-theme="dark"])'
    );
  }

  const darkTokens = resolveIndirection({ ...lightTokens, ...darkOverrides });

  return { lightTokens, darkTokens, mechanisms };
}

// ---------------------------------------------------------------------------
// 3. Color parsing + WCAG 2.x relative luminance / contrast ratio.
// ---------------------------------------------------------------------------

const NAMED_COLORS = { transparent: { r: 0, g: 0, b: 0, a: 0 }, white: { r: 255, g: 255, b: 255, a: 1 }, black: { r: 0, g: 0, b: 0, a: 1 } };

function hueToRgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, h) * 255),
    b: Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
  };
}

/**
 * Parse a CSS color into {r,g,b,a} (0-255, alpha 0-1).
 * Supports: #rgb #rgba #rrggbb #rrggbbaa, rgb()/rgba(), hsl()/hsla(),
 * `transparent`/`white`/`black`. Anything else (oklch(), lab(), lch(),
 * color-mix(), CSS-4 space-separated rgb()) is NOT supported and throws —
 * this palette does not currently use those formats for any text or
 * background token (verified: every --bg, --surface, --ink, --ink-soft,
 * --accent, and --accent-strong value in global.css is a plain #rrggbb hex
 * literal), so no approximation was needed. If a future token adopts one
 * of those formats, this function is
 * the single place to extend, and the approximation used must be
 * documented here and in docs/site-sources.md.
 */
function parseColor(raw) {
  const value = raw.trim();
  if (NAMED_COLORS[value]) return { ...NAMED_COLORS[value] };

  let m = /^#([0-9a-f]{3})$/i.exec(value);
  if (m) {
    const [r, g, b] = m[1].split("").map((c) => parseInt(c + c, 16));
    return { r, g, b, a: 1 };
  }
  m = /^#([0-9a-f]{4})$/i.exec(value);
  if (m) {
    const [r, g, b, a] = m[1].split("").map((c) => parseInt(c + c, 16));
    return { r, g, b, a: a / 255 };
  }
  m = /^#([0-9a-f]{6})$/i.exec(value);
  if (m) {
    const hex = m[1];
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: 1,
    };
  }
  m = /^#([0-9a-f]{8})$/i.exec(value);
  if (m) {
    const hex = m[1];
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: parseInt(hex.slice(6, 8), 16) / 255,
    };
  }
  m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(value);
  if (m) {
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
  }
  m = /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(value);
  if (m) {
    const { r, g, b } = hslToRgb(+m[1], +m[2] / 100, +m[3] / 100);
    return { r, g, b, a: m[4] !== undefined ? +m[4] : 1 };
  }

  throw new Error(
    `unsupported color format "${value}" — parseColor() only handles hex/rgb()/hsl(); ` +
      "extend it (and document the approximation) if the palette adopts oklch()/lab()/color-mix()."
  );
}

/** Alpha-composite `fg` over opaque `bg` (both {r,g,b,a}); returns opaque {r,g,b}. */
function flattenOverBackground(fg, bg) {
  if (fg.a >= 1) return { r: fg.r, g: fg.g, b: fg.b };
  const a = fg.a;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
  };
}

function srgbChannelToLinear(c) {
  const cs = c / 255;
  return cs <= 0.04045 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}

function relativeLuminance({ r, g, b }) {
  const R = srgbChannelToLinear(r);
  const G = srgbChannelToLinear(g);
  const B = srgbChannelToLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(colorA, colorB) {
  const lA = relativeLuminance(colorA);
  const lB = relativeLuminance(colorB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

function ratioForPair(tokens, fgToken, bgToken) {
  const bgRaw = tokens[bgToken];
  const fgRaw = tokens[fgToken];
  if (bgRaw === undefined) throw new Error(`unknown background token --${bgToken}`);
  if (fgRaw === undefined) throw new Error(`unknown foreground token --${fgToken}`);
  const bg = parseColor(bgRaw);
  const fgRawParsed = parseColor(fgRaw);
  const fg = flattenOverBackground(fgRawParsed, bg);
  return contrastRatio(fg, bg);
}

// ---------------------------------------------------------------------------
// 4. The documented pairing list.
//
// Every entry below cites the file:line where the foreground `color:` rule
// and the background it renders on were confirmed by reading the markup
// (see the header comment for why this is hand-maintained rather than
// inferred). All entries reduce to six underlying token combinations
// ({ink, ink-soft, accent} x {bg, surface}) but are listed individually,
// under their own UI names, per the task's minimum-coverage requirement
// (body text, muted text, card text, link/accent text on page + card,
// header/footer text, chip/badge pairs).
// ---------------------------------------------------------------------------

const PAIRS = [
  {
    name: "Body text on page background",
    fg: "ink",
    bg: "bg",
    evidence: "global.css:112 (body { color: var(--ink) }) on global.css:100 (html { background: var(--bg) })",
  },
  {
    name: "Muted/secondary text on page background",
    fg: "ink-soft",
    bg: "bg",
    evidence:
      "global.css:262 (.muted { color: var(--ink-soft) }) and index.astro:170 (.tagline) rendered directly on the page background",
  },
  {
    name: "Header wordmark on header background",
    fg: "ink",
    bg: "bg",
    evidence: "Header.astro:49 (.wordmark { color: var(--ink) }); header has no own background, so it sits on --bg",
  },
  {
    name: "Header nav links on header background",
    fg: "ink-soft",
    bg: "bg",
    evidence: "Header.astro:68 (nav a { color: var(--ink-soft) })",
  },
  {
    name: "Footer wordmark on footer background",
    fg: "ink",
    bg: "bg",
    evidence: "Footer.astro:60 (.wordmark { color: var(--ink) }); footer has no own background, so it sits on --bg",
  },
  {
    name: "Footer nav links + note on footer background",
    fg: "ink-soft",
    bg: "bg",
    evidence: "Footer.astro:75 (nav a) and Footer.astro:86 (.note), both { color: var(--ink-soft) }",
  },
  {
    name: "Text on card/surface backgrounds (headings + body)",
    fg: "ink",
    bg: "surface",
    evidence:
      "global.css:279 (.card { background: var(--surface) }) with global.css:284 (.card { color: var(--ink) }) " +
      "and global.css:151 (h1,h2,h3 { color: var(--ink) }) rendered inside .card (e.g. index.astro axis/arena-cta headings)",
  },
  {
    name: "Muted text on card/surface backgrounds",
    fg: "ink-soft",
    bg: "surface",
    evidence: "global.css:262 (.muted) rendered inside .card, e.g. index.astro axis copy and link-card/arena-cta copy",
  },
  {
    name: "Link/accent text on page background",
    fg: "accent",
    bg: "bg",
    evidence: "global.css:186 (a { color: var(--accent) }) and global.css:271 (.eyebrow), both on the page background",
  },
  {
    name: "Link/accent text on card background",
    fg: "accent",
    bg: "surface",
    evidence:
      "arena.astro:185 (.axis-sub, inside .card axis), arena.astro:276 (.link-card .go, .link-card is .card), " +
      "index.astro:430 (.arena-cta .go, .arena-cta is .card)",
  },
  {
    name: 'FIRST TARGET chip — "First target" eyebrow label',
    fg: "accent",
    bg: "surface",
    evidence: "index.astro:185 (.target-chip { background: var(--surface) }) with index.astro:198 (.chip-label)",
  },
  {
    name: "FIRST TARGET chip — device name",
    fg: "ink",
    bg: "surface",
    evidence: "index.astro:203 (.chip-device { color: var(--ink) }) inside .target-chip",
  },
  {
    name: "FIRST TARGET chip — pipeline chain",
    fg: "ink-soft",
    bg: "surface",
    evidence: "index.astro:209 (.chip-chain { color: var(--ink-soft) }) inside .target-chip",
  },
  {
    name: "Skip-to-content link on surface background",
    fg: "ink",
    bg: "surface",
    evidence: "global.css:226 (.skip-link { background: var(--surface) }) with global.css:227 (color: var(--ink))",
  },
];

// ---------------------------------------------------------------------------
// 5. Automated coverage guard: every `color: var(--token)` declaration in
//    the source tree must use a token PAIRS actually checks. This is the
//    "automate what you can" half of the brief — it won't tell you *which*
//    background a new rule sits on, but it will refuse to pass silently if
//    a brand-new foreground token shows up that PAIRS has never heard of.
// ---------------------------------------------------------------------------

function walk(dir, exts, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, exts, out);
    else if (exts.some((ext) => entry.endsWith(ext))) out.push(full);
  }
  return out;
}

function collectUsedForegroundTokens() {
  const files = walk(SRC_DIR, [".astro", ".css"]);
  // Negative lookbehind excludes `background-color:`, `text-decoration-color:`,
  // and SVG `stop-color:` — only a bare `color:` declaration is a real
  // foreground-text-color pairing.
  const colorDeclRe = /(?<![\w-])color\s*:\s*var\(--([a-zA-Z0-9-]+)\)/g;
  const used = new Set();
  const perToken = {};
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    let m;
    while ((m = colorDeclRe.exec(text))) {
      used.add(m[1]);
      (perToken[m[1]] ??= new Set()).add(path.relative(SITE_ROOT, file));
    }
  }
  return { used, perToken };
}

function checkPairCoverage() {
  const { used, perToken } = collectUsedForegroundTokens();
  const covered = new Set(PAIRS.map((p) => p.fg));
  const uncovered = [...used].filter((t) => !covered.has(t));
  return { uncovered, perToken };
}

// ---------------------------------------------------------------------------
// 6. Run.
// ---------------------------------------------------------------------------

function formatRatio(r) {
  return r.toFixed(2);
}

function main() {
  const css = readFileSync(CSS_PATH, "utf8");
  const { lightTokens, darkTokens, mechanisms } = resolveThemeTokens(css);

  console.log("jetson-arena.com contrast check");
  console.log(`  source: ${path.relative(SITE_ROOT, CSS_PATH)}`);
  console.log(`  dark theme declared via: ${mechanisms.join(", ")}`);
  console.log(`  threshold: WCAG AA normal text >= ${AA_NORMAL_TEXT}:1\n`);

  const rows = PAIRS.map((pair) => {
    const light = ratioForPair(lightTokens, pair.fg, pair.bg);
    const dark = ratioForPair(darkTokens, pair.fg, pair.bg);
    const pass = light >= AA_NORMAL_TEXT && dark >= AA_NORMAL_TEXT;
    return { ...pair, light, dark, pass };
  });

  const nameWidth = Math.max(...rows.map((r) => r.name.length), "Pair".length);
  const header = `${"Pair".padEnd(nameWidth)}  Light   Dark    Pass/Fail`;
  console.log(header);
  console.log("-".repeat(header.length));
  for (const row of rows) {
    const light = formatRatio(row.light).padStart(5);
    const dark = formatRatio(row.dark).padStart(5);
    const status = row.pass ? "PASS" : "FAIL";
    console.log(`${row.name.padEnd(nameWidth)}  ${light}  ${dark}  ${status}`);
  }

  const failures = rows.filter((r) => !r.pass);

  console.log();
  const { uncovered, perToken } = checkPairCoverage();
  if (uncovered.length > 0) {
    console.log(
      `WARNING: ${uncovered.length} foreground color token(s) used in source are not covered by any PAIRS entry:`
    );
    for (const token of uncovered) {
      console.log(`  --${token} (used in: ${[...perToken[token]].join(", ")})`);
    }
    console.log("Add a PAIRS entry (with evidence) for each before trusting this check.\n");
  } else {
    console.log(`Coverage OK: every foreground color token used in src/ is checked by a PAIRS entry.\n`);
  }

  if (failures.length > 0) {
    console.log(`FAILED: ${failures.length} pair(s) below ${AA_NORMAL_TEXT}:1 in at least one theme:`);
    for (const f of failures) {
      console.log(`  - ${f.name} (light ${formatRatio(f.light)}, dark ${formatRatio(f.dark)})`);
    }
    process.exitCode = 1;
  } else if (uncovered.length > 0) {
    // Coverage gaps are a real finding but not a contrast failure per se —
    // still fail the build so they get triaged rather than silently ignored.
    process.exitCode = 1;
  } else {
    console.log(`All ${rows.length} pairs pass in both themes.`);
    process.exitCode = 0;
  }
}

main();
