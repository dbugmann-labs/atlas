# Atlas

A development system: the specs, gates, agents and checks that produce software here.

What is here is the machinery — how work is decomposed, how a requirement becomes a test, what
a human must approve, and what a machine refuses to merge. It holds no product of its own,
because it is meant to be copied: Atlas is the template a project starts from, and the product
is defined in the copy. `src/` holds one 48-line command-line entry point, a deliberate worked
example that proves the pipeline runs end to end.

So there is nothing here to build *against*. There is a well-defined way to build. Read on.

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

## Starting a project from this

```bash
gh repo create <owner>/<project> --public
git clone https://github.com/<owner>/atlas.git <project> && cd <project>
git remote set-url origin https://github.com/<owner>/<project>.git
git push -u origin main
git remote add upstream https://github.com/<owner>/atlas.git
```

Cloning rather than using GitHub's *Use this template* button or a fork preserves the shared
git history, so process fixes made in Atlas can later be merged downstream — a template copy
starts with no common ancestor to merge from, and a fork's commits do not count toward the
contribution graph.

**A push carries files and history, and nothing else.** Branch protection, merge settings and
labels do not travel, so the new repository starts with `main` unprotected — which silently
removes G8, the only gate between a finished Story and `main`. Restore them:

```bash
REPO=<owner>/<project>
gh api --method PATCH /repos/$REPO -F allow_merge_commit=false -F allow_rebase_merge=false \
  -F allow_squash_merge=true -F delete_branch_on_merge=true
gh api --method POST /repos/$REPO/rulesets --input - <<'JSON'
{ "name": "main", "target": "branch", "enforcement": "active", "bypass_actors": [],
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "rules": [ { "type": "deletion" }, { "type": "non_fast_forward" },
    { "type": "required_linear_history" },
    { "type": "pull_request", "parameters": { "allowed_merge_methods": ["squash"],
        "dismiss_stale_reviews_on_push": false, "require_code_owner_review": false,
        "require_last_push_approval": false, "required_approving_review_count": 0,
        "required_review_thread_resolution": false } },
    { "type": "required_status_checks", "parameters": { "do_not_enforce_on_create": false,
        "strict_required_status_checks_policy": true,
        "required_status_checks": [ { "context": "verify" } ] } } ] }
JSON
```

The five triage labels in `docs/agents/triage-labels.md` do not travel either; create them with
`gh label create` before the first inbound issue arrives.

Later, `git fetch upstream && git merge upstream/main` brings those process fixes down; that
stays cheap only if process files are edited in Atlas rather than in the project.

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
