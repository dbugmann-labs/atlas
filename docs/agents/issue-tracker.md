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

- **Create an issue**: **not** `gh issue create` — it has no `--type` flag in gh 2.83.0, so it
  silently produces a typeless issue and breaks the three-level model. Use the API:

  ```bash
  gh api --method POST /repos/dbugmann-labs/atlas/issues \
    -f title='FEAT: cli-version' \
    -f body="$(cat <<'EOF'
  One sentence of intent. Link to the change folder. Gate checkboxes.
  EOF
  )" \
    -f type='Feature' --jq '{number, id}'
  ```

  Valid `type` values are `Epic`, `Feature`, `Task`, `Bug`. Keep the returned `id` — the next
  step needs it.

- **Attach a sub-issue**: there is no `gh` verb for this. It is an API call, and the field is
  the child's **database `id`**, not its issue number — passing the number silently attaches
  the wrong issue or fails:

  ```bash
  CHILD_ID=$(gh api /repos/dbugmann-labs/atlas/issues/<child-number> --jq .id)
  gh api --method POST /repos/dbugmann-labs/atlas/issues/<parent-number>/sub_issues \
    -F sub_issue_id="$CHILD_ID"
  ```

  Verify with `gh api /repos/dbugmann-labs/atlas/issues/<parent>/sub_issues --jq '.[].number'`.
  **Never fake the edge with a "Parent: #3" line in the body** — `docs/graph.mmd` is generated
  from real sub-issue edges and will not see it.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

## The G4 approval marker

G4 is recorded as a comment on the Story issue whose body begins with the exact line:

```
G4: approved
```

optionally followed by who authorised it — `G4: approved — authorised by Diego`.

**The decision must be the human's; the keystrokes need not be.** A human who says "approved"
in conversation may have an agent relay it. What is forbidden is originating the decision: an
agent must never decide a proposal is fine and record it, and must never write the marker for
any other reason.

That is why the marker is `G4: approved` and not the bare word. "Approved" appears constantly
in ordinary prose — an agent writing "still waiting for the approved comment" on the issue
would forge the gate for any grep-based reader. **Never write the string `G4: approved` on a
Story issue except as the approval itself.** When discussing the gate, call it "the G4 marker".

Read it with `gh issue view <number> --comments`. `pnpm run check:g4` asserts it, and CI
check 5 blocks the merge if it is missing.

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
