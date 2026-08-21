# AGENTS.md

Instructions for any agent working in this repo. Read this before doing anything else.
The full reasoning lives in `docs/process.md`; this file is the operative summary.

## What this repo is

Atlas. The product is **not yet defined** — that is deliberate. Until the scaffolding is
signed off, do not propose features, screens, data models, or a product name. If the user
volunteers product detail, append it to `docs/parking-lot.md` and carry on.

## The pipeline

```
Epic ──▶ Feature ──▶ Story ──▶ grill ──▶ propose ──▶ [G4] ──▶ red/green ──▶ review ──▶ archive ──▶ PR ──▶ merge
        (issue)     (issue)   (issue)                  ▲
                                                       └── nothing is implemented before this gate
```

| Level | GitHub | Anchor on disk |
|---|---|---|
| Epic | issue, type `Epic` | none |
| Feature | issue, type `Feature` | `openspec/specs/<capability>/spec.md` |
| Story | issue, type `Task` | `openspec/changes/<change-id>/` |

One Story = one change = one branch = one PR.

## Hard rules

1. **No implementation before G4.** A Story may not be implemented until its change folder
   exists, `openspec validate <change-id> --strict` exits 0, and the human has commented
   `approved` on the Story issue. If that comment is absent, stop and ask.
2. **Never hand-edit `openspec/specs/`.** It is written by `/opsx:archive` and nothing else.
3. **One scenario at a time.** Each red-green cycle takes the next unsatisfied
   `#### Scenario:` from the delta, writes exactly one acceptance test named identically to
   that scenario, and makes it pass. Never transcribe all scenarios into tests up front.
4. **Issues carry no requirements.** An issue body holds a one-sentence intent, a link to
   the change folder, and gate checkboxes. Requirements live in specs. If they disagree,
   the spec wins.
5. **Stop rather than improvise.** If a command fails or does something unexplained, report
   it. Do not diagnose around it, and never commit a file you did not intend to create.
6. **Configuration changes are not delegable.** Installing a plugin, editing
   `.claude/settings.json`, changing permissions, or editing `CLAUDE.md` must be done by the
   session that is actually talking to the human. Do not ask a subagent to do it: a correctly
   behaving subagent will refuse authorization relayed through another agent, and it is right
   to. Orchestrators: keep these steps for yourself.

## Naming

| Thing | Form |
|---|---|
| Change id | kebab, verb-first — `add-version-command` |
| Story issue title | the change id, verbatim |
| Branch | `story/<issue#>-<change-id>` |
| Chore branch | `chore/<slug>` — no behaviour change, no Story needed |
| Commit | Conventional Commits — `feat(cli-version): print version` |
| ADR | `docs/adr/NNNN-kebab-title.md` |

## Agent roles and model routing

> **Model tier is a function of whether the task creates, judges, or merely executes
> requirements.** Creating or judging requirements → **Opus**. Executing an approved,
> written-down plan → **Sonnet**. Mechanical work whose correctness is visible in the diff
> → **Haiku**.

| Agent | Model | May write |
|---|---|---|
| `orchestrator` | Opus | nothing in the repo; GitHub issues only |
| `spec-author` | Opus | `openspec/changes/**`, `docs/adr/**` |
| `implementer` | Sonnet | `src/**`, `tests/**`, and `tasks.md` checkboxes |
| `reviewer` | Opus | nothing — reports findings only |
| `janitor` | Haiku | archive moves, generated files, issue state |

Nothing writes `openspec/specs/` except `/opsx:archive`.

## Context discipline

Start every session from durable files, never from chat history. You are given an issue
number; read this file, `CONTEXT.md`, the change folder, and the relevant capability spec.
When a session must end mid-Story, use `/handoff` and write the continuation state into the
change folder — not into a chat log, not into the issue. A session that has drifted onto a
second Story is a bug: stop and start a fresh one.

## Skills

**Use:** `/opsx:propose`, `/opsx:apply`, `/opsx:archive`, `/opsx:explore`, `grill-with-docs`,
`to-tickets`, `tdd`, `code-review`, `triage`, `handoff`, `diagnosing-bugs`, `research`.

**Never invoke:** `to-spec` (duplicates `/opsx:propose` and would publish requirements to the
issue tracker, breaking rule 4), `implement` (duplicates `/opsx:apply` and its commit step
bypasses review), `wayfinder`, `improve-codebase-architecture`.

These four are `disable-model-invocation: true`, so they cannot fire on their own. Do not
invoke them by name either.

## Agent skills

### Issue tracker

GitHub Issues on `dbugmann-labs/atlas`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, label strings unchanged. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Commands

```bash
pnpm run verify      # lint + typecheck + test — must pass before any PR
pnpm run test:watch  # TDD loop
openspec validate <change-id> --strict
openspec validate --all --strict --no-interactive
openspec validate --archived        # every archived tasks.md box ticked
```

## This machine

Homebrew is unusable here: `/opt/homebrew` is owned by `admin:admin` and this account is not
in the `admin` group, and there is no passwordless sudo. Never suggest `brew install` or
`sudo chown`. Node comes from fnm in `~/.local/share/fnm`, pnpm from `~/Library/pnpm`.
Anything new must install into `$HOME`.

Dependency installs are gated by `minimumReleaseAge: 1440` in `pnpm-workspace.yaml` — pnpm
refuses versions published in the last 24h. If an install fails that check, do not add an
exclusion; pick a matured version or widen the range. See `docs/adr/0011-*`.
