# Scope — what the arena is for

> **Status: sketch, not a spec.** Nothing described below is implemented, and
> the details are inferred from the agent's one-line charter rather than agreed.
> It exists so that the next agent to touch this repo starts from a shared
> picture instead of inventing one. Converge it with the `/think` skill (and
> then `/spec-to-plan`) before building — do not treat this file as settled.

## The question

**How does a given Jetson device handle a given model setup?**

A setup ranges from a single model through model mixtures to a whole
pipeline under a pinned config (operator direction, 2026-07-14; device order:
Thor, then AGX Orin on JetPack 7.2, then Orin Nano Super 8GB). For a whole
pipeline the load-bearing word is *whole*. A published benchmark that says "model X runs
at N tok/s on an Orin Nano" tells you almost nothing about whether X can be the
LLM in a realtime voice loop on that same board, because in the loop it does not
run alone. A realtime VAD → STT → LLM → TTS pipeline puts four models on one
8GB device where they contend for VRAM, memory bandwidth, and the GPU itself.
Each is fine in isolation. The stack is what fails.

The arena benchmarks the setup — and for pipelines, the stack as a whole.

## What gets measured

Three axes, per the charter:

- **Latency** — under a realtime pipeline the interesting number is
  conversational: how long from end-of-speech to first audio out. It decomposes
  per stage (VAD trigger, STT finalize, LLM time-to-first-token, TTS
  time-to-first-audio), and the decomposition is the useful artifact, because it
  says *which* stage to swap.
- **Memory signature** — not a single peak number but a shape over time: steady
  state, peak, and the headroom left on the device. On an 8GB board the question
  "does it fit" and the question "does it fit *while the other three models are
  resident*" have different answers.
- **Quality** — the axis that keeps the other two honest. A stack that hits its
  latency budget by quantizing the STT into uselessness has not won anything.

## What gets published

Two artifacts, and the second is what makes the first trustworthy:

1. **Results** — the measurements above, per (device, stack) pair.
2. **The Docker build recipe that reproduces them** — the arena's claim is only
   worth as much as someone else's ability to re-run it. Recipes are expected to
   build on the `jetson-containers` family already in this workspace
   (`jetson-containers-nv`, `jetson-containers-dusty`).

Plus **the public site**, which is the reader-facing view of the results.

## Nouns the CLI will probably grow

A first guess at the surface, to be argued with rather than accepted. Each is a
noun group under the existing agent-first CLI, and each needs its own `overview`
verb the day it gains an action verb (see `CLAUDE.md`):

| Noun | Roughly |
|------|---------|
| `device` | What board are we on — model, JetPack, memory, power mode. Detected, not declared. |
| `stack` | A named pipeline definition: the models, their order, their config. |
| `run` | One (device × stack) benchmark execution producing one result. |
| `result` | The measurements, as data. |
| `recipe` | The Docker build that reproduces a run. |
| `board` | The published comparison — what the site renders. |

## Open questions

These are genuinely undecided, and each one changes the design:

- **Where does the benchmark execute?** The agent runs on a workstation; the
  device under test is a Jetson. Does the CLI drive the board over SSH, or does
  it ship to the board and run there? This decides whether the package can ever
  be dependency-free on the host.
- **What is "quality" concretely, per stage?** WER for STT is easy. Quality of a
  TTS voice or an LLM turn in a voice loop is not, and a made-up metric is worse
  than none.
- **What does the charter's "signed" mean for recipes** — cryptographically
  signed, or simply checked-in and reproducible? The charter phrasing
  ("signed-in Docker build recipes") is ambiguous and nobody has ruled.
- **Where does the site live**, and is it built from the results data or
  maintained alongside it?

## What exists today

The agent-first CLI scaffold, and nothing else: `whoami`, `learn`, `explain`,
`overview`, `doctor`, `cli overview`. No device probe, no runner, no results
store, no recipes, no site. That is the honest state, and this file is a
placeholder for the design that has not happened yet.
