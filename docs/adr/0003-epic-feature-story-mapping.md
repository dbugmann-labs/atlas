# 0003. Epic to Feature to Story, mapped onto OpenSpec changes

- Status: accepted
- Date: 2026-08-22
- Deciders: Diego Bugmann

## Context

Epic/Feature/Story and the OpenSpec *change* are two different decomposition units and
needed reconciling. OpenSpec has no hierarchy at all: one unit, the change, right-sized to
"one intent you can say in a sentence" and buildable in a single focused session. Grouping
happens only by spec domain.

An earlier draft collapsed the hierarchy to two levels, on the assumptions that sub-issues
and issue types would be unavailable and that "Feature" would be an unanchored ceremony
layer. Both assumptions turned out to be false.

## Decision

Three levels, mapped as follows:

| Level | GitHub | Anchor on disk | Lifetime |
|---|---|---|---|
| Epic | issue, type `Epic` | none, pure coordination | weeks |
| Feature | issue, type `Feature` | `openspec/specs/<capability>/spec.md` | forever |
| Story | issue, type `Task` | `openspec/changes/<change-id>/` | days |

One Story is exactly one change, one branch, one pull request. A Feature is exactly one
capability spec. A Feature belongs to exactly one Epic, so sub-issues form a tree.

A Story touching several capabilities hangs off the Feature it primarily advances, with the
others named in `proposal.md`. Work with no behaviour change skips the hierarchy entirely
via a `chore/` branch.

## Consequences

- The middle level is a file, not a fiction, which is what makes three levels honest here.
- Verified on this account: the free organisation ships issue types `Task`/`Bug`/`Feature`
  and allows up to 25 custom types, and sub-issues nest 8 deep with 100 children per parent.
  Only the `Epic` type has to be created.
- `gh issue create` has no `--type` flag as of gh 2.83.0, so setting an issue type requires
  a `gh api` call with the `type` field.
- If Epics stop earning their keep, they are the first level to drop: they are the only one
  with no disk anchor.

## Alternatives considered

**Epic to Story, two levels.** Rejected once the capability anchor was established.
**Labels instead of issue types.** Rejected: native types give filtering and project views
for free on this plan.
