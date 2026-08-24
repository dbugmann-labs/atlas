/**
 * Regenerates `docs/graph.mmd` — a read-only projection of the Epic → Feature → Story
 * hierarchy held in GitHub Issues (docs/adr/0002-systems-of-record.md, ADR-0012).
 *
 * The graph is a projection and never an input. Nothing reads it back; editing it by hand
 * changes nothing and is overwritten on the next run. It exists so a human can see the shape
 * of the tracker without clicking through it.
 *
 * **Source: the GraphQL API, not `gh issue list --json`.** That command exposes neither the
 * issue type nor the sub-issue edge (checked against gh 2.83.0), so it cannot produce this
 * file. One GraphQL query returns both, excludes pull requests, and costs a single request.
 *
 * **Deliberately not a CI check.** Issue state changes without any commit, so a staleness
 * check would redden `main` whenever somebody opened an issue. The file is a snapshot, taken
 * on demand at Stage 9. Its output is deterministic and carries no timestamp, so regenerating
 * an unchanged tracker produces an empty diff.
 */
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

export type GraphIssue = {
  number: number
  title: string
  state: 'OPEN' | 'CLOSED'
  /** The org issue type: `Epic`, `Feature`, `Task`, or null for anything outside the pipeline. */
  type: string | null
  parent: number | null
}

/** GitHub's issue-type names, mapped to the vocabulary AGENTS.md uses. */
const LEVELS = new Map([
  ['Epic', { label: 'Epic', css: 'epic' }],
  ['Feature', { label: 'Feature', css: 'feature' }],
  ['Task', { label: 'Story', css: 'story' }],
])

const QUERY = `
query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    issues(first: 100, states: [OPEN, CLOSED], orderBy: { field: CREATED_AT, direction: ASC }) {
      pageInfo { hasNextPage }
      nodes {
        number
        title
        state
        issueType { name }
        parent { number }
      }
    }
  }
}`

/**
 * Mermaid reads `#` as the start of an entity code and `"` as the end of a label, so both have
 * to be escaped or a single issue title breaks the whole diagram.
 */
function escapeLabel(text: string): string {
  return text.replaceAll('#', '#35;').replaceAll('"', '#quot;')
}

/** The level prefix is redundant once the node says "Epic" — `EPIC: Foo` would read `Epic 3 — EPIC: Foo`. */
function stripPrefix(title: string): string {
  return title.replace(/^(EPIC|FEAT|FEATURE|STORY):\s*/i, '')
}

export function renderGraph(issues: GraphIssue[]): string {
  const header = [
    '%% GENERATED FILE — do not edit. Run `pnpm run graph` to refresh.',
    '%% A read-only projection of the Epic → Feature → Story hierarchy in GitHub Issues.',
    '%% GitHub owns this state; this file only shows it (docs/adr/0002-systems-of-record.md).',
    '%% A dashed red border means the issue is typed but has no parent — a broken tracker edge.',
    '',
  ]

  const nodes = issues
    .filter((i) => i.type !== null && LEVELS.has(i.type))
    .sort((a, b) => a.number - b.number)

  if (nodes.length === 0) {
    return [...header, 'flowchart TD', '  none["No Epic, Feature or Story issues yet"]', ''].join('\n')
  }

  const present = new Set(nodes.map((i) => i.number))
  const lines = [...header, 'flowchart TD']

  lines.push(
    '  classDef epic fill:#dbeafe,stroke:#1d4ed8,color:#0b1220',
    '  classDef feature fill:#e0f2fe,stroke:#0369a1,color:#0b1220',
    '  classDef story fill:#f1f5f9,stroke:#475569,color:#0b1220',
    '  classDef done stroke:#15803d,stroke-width:2px',
    '  classDef orphan stroke:#b91c1c,stroke-width:3px,stroke-dasharray:4 3',
    '',
  )

  for (const issue of nodes) {
    const level = LEVELS.get(issue.type!)!
    const label = escapeLabel(`${level.label} ${issue.number} — ${stripPrefix(issue.title)}`)
    lines.push(`  I${issue.number}["${label}"]`)
  }

  const edges = nodes
    .filter((i) => i.parent !== null && present.has(i.parent))
    .map((i) => `  I${i.parent} --> I${i.number}`)
    .sort()

  if (edges.length > 0) lines.push('', ...edges)

  lines.push('')
  for (const issue of nodes) {
    const classes = [LEVELS.get(issue.type!)!.css]
    if (issue.state === 'CLOSED') classes.push('done')
    // An Epic is a root by definition; a Feature or Story without a reachable parent is not.
    if (issue.type !== 'Epic' && (issue.parent === null || !present.has(issue.parent))) {
      classes.push('orphan')
    }
    lines.push(`  class I${issue.number} ${classes.join(',')}`)
  }

  lines.push('')
  return lines.join('\n')
}

export function fetchIssues(repo: string): GraphIssue[] {
  const [owner, name] = repo.split('/')
  const raw = execFileSync(
    'gh',
    ['api', 'graphql', '-f', `query=${QUERY}`, '-F', `owner=${owner}`, '-F', `name=${name}`],
    { encoding: 'utf8' },
  )

  const parsed = JSON.parse(raw) as {
    data: {
      repository: {
        issues: {
          pageInfo: { hasNextPage: boolean }
          nodes: {
            number: number
            title: string
            state: 'OPEN' | 'CLOSED'
            issueType: { name: string } | null
            parent: { number: number } | null
          }[]
        }
      }
    }
  }

  const { pageInfo, nodes } = parsed.data.repository.issues
  if (pageInfo.hasNextPage) {
    // Rule 5: stop rather than improvise. A silently truncated graph is worse than none.
    throw new Error(
      `${repo} has more than 100 issues; this generator does not paginate yet. ` +
        'Add pagination to scripts/generate-graph.ts before trusting docs/graph.mmd again.',
    )
  }

  return nodes.map((n) => ({
    number: n.number,
    title: n.title,
    state: n.state,
    type: n.issueType?.name ?? null,
    parent: n.parent?.number ?? null,
  }))
}

if (import.meta.filename === process.argv[1]) {
  const repo = process.env['GITHUB_REPOSITORY'] ?? 'dbugmann-labs/atlas'
  const issues = fetchIssues(repo)
  const out = new URL('../docs/graph.mmd', import.meta.url)
  writeFileSync(out, renderGraph(issues), 'utf8')
  const counted = issues.filter((i) => i.type !== null && LEVELS.has(i.type)).length
  console.log(`✓ docs/graph.mmd — ${counted} pipeline issue(s) from ${repo}`)
}
