# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues on `dbugmann-labs/atlas`. Use the `gh`
CLI for all operations. `gh` infers the repo from `git remote -v` when run inside a clone.

## What goes in an issue body

**Issues carry no requirements.** An issue body holds a one-sentence intent, a link to the
change folder, and gate checkboxes — nothing else. Requirements live in
`openspec/specs/**` and `openspec/changes/<id>/specs/**`. Where an issue and a spec
disagree, the spec wins and the issue is wrong. See `AGENTS.md` rule 4 and
`docs/adr/0002-systems-of-record.md`.

A skill whose default template emits acceptance criteria into the issue body (`to-tickets`
does) must be told to emit a stub instead.

## Issue types

| Level | GitHub issue type | Anchor on disk |
|---|---|---|
| Epic | `Epic` | none |
| Feature | `Feature` | `openspec/specs/<capability>/spec.md` |
| Story | `Task` | `openspec/changes/<change-id>/` |

A Story issue's title is the change id, verbatim. One Story = one change = one branch = one PR.

Traceability is one-way and write-once: the Story issue is created once via `gh issue
create`, the branch name embeds the issue number and change id (`story/<issue#>-<change-id>`),
and the PR closes the issue. `docs/graph.mmd` is a read-only projection regenerated from
`gh issue list --json`.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

The G4 approval gate is a human comment reading `approved` on the Story issue. Read it with
`gh issue view <number> --comments`; never write it on the human's behalf.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr` equivalents:

- **Read a PR**: `gh pr view <number> --comments` and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` then keep only `authorAssociation` of `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE` (drop `OWNER`/`MEMBER`/`COLLABORATOR`).
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either: resolve with `gh pr view 42` and fall back to `gh issue view 42`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue — as a stub, per **What goes in an issue body** above.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`, then open the change folder it links to. An issue
read in isolation is not enough to implement from.

## Wayfinding operations

Not applicable. `/wayfinder` is on the **Never invoke** list in `AGENTS.md`, so this repo
keeps no wayfinder map, child tickets or `wayfinder:*` labels.
