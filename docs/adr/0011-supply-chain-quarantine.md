# 0011. Dependency versions are quarantined for 24 hours

- Status: accepted
- Date: 2026-08-22
- Deciders: Diego Bugmann

## Context

pnpm 11 defaults `minimumReleaseAge` to 1440 minutes, refusing to install versions published
in the last 24 hours. This defends against the common supply-chain attack pattern where a
compromised version is published and mass-installed within hours.

Crucially, `minimumReleaseAgeStrict` defaults to **false when `minimumReleaseAge` is not
explicitly configured**. During scaffolding, `pnpm install` therefore installed
`eslint@10.9.0` — published the previous day — and silently wrote itself an exemption into a
`pnpm-workspace.yaml` it created for the purpose. The gate defeated itself, and would have
been committed had the subagent not stopped on the unexplained file.

## Decision

Set the policy explicitly in `pnpm-workspace.yaml`:

```yaml
minimumReleaseAge: 1440
```

Configuring it explicitly flips `minimumReleaseAgeStrict` to true, so resolution **fails
loudly** instead of falling back. No `minimumReleaseAgeExclude` entries. When an install
fails this check, pick a matured version or widen the range — never add an exclusion.

Dependency ranges must therefore be wide enough to contain a matured version. `eslint` is
ranged `^10.8.1` rather than `^10.9.0` for exactly this reason.

## Consequences

- A genuine security patch is delayed by 24 hours.
- `pnpm install` now fails rather than silently proceeding when something in range is too
  fresh. CI is unaffected: it installs from the committed lockfile, so the friction appears
  only when dependencies are deliberately updated. That is the right place for it.
- The policy governs pnpm-resolved dependencies only. Globally installed tooling
  (`npm i -g @fission-ai/openspec`) bypasses it entirely. This asymmetry is real and
  unmitigated; global tools are pinned by exact version instead.
- A stale `node_modules/.pnpm` can cause the check to validate against a cached resolution.
  Clearing `node_modules` forces a fresh one.

## Alternatives considered

**A 7-day window.** Rejected: it would also block `vitest@4.1.11` with no older version in
range. The protection comes from strict mode being on, not from the window's length.
**Deleting `pnpm-workspace.yaml` and accepting the silent-fallback default.** Rejected: that
is the behaviour that caused the problem.
