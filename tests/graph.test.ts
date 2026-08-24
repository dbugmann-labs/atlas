import { describe, expect, it } from 'vitest'
import { renderGraph, type GraphIssue } from '../scripts/generate-graph.ts'

// `docs/graph.mmd` is regenerated at Stage 9 of every Story and committed. Two properties make
// that safe to do repeatedly: the output is deterministic, so an unchanged tracker produces an
// empty diff, and a hostile issue title cannot break the diagram for every other issue. Both
// are easy to lose in a later edit, so they are pinned here rather than left to review.

function issue(over: Partial<GraphIssue> & Pick<GraphIssue, 'number'>): GraphIssue {
  return { title: `issue ${over.number}`, state: 'OPEN', type: 'Task', parent: null, ...over }
}

const TREE: GraphIssue[] = [
  issue({ number: 3, title: 'EPIC: Command-line surface', type: 'Epic' }),
  issue({ number: 4, title: 'FEAT: cli-version', type: 'Feature', parent: 3 }),
  issue({ number: 5, title: 'add-version-command', type: 'Task', state: 'CLOSED', parent: 4 }),
]

describe('renderGraph', () => {
  it('renders the hierarchy as parent-to-child edges', () => {
    const out = renderGraph(TREE)
    expect(out).toContain('  I3 --> I4')
    expect(out).toContain('  I4 --> I5')
  })

  it('names each node by its level and strips the redundant title prefix', () => {
    const out = renderGraph(TREE)
    expect(out).toContain('I3["Epic 3 — Command-line surface"]')
    expect(out).toContain('I4["Feature 4 — cli-version"]')
    expect(out).toContain('I5["Story 5 — add-version-command"]')
  })

  it('marks a closed issue done without discarding its level styling', () => {
    expect(renderGraph(TREE)).toContain('  class I5 story,done')
    // I3 is the control: open, with an open child, so it carries its level class and nothing else.
    expect(renderGraph(TREE)).toContain('  class I3 epic\n')
  })

  it('is deterministic regardless of the order issues arrive in', () => {
    expect(renderGraph([...TREE].reverse())).toBe(renderGraph(TREE))
  })

  it('excludes issues with no pipeline type, and any edge into them', () => {
    const out = renderGraph([...TREE, issue({ number: 7, title: 'a bug report', type: null })])
    expect(out).not.toContain('I7')
    expect(out).toBe(renderGraph(TREE))
  })

  // A Feature or Story reaches the graph only through its sub-issue edge. If someone writes
  // "Parent: #3" in the body instead of attaching it, the issue silently vanishes from the
  // tree — so an unparented one is drawn in red rather than quietly rendered as a root.
  it('flags a typed issue whose parent is missing, but not an Epic', () => {
    const out = renderGraph([
      issue({ number: 3, type: 'Epic' }),
      issue({ number: 9, type: 'Feature', parent: null }),
      issue({ number: 11, type: 'Task', parent: 404 }),
    ])
    expect(out).toContain('  class I3 epic\n')
    expect(out).toContain('  class I9 feature,orphan')
    expect(out).toContain('  class I11 story,orphan')
  })

  // `open` has exactly one meaning in this tracker: there is outstanding work here. A parent
  // whose Stories have all merged is stale state, and the graph is the only place that is
  // visible without opening each issue — so the rule is drawn rather than remembered.
  it('marks an open parent whose children have all closed as ready to close', () => {
    expect(renderGraph(TREE)).toContain('  class I4 feature,settled')
  })

  it('does not mark a parent settled while any child is still open', () => {
    const open = [...TREE.slice(0, 2), { ...TREE[2]!, state: 'OPEN' as const }]
    expect(renderGraph(open)).toContain('  class I4 feature\n')
  })

  // Settling cascades one level per run: an Epic is only at rest once its Features close,
  // which cannot happen in the same pass that closes the Stories beneath them.
  it('does not settle a grandparent whose child is settled but still open', () => {
    expect(renderGraph(TREE)).toContain('  class I3 epic\n')
  })

  it('never marks a closed issue settled, and never marks a leaf settled', () => {
    const out = renderGraph(TREE)
    expect(out).toContain('  class I5 story,done')
    expect(out).not.toContain('done,settled')
  })

  it('escapes the two characters that would otherwise break the diagram', () => {
    const out = renderGraph([issue({ number: 1, type: 'Epic', title: 'fix "quoting" in #4' })])
    expect(out).toContain('I1["Epic 1 — fix #quot;quoting#quot; in #35;4"]')
  })

  it('emits a valid diagram when no pipeline issue exists yet', () => {
    const out = renderGraph([])
    expect(out).toContain('flowchart TD')
    expect(out).toContain('No Epic, Feature or Story issues yet')
  })

  it('carries no timestamp, so regeneration of an unchanged tracker is an empty diff', () => {
    expect(renderGraph(TREE)).not.toMatch(/\d{4}-\d{2}-\d{2}|\d{2}:\d{2}/)
  })
})
