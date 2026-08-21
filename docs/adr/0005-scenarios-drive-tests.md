# 0005. Scenarios drive acceptance tests one-to-one; nothing is generated

- Status: accepted
- Date: 2026-08-22
- Deciders: Diego Bugmann

## Context

Spec-as-contract and TDD pull in opposite directions. A settled OpenSpec spec is, by
construction, a complete set of behaviours imagined before any code exists. The Pocock `tdd`
skill names exactly that as an anti-pattern: *"horizontal slicing: writing all tests first,
then all implementation. Bulk tests verify imagined behaviour."*

## Decision

Each `#### Scenario:` in a change's delta becomes exactly one acceptance test at the top
seam, whose title is **identical to the scenario title**. Unit tests below the seam are
free-form and traced to nothing. No code is generated from specs, ever.

The tension is resolved by *consumption order*, not by weakening either side. The spec is
written up front; the tests are not. Each red-green cycle takes the next unsatisfied
scenario, writes that one test, makes it pass, and moves on. The scenario-coverage lint runs
only at PR time, when the change is finished, so it can never push anyone into writing tests
in bulk.

The seam under test is named in the change's `design.md`, per the `tdd` skill's rule that no
test is written at an unconfirmed seam.

## Consequences

- A machine can check that every specified behaviour has a test, by title matching.
- Renaming a scenario breaks the lint until the test is renamed. That is intended: the names
  are the contract.
- Recording the seam in `design.md` is a convention we invented; neither OpenSpec nor the
  skills define it, so nothing enforces it but the review.

## Alternatives considered

**Generate test stubs from scenarios.** Rejected: generated tests are tautological, they
encourage bulk authoring, and they decouple the test from the thinking that should produce it.
**Write tests independently of the spec.** Rejected: it makes the spec decorative.
