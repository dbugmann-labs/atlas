# 0012. No GitHub Project board; the gate checkboxes are the status

- Status: accepted
- Date: 2026-08-22
- Deciders: Diego Bugmann

## Context

Phase 2 planned a GitHub Project v2 board alongside the issue hierarchy. Projects are free
on a public repo in a free organisation, so cost was not the question.

The question was drift. ADR-0002 spent real effort reducing this system to two systems of
record: the repo owns content, GitHub owns state. A Project board's `Status` column is a
third — and unlike the other two, nothing checks it. An issue is open or closed and CI can
read that. A change folder exists or it does not and CI can read that. A card sitting in
"In review" is an assertion nobody verifies, and it goes stale the moment a session ends
without someone dragging it.

The board would also duplicate information that already exists in a stronger form. A Story's
position in the ten-stage lifecycle is legible from its gate checkboxes: G4 ticked means the
spec is approved, G7 ticked means review is clean. Those boxes live in the issue body, are
part of the Definition of Ready, and are read by a human at merge time. Sub-issues already
supply the Epic → Feature → Story hierarchy that a board's grouping would otherwise provide.

For one person at four to eight hours a week with one concurrent Story, the board's real
offering is reassurance, not information.

## Decision

No GitHub Project. Story state is carried by:

- **open/closed** on the issue, which the PR sets automatically,
- **the gate checkboxes** in the issue body, which mirror the DoR and DoD in `docs/process.md`,
- **the triage labels**, for work not yet started,
- **`docs/graph.mmd`**, a generated read-only projection of the sub-issue edges.

## Consequences

- There is no single screen showing every Story's stage. Answering "where is everything"
  means `gh issue list` plus reading checkboxes. Acceptable at one concurrent Story;
  it would not be at five.
- Nothing has to be dragged, so nothing can be stale.
- Reversible in about two minutes (`gh project create --owner dbugmann-labs`) if Phase 3 or
  ordinary use shows the state genuinely is hard to see. That evidence, not the discomfort
  of an empty board, is what should trigger it.
- If a board is ever added, its `Status` column must be derived from the checkboxes, never
  hand-maintained, or this ADR's reasoning is simply reintroduced as a bug.
