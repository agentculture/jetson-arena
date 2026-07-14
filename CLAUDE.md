# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## The agent

**jetson-arena** answers one question: *how does a given Jetson device handle a
whole model stack?* Not a single model in isolation — the whole pipeline
(e.g. realtime VAD → STT → LLM → TTS on an Orin Nano Super 8GB), measured for
**latency**, **memory signature**, and **quality**. The agent benchmarks those
pipelines, publishes the results together with the Docker build recipes that
reproduce them, and maintains the arena's public site.

**Read this before you build anything:** the domain surface does not exist yet.
This repo was scaffolded from `culture-agent-template` and everything in
`jetson_arena/` today is the template's agent-first CLI (`whoami`, `learn`,
`explain`, `overview`, `doctor`, `cli overview`). There is no benchmark runner,
no device probe, no recipe store, no site. The intended shape — nouns, run
model, artifacts — is sketched in [`docs/scope.md`](docs/scope.md), which is a
sketch and not a spec. Converge it with the `/think` skill before implementing;
do not invent a domain design mid-task and ship it.

## Commands

```bash
uv sync                                   # install (dev group included)

uv run pytest -n auto                     # full suite (xdist, ~1s)
uv run pytest tests/test_cli.py::test_whoami_text -v   # one test
uv run pytest -n auto --cov=jetson_arena --cov-report=term   # coverage (gate: 60%)

uv run jetson-arena whoami                # any CLI verb, from source
uv run jetson-arena doctor --json

uv run black jetson_arena tests           # CI runs --check
uv run isort jetson_arena tests           # CI runs --check-only
uv run flake8 jetson_arena tests
uv run bandit -c pyproject.toml -r jetson_arena
markdownlint-cli2 "**/*.md" "#node_modules" "#.local" "#.claude/skills" "#.teken"
uv run teken cli doctor . --strict        # the agent-first rubric gate
```

The rubric gate is not optional decoration — it is a CI job (`lint` → `afi
rubric gate`) that drives the built CLI as a black box and fails the build if a
verb violates the contracts below. Run it before you push.

## The CLI contract

`jetson_arena/cli/` implements an *agent-first* CLI cited from
[teken](https://github.com/agentculture/teken)'s `python-cli` reference. Three
invariants hold everywhere, and the rubric gate checks all three:

1. **Streams never mix.** Results → stdout, errors and diagnostics → stderr.
   Go through `cli/_output.py` (`emit_result` / `emit_error` / `emit_diagnostic`);
   never `print()`.
2. **Every command takes `--json`.** Text mode is for humans, JSON for agents.
   Both come from the same payload — build a dict, then branch on `json_mode`.
3. **Failures raise `CliError`, never a traceback.** `cli/_errors.py` defines
   the exit-code policy (`0` success, `1` user error, `2` environment error,
   `3+` reserved) and `CliError` carries a `remediation` string that renders as
   the `hint:` line agents parse. `_dispatch()` in `cli/__init__.py` wraps any
   stray exception into a `CliError` so nothing leaks; `_CliArgumentParser`
   overrides `argparse.error()` so even parse failures (unknown verb, bad flag)
   exit `1` with `error:` / `hint:` instead of argparse's default exit `2`.
   The `--json` flag is honoured for parse-time errors too, via the
   `_json_hint` class attribute that `main()` pre-populates by scanning raw
   argv before parsing.

Two rubric rules constrain *shape* rather than plumbing, and they are easy to
trip:

- **Descriptive verbs must never hard-fail on a bad path.** `overview` accepts
  an ignored positional `target` purely so `overview /no/such/path` still exits
  `0`. Keep that behaviour in any new descriptive verb.
- **Any noun that gains action-verbs must also expose `overview`.** That is the
  entire reason the `cli` noun group exists today (`cli overview` describes the
  CLI surface; the global `overview` describes the agent). When you add a
  `device` or `bench` noun, it needs its own `overview` from day one.

### Adding a verb

Five touchpoints, in order — miss any of the last three and either the rubric
gate or a test fails:

1. `jetson_arena/cli/_commands/<verb>.py` — a `register(sub)` function plus a
   `cmd_<verb>(args)` handler. Handlers return `int | None` (`None` = exit 0)
   and raise `CliError` to fail.
2. `_build_parser()` in `jetson_arena/cli/__init__.py` — import and call
   `register(sub)`. There is a marked comment block for new noun groups.
3. `ENTRIES` in `jetson_arena/explain/catalog.py` — a markdown entry keyed by
   the command-path tuple. Entries are self-contained by convention: an agent
   reading one should not need to chain reads. `test_every_catalog_path_resolves`
   asserts every key resolves.
4. `tests/` — text mode, `--json` shape, and the error path.
5. `learn.py` and the `_ROOT`/`_VERBS` lists — the command map is duplicated in
   `learn.py`'s `_TEXT` + `_as_json_payload()`, `explain/catalog.py`'s `_ROOT`,
   and `overview.py`'s `_VERBS`. Nothing enforces that they agree; keep them in
   sync by hand.

### The zero-dependency rule

`dependencies = []` in `pyproject.toml`, and it should stay that way. This is
why `whoami.py` hand-parses `culture.yaml` line-by-line instead of importing
PyYAML. When the benchmark harness arrives it will want heavy deps (torch,
tritonclient, docker) — put those behind an **optional extra** or a separate
package so `uv tool install jetson-arena` stays instant and installable on a
Jetson with a cold cache. Dev-only tooling belongs in `[dependency-groups] dev`.

## Identity, and the two prompt files

`culture.yaml` declares this agent to the AgentCulture mesh:

```yaml
agents:
- suffix: jetson-arena
  backend: colleague
  model: sakamakismile/Qwen3.6-27B-Text-NVFP4-MTP
```

`backend: colleague` means the **resident** prompt file is
`AGENTS.colleague.md`, not this file. Both matter and they are not
interchangeable: `AGENTS.colleague.md` is what the colleague resident loads when
it runs in the mesh; `CLAUDE.md` (this file) is what Claude Code loads. The
`doctor` verb enforces the mapping — `_PROMPT_FILE` in
`cli/_commands/doctor.py` maps `claude → CLAUDE.md`, `colleague →
AGENTS.colleague.md`, `acp → AGENTS.md`, `gemini → GEMINI.md`. Change the
backend in `culture.yaml` and you must also update that map and
`test_doctor_recognizes_declared_backend`, which fails loudly on an unknown
backend rather than tolerating it.

`whoami` resolves `culture.yaml` by walking up from `__file__`, not from the
CWD — the identity reported is always *this agent's own*, never whatever
`culture.yaml` happens to sit in the caller's working directory.

## Skills are vendored, not imported

`.claude/skills/` holds 14 skills vendored **cite-don't-import** from
guildmaster (the AgentCulture skills supplier), with two tracked exceptions
vendored straight from their origin repos. Provenance and per-skill
divergences live in [`docs/skill-sources.md`](docs/skill-sources.md) — the
ledger is the contract:

- Editing a vendored `SKILL.md` or script in place is a **divergence**, and a
  divergence that is not recorded in `docs/skill-sources.md` will be silently
  destroyed by the next re-sync. If a change belongs upstream, lift it into
  guildmaster first and re-vendor.
- Every vendored `SKILL.md` must carry `type: command` in its frontmatter.
  `core.skill_loader` silently skips any skill without it, so a missing `type:`
  is a skill that simply never loads — no error, no warning.
- Vendored skills are excluded from markdownlint (`.markdownlint-cli2.yaml`) and
  from SonarCloud (`sonar.exclusions`) precisely because they are cited
  verbatim. Do not reformat them to satisfy a linter.

Runtime prerequisites for the skills: `devex` (>=0.21) and `agtag` (>=0.1) on
PATH; `colleague` and `eidetic` optional (their skills degrade with an install
hint rather than blocking).

## Every PR bumps the version

CI enforces this (`version-check` job): a PR whose `pyproject.toml` version
matches `main` fails and gets a bot comment. **Docs-only, config-only, and
CI-only PRs are not exempt** — the rule exists because a push to `main` that
touches `pyproject.toml` or `jetson_arena/**` publishes to PyPI, and a repeated
version is a failed publish.

Use the `/version-bump` skill (`patch|minor|major`); it updates
`pyproject.toml` and prepends the CHANGELOG entry in Keep-a-Changelog form.
Open and shepherd the PR with the `/cicd` skill (`workflow.sh open|read|reply`,
plus `status`/`await` for the SonarCloud gate) — PR replies auto-sign as
`- jetson-arena (Claude)` via `_resolve-nick.sh`, so do not hand-sign them.

Publishing is automatic: PRs from this repo (not forks) ship a
`.dev<run>`-suffixed build to TestPyPI; a merge to `main` that touches
`pyproject.toml` or `jetson_arena/**` publishes to PyPI via Trusted Publishing.
