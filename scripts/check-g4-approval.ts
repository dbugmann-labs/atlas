/**
 * CI check 5 — G4 approval recorded (docs/process.md §4, ADR-0014).
 *
 * G4 is the gate the whole requirement set rests on: no implementation before a human has
 * decided the proposal is right. A human need not type the comment — they may tell an agent
 * "approved" and have it relay — but the decision must be theirs, and it must be recorded on
 * the Story issue before the work merges.
 *
 * The marker is the exact line `G4: approved`, not the bare word. A bare "approved" appears
 * incidentally in ordinary prose, so any agent writing "waiting for the approved comment"
 * would forge a gate read by grep. The marker exists to be unforgeable by accident.
 *
 * This cannot prove a human made the decision — nothing can, since agents act through the
 * owner's token. It proves the decision was recorded, which turns a silent omission into a
 * red build.
 */
import { execFileSync } from 'node:child_process'
import { currentBranch, fail, parseBranch, pass, repoSlug, skip } from './lib/ci.ts'

const CHECK = 'G4 approval recorded'
const MARKER = /^G4: approved\b/m

const branch = parseBranch(currentBranch())
if (branch.kind !== 'story') {
  skip(CHECK, `branch "${branch.raw}" is not a story branch`)
  process.exit(0)
}

const repo = repoSlug()
let comments: { body: string; user: { login: string }; created_at: string }[]
try {
  const raw = execFileSync(
    'gh',
    ['api', '--paginate', `/repos/${repo}/issues/${branch.issue}/comments`],
    { encoding: 'utf8' },
  )
  comments = JSON.parse(raw) as typeof comments
} catch (err) {
  fail(CHECK, [
    `Could not read comments on issue #${branch.issue}.`,
    'CI needs `issues: read` permission and GH_TOKEN in the environment.',
    String(err),
  ])
}

const approval = comments.find((c) => MARKER.test(c.body ?? ''))

if (approval === undefined) {
  fail(CHECK, [
    `Issue #${branch.issue} carries no G4 approval.`,
    '',
    'A human must decide the proposal is right before this merges. Once they have, record it:',
    '',
    `  gh issue comment ${branch.issue} --body 'G4: approved — authorised by <name>'`,
    '',
    'Never write that marker on a Story issue for any other reason, and never originate the',
    'decision yourself. Relaying a human decision is fine; inventing one is forging the gate.',
  ])
}

pass(CHECK, `#${branch.issue} approved by ${approval.user.login} at ${approval.created_at}`)
