# 0010. TDD is enforced by convention and a PR-time lint, not commit-order forensics

- Status: accepted
- Date: 2026-08-22
- Deciders: Diego Bugmann

## Context

The stated requirement was "no implementation commits without a failing test that preceded
them". Verifying that mechanically means inspecting commit order, which any rebase, squash
or amend destroys. Our merge strategy is squash, so the ordering evidence is deleted at merge
by design.

Separately, OpenSpec's own philosophy is "fluid not rigid, no phase gates, enablers not
gates", and it never touches git. It will not enforce anything for us.

## Decision

CI proves that every scenario in the delta has a passing acceptance test of the same name,
and that lint, typecheck and the suite pass. It does **not** attempt to prove a test was red
before the implementation was written. Red-before-green is a documented discipline in
`AGENTS.md`, a checkbox on the pull request, and the loop rules inside the `tdd` skill.

## Consequences

- This is a deliberate weakening of the original requirement, recorded so it is not mistaken
  for an oversight.
- What is actually guaranteed: no behaviour ships unspecified, and no specified behaviour
  ships untested. What is not guaranteed: the order in which the author wrote them.
- Because OpenSpec enforces nothing, every gate in this process is bespoke machinery in CI
  and branch rules. That machinery is ours to maintain and is the part most likely to rot.

## Alternatives considered

**Commit-order verification in CI.** Rejected: defeated by a single rebase, and it would be
disabled the first time it produced a false positive. The advice against attempting it is
recorded here deliberately.
