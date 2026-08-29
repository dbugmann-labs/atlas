# Parking lot

Product ideas captured during scaffolding, deliberately **not acted on**.

**Live as of 2026-08-24**, when the development system was signed off and product definition
began. This is now the holding pen between "someone said it" and "it is agreed": an idea lands
here in one line and the conversation moves on, rather than becoming code by momentum.

An entry leaves this file in exactly one direction — promoted into an Epic or Feature issue,
then deleted from here. Nothing is implemented from this file. An entry that has sat here
through two rounds of Epic intake is telling you something; either promote it or delete it.

## Entries

Surfaced 2026-08-28, in the first product-definition conversation.

The entries describing a day screen, its ticks and the schedule behind them were promoted into
`EPIC: Daily commitments` (#17) on 2026-08-28 and removed. What remains below is either out of
that Epic's scope or still an open question inside it. Nothing here is agreed.

### The seven things being tracked

- weight — a number entered once a day, looked at as a line over months
- protein — a number entered several times a day that accumulates rather than overwrites
- mood — a number set by a single tap, once a day
- journal — two or three sentences a day, deliberately not an essay
- supplements — a daily tick
- sport — a tick tied to a fixed day of the week ("Tuesday is Gym")
- a habit phrased as a negative, where ticking it records that the thing was *not* done

### Shape

- the day-one list, in the owner's words: gym Mon/Wed/Sat · run Tue/Thu/Sun · finances every 25th ·
  reading 3x a week · supplements and habits daily · journaling daily · contact lenses every 14 days ·
  water plants every 3rd day
- four rule shapes cover all of it: a set of weekdays, every N days, a day of the month, N times a week
- journaling appears on the day-one list as a tick, not as written text
- speculative and unclaimed by anything real: "once a month" unanchored, and a rule bounded to a
  stretch of weeks — invented while answering a question about rules, not drawn from the week
- reading — an obligation of three times a week, any nights, open until the week turns over
- unticked items stay visible into the evening rather than being silently missed
- a detail page per area, visited deliberately and rarely, to look rather than to enter
- a weight graph over months
- nothing congratulates you; no streaks, no gamification — rows just go quiet
- the five-percent principle: a thin version of seven things, not a deep version of one
- an iPhone app — every one of the five daily visits happens with a phone in hand, never a laptop
- carrying your history to a new phone; restore, not live sync between devices

### Open, unresolved on purpose

- what a phone app means for a repo built around a Node CLI — owed an ADR, not yet decided
- week turnover is undefined: does an unfinished two-of-three vanish, or get recorded as a miss?
- how far back the past stays writable, and what happens to days before a thing existed
- "every N days" needs an anchor: N days from a fixed start, or N days from the last tick? the second
  makes a late tick shift everything after it, which is a different mechanism from the calendar rules
- whether "every day" is a set of seven weekdays or an interval of one — two rules can express it
- supplements and habits were named as one line; a habit phrased as a negative is not a supplement
- has not been checked against what already exists; the consolidated small app may already be shipping
