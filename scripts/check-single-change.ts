/**
 * CI check 3 — the single-change rule (docs/process.md §7).
 *
 * One Story = one change = one branch = one PR. A story PR must archive exactly
 * one change — its own — and leave no active change folder behind. This is the
 * check that keeps parallel stories from entangling, and it is why the branch
 * name embeds the change id.
 */
import { existsSync } from 'node:fs'
import { archivedChangeId, changedFiles, currentBranch, fail, inCI, locateChange, note, parseBranch, pass, skip } from './lib/ci.ts'

const CHECK = 'single-change rule'
const branch = parseBranch(currentBranch())

if (branch.kind === 'other') {
  skip(CHECK, `branch "${branch.raw}" is neither story/ nor chore/`)
  process.exit(0)
}

const archived = new Set<string>()
const active = new Set<string>()

for (const file of changedFiles()) {
  if (!file.startsWith('openspec/changes/')) continue
  const rest = file.split('/').slice(2)
  if (rest[0] === 'archive') {
    if (rest.length >= 3) archived.add(archivedChangeId(rest[1]!))
  } else if (rest.length >= 2) {
    active.add(rest[0]!)
  }
}

const all = new Set([...archived, ...active])

if (all.size > 1) {
  fail(CHECK, [
    `This PR touches ${all.size} changes: ${[...all].sort().join(', ')}`,
    'Split it. One Story = one change = one branch = one PR.',
  ])
}

if (branch.kind === 'chore') {
  pass(CHECK, all.size === 0 ? 'chore branch touches no change folder' : `chore branch touches only ${[...all][0]}`)
  process.exit(0)
}

const { changeId } = branch

// Before Stage 8 the change is still active and nothing has been archived yet. That is the
// normal state for most of a Story's life, so locally this reports rather than fails. In CI
// the PR is claiming to be finished, so it binds.
const located = locateChange(changeId)
if (!inCI && located !== null && !located.archived) {
  note(CHECK, `"${changeId}" is still active — archive runs at Stage 8; this check binds at PR time`)
  process.exit(0)
}

if (!archived.has(changeId)) {
  fail(CHECK, [
    `Nothing was archived under openspec/changes/archive/<date>-${changeId}/.`,
    'Run /opsx:archive as the last commit on this branch — archiving happens in',
    'the story PR, not a follow-up (docs/process.md §4).',
  ])
}

if (all.size === 1 && ![...all].includes(changeId)) {
  fail(CHECK, [`Branch names change "${changeId}" but the diff touches "${[...all][0]}".`])
}

const leftBehind = `openspec/changes/${changeId}`
if (existsSync(leftBehind)) {
  fail(CHECK, [
    `${leftBehind}/ still exists at HEAD.`,
    'The archive step moves the folder; it must not remain as an active change.',
  ])
}

pass(CHECK, `archived exactly one change (${changeId}), nothing left active`)
