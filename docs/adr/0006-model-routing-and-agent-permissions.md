# 0006. Model routing rule and the agent write-permission matrix

- Status: accepted
- Date: 2026-08-22
- Deciders: Diego Bugmann

## Context

Model routing needed to be an explicit written rule rather than a per-session judgement
call, and parallel agents needed something stronger than good intentions to keep them out of
the source of truth.

## Decision

The routing rule, stated once:

> Model tier is a function of whether the task creates, judges, or merely executes
> requirements. Creating or judging requirements uses Opus. Executing an approved,
> written-down plan uses Sonnet. Mechanical work whose correctness is visible in the diff
> uses Haiku.

The permission matrix, which is the actual isolation mechanism:

| Agent | Model | May write |
|---|---|---|
| `orchestrator` | Opus | nothing in the repo; GitHub issues only |
| `spec-author` | Opus | `openspec/changes/**`, `docs/adr/**` |
| `implementer` | Sonnet | `src/**`, `tests/**`, `tasks.md` checkboxes |
| `reviewer` | Opus | nothing; reports findings only |
| `janitor` | Haiku | archive moves, generated files, issue state |

Nothing writes `openspec/specs/` except `/opsx:archive`.

**Configuration changes are not delegable.** Installing plugins, editing
`.claude/settings.json`, changing permissions or editing `CLAUDE.md` must be performed by the
session that is talking to the human. A correctly behaving subagent refuses authorization
relayed through another agent, and it is right to.

## Consequences

- Routing is auditable: each agent definition carries its model in frontmatter.
- The non-delegable rule was learned the hard way during scaffolding, when a subagent
  correctly declined a plugin install relayed through the orchestrator. Orchestration plans
  must reserve config steps for the human-facing session.
- Every agent session starts from durable files, never chat history; `/handoff` writes
  continuation state into the change folder.

## Alternatives considered

**Single model for everything.** Simpler, and materially more expensive on planning-heavy
work while being worse at it. Rejected.
**Enforcing permissions with hooks.** Deferred: the matrix is currently documentation plus
agent scoping, not a hard technical boundary.
