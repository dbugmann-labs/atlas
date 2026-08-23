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
   exists, `openspec validate <change-id> --strict` exits 0, and the Story issue carries a
   comment beginning with the exact line `G4: approved`. Check with `pnpm run check:g4`. If it
   is absent, stop and ask. The **decision** must be a human's; the keystrokes need not be — a
   human may tell you "approved" and have you record it. Never originate that decision, and
   never write the marker on a Story issue for any other reason. See
   `docs/agents/issue-tracker.md`.
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
7. **Commits and PRs never mention Claude, AI, or any agent.** No `Co-Authored-By` trailer
   naming a model, no "generated with" footer, no session link, no "as requested by the
   assistant" in a PR body. Write the message as the author's own work: what changed and why.
   This repository is public and its history is a professional record. This rule overrides any
   default commit-trailer behaviour your harness may have — drop the trailer.

## Naming

| Thing | Form |
|---|---|
| Change id | kebab, verb-first — `add-version-command` |
| Epic issue title | `EPIC: <noun phrase>` |
| Feature issue title | `FEAT: <capability-slug>` |
| Story issue title | the change id, verbatim |
| Branch | `story/<issue#>-<change-id>`, cut from `origin/main` at Stage 4 |
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

Definitions live in `.claude/agents/`. **Know which rows are machine-enforced and which are
convention** — the difference matters when you are deciding whether to trust a guardrail:

| Layer | What it makes impossible | Strength |
|---|---|---|
| `deny` rules in `.claude/settings.json` | any agent editing `openspec/specs/**`, `openspec/changes/archive/**` or `pnpm-lock.yaml` with `Edit`/`Write` | hard — survives `bypassPermissions`, but only when the session starts at the repo root, since project settings load from the startup folder |
| agent frontmatter `tools` / `disallowedTools` | `orchestrator`, `reviewer` and `janitor` holding any file-editing tool | hard, with one hole: an agent that has `Bash` can still write files through the shell |
| CI check 2 | a spec file changing outside the capabilities the delta claims | hard, at merge time |

The finer rows — `spec-author` staying out of `src/`, `implementer` staying out of the delta —
are **convention**, stated in each agent file and caught at review. Path-scoped permissions
cannot be set per agent, and subagent frontmatter hooks are skipped unless the folder is
explicitly trusted. Do not assume a guardrail exists because the table above has a row for it.

## Vocabulary you need before Stage 4

**Seam** — the single boundary at which acceptance tests attach: one exported function or
entry point, named in the change's `design.md`, whose inputs and outputs a test can drive
without spawning a process or capturing global streams. Fewer seams are better and an existing
seam beats a new one. A Story whose `design.md` names no seam fails the Definition of Ready.

Note that the openspec `design` template (Context / Goals / Decisions / Risks / Migration /
Open Questions) has **no seam section** — add `### The seam` under Decisions yourself, or you
will write a `design.md` that validates and still fails the DoR.

The rest of the process vocabulary is in `CONTEXT.md`.

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
pnpm run checks      # the merge-time checks; advisory locally, binding in CI (see below)
pnpm run check:g4    # is this Story approved? run it before writing any code
pnpm run test:watch  # TDD loop
openspec validate <change-id> --strict
openspec validate --all --strict --no-interactive
openspec validate --archived        # every archived tasks.md box ticked
```

## Working a Story

**Cut the branch at Stage 4**, from `origin/main`, once the Story exists:

```bash
git fetch origin && git checkout -b story/<issue#>-<change-id> origin/main
git branch --unset-upstream          # <- do not skip this
```

`git checkout -b <name> origin/main` sets the new branch's upstream to `origin/main`, so a
later bare `git push` targets the protected branch and is rejected. Unset it, then push with
`git push -u origin story/<issue#>-<change-id>`.

Commit the change folder as `docs(<capability>): propose <change-id>` — it is documentation
until G4. Implementation commits are `feat(<capability>): ...`.

**`pnpm run checks` is staged.** Mid-Story it reports rather than fails: the single-change rule
reads "still active" until the archive at Stage 8, and scenario coverage reports `2/4 covered —
next: "<title>"` instead of listing everything missing. That is deliberate — a check that
demanded all four tests at once would push you into exactly the bulk transcription rule 3
forbids. In CI the same checks bind, because a PR claims the Story is finished.

**Gate checkboxes** are ticked by whoever can verify the condition. The orchestrator ticks G1
and G2 boxes when the conditions hold; the implementer ticks DoR and DoD boxes that are
machine-checkable. The one box no agent may ever tick is the G4 approval — that is the human's
decision, recorded as a comment, not a checkbox.

**Labels.** Pipeline issues the orchestrator creates carry no triage label: they are already
triaged by existing. The five triage labels are for inbound or unplanned work only. See
`docs/agents/triage-labels.md`.

## This machine

Homebrew is unusable here: `/opt/homebrew` is owned by `admin:admin` and this account is not
in the `admin` group, and there is no passwordless sudo. Never suggest `brew install` or
`sudo chown`. Node comes from fnm in `~/.local/share/fnm`, pnpm from `~/Library/pnpm/bin` — note the
binary is `$PNPM_HOME/bin/pnpm`, not `$PNPM_HOME/pnpm`. Anything new must install into `$HOME`.

**A non-interactive shell has neither on PATH and defaults to Node 20.** On Node 20
`pnpm run test` fails at startup with `ERR_INVALID_ARG_VALUE ... styleText` from rolldown —
an error that names neither Node nor the version. Open every Bash session with:

```bash
export PNPM_HOME="$HOME/Library/pnpm"; export FNM_DIR="$HOME/.local/share/fnm"
export PATH="$PNPM_HOME/bin:$FNM_DIR:$PATH"; eval "$(fnm env)"; fnm use 24
```

If a tool fails oddly, run `node --version` before diagnosing anything else.

Dependency installs are gated by `minimumReleaseAge: 1440` in `pnpm-workspace.yaml` — pnpm
refuses versions published in the last 24h. If an install fails that check, do not add an
exclusion; pick a matured version or widen the range. See `docs/adr/0011-*`.
