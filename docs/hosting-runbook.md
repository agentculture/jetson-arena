# Hosting runbook — jetson-arena.com

Every credentialed step that shapes the `jetson-arena.com` zone is recorded
here, verbatim, so the hosting state is reproducible from this file alone.
Commands run with credentials sourced from `~/.config/agent/cultureflare.env`
(mode `0600`, outside the repo — see `cultureflare learn` for the pattern):

```bash
set -a; . ~/.config/agent/cultureflare.env; set +a
```

Plan/spec context: this file is task **t1** (and later **t7**, **t9**) of
[`docs/plans/2026-07-14-jetson-arena-com-is-live-the-arena-s-public-site-b.md`](plans/2026-07-14-jetson-arena-com-is-live-the-arena-s-public-site-b.md).

## t1 — pre-wiring state (2026-07-14)

### Token is valid

```console
$ cultureflare whoami
**CloudFlare token**
- **id:** 85a386f230f190a43bcd25d7997f949b
- **status:** active
- **not_before:** —
- **expires_on:** never
```

### Zone visibility — GAP, token scope insufficient

```console
$ cultureflare zones list
## Zones (0)
| ID | NAME | STATUS | PLAN |
| --- | --- | --- | --- |
```

The raw API confirms it is scope, not tooling — the list call *succeeds* and
returns nothing, and the account-scoped Pages call is refused outright:

```console
$ curl -s "https://api.cloudflare.com/client/v4/zones?per_page=50" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
success: True, zones: [], errors: []

$ curl -s "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
success: False, errors: [{'code': 10000, 'message': 'Authentication error'}]
```

**TODO (operator, dashboard):** edit the token to add, per
`cultureflare` `docs/SETUP.md`:

| Permission (dashboard label) | Level | Access |
| --- | --- | --- |
| Zone · Zone | Zone | Read |
| Zone · DNS | Zone | **Edit** |
| Account · Cloudflare Pages | Account | **Edit** |

with **Zone Resources → Include → All zones from an account** (single-zone
scoping breaks every other zone with `code 10000`) and **Account Resources →
Include → the account holding the zone**. Task **t7** is blocked on this.

### What the domain serves today — not "nothing"

The spec's before-state assumed the zone "points at nothing". Verified
otherwise: the apex already serves a Jekyll placeholder via GitHub Pages,
proxied through Cloudflare, and `www` 301s to the apex.

```console
$ curl -sI https://jetson-arena.com | head -4
HTTP/2 200
date: Tue, 14 Jul 2026 05:44:52 GMT
content-type: text/html; charset=utf-8
server: cloudflare

$ curl -s https://jetson-arena.com | grep generator
<meta name="generator" content="Jekyll v3.10.0" />

$ curl -sI https://www.jetson-arena.com | grep -i "HTTP/\|location"
HTTP/2 301
location: https://jetson-arena.com/

$ dig +short jetson-arena.com A
104.21.28.183
172.67.147.21
```

Consequence for **t7**: the DNS wiring is a *replacement* of the existing
GitHub-Pages-pointing records, not a creation into empty space.
`cultureflare dns create` is conflict-aware; expect it to surface the existing
records in the dry-run — read that plan carefully before `--apply`.

## t7 — Pages project, custom domains, DNS

*Blocked on the token-scope TODO above. Steps will be recorded here verbatim
when they run: `wrangler pages project create jetson-arena`, custom-domain
attach for apex + www via the Pages API, `cultureflare dns create` dry-run →
`--apply`, and the www serve-or-redirect decision (plan risk r2).*

## t9 — go-live verification

*Runs after the deploy workflow's first successful production deploy. Records:
`curl -sI` for both hostnames, the static-404 check, and the re-run of
`site-astro/scripts/check-contrast.mjs` against the shipped CSS.*
