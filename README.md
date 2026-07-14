# jetson-arena

**How does a given Jetson device handle a given model setup?**

A setup can be a single model, a mixture of models, or a whole pipeline under
a pinned config. The flagship example is still the realtime VAD → STT → LLM →
TTS loop: four models on one board, contending for VRAM, memory bandwidth,
and the GPU — each fits alone; the setup is what fails. jetson-arena
benchmarks setups for **latency**, **memory signature**, and **quality**,
then publishes the results together with the Docker build recipes that
reproduce them — and maintains the arena's public site,
[jetson-arena.com](https://jetson-arena.com). Device order: **Jetson Thor
first**, then Jetson AGX Orin on JetPack 7.2, then Jetson Orin Nano Super
8GB.

## Status

**Early.** The benchmark domain surface is not built yet. What exists today is
the agent-first CLI scaffold below, the mesh identity, the CI baseline, and
the public site ([jetson-arena.com](https://jetson-arena.com), `site-astro/`)
— there is no benchmark runner, device probe, or recipe store. The intended
shape, and the questions still open, are written down in
[`docs/scope.md`](docs/scope.md). Read that before proposing a design.

## Quickstart

```bash
uv sync
uv run pytest -n auto                 # run the test suite
uv run jetson-arena whoami            # identity from culture.yaml
uv run jetson-arena learn             # self-teaching prompt (add --json)
uv run teken cli doctor . --strict    # the agent-first rubric gate CI runs
```

## CLI

| Verb | What it does |
|------|--------------|
| `whoami` | Report this agent's nick, version, backend, and model from `culture.yaml`. |
| `learn` | Print a structured self-teaching prompt. |
| `explain <path>` | Markdown docs for any noun/verb path. |
| `overview` | Read-only descriptive snapshot of the agent. |
| `doctor` | Check the agent-identity invariants (prompt-file-present, backend-consistency). |
| `cli overview` | Describe the CLI surface itself. |

Every command supports `--json`. Results go to stdout, errors/diagnostics to
stderr (never mixed). Exit codes: `0` success, `1` user error, `2` environment
error, `3+` reserved.

## How it is put together

- **An agent-first CLI** cited from [teken](https://github.com/agentculture/teken)
  (`afi-cli`) — the runtime package has no third-party dependencies, and the
  contracts above are enforced in CI by a rubric gate that drives the built CLI
  as a black box.
- **A mesh identity** — `culture.yaml` (`suffix` + `backend`) and the matching
  resident prompt file (`AGENTS.colleague.md`, since this agent runs
  `backend: colleague`). `CLAUDE.md` is the parallel prompt for Claude Code.
- **The guildmaster skill kit** (14 skills) under `.claude/skills/`, vendored
  cite-don't-import. Provenance ledger:
  [`docs/skill-sources.md`](docs/skill-sources.md).
- **A build + deploy baseline** — pytest, lint, the agent-first rubric gate, and
  PyPI Trusted Publishing wired into GitHub Actions.

## Contributing

Every PR bumps the version — docs-only ones included. CI enforces it, because a
merge to `main` publishes to PyPI and a repeated version is a failed publish. See
[`CLAUDE.md`](CLAUDE.md) for the full conventions: the CLI contract, the
vendored-skills rule, and the `cicd` PR lane.

## License

Apache 2.0 — see [`LICENSE`](LICENSE).
