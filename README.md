# Atlas

A development system: the specs, gates, agents and checks that produce software here.

**The product is not yet defined.** That is deliberate, not an omission. What exists is the
machinery — how work is decomposed, how a requirement becomes a test, what a human must
approve, and what a machine refuses to merge. `src/` holds one 48-line command-line entry
point that exists only to prove the pipeline runs end to end.

If you have arrived to build a feature, there is nothing to build against yet. If you have
arrived to work an issue, read on.

## The whole process in one paragraph

Work is decomposed into **Epics** (coordination only), **Features** (each one a capability
spec that lives forever), and **Stories** (each one an OpenSpec change, one branch, one PR,
then archived). Nothing is implemented until its change folder exists, validates, and a human
has approved it — that is the one hard gate. After approval, an implementer works the change's
scenarios one at a time, red-green, until every scenario in the delta has a passing acceptance
test of the same name. The change is then archived as the final commit on the same branch, so
one PR carries the spec, the code and the merge into the source of truth — and CI refuses any
spec edit that the archived delta does not claim. The repo is authoritative for *content*;
GitHub is authoritative for *state and order*; nothing is written down twice.

If you can say that paragraph from memory, you know the process.

## Start here

**If you are an agent:** read `AGENTS.md`. It is binding and it is the operative summary —
seven hard rules, the naming table, and what is machine-enforced versus what is convention.
Then read `CONTEXT.md` for vocabulary, then the change folder for the Story you were given.
Do not start from a chat log.

**If you are a human picking this up cold:** read this file, then `docs/process.md` — the
full reasoning, twelve sections, including §12 on whether the whole apparatus is
proportionate. `docs/retrospective.md` says what actually happened when it was first run.

**If you want to know why something is the way it is:** `docs/adr/`. Fourteen decision
records, MADR format, immutable once accepted. The register is `docs/adr/README.md`.

## Make the machine work first

Node comes from [fnm](https://github.com/Schniz/fnm), pnpm from a home-directory install.
**A non-interactive shell has neither on `PATH` and defaults to Node 20**, where `pnpm run
test` fails at startup with an `ERR_INVALID_ARG_VALUE ... styleText` error that names neither
Node nor the version. Open every shell with:

```bash
export PNPM_HOME="$HOME/Library/pnpm"; export FNM_DIR="$HOME/.local/share/fnm"
export PATH="$PNPM_HOME/bin:$FNM_DIR:$PATH"; eval "$(fnm env)"; fnm use 24
```

If a tool fails oddly, run `node --version` before diagnosing anything else. Homebrew is not
available on the development machine; see `AGENTS.md` § *This machine*.

```bash
pnpm install
pnpm run verify      # lint + typecheck + test — must pass before any PR
```

## Commands

| Command | What it does |
|---|---|
| `pnpm run verify` | lint, typecheck, test — the gate before any PR |
| `pnpm run checks` | the five merge-time checks; advisory locally, binding in CI |
| `pnpm run check:g4` | is this Story approved? run it before writing any code |
| `pnpm run test:watch` | the TDD loop |
| `pnpm run graph` | regenerate `docs/graph.mmd` from the tracker |
| `openspec validate --all --strict --no-interactive` | every spec and change is well-formed |

`pnpm run checks` is **staged**: mid-Story it reports rather than fails, because a check that
demanded all four acceptance tests at once would force exactly the bulk transcription
`AGENTS.md` rule 3 forbids. In CI the same checks bind, because a PR claims the Story is
finished.

## Where things live

```
AGENTS.md                  binding rules for any agent — read first
CLAUDE.md                  Claude Code specifics; imports AGENTS.md
CONTEXT.md                 shared vocabulary
openspec/specs/            SOURCE OF TRUTH — written only by /opsx:archive, never by hand
openspec/changes/          proposals in flight, and archive/YYYY-MM-DD-<change-id>/
docs/process.md            the full process and its reasoning
docs/retrospective.md      what the first end-to-end run actually cost and caught
docs/adr/                  why each hard decision was made
docs/agents/               issue tracker, triage labels, domain docs
docs/graph.mmd             generated projection of the issue hierarchy — never an input
docs/parking-lot.md        product ideas, deliberately not acted on
scripts/                   the merge-time checks and the graph generator
.claude/agents/            the five pipeline agents and their model routing
.github/workflows/ci.yml   the eight CI steps
```

## The two things that are actually load-bearing

Everything else is scaffolding around these:

1. **G4** — no implementation before a human has approved the proposal. Recorded as a comment
   beginning with the exact line `G4: approved` on the Story issue, and enforced at merge time
   by `scripts/check-g4-approval.ts`. See `docs/adr/0014-g4-approval-marker.md` for what that
   check can and cannot prove.
2. **CI check 2** — spec-diff containment. A pull request may not change a capability spec
   that its archived delta does not claim. This is what keeps `openspec/specs/` honest.

If the process ever has to be cut down, cut in the order given in `docs/process.md` §12, and
keep those two in every version.

## Repository

Public, in a free organisation, with no `LICENSE` file — see
`docs/adr/0007-public-repo-free-org.md`. `main` is protected: squash merges only, CI must be
green, no bypass actors.
