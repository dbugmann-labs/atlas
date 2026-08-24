# Retrospective — building the system, and running it once

**Scope:** everything from the empty repository to the first Story merged end to end.
`docs/process.md` §12 asked for exactly this: *"Phase 4 revisits this list against what
actually happened during the dry run."* This is that revisit.

Written at commit `72a05e1`, three days after `e5fcc2e`.

---

## 1. What exists

| | |
|---|---|
| Hand-written prose (rules, ADRs, agent definitions, process) | ~1,750 lines |
| Code and config (checks, CI, issue templates, generator) | ~1,060 lines |
| Product code | **48 lines** |
| ADRs | 14 |
| Commits on `main` | 16 |
| Merge-time checks | 6 (1 generic, 5 bespoke) |

The ratio of scaffolding to product is roughly 60:1. That is the correct number for a project
whose product is deliberately undefined, and it is also the number to watch: if it is still
above 5:1 after ten real Stories, the apparatus is not amortising and §12's cut list applies.

## 2. What the first Story cost

`add-version-command` — four scenarios, 48 lines of implementation — went through all nine
stages. It produced **three pull requests**: the Story itself (#9), a CI fix that the Story
uncovered (#8), and a documentation fix the Story uncovered (#10). Review raised eight
findings: five fixed, one dropped, one resolved by amending a task, one deferred to issue #7.

That is the honest cost picture, and it is not representative — a rehearsal Story pays for
every defect in the machinery it is the first to touch. `docs/process.md` §12 already carves
out the exception it relied on: *a Story whose purpose is to exercise the pipeline itself*.
The rule it protects — **no Story smaller than roughly two hours goes through the full
pipeline** — survives this run intact and matters more now than when it was written.

## 3. Did the checks earn their keep?

The question §12 posed. One verdict each, on evidence rather than intent.

| Check | Fired in anger? | Verdict |
|---|---|---|
| 2 — spec-diff containment | No | **Keep.** Unproven but irreplaceable |
| 3 — one change per branch | No | **Keep, provisionally.** Cheapest to drop |
| 4 — scenario coverage | Not as a failure | **Keep.** It paced the work rather than caught it |
| 5 — G4 approval recorded | No | **Keep.** It converted a convention into a build failure |
| 6 — commit hygiene | No | **Keep.** Cost is one regex file |

**None of the five has ever blocked a bad merge.** That is worth stating plainly rather than
dressing up, and it is the least comfortable line in this document. What can be said in their
defence is narrower and specific:

- **Check 4 shaped the work.** Reporting `1/4 covered — next: "<title>"` gave the implementer
  the next scenario by name and nothing else. Four red-green cycles happened in delta order
  without anyone policing it. A check that changes behaviour without ever failing is doing its
  job; it is simply invisible when it works.
- **Check 5 changed what G4 *is*.** Before it, G4 was a sentence in a document. After it, a
  Story that reaches a PR without a recorded human decision goes red. `ADR-0014` is explicit
  that this cannot prove a human made the decision — agents act through the owner's token, and
  nothing closes that. It proves the decision was *recorded*, which converts a silent omission
  into a loud one. That is the whole of what was available.
- **Checks 2 and 3 are insurance.** They defend against a spec edit smuggled past the delta,
  and against two changes riding one branch. Neither has happened at one concurrent Story, and
  neither *can* happen much at one concurrent Story. They are priced for the three-Story
  future, not this one.

**The staging fix was the most valuable change made to them.** As first written, `pnpm run
checks` could not pass before Stage 8, and check 4's failure text instructed the reader to
write every missing test — directly contradicting `AGENTS.md` rule 3. A guardrail whose
failure message tells you to break a hard rule is worse than no guardrail. They are now
informational locally and binding in CI.

## 4. The sharpest finding: the checks were validated against themselves

All three original checks resolve a change folder by name. All three assumed the archived form
is `openspec/changes/archive/<change-id>/`. The archive step actually writes
`archive/YYYY-MM-DD-<change-id>/` — a form `docs/process.md` §5 **already documented
correctly** when the checks were written.

So all three failed simultaneously, at the last commit before the first real PR: the Story
finished, reviewed, branch ready. The worst possible place to find it.

Each check had been tested in both directions before it shipped. The tests passed. They passed
because the fixture encoded the same wrong assumption as the code — same author, same sitting,
same misreading of a document that was sitting there being right.

**The lesson is not "test more."** It is that a check must be exercised against output produced
by the real tool at least once, and that a fixture written alongside the code it tests proves
only internal consistency. `tests/ci-lib.test.ts` now pins the date-prefix rule directly, with
a comment saying why that is the worst place to discover it.

## 5. What the dry run caught that design review did not

Phase 3 put a cold agent through stages 0–4 and asked it to **audit the documentation rather
than follow it**. Fifteen defects. The four that mattered were all of one kind: *the documents
were internally coherent and did not survive contact with the tools they described.*

- `gh issue create` has no `--type` flag, so every documented path to creating a conforming
  issue produced a typeless one.
- Nothing anywhere said how to attach a sub-issue — it needs an API call keyed on the child's
  database `id`, not its issue number.
- G4's marker was the bare word "approved", which occurs in ordinary prose. Any agent writing
  *"waiting on the approved comment"* forged the gate for a grep-based reader.
- `docs/graph.mmd` was documented four times as generated from `gh issue list --json`, which
  carries neither the issue type nor the sub-issue edge. It could never have worked. This one
  survived until Phase 4, because nothing tried to build the generator until then.

A cold agent instructed to be adversarial found in one session what four rounds of writing and
re-reading did not. **That is the technique worth keeping**, and it is cheap: the instruction
is "report every defect, do not work around any of them."

## 6. §12's cut list, revisited

§12 proposed cutting in this order if the process hurt. Against evidence:

| Proposed cut | Now |
|---|---|
| 1. Fold Stage 3 into Stage 4 | **Still first.** Grilling never justified its own session at one Story |
| 2. Fold Stage 7 into Stage 8 | **Demote.** Review produced 8 findings on 48 lines; it is the highest-yield stage measured |
| 3. Drop the Epic level | **Promote to second.** One Epic, one Feature, one Story — the Epic carried nothing a Feature did not |
| 4. Drop checks 3 and 4 | **Drop check 3 only.** Check 4 paces the red-green loop; check 3 defends a collision that cannot occur yet |

Unchanged: **G4 and check 2 are never cut.** Nothing in this run argued against that.

The one addition the run suggests: **the human's real cost is not the gates, it is the
machinery defects the gates surface.** §12 priced G2/G4/G7 at 45–90 minutes per Story. That
held. What it did not price was PRs #8 and #10 — work created by the Story rather than
contained in it. That cost decays as the machinery settles, but it is not zero on Story two.

## 7. Known weak points

- **Per-agent write permissions are largely convention.** Path-scoped permissions cannot be
  set per agent, and subagent frontmatter hooks are silently skipped unless the folder is
  explicitly trusted. Three layers enforce what can be enforced; `AGENTS.md` and `ADR-0013`
  state exactly which matrix rows are mechanical and which are not. Do not read the table as
  a guarantee.
- **Project settings load from the session's startup folder.** A session started one directory
  above the repo gets no deny rules, no agents and no skills, and says nothing about it. This
  is the single easiest way to run the whole process unprotected.
- **An agent that holds `Bash` can write any file**, whatever its `disallowedTools` say.
  `orchestrator`, `reviewer` and `janitor` all need `Bash`.
- **The graph generator does not paginate** past 100 issues. It throws rather than truncating.
- **`docs/adr/README.md` forbids editing an accepted ADR except to add a `Superseded by`
  line.** `ADR-0002` contains two factually wrong command names, written wrong on the day it
  was accepted. The rule as written offers no way to correct a false statement that is not the
  decision. Unresolved — see §8.

## 8. Open

- **Issue #7** — manifest read failures escape `runCli` as exceptions instead of a `CliResult`.
  The one review finding deferred rather than fixed.
- **The ADR correction question.** Either `docs/adr/README.md` gains a sentence distinguishing
  a decision from an incidental detail, or `ADR-0002`'s two wrong command names stay wrong
  forever. This is a process decision, not a typo fix, so it is left to the human.
- **Whether any of this holds at three concurrent Stories.** Every judgement above is drawn
  from a sample of one, run by its own author. That is the largest caveat on this document.
