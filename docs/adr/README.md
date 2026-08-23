# Architecture Decision Records

One file per decision, in [MADR](https://adr.github.io/madr/)-style format.

**ADRs are immutable once accepted.** A reversal is a new ADR that supersedes the old one;
the superseded file stays where it is. Never edit an accepted ADR to change its decision —
edit it only to add a `Superseded by` line.

Write an ADR when a decision was hard, is expensive to reverse, or would surprise someone
reading the code later. Do not write one for choices the code already makes obvious.

| ADR | Decision |
|---|---|
| [0001](0001-monorepo.md) | Specs, docs and code live in one repository |
| [0002](0002-systems-of-record.md) | The repo owns content, GitHub owns state |
| [0003](0003-epic-feature-story-mapping.md) | Epic to Feature to Story, mapped onto OpenSpec changes |
| [0004](0004-branch-isolation-and-archive.md) | One change per branch; archive inside the story PR |
| [0005](0005-scenarios-drive-tests.md) | Scenarios drive acceptance tests one-to-one; nothing is generated |
| [0006](0006-model-routing-and-agent-permissions.md) | Model routing rule and the agent write-permission matrix |
| [0007](0007-public-repo-free-org.md) | Public repository in a free organisation, with no LICENSE file |
| [0008](0008-toolchain.md) | Toolchain: Node 24, pnpm 11, TypeScript pinned to 5.9.3, Vitest 4 |
| [0009](0009-skill-inventory.md) | Install the skills plugin whole; four skills are never invoked |
| [0010](0010-tdd-enforcement.md) | TDD is enforced by convention and a PR-time lint, not commit-order forensics |
| [0011](0011-supply-chain-quarantine.md) | Dependency versions are quarantined for 24 hours |
| [0012](0012-no-project-board.md) | No GitHub Project board; the gate checkboxes are the status |
| [0013](0013-permission-matrix-enforcement.md) | The write-permission matrix is enforced in three layers, and only partly |
| [0014](0014-g4-approval-marker.md) | G4 is a relayed human decision, recorded as `G4: approved` and enforced at merge time |
