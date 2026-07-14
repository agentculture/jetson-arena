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

## t7 — Pages project, custom domains, DNS (2026-07-14)

Unblocked: the operator added the three token permissions and `zones list`
now shows all 18 zones including `jetson-arena.com` (id
`29e971673c0d028b78388cac12124963`, active). Repo secrets
`CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` were set via
`gh secret set` with the operator's explicit go-ahead.

### Pages project

```console
$ npx --no-install wrangler pages project create jetson-arena --production-branch main
⛅️ wrangler 4.110.0
✨ Successfully created the 'jetson-arena' project. It will be available at
https://jetson-arena.pages.dev/ once you create your first deployment.
```

### Custom domains (Pages API — no cultureflare verb yet)

```console
$ curl -s -X POST ".../accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/jetson-arena/domains" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" --data '{"name": "jetson-arena.com"}'
success: True | status: initializing
$ # same for www.jetson-arena.com
success: True | status: initializing
```

### DNS — a content swap, not a create

Before the cutover the zone held (recorded verbatim):

```text
CNAME  jetson-arena.com      -> orinachum.github.io   proxied=True
CNAME  www.jetson-arena.com  -> orinachum.github.io   proxied=True
TXT    jetson-arena.com      -> google-site-verification=… (x2, untouched)
```

The `cultureflare dns create` dry-run was read and **rejected**: its
idempotency check matches on (type, name, content), so with different
content it would blind-POST a second CNAME (which Cloudflare refuses), and
its plan sets `proxied: false`. It has no update flow ("not yet
implemented" per its own remediation) — filed as part of the upstream gap.
Documented fallback used instead — `PATCH` the two existing records'
content, an atomic swap that preserves `proxied=true`:

```console
$ curl -s -X PATCH ".../zones/29e971…/dns_records/3221ae29…" \
    --data '{"content": "jetson-arena.pages.dev", "comment": "Pages custom domain; cut over from GitHub Pages 2026-07-14 (jetson-arena t7)"}'
success: True | jetson-arena.com -> jetson-arena.pages.dev | proxied: True
$ curl -s -X PATCH ".../zones/29e971…/dns_records/ee0b5ea5…" --data '…same…'
success: True | www.jetson-arena.com -> jetson-arena.pages.dev | proxied: True
```

**Decisions (plan risk r2):** both hostnames serve the site (no 301);
canonical URLs in the HTML point at the apex. The old origin is gone: the
operator disabled GitHub Pages on the previous repo, so a DNS revert would
serve nothing.

### First deploy

`gh workflow run deploy-site.yml --ref main` → run `29314578772`
completed: **success** (the earlier merge-triggered run `29314304928`
failed as expected — it predated the project + secrets).

## t9 — go-live verification (2026-07-14)

All checks executed against the live domain after the first successful
deploy; nothing recorded from memory.

```console
$ curl -sI https://jetson-arena.com | head -2
HTTP/2 200
content-type: text/html; charset=utf-8

$ curl -sI https://www.jetson-arena.com | head -2
HTTP/2 200
content-type: text/html; charset=utf-8

$ curl -s -o /dev/null -w "%{http_code}\n" https://jetson-arena.com/no/such/path
404
$ curl -s https://jetson-arena.com/no/such/path | grep -o "There is nothing at this address"
There is nothing at this address
```

The deployed site is byte-for-byte the static build of `main` — md5 of the
live HTML and fingerprinted CSS match a clean local `npm run build`:

```text
live html: 2ecbc1d4133b9e445b79981233305eaa   dist html: 2ecbc1d4133b9e445b79981233305eaa
live css:  777f867f13c598fab644d94ad07f7416   dist css:  777f867f13c598fab644d94ad07f7416
```

`npm run check:contrast` against that verified-shipped CSS: **all 14 pairs
pass in both themes.**
