# 0013. The write-permission matrix is enforced in three layers, and only partly

- Status: accepted
- Date: 2026-08-22
- Deciders: Diego Bugmann

## Context

ADR-0006 defined a write-permission matrix per agent and `docs/process.md` §6 claimed that
"this matrix, not good intentions, is what keeps parallel agents from corrupting the specs."
Implementing the agents in `.claude/agents/` forced the question of whether that claim is
true. Investigating what Claude Code can actually enforce produced four facts, two of them
surprising:

1. **Path-scoped permissions cannot be set per agent.** Agent frontmatter offers `tools` and
   `disallowedTools`, which name tools, not paths. Path rules live in `.claude/settings.json`
   and apply to the whole session — every agent in it.
2. **File permission checks consult `Edit(path)` and `Read(path)` rules only.** A
   `Write(path)` rule is accepted, never consulted, and warns at startup. `Edit(...)` covers
   `Write`, `NotebookEdit` and `MultiEdit` as well.
3. **`deny` rules survive `bypassPermissions` mode.** Verified directly: a headless session
   run with `--permission-mode bypassPermissions` was still refused with "File is in a
   directory that is denied by your permission settings." Bypass skips *prompts*, not denials.
   `deny` rules also apply without the workspace-trust step that `allow` rules wait for.
4. **Subagent frontmatter hooks are skipped unless the folder is explicitly trusted** — the
   per-agent `PreToolUse` guard that would express the full matrix silently does not run
   otherwise. A guardrail that fails silently is worse than one that is known to be absent.

Fact 1 kills the obvious design. Fact 3 makes a cruder design unexpectedly strong. Fact 4
rules out the workaround.

## Decision

Enforce what can be enforced, and state plainly in `AGENTS.md` which rows are conventional.

**Layer 1 — session-wide `deny` rules** in `.claude/settings.json`, expressed with `Edit(...)`:

```json
"deny": [
  "Edit(/openspec/specs/**)",
  "Edit(/openspec/changes/archive/**)",
  "Edit(/pnpm-lock.yaml)"
]
```

This makes hard rule 2 — never hand-edit `openspec/specs/` — genuinely impossible rather than
merely instructed, for every agent, in every permission mode. It does not obstruct
`/opsx:archive`, whose frontmatter is `allowed-tools: Bash(openspec:*)`: it writes specs
through the CLI, not through `Edit`. Archived changes and the lockfile are protected on the
same principle — each has a tool that owns it.

**Layer 2 — agent frontmatter.** `orchestrator`, `reviewer` and `janitor` declare
`disallowedTools: Write, Edit, NotebookEdit` and hold no file-editing tool at all.

**Layer 3 — CI check 2**, which catches spec-diff escapes at merge time regardless of how
they were produced.

The remaining rows — `spec-author` staying out of `src/`, `implementer` staying out of the
delta — are convention, written into each agent file and caught at review.

## Consequences

- The dangerous failure, corrupting the source of truth, is blocked mechanically at two
  independent layers. The cosmetic failures are not blocked at all.
- **The deny rules only load when the session starts at the repository root**, because project
  settings are read from the startup folder. A session started in a parent directory silently
  has no such protection. This is the sharpest edge in the whole arrangement.
- `Bash` remains a hole in layer 2: an agent holding `Bash` can write any file through the
  shell. `orchestrator`, `reviewer` and `janitor` all need `Bash` for `gh` and the openspec
  CLI, so their "writes nothing" is convention plus the absence of the obvious tool, not a
  guarantee.
- `docs/process.md` §6 overstated the matrix and has been amended rather than left to mislead.
- If the matrix ever needs full mechanical enforcement, the route is a `PreToolUse` hook in
  the **project settings file** — not in agent frontmatter — dispatching on the agent name.
  That is a real option, deliberately not taken now: it is a fourth bespoke mechanism guarding
  failures that review already catches.
