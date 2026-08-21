# 0004. One change per branch; archive inside the story PR

- Status: accepted
- Date: 2026-08-22
- Deciders: Diego Bugmann

## Context

If several agents work at once, they must not corrupt the shared source of truth. OpenSpec
change folders never collide, so the only contended resource is `openspec/specs/`, which is
mutated when a change is archived.

The defensive design is to archive in a second pull request on `main` after the story PR
merges. That serialises the contended state absolutely and makes the CI check trivial: a
story branch may never touch `openspec/specs/` at all. The cost is two pull requests per
Story.

## Decision

One Story is one change folder, one branch, one worktree, one pull request. The change is
archived with `/opsx:archive` as the final commit **on the story branch**, after review, so
a single PR carries the spec, the code and the merge into the source of truth.

The merge-time guard becomes **spec-diff containment**: every file changed under
`openspec/specs/` must belong to a capability named in the archived change's delta. On a
`chore/` branch that set must be empty.

**Switch-back trigger:** in-PR archiving is safe while concurrent Stories target different
capabilities, because different capabilities are different files. If two concurrent Stories
ever target the *same* capability, either serialise them or move that pair to separate
archive PRs. This is decided when the second Story is started, not discovered at merge.

## Consequences

- Halves the PR count and removes a branch type, a stage and a gate.
- The guard is weaker: it blocks unrelated or hand-edited spec changes, but cannot prove the
  diff is byte-for-byte what `/opsx:archive` would have produced.
- Containment is a bespoke script and is among the most likely parts of this system to rot.
- At one concurrent Story, the collision the strict form prevents cannot occur at all.

## Alternatives considered

**Separate archive PR on `main`.** The airtight option, and what OpenSpec recommends for
teams. Rejected as disproportionate at one concurrent Story; recorded here so it is not
rediscovered as an oversight.
