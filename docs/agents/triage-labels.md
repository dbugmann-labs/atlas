# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

Edit the right-hand column to match whatever vocabulary you actually use.

## Which issues carry these

**Not pipeline issues.** An Epic, Feature or Story the orchestrator creates is already triaged
by existing: it was decomposed deliberately and is being driven. Applying `needs-triage` to it
is noise, and the issue templates apply no label for that reason.

These five labels are for **inbound or unplanned work** — something noticed mid-Story, a bug
report, an idea that arrives before it has an Epic. `needs-triage` is where such an issue
starts; it leaves by becoming a Story under a Feature, or by `wontfix`.
