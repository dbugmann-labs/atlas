/**
 * CI check 6 — commit hygiene (AGENTS.md hard rule 7).
 *
 * Commits and PRs never mention tooling or carry attribution trailers. The history is a
 * professional record of the author's own work, and this repository is public.
 *
 * Rule 7 otherwise has no backstop at all: it relies entirely on each agent overriding its
 * harness's default trailer behaviour, and one that forgets leaves a permanent mark that only
 * a force-push can remove. This check is the cheap mechanical version.
 */
import { changedCommitMessages, currentBranch, fail, parseBranch, pass, skip } from './lib/ci.ts'

const CHECK = 'commit hygiene'

const FORBIDDEN: { pattern: RegExp; what: string }[] = [
  { pattern: /^\s*co-authored-by:.*\b(claude|anthropic|copilot|cursor)\b/im, what: 'attribution trailer naming a tool' },
  { pattern: /^\s*claude-session:/im, what: 'session-link trailer' },
  { pattern: /generated with \[?claude code/i, what: '"generated with" footer' },
  { pattern: /claude\.ai\/code/i, what: 'session URL' },
  { pattern: /\u{1F916}/u, what: 'robot emoji' },
]

const branch = parseBranch(currentBranch())
if (branch.kind === 'other') {
  skip(CHECK, `branch "${branch.raw}" is neither story/ nor chore/`)
  process.exit(0)
}

const commits = changedCommitMessages()
const problems: string[] = []

for (const { sha, message } of commits) {
  for (const { pattern, what } of FORBIDDEN) {
    const hit = pattern.exec(message)
    if (hit) problems.push(`${sha.slice(0, 8)} — ${what}: ${hit[0].trim().slice(0, 70)}`)
  }
}

if (problems.length > 0) {
  fail(CHECK, [
    'Commit messages must not mention tooling or carry attribution trailers (rule 7).',
    '',
    ...problems,
    '',
    'Rewrite them before merging: `git rebase -i` and drop the offending lines. Once this',
    'lands on main only a force-push can remove it.',
  ])
}

pass(CHECK, `${commits.length} commit(s) clean`)
