# CONTEXT

The project's shared vocabulary. Agents read this so that spec wording, test names and issue
titles all use the same words for the same things.

This file is maintained by the `grill-with-docs` skill as domain understanding develops.
Add a term when you catch yourself explaining it twice.

## Status

**The product is not yet defined.** This file currently holds only process vocabulary. Domain
terms arrive once product definition begins — see `docs/parking-lot.md`.

## Process vocabulary

**Epic** — a body of work spanning several capabilities. A GitHub issue of type `Epic`. Has
no anchor on disk; pure coordination.

**Feature** — one capability. A GitHub issue of type `Feature`, corresponding one-to-one with
`openspec/specs/<capability>/spec.md`. Lives forever.

**Story** — one unit of implementable work. A GitHub issue of type `Task`, corresponding
one-to-one with an OpenSpec change, a branch and a pull request. Archived when done.

**Change** — OpenSpec's unit of work: the folder `openspec/changes/<change-id>/` holding a
proposal, delta specs, a design and a task list. One change is one Story.

**Delta spec** — the part of a change describing only what is changing, as `ADDED`,
`MODIFIED` or `REMOVED` requirements, rather than restating a whole spec.

**Capability** — a domain grouping of behaviour, one directory under `openspec/specs/`.

**Scenario** — a concrete Given/When/Then example proving a requirement. Each one maps to
exactly one acceptance test of the same name. See `docs/adr/0005-scenarios-drive-tests.md`.

**Seam** — the public boundary a test observes behaviour at. Named in a change's `design.md`
before any test is written.

**G4** — the spec-approval gate. Nothing is implemented before it. See `docs/process.md`.
