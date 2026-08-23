/**
 * CI check 2 — spec-diff containment (docs/process.md §7, ADR-0004).
 *
 * Every file changed under openspec/specs/ must belong to a capability the
 * change's delta claims. This is what makes the source of truth safe: it blocks
 * hand-edits and blocks an archive that reaches into a capability the proposal
 * you approved at G4 never mentioned.
 *
 * It cannot prove the diff is byte-for-byte what /opsx:archive would produce.
 * That weaker guarantee is the price of archiving inside the story PR, and is
 * accepted deliberately in ADR-0004.
 */
import { changedFiles, currentBranch, deltaCapabilities, fail, locateChange, parseBranch, pass, skip, specCapability } from './lib/ci.ts'

const CHECK = 'spec-diff containment'
const branch = parseBranch(currentBranch())

if (branch.kind === 'other') {
  skip(CHECK, `branch "${branch.raw}" is neither story/ nor chore/`)
  process.exit(0)
}

const touched = changedFiles().filter((f) => f.startsWith('openspec/specs/'))

if (branch.kind === 'chore') {
  const capabilityEdits = touched.filter((f) => specCapability(f) !== null)
  if (capabilityEdits.length > 0) {
    fail(CHECK, [
      'A chore/ branch may not change any capability spec.',
      'Behaviour change needs a Story. See docs/process.md §5.',
      '',
      ...capabilityEdits.map((f) => `changed: ${f}`),
    ])
  }
  pass(CHECK, 'chore branch touches no capability spec')
  process.exit(0)
}

const loc = locateChange(branch.changeId)
if (loc === null) {
  fail(CHECK, [
    `No change folder for "${branch.changeId}".`,
    `Looked in openspec/changes/${branch.changeId}/ and openspec/changes/archive/<date>-${branch.changeId}/.`,
    'A story branch must carry the change folder its name refers to.',
  ])
}

const claimed = new Set(deltaCapabilities(loc))
const problems: string[] = []

for (const file of touched) {
  const capability = specCapability(file)
  if (capability === null) {
    problems.push(`${file} — sits at the root of openspec/specs/; a story branch may not edit it`)
  } else if (!claimed.has(capability)) {
    problems.push(`${file} — capability "${capability}" is not claimed by the delta`)
  }
}

if (problems.length > 0) {
  fail(CHECK, [
    `Change "${branch.changeId}" claims: ${claimed.size > 0 ? [...claimed].join(', ') : '(nothing)'}`,
    `Delta read from ${loc.dir}/specs/`,
    '',
    ...problems,
    '',
    'Either the delta is missing a capability, or openspec/specs/ was edited by',
    'something other than /opsx:archive. Never hand-edit it (AGENTS.md rule 2).',
  ])
}

pass(CHECK, touched.length === 0 ? 'no spec files changed' : `${touched.length} file(s), all within {${[...claimed].join(', ')}}`)
