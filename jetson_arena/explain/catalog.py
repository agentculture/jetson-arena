"""Markdown catalog for ``jetson-arena explain <path>``.

Each entry is verbatim markdown. Keys are command-path tuples. The empty tuple
and ``("jetson-arena",)`` both resolve to the root entry.

Keep bodies self-contained: an agent reading one entry should get enough
context without chaining reads.
"""

from __future__ import annotations

_ROOT = """\
# jetson-arena

A clonable template for AgentCulture mesh agents. It carries an agent-first CLI
(cited from the teken `python-cli` reference), a mesh identity (`culture.yaml` +
`CLAUDE.md`), the canonical guildmaster skill kit under `.claude/skills/`, and a
buildable/deployable package baseline. Clone it, rename the package, edit
`culture.yaml`, and you have a new agent.

## Verbs

- `jetson-arena whoami` — identity probe from `culture.yaml`.
- `jetson-arena learn` — structured self-teaching prompt.
- `jetson-arena explain <path>` — markdown docs for any noun/verb.
- `jetson-arena overview` — descriptive snapshot of the agent.
- `jetson-arena doctor` — check the agent-identity invariants.
- `jetson-arena cli overview` — describe the CLI surface.

## Exit-code policy

- `0` success
- `1` user-input error
- `2` environment / setup error
- `3+` reserved

## See also

- `jetson-arena explain whoami`
- `jetson-arena explain doctor`
"""

_WHOAMI = """\
# jetson-arena whoami

Reports the agent's identity from `culture.yaml`: nick (`suffix`), backend,
served model, and the package version. Read-only.

## Usage

    jetson-arena whoami
    jetson-arena whoami --json
"""

_LEARN = """\
# jetson-arena learn

Prints a structured self-teaching prompt covering purpose, command map,
exit-code policy, `--json` support, and the `explain` pointer.

## Usage

    jetson-arena learn
    jetson-arena learn --json
"""

_EXPLAIN = """\
# jetson-arena explain <path>

Prints markdown documentation for any noun/verb path. Unlike `--help` (terse,
positional), `explain` is global and addressable by path.

## Usage

    jetson-arena explain jetson-arena
    jetson-arena explain whoami
    jetson-arena explain --json <path>
"""

_OVERVIEW = """\
# jetson-arena overview

Read-only descriptive snapshot of the agent: identity (from `culture.yaml`), the
verb surface, and the sibling-pattern artifacts the template carries. Accepts an
ignored `target` so a stray path never hard-fails.

## Usage

    jetson-arena overview
    jetson-arena overview --json
"""

_DOCTOR = """\
# jetson-arena doctor

Checks the agent-identity invariants `steward doctor` verifies:
prompt-file-present and backend-consistency (`colleague` → `AGENTS.colleague.md`), plus a
skills-present check. Exits 1 when unhealthy.

## Usage

    jetson-arena doctor
    jetson-arena doctor --json
"""

_CLI = """\
# jetson-arena cli

Noun group for CLI-surface introspection. `cli overview` describes the CLI
itself (distinct from the global `overview`, which describes the agent).

## Usage

    jetson-arena cli overview
    jetson-arena cli overview --json
"""


ENTRIES: dict[tuple[str, ...], str] = {
    (): _ROOT,
    ("jetson-arena",): _ROOT,
    ("whoami",): _WHOAMI,
    ("learn",): _LEARN,
    ("explain",): _EXPLAIN,
    ("overview",): _OVERVIEW,
    ("doctor",): _DOCTOR,
    ("cli",): _CLI,
    ("cli", "overview"): _CLI,
}
