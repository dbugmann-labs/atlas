# 0007. Public repository in a free organisation, with no LICENSE file

- Status: accepted
- Date: 2026-08-22
- Deciders: Diego Bugmann

## Context

The budget is 20 CHF per month excluding model spend. On GitHub's Free plan, branch
protection and rulesets are unavailable on **private** repositories, and Actions is metered
at 2,000 minutes per month. On a **public** repository both are free and unlimited. Issue
types are organisation-only and unavailable to personal accounts on any plan.

A personal private repo on Free has no branch protection at all; personal private on Pro
costs about 3.2 CHF per month and still has no issue types.

## Decision

A free GitHub organisation, `dbugmann-labs`, owning a public repository, `atlas`. No
`LICENSE` file is added.

## Consequences

- Branch protection, unlimited CI minutes, issue types and sub-issues all cost nothing, and
  the entire budget stays available for other services.
- Development is public from the first commit, including the process documentation and,
  eventually, the product direction in `docs/parking-lot.md`.
- Without a LICENSE, default copyright applies: others may view and fork under GitHub's
  terms of service but have no licence to use the work. This is the correct posture for a
  product that is not yet defined and may be commercialised. Adding a licence later is
  trivial; retracting one is not.

## Alternatives considered

**Private repo on GitHub Pro.** Rejected: costs money, and still cannot use issue types.
**Private repo on Free.** Rejected: no branch protection means no enforceable merge gate,
which removes the mechanism the whole process depends on.
