# 0008. Toolchain: Node 24, pnpm 11, TypeScript pinned to 5.9.3, Vitest 4

- Status: accepted
- Date: 2026-08-22
- Deciders: Diego Bugmann

## Context

The scaffold language had to be chosen before the platform decision (native / cross-platform
/ web / PWA) is made, without pre-empting it. It is needed for the test harness, the CI that
runs it, the repo's own tooling scripts, and the Phase 3 dry-run feature.

## Decision

TypeScript on Node 24 with pnpm 11 and Vitest 4. TypeScript is pinned **exactly** to 5.9.3,
not caret-ranged. `erasableSyntaxOnly` is enabled in `tsconfig.json`.

Node 24 is the current Active LTS; Node 22 entered Maintenance in October 2025. Node 24 runs
TypeScript directly with no flags, verified on this machine, so there is no build step, no
bundler and no `tsx`.

## Consequences

- Web, PWA, React Native and Expo all remain open. A later pivot to a Kotlin or Swift native
  app costs nothing in the development system: specs, ADRs, issues, CI structure and agent
  definitions are language-agnostic.
- **The platform decision can be deferred until the first story that renders a user-facing
  view.** Before that point the cost of deferring is zero.
- `erasableSyntaxOnly` rejects syntax Node cannot strip (enums, parameter properties,
  namespaces), so anything that typechecks also runs.
- OpenSpec is installed globally and pinned to 1.10.0, because its generated skills invoke
  the bare `openspec` command. It shipped three days before this decision and its command
  surface has already broken once, so it is bumped deliberately, never incidentally.

## Alternatives considered

**TypeScript 7.0.2**, which is npm `latest` and the Go-ported compiler. Rejected:
`typescript-eslint@8.67.0` peer-requires `typescript >=4.8.4 <6.1.0`, so the linting
ecosystem does not support it yet. TS 7 has one published release; the 5.x line has 24. This
is the deliberate "boring where it counts" deviation from state of the art. Revisit when
typescript-eslint ships TS 7 support.

**pnpm 12**, currently a release candidate built on a Rust rewrite. Rejected for the same
reason. **Biome instead of ESLint**, which would remove the TypeScript peer-version coupling
that forced the TS pin. Considered and declined in favour of the more proven tool.
