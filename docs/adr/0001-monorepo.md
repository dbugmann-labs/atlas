# 0001. Specs, docs and code live in one repository

- Status: accepted
- Date: 2026-08-22
- Deciders: Diego Bugmann

## Context

The original requirement was a separate repository for specs and documentation. That
conflicts with OpenSpec's core premise, which is that specs live beside the code they
describe, and with our own definition of done: *a new agent session, given only the repo,
can pick up any issue and follow the process*. Two repos means two clones, two checkouts to
keep in sync, and a spec delta that cannot be reviewed in the same pull request as the code
implementing it.

## Decision

One repository, `dbugmann-labs/atlas`. It holds `openspec/` (specs and changes), `docs/`
(process, ADRs, parking lot), `.claude/` (agent and skill configuration), and the source.

## Consequences

- A pull request carries the spec delta and the code together, so the reviewer reads the
  intended behaviour before the diff.
- Specs are versioned with the code, so an archived spec explains a past decision at the
  commit where it applied.
- A cold agent needs one clone and no external context.
- The repo will grow mixed concerns. If the product later splits into several deployables,
  this becomes a workspace rather than several repos.

## Alternatives considered

**Separate specs repository.** OpenSpec supports it through the beta *stores* feature, where
planning gets its own repo that code repos reference. Rejected: the feature is beta, it
solves a multi-repo/multi-team problem we do not have, and it breaks the cold-start property.
