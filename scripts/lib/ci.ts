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

export type ChangeLocation = { changeId: string; dir: string; archived: boolean }

export function locateChange(changeId: string): ChangeLocation | null {
  const archived = path.join('openspec', 'changes', 'archive', changeId)
  if (existsSync(archived)) return { changeId, dir: archived, archived: true }
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
