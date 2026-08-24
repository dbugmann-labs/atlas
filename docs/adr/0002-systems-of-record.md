# 0002. The repo owns content, GitHub owns state

- Status: accepted
- Date: 2026-08-22
- Deciders: Diego Bugmann

## Context

Three systems overlap and each could plausibly be the source of truth: OpenSpec's
`specs/` and `changes/`, the Pocock skills' `to-spec`/`to-tickets` which publish to an
issue tracker, and GitHub Issues as the Epic/Feature/Story hierarchy. Left unresolved,
requirements get written in two places and drift apart, and it is never clear which one a
reader should believe.

## Decision

Exactly one authority per question:

| Question | Authority |
|---|---|
| What does the system do today? | `openspec/specs/<capability>/spec.md` |
| What will this change do to that? | `openspec/changes/<id>/specs/**` |
| Why did we choose this? | `docs/adr/` |
| What do our words mean? | `CONTEXT.md` |
| What is being worked on, in what order, blocked by what? | GitHub Issues |
| What steps remain inside this change? | `openspec/changes/<id>/tasks.md` |

An issue body carries a one-sentence intent, a link to the change folder, and gate
checkboxes. It never carries requirements or acceptance criteria. Where an issue and a spec
disagree, the spec wins and the issue is wrong.

Traceability is one-way and write-once: the Story issue is created once through the GitHub
API, the branch name embeds the issue number and change id, and the PR closes the issue.
`docs/graph.mmd` is a read-only projection, regenerated on demand and never read back.

The exact commands live in `docs/agents/issue-tracker.md`. This ADR fixes the shape of the
traceability, not the tooling that implements it.

## Consequences

- No double bookkeeping, because no prose exists in two places.
- `to-tickets` must be told to emit issue stubs rather than its default acceptance criteria.
  This is an instruction in `AGENTS.md` overriding a third-party skill's template, which is
  the most fragile part of this decision.
- An issue read in isolation is not enough to implement from; you must open the change folder.

## Alternatives considered

**Bidirectional sync between change folders and issues.** Rejected: it is the highest
maintenance component in a setup like this and it fails silently. Write-once creation plus a
read-only projection gets most of the value with none of the drift.

## Corrections

- **2026-08-24** — the traceability paragraph named `gh issue create` for Story creation and
  `gh issue list --json` as the source for `docs/graph.mmd`. Neither command can do what was
  claimed: `gh issue create` has no `--type` flag as of gh 2.83.0 and so produces a typeless
  issue, and `gh issue list --json` exposes neither the issue type nor the sub-issue edge.
  Both were wrong on the day this ADR was accepted, and both were corrected everywhere else
  before this file. The paragraph now names no command and points at
  `docs/agents/issue-tracker.md` instead. The decision — one authority per question,
  write-once traceability, a read-only projection — is unchanged.
