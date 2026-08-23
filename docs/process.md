# Atlas — Process Architecture

**Status:** proposed, awaiting Phase 1 sign-off
**Destination:** `docs/process.md` in `dbugmann-labs/atlas`
**Audience:** any agent or human picking up any issue in this repo, with zero prior context

---

## 0. The whole process in one paragraph

Work is decomposed into **Epics** (coordination only), **Features** (each one a capability spec that lives forever), and **Stories** (each one an OpenSpec change, one branch, one PR, then archived). Nothing is implemented until its change folder exists, validates, and has been approved by a human — that is the one hard gate. After approval, an implementer works the change's scenarios one at a time, red-green, until every scenario in the delta has a passing acceptance test of the same name. The change is then archived as the final commit on the same branch, so one PR carries the spec, the code and the merge into the source of truth — and CI refuses any spec edit that the archived delta does not claim. The repo is authoritative for *content*; GitHub is authoritative for *state and order*; nothing is written down twice.

If you can say that paragraph from memory, you know the process.

---

## 1. Systems of record

Three systems overlap. Each is authoritative for exactly one thing, and nothing is authoritative twice.

| Question | Authoritative artifact | Lives in | Lifetime |
|---|---|---|---|
| What does the system do today? | `openspec/specs/<capability>/spec.md` | repo | forever |
| What will this change do to that? | `openspec/changes/<change-id>/specs/**` (delta) | repo | until archive |
| Why did we choose this? | `docs/adr/NNNN-*.md` | repo | forever |
| What do our words mean? | `CONTEXT.md` | repo | forever |
| What is being worked on, in what order, blocked by what? | GitHub Issues + Project | GitHub | until closed |
| What steps remain inside this change? | `openspec/changes/<change-id>/tasks.md` | repo | until archive |

**The rule: the repo owns content, GitHub owns state.** An issue body never contains requirements, acceptance criteria, or design. It contains a one-sentence intent, a link to the change folder, and checkboxes for the process gates. If an issue and a spec disagree, the spec wins and the issue is wrong.

This is what removes double bookkeeping. `to-tickets` normally writes acceptance criteria into issue bodies; here it does not — its issue template is overridden in `AGENTS.md` to emit stubs.

**Traceability** is one-way and write-once. The Story issue is created by the agent at Stage 2 with `gh issue create`, titled with the change-id. The branch name embeds both the issue number and the change-id. The PR closes the issue. Nothing syncs back. The dependency graph (`docs/graph.mmd`) is *regenerated read-only* from `gh issue list --json` on demand — it is a projection, never an input.

> Rejected alternative: a bidirectional sync script. It is the highest-maintenance component in any setup like this and it fails silently. Write-once creation plus a read-only projection gets ~90% of the value with none of the drift.

---

## 2. Repository layout

One repo. Specs live beside the code they describe, which is OpenSpec's core premise and also the only way a cold agent handed one URL can follow this process.

```
atlas/
├── AGENTS.md                     # the process, written for agents
├── CLAUDE.md                     # "@AGENTS.md" + Claude-specific notes
├── CONTEXT.md                    # domain vocabulary (Pocock skills read this)
├── README.md                     # cold-start entry point (Phase 4)
├── openspec/
│   ├── config.yaml
│   ├── specs/<capability>/spec.md            # SOURCE OF TRUTH
│   └── changes/
│       ├── <change-id>/{proposal.md, specs/, design.md, tasks.md, .openspec.yaml}
│       └── archive/YYYY-MM-DD-<change-id>/
├── docs/
│   ├── process.md                # this document
│   ├── adr/NNNN-kebab-title.md
│   ├── agents/{issue-tracker.md, domain.md, triage-labels.md}   # written by setup-matt-pocock-skills
│   ├── graph.mmd                 # generated, read-only
│   └── parking-lot.md            # product ideas, deliberately not acted on
├── .claude/agents/*.md           # subagent definitions + model routing
├── .github/
│   ├── ISSUE_TEMPLATE/{epic.yml, feature.yml, story.yml}
│   └── workflows/ci.yml
├── scripts/                      # graph generation, scenario-coverage lint
├── src/
└── tests/
```

---

## 3. Decomposition and its mapping to OpenSpec

OpenSpec has exactly one unit of work — the *change* — and no hierarchy at all. It fixes the bottom of our hierarchy and anchors the middle. Everything above is GitHub's job.

| Level | GitHub | Anchor on disk | Cardinality | Lifetime |
|---|---|---|---|---|
| **Epic** | issue, type `Epic` | none — pure coordination | 1 Epic : many Features | weeks–months |
| **Feature** | issue, type `Feature` | `openspec/specs/<capability>/spec.md` | 1 Feature : 1 capability | forever |
| **Story** | issue, type `Task` | `openspec/changes/<change-id>/` | 1 Story : 1 change : 1 branch : 1 PR | days |

The middle level is honest because a Feature *is* a capability spec. It is not a ceremony layer; it is a file.

**Sizing rule for a Story**, inherited from OpenSpec: one intent you can state in a sentence, buildable in one focused session. If describing it needs "and also", split it. If reviewing it would take an afternoon, split it.

**Edge cases.** A Story that touches more than one capability hangs off the Feature it primarily advances; the additional capabilities are named in `proposal.md`. A Feature belongs to exactly one Epic, so sub-issues stay a tree rather than a graph. Work with no behaviour change — tooling, refactors, docs — skips the Feature level entirely and uses the `chore/` escape hatch in §5.

### Naming conventions

| Thing | Form | Example |
|---|---|---|
| Epic issue title | `EPIC: <noun phrase>` | `EPIC: Development system` |
| Feature issue title | `FEAT: <capability-slug>` | `FEAT: cli-version` |
| Capability directory | kebab noun | `openspec/specs/cli-version/` |
| Story issue title | the change-id, verbatim | `add-version-command` |
| Change id | kebab, verb-first | `add-version-command` |
| Branch | `story/<issue#>-<change-id>` | `story/14-add-version-command` |
| Chore branch | `chore/<slug>` | `chore/bump-node-22` |
| Archive commit | `chore(archive): <change-id>` | last commit on the story branch |
| Archive branch | only if §7's switch-back trigger fires | `archive/add-version-command` |
| Commit | Conventional Commits | `feat(cli-version): print version from package.json` |
| PR title | = the squash commit message | same |
| ADR | `docs/adr/NNNN-kebab-title.md` | `docs/adr/0004-branch-isolation.md` |
| Archive folder | OpenSpec-controlled | `openspec/changes/archive/2026-08-21-add-version-command/` |

---

## 4. The lifecycle

Ten stages, five gates. **Gate** means work stops until a named condition holds. `H` = you sign off, `CI` = machine-checked, `A` = agent-internal.

| # | Stage | Driver | Agent / model | Output | Gate |
|---|---|---|---|---|---|
| 0 | Epic intake | you | `orchestrator` / Opus | Epic issue | — |
| 1 | Feature definition | you | `orchestrator` / Opus | Feature issue, sub-issue of Epic | **G1 (H)** |
| 2 | Story decomposition | `/to-tickets` on the Feature | `orchestrator` / Opus | Story issues, sub-issues of Feature, blocking edges declared | **G2 (H)** |
| 3 | Grill | `/grill-with-docs` | `spec-author` / Opus | `design.md` **Open Questions** filled in — "None" is a valid and required answer — plus any new `CONTEXT.md` terms | — |
| 4 | Propose | `/opsx:propose <change-id>` | `spec-author` / Opus | change folder: proposal, delta specs, design, tasks — cut the branch here, commit as `docs(<capability>): propose <change-id>` | **G4 (H+CI)** ← the hard gate |
| 5 | Red | first unsatisfied scenario | `implementer` / Sonnet | one failing acceptance test | A |
| 6 | Green + next | `/opsx:apply` driving `/tdd` | `implementer` / Sonnet | one scenario per cycle until the delta is satisfied | A |
| 7 | Review | `/code-review` | `reviewer` / Opus | findings, two-axis: standards + spec fidelity | **G7 (H)** |
| 8 | Archive | `/opsx:archive` on the same branch | `janitor` / Haiku | delta merged into `openspec/specs/`, change moved to `changes/archive/`, PR marked ready | — |
| 9 | Merge | squash-merge | `janitor` / Haiku | issue auto-closed, `docs/graph.mmd` regenerated | **G8 (CI)** |

### The gates, precisely

**G1 — Feature ready.** The Feature names one capability, the capability slug is decided, and the Feature is a sub-issue of exactly one Epic.

**G2 — Decomposition accepted.** Every Story states one sentence of intent. Blocking edges are declared and acyclic. You have said yes to the breakdown; `to-tickets` iterates until you do.

**G4 — Spec approved. This is the gate your whole requirement set rests on.** All of:
- `openspec validate <change-id> --strict` exits 0
- the delta uses ADDED / MODIFIED / REMOVED correctly against current specs
- every requirement has at least one scenario, and the error/edge cases have scenarios, not just the happy path
- you have read `proposal.md` and the delta, and the Story issue carries a comment beginning `G4: approved`

No implementation commit may precede that comment. Enforcement is CI check 5 in §7.

The **decision** must be a human's; the keystrokes need not be. A human may say "approved" and have an agent record it. The marker is the exact line `G4: approved`, not the bare word, because "approved" occurs constantly in ordinary prose and an agent writing *"waiting on the approved comment"* would otherwise forge the gate for any grep-based reader.

**G7 — Review clean.** `code-review` reports no unresolved findings on either axis. The reviewer never edits code; it reports and the implementer fixes.

**G8 — CI green.** The only gate between a finished Story and `main`. It now also carries what used to be a separate archive gate: `openspec validate --archived` proves every `tasks.md` box is ticked, and spec-diff containment proves the archive touched only capabilities the delta claims. See §7 for the exact check list.

Archiving happens on the story branch as the last commit, not in a follow-up PR. The review at G7 runs *before* the archive commit, so the reviewer sees the change folder at the path you approved at G4.

---

## 5. Branch strategy

`main` is protected and linear. Everything reaches it by squash-merged PR.

| Branch type | May touch `openspec/specs/` | May touch `src/` | Requires a change folder |
|---|---|---|---|
| `story/<issue#>-<change-id>` | **yes — in the archive commit only, and only capabilities the delta claims** | yes | yes |
| `chore/<slug>` | **no** | yes | no — but `.openspec.yaml` sets `skip_specs: true` if a change folder exists |

The `chore/` lane is the deliberate escape hatch. Without it, a one-line dependency bump would need an Epic, and you would abandon the process within a month. Chore branches are for work with no behaviour change: tooling, dependency bumps, docs, CI. If you find yourself reaching for `chore/` to add behaviour, that is the process telling you to write a Story.

**Ruleset on `main`** (free org + public repo, so this costs nothing): require a pull request, require status checks to pass, require linear history, block force-push, **zero required approvals**. Required approvals are theatre when you are the only human; the status checks are the real gate.

---

## 6. Agent roles and model routing

### The routing rule, stated once

> **Model tier is a function of whether the task creates, judges, or merely executes requirements.**
> Creating or judging requirements → **Opus**. Executing an approved, written-down plan → **Sonnet**. Mechanical work whose correctness is visible in the diff → **Haiku**.

That rule is the whole policy. Everything below is its application. It is written in `AGENTS.md` and in each agent's frontmatter, not decided per session.

### Write-permission matrix

This matrix, not good intentions, is what keeps parallel agents from corrupting the specs.

| Agent | Model | `openspec/specs/` | `openspec/changes/` | `src/` + `tests/` | `docs/adr/` | GitHub |
|---|---|---|---|---|---|---|
| `orchestrator` | Opus | ✗ | ✗ | ✗ | ✗ | create/label/link |
| `spec-author` | Opus | ✗ | **write** | ✗ | **write** | comment |
| `implementer` | Sonnet | ✗ | `tasks.md` only | **write** | ✗ | comment |
| `reviewer` | Opus | ✗ | ✗ | ✗ | ✗ | comment |
| `janitor` | Haiku | via `/opsx:archive` only | move to `archive/` | ✗ | ✗ | close/update |

`CONTEXT.md` is written by `spec-author` alone, at Stage 3, and by nobody else — it is the one shared file outside `openspec/` that the matrix governs.

Read as: **only `spec-author` writes deltas; nothing writes `openspec/specs/` except the archive step.**

**How much of this is actually enforced.** Two rows are mechanical and the rest are not, and
the difference is worth knowing precisely. `deny` rules in `.claude/settings.json` make
`openspec/specs/**` unwritable by `Edit`/`Write` for every agent in every permission mode —
verified against `bypassPermissions` — while leaving `/opsx:archive` free, because it writes
through the openspec CLI over Bash. Frontmatter `disallowedTools` removes file-editing tools
from `orchestrator`, `reviewer` and `janitor` outright. CI check 2 catches spec-diff escapes at
merge time whatever produced them.

The finer splits — `spec-author` not writing `src/`, `implementer` not writing the delta —
cannot be expressed: path-scoped permissions are session-wide, not per-agent, and the
per-agent hook that would express them is skipped unless the folder is explicitly trusted.
Those rows are convention, caught at review. The earlier claim that the matrix rather than
good intentions keeps agents honest holds for the source of truth and nothing else.
See ADR-0013.

### Context discipline

Every agent session starts from durable files, never from chat history. The orchestrator hands a subagent a Story issue number and nothing else; the subagent reads `AGENTS.md`, `CONTEXT.md`, the change folder, and the relevant capability spec. When a session must end mid-Story, `/handoff` writes the continuation state into the change folder — not into a chat log, not into the issue. Sessions are deliberately short and single-purpose; a session that has drifted onto a second Story is a bug.

---

## 7. Parallelism, isolation, and the merge-time check

**Isolation.** One Story = one change folder = one branch = one git worktree. Change folders never collide, which is OpenSpec's own design claim. The single shared mutable resource is `openspec/specs/`, and it is touched exactly once per Story: the archive commit at Stage 8.

You start with **one concurrent Story**, where two changes cannot possibly race for the same spec file. Worktrees are configured and documented in Phase 2 and stay dormant until you have evidence you need two. Your review capacity, not agent wall-clock, is the constraint.

**The switch-back trigger.** In-PR archiving is safe while concurrent Stories target *different* capabilities — different capabilities are different files, so git never sees a conflict. If two concurrent Stories ever target the **same** capability, either serialise them or move that pair to separate `archive/<change-id>` PRs landing after each story merges. Do not discover this at merge time: it is a decision made when the second Story is started, at Stage 2.

**The merge-time check.** CI on every PR:

1. `openspec validate --all --strict --no-interactive`
2. **Spec-diff containment** — every file changed under `openspec/specs/` must belong to a capability named in the archived change's delta. On a `chore/` branch the set must be empty. This is the check that makes the source of truth safe.
3. **Single-change rule** — a `story/` PR adds exactly one directory under `openspec/changes/archive/` and leaves no active change folder behind for that Story.
4. **Scenario coverage** — every `#### Scenario:` in the change's delta has an acceptance test whose title matches it verbatim. See §8.
5. **G4 approval recorded** — the Story issue carries a comment beginning `G4: approved`. This is what turns "no implementation before G4" from a convention into a red build.
6. **Commit hygiene** — no commit on the branch carries an attribution trailer or names a tool (§hard rule 7).
7. `pnpm run verify` — lint, typecheck, test.
8. `openspec validate --archived` — every `tasks.md` checkbox in the newly archived change is ticked.

Checks 2–6 are bespoke scripts in `scripts/`. They are the most likely part of this system to rot, and Phase 4 revisits whether they earned their keep.

**Checks 3 and 4 are staged.** Run locally on a Story still in flight they report rather than fail — the single-change rule reads "still active" until the archive at Stage 8, and scenario coverage reports how many scenarios are covered and names the next one. Failing locally would demand every acceptance test at once, which is precisely the bulk transcription §8 forbids. In CI they bind, because a PR asserts the Story is finished.

**What check 5 can and cannot prove.** Agents act through the repository owner's token, so no check can prove a human rather than an agent wrote a comment. Check 5 proves the decision was *recorded*, which converts a silent omission into a blocked merge. The gate's integrity rests on agents never originating the marker — stated in `AGENTS.md` rule 1 and in `docs/agents/issue-tracker.md`. ADR-0014 records why the marker is `G4: approved` and not the bare word.

> **What check 2 gives up.** The stricter form of this rule — "a story branch may never touch `openspec/specs/` at all" — is airtight and needs no script, but it forces archiving into a second PR. Containment is the weaker guarantee that survives one-PR archiving: it blocks unrelated or hand-edited spec changes, but cannot prove the diff is byte-for-byte what `/opsx:archive` would have produced. Accepted deliberately; recorded in ADR-0004.

**TDD enforcement, honestly.** Checks 4 and 5 prove tests exist, are named after scenarios, and pass. They do *not* prove a test was red before the implementation was written. Nothing short of commit-order forensics does, and that is defeated by one rebase. Red-before-green is therefore a **documented discipline in `AGENTS.md` and a PR checkbox you tick**, plus the `tdd` skill's own loop rules. This is a deliberate weakening of your requirement, recorded in ADR-0010.

---

## 8. Where the spec stops and the test starts

**Scenarios drive tests. They never generate them.**

| | |
|---|---|
| **Acceptance tests** | One per `#### Scenario:` in the delta, at the top seam, **title identical to the scenario title**. Machine-checked at PR time. |
| **Unit tests** | Free-form, below the seam, not traced to anything, written as the TDD loop demands. |

The seam is agreed *before* any test is written, per the `tdd` skill — the fewer seams, the better, and existing seams beat new ones. The seam for a Story is named in its `design.md`.

**The tension this resolves:** a settled OpenSpec spec is, by construction, a complete set of behaviours imagined before any code — which is exactly what the `tdd` skill calls horizontal slicing and names an anti-pattern. The resolution is consumption order. The spec is written up front; the *tests are not*. Each red-green cycle picks up one not-yet-satisfied scenario, writes that one test, makes it pass, and moves on. The coverage lint only runs at PR time, when the change is finished — never per-commit — so it can never push you into writing tests in bulk.

---

## 9. Definition of Ready / Definition of Done

### DoR — a Story may enter Stage 5

- [ ] Sub-issue of exactly one Feature, which is a sub-issue of exactly one Epic
- [ ] Intent stated in one sentence
- [ ] Every blocking Story closed
- [ ] No open questions left by the grill
- [ ] Change folder exists; `openspec validate <change-id> --strict` exits 0
- [ ] Seam(s) named in `design.md`
- [ ] Human `approved` comment on the issue (**G4**)

**Who ticks a box.** Whoever can verify the condition: the orchestrator ticks G1 and G2, the implementer ticks the machine-checkable DoR and DoD boxes. Ticking asserts the condition holds, not that a human looked. The one line no agent may write is the G4 marker, which is a comment rather than a checkbox precisely so the two cannot be confused.

### DoD — a Story is finished

- [ ] Every scenario in the delta has a passing, name-matched acceptance test
- [ ] `pnpm run verify` green; full CI green
- [ ] `code-review` clean on both axes
- [ ] ADR written if a decision was hard, reversible-with-pain, or surprising
- [ ] `/opsx:archive` run as the last commit on the branch: `openspec/specs/` updated, change under `changes/archive/`, every `tasks.md` box ticked
- [ ] PR squash-merged into `main`; issue auto-closed
- [ ] `docs/graph.mmd` regenerated

---

## 10. Skill inventory

Installed as one pinned plugin from the official marketplace, and **not** pruned — because pruning turns out to be unnecessary.

Claude Code has no per-skill disable mechanism: `claude plugin disable` operates at plugin granularity, there is no `disabledSkills` setting, and deleting skill directories from the installed copy is reverted by `claude plugin update`. That would normally force a fork. It doesn't here, because every skill on the kill list already declares `disable-model-invocation: true` in its own frontmatter — `to-spec`, `implement`, `wayfinder`, `improve-codebase-architecture`, and in fact all the user-invoked skills. They cannot fire on their own; only an explicit invocation by name reaches them. The two we most want firing automatically, `tdd` and `code-review`, are the model-invocable ones.

So "disabled" below means **never invoke**, enforced by `AGENTS.md` and backed by the fact that nothing can invoke them accidentally. No fork, no vendoring, no upstream tracking.

| Skill | Status | Why |
|---|---|---|
| `grill-with-docs` | **enabled** | Stage 3; also maintains `CONTEXT.md` |
| `to-tickets` | **enabled**, template overridden | Stage 2; issue bodies emit stubs, not acceptance criteria |
| `tdd` | **enabled** | Stages 5–6, invoked by `/opsx:apply` |
| `code-review` | **enabled** | Stage 7 |
| `triage` | **enabled** | label state machine for inbound work |
| `handoff` | **enabled** | context discipline, §6 |
| `diagnosing-bugs`, `research`, `domain-modeling`, `codebase-design`, `resolving-merge-conflicts` | enabled | narrow, no overlap |
| `to-spec` | **never invoke** | duplicates `/opsx:propose`; would publish requirements prose to the issue tracker, breaking §1 |
| `implement` | **never invoke** | duplicates `/opsx:apply`, and its "commit your work to the current branch" step bypasses G7/G8 |
| `wayfinder` | **never invoke** | multi-session decision tickets; premature at one concurrent Story |
| `improve-codebase-architecture` | **never invoke** | there is no codebase yet |
| `prototype`, `wizard`, `teach`, `to-questionnaire`, `wait-what`, `grill-me`, `ask-matt` | disabled | unused; keeps model-invoked surface small |

`setup-matt-pocock-skills` runs exactly once, in Phase 2, and configures tracker = GitHub, default triage labels, single-context docs.

---

## 11. ADR register

| ADR | Decision |
|---|---|
| 0001 | Monorepo: specs, docs, ADRs and code in one repo |
| 0002 | Systems of record: repo owns content, GitHub owns state; one-way traceability |
| 0003 | Epic → Feature → Story, and its mapping onto OpenSpec changes |
| 0004 | Branch-per-change isolation; archive inside the story PR, guarded by spec-diff containment |
| 0005 | Scenarios drive acceptance tests 1:1 by name; no code generation |
| 0006 | Model routing rule and the agent write-permission matrix |
| 0007 | Public repo in a free organisation; no LICENSE file |
| 0008 | Toolchain: Node 24 LTS, pnpm 11, TypeScript pinned to 5.9.3, Vitest 4 — and the platform-decision deferral point |
| 0009 | Skill inventory: which skills are never invoked, and why no disable mechanism is needed |
| 0010 | TDD enforced by convention plus PR-time coverage lint, not commit-order forensics |
| 0011 | Supply-chain quarantine: `minimumReleaseAge` set explicitly so pnpm fails on freshly-published versions rather than silently falling back |
| 0012 | No GitHub Project board; the gate checkboxes are the status |
| 0013 | The write-permission matrix is enforced in three layers, and only partly |
| 0014 | G4 is a relayed human decision, recorded as `G4: approved` and enforced at merge time |

All fourteen are written; `docs/adr/README.md` is the live index.

ADRs are immutable once accepted. A reversal is a new ADR that supersedes the old one; the old file stays.

---

## 12. Is this proportionate?

Honestly: **it is at the ceiling of what one person at 4–8h/week can carry, and it is only worth it because of what you said "done" means.**

The gates cost you roughly 45–90 minutes of *your own* time per Story — reading a proposal and delta at G4, accepting a decomposition at G2, reading review findings at G7. If a Story is three hours of agent work, that is a 25–50% tax. You are buying: specs that stay true, a cold agent that needs no explanation, and decisions you can still reconstruct in a year. That is a good trade *if and only if the tax amortises* — which means:

**A Story smaller than roughly two hours of work must not go through the full pipeline.** Batch it into a larger change, or route it through `chore/`. The single fastest way to make this apparatus feel absurd is to run a five-line fix through ten stages.

*One exception:* a Story whose purpose is to exercise the pipeline itself — a scaffolding dry run, or a rehearsal after the process changes materially. There the trivial size is the point, because the work must not distract from the machinery being tested. Say so in the Story's intent. Absent that sentence, this rule stands and a cold agent should push back on the assignment rather than proceed.

### If it hurts, cut in this order

1. **Fold Stage 3 into Stage 4** — grill inside `/opsx:propose` rather than as a separate session. Cheapest cut, smallest loss.
2. **Fold Stage 7 into Stage 8** — review as a PR step rather than a separate agent pass.
3. **Drop the Epic level** — keep Feature → Story. Epics are the layer with no disk anchor and therefore the first fiction to appear.
4. **Drop CI checks 3 and 4** — keep spec-diff containment (check 2), which is the one that actually protects the source of truth.

What you should not cut, in any version: **G4** and **CI check 2**. Those two are the process. Everything else is scaffolding around them.

### Already cut, before we started

The first draft of this document put the archive step in a second PR on `main`, landing after the story PR merged. That is the airtight option and it is what OpenSpec recommends for teams. It was cut because it doubles the PR count to defend against a collision that cannot occur at one concurrent Story and is rare at three. §7 records the trigger for putting it back.

Phase 4 revisits this list against what actually happened during the dry run.
