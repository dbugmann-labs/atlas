# 0014. G4 is a relayed human decision, recorded as `G4: approved` and enforced at merge time

- Status: accepted
- Date: 2026-08-23
- Deciders: Diego Bugmann

## Context

G4 — no implementation before the human has approved the proposal — is the gate the entire
requirement set rests on. Until now it was specified as "the human has commented `approved` on
the Story issue", and enforced by nothing but agent compliance.

The Phase 3 dry run showed that specification fails twice.

**It cannot detect who is speaking.** Agents act through `gh`, authenticated as the repository
owner. A status comment posted by an agent during the dry run is authored by `diegobugmann` and
is indistinguishable from one the human typed. No check can close this: there is no signal in a
GitHub comment that separates the owner's fingers from the owner's token.

**The bare word is forgeable by accident.** "Approved" occurs constantly in ordinary prose. An
agent writing *"this Story is waiting on the approved comment"* injects the token into the
comment stream and forges the gate for any grep-based reader — and for a human skimming the
thread. The dry-run agent noticed this and deliberately avoided the word, a precaution that was
documented nowhere.

Insisting the human personally type the comment does not survive contact with how the work
actually happens: the human is often in a terminal talking to an agent, and asking them to
switch context to type six characters buys nothing real.

## Decision

**What matters is that a human is in the loop before implementation starts, not whose fingers
moved.** A human may say "approved" in conversation and have an agent record it. What is
forbidden is an agent *originating* the decision.

The marker is a comment on the Story issue whose body begins with the exact line:

```
G4: approved
```

optionally followed by who authorised it. Three consequences follow:

1. The token cannot be produced by prose. Discussing the gate uses the phrase "the G4 marker";
   writing the literal string on a Story issue for any purpose other than the approval itself
   is forbidden by `AGENTS.md` rule 1.
2. It is greppable, so **CI check 5** blocks the merge when it is absent. G4 stops being pure
   convention and becomes a red build.
3. It is a comment, never a checkbox, so it cannot be confused with the machine-checkable boxes
   an agent legitimately ticks.

## Consequences

- The gate is now enforced at *merge* time, not at implementation time. An agent that ignores
  rule 1 still writes code before approval; what it cannot do is land it. That is a real
  narrowing of the failure, not a closure of it.
- **Check 5 proves the decision was recorded, never that a human made it.** That residue is
  irreducible while agents hold the owner's token, and it is the honest limit of this design.
  Closing it would need a signal outside GitHub comments — a deployment environment approval,
  or a label only a protected ruleset lets the human apply. Deliberately not built: it is real
  machinery guarding a failure mode that requires an agent to actively lie.
- Any Story approved before this ADR carries the old bare-word form and will fail check 5 until
  re-marked. There is exactly one such Story, #5.
- The rule is stated in three places — `AGENTS.md` rule 1, `docs/agents/issue-tracker.md`, and
  the Story issue template — because an agent that reads only one of them must still get it
  right.
