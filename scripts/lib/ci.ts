/**
 * Shared helpers for the three bespoke PR checks described in docs/process.md §7.
 *
 * These run in CI on pull requests and are also runnable locally on a story or
 * chore branch. They deliberately share this module so that "what is a story
 * branch" and "where does a change folder live" have exactly one definition.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

/** True inside GitHub Actions. Several checks are advisory locally and binding at PR time. */
export const inCI = process.env['GITHUB_ACTIONS'] === 'true' || process.env['CI'] === 'true'

export type Branch =
  | { kind: 'story'; issue: number; changeId: string; raw: string }
  | { kind: 'chore'; raw: string }
  | { kind: 'other'; raw: string }

export function git(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

/**
 * On a pull_request event HEAD is a detached merge commit, so the branch name
 * has to come from the environment. Locally it comes from git.
 */
/**
 * Pull `owner/repo` out of an origin remote URL, in either the SSH or HTTPS form.
 * Split from `repoSlug` so the parsing is testable without a git remote.
 */
export function parseRepoSlug(remoteUrl: string): string | null {
  const match = /[:/]([^/:]+\/[^/]+?)(?:\.git)?$/.exec(remoteUrl.trim())
  const slug = match?.[1]
  return slug === undefined ? null : slug
}

/**
 * The `owner/repo` these checks run against. GitHub Actions sets
 * GITHUB_REPOSITORY; locally it comes from the origin remote rather than a
 * constant, so a repository created from this one checks itself instead of
 * silently checking its ancestor.
 */
export function repoSlug(): string {
  const fromEnv = process.env['GITHUB_REPOSITORY']
  if (fromEnv !== undefined && fromEnv !== '') return fromEnv
  const slug = parseRepoSlug(git(['remote', 'get-url', 'origin']))
  if (slug === null) {
    throw new Error('Cannot derive owner/repo from the origin remote; set GITHUB_REPOSITORY.')
  }
  return slug
}

export function currentBranch(): string {
  const fromEnv = process.env['GITHUB_HEAD_REF']
  if (fromEnv) return fromEnv
  return git(['rev-parse', '--abbrev-ref', 'HEAD'])
}

export function parseBranch(raw: string): Branch {
  const story = /^story\/(\d+)-(.+)$/.exec(raw)
  if (story) return { kind: 'story', issue: Number(story[1]), changeId: story[2]!, raw }
  if (raw.startsWith('chore/')) return { kind: 'chore', raw }
  return { kind: 'other', raw }
}

/** Files changed between the merge-base with the target branch and HEAD. */
export function changedFiles(): string[] {
  const base = process.env['GITHUB_BASE_REF'] ?? 'main'
  const remote = `origin/${base}`
  const ref = existsSync('.git') && refExists(remote) ? remote : base
  const mergeBase = git(['merge-base', ref, 'HEAD'])
  const out = git(['diff', '--name-only', mergeBase, 'HEAD'])
  return out === '' ? [] : out.split('\n')
}

function refExists(ref: string): boolean {
  try {
    git(['rev-parse', '--verify', '--quiet', ref])
    return true
  } catch {
    return false
  }
}

/** Commit sha + full message for each commit this branch adds over its base. */
export function changedCommitMessages(): { sha: string; message: string }[] {
  const base = process.env['GITHUB_BASE_REF'] ?? 'main'
  const remote = `origin/${base}`
  const ref = refExists(remote) ? remote : base
  const mergeBase = git(['merge-base', ref, 'HEAD'])
  const shas = git(['rev-list', `${mergeBase}..HEAD`])
  if (shas === '') return []
  return shas.split('\n').map((sha) => ({ sha, message: git(['log', '-1', '--format=%B', sha]) }))
}

export type ChangeLocation = { changeId: string; dir: string; archived: boolean }

/**
 * The date prefix `/opsx:archive` puts on an archived folder, e.g.
 * `2026-08-21-add-version-command`. The form is OpenSpec's, recorded in docs/process.md §5;
 * the change id itself never carries a date, so the two have to be related by stripping it.
 */
const ARCHIVE_DATE_PREFIX = /^\d{4}-\d{2}-\d{2}-/

/** The change id inside an archive folder name, dated or not. */
export function archivedChangeId(folder: string): string {
  return folder.replace(ARCHIVE_DATE_PREFIX, '')
}

export function locateChange(changeId: string): ChangeLocation | null {
  const archiveRoot = path.join('openspec', 'changes', 'archive')
  if (existsSync(archiveRoot)) {
    for (const entry of readdirSync(archiveRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || archivedChangeId(entry.name) !== changeId) continue
      return { changeId, dir: path.join(archiveRoot, entry.name), archived: true }
    }
  }
  const active = path.join('openspec', 'changes', changeId)
  if (existsSync(active)) return { changeId, dir: active, archived: false }
  return null
}

/** Capability slugs a change's delta claims, i.e. the dirs under <change>/specs/. */
export function deltaCapabilities(loc: ChangeLocation): string[] {
  const specsDir = path.join(loc.dir, 'specs')
  if (!existsSync(specsDir)) return []
  return readdirSync(specsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
}

/**
 * Splits a path under openspec/specs/ into its capability, or null when the
 * path sits at the root of that directory (README.md and the like).
 */
export function specCapability(file: string): string | null {
  const rest = file.split('/').slice(2)
  return rest.length >= 2 ? rest[0]! : null
}

export function note(check: string, detail: string): void {
  console.log(`i ${check} — ${detail}`)
}

export function fail(check: string, lines: string[]): never {
  console.error(`✗ ${check}\n`)
  for (const l of lines) console.error(`  ${l}`)
  console.error('')
  process.exit(1)
}

export function pass(check: string, detail: string): void {
  console.log(`✓ ${check} — ${detail}`)
}

export function skip(check: string, why: string): void {
  console.log(`– ${check} skipped — ${why}`)
}
