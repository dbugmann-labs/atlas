import { describe, expect, it } from 'vitest'
import { archivedChangeId } from '../scripts/lib/ci.ts'

// The merge-time checks locate a change folder by name. `/opsx:archive` writes the archived
// folder with a date prefix (docs/process.md §5) while the change id never carries one, so
// every check that looks a change up has to relate the two. Getting this wrong fails a story
// PR at the archive commit — the last commit on the branch — which is the worst place to
// discover it, so the rule is pinned here rather than left to the three call sites.
describe('archivedChangeId', () => {
  it('strips the date prefix /opsx:archive writes', () => {
    expect(archivedChangeId('2026-08-23-add-version-command')).toBe('add-version-command')
  })

  it('leaves an undated folder name alone', () => {
    expect(archivedChangeId('add-version-command')).toBe('add-version-command')
  })

  it('strips only the leading date, not a date inside the change id', () => {
    expect(archivedChangeId('2026-08-23-migrate-2025-01-01-fixtures')).toBe('migrate-2025-01-01-fixtures')
  })

  it('ignores a prefix that is not a full YYYY-MM-DD date', () => {
    expect(archivedChangeId('2026-1-2-add-version-command')).toBe('2026-1-2-add-version-command')
  })
})
