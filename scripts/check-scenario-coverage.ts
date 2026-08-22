/**
 * CI check 4 — scenario coverage (docs/process.md §7 and §8).
 *
 * Every "#### Scenario:" in the change's delta must have an acceptance test
 * whose title matches it verbatim. Scenarios drive tests; they never generate
 * them. This runs only at PR time, when the change is finished, so it can never
 * push anyone into transcribing all scenarios into tests up front — which is
 * the horizontal slicing the tdd skill rightly calls an anti-pattern.
 *
 * Test titles come from `vitest list`, not from grepping source, so nesting and
 * template literals are read the way vitest itself reads them. Matching is on
 * the leaf title, which lets acceptance tests sit inside a describe() block.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { currentBranch, deltaCapabilities, fail, locateChange, parseBranch, pass, skip } from './lib/ci.ts'

const CHECK = 'scenario coverage'
const branch = parseBranch(currentBranch())

if (branch.kind !== 'story') {
  skip(CHECK, `branch "${branch.raw}" is not a story branch`)
  process.exit(0)
}

const loc = locateChange(branch.changeId)
if (loc === null) {
  fail(CHECK, [`No change folder for "${branch.changeId}".`])
}

type Scenario = { title: string; source: string }
const scenarios: Scenario[] = []

for (const capability of deltaCapabilities(loc)) {
  const dir = path.join(loc.dir, 'specs', capability)
  for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue
    const file = path.join(entry.parentPath, entry.name)
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = /^####\s+Scenario:\s*(.+?)\s*$/.exec(line)
      if (m) scenarios.push({ title: m[1]!, source: file })
    }
  }
}

if (scenarios.length === 0) {
  skip(CHECK, `delta for "${branch.changeId}" declares no scenarios`)
  process.exit(0)
}

const tmp = mkdtempSync(path.join(tmpdir(), 'atlas-scenarios-'))
const out = path.join(tmp, 'tests.json')
let listed: { name: string; file: string }[]
try {
  execFileSync('pnpm', ['exec', 'vitest', 'list', `--json=${out}`], { stdio: 'ignore' })
  listed = JSON.parse(readFileSync(out, 'utf8')) as { name: string; file: string }[]
} finally {
  rmSync(tmp, { recursive: true, force: true })
}

const leafTitles = new Set(listed.map((t) => t.name.split(' > ').at(-1)!))
const missing = scenarios.filter((s) => !leafTitles.has(s.title))

if (missing.length > 0) {
  fail(CHECK, [
    `${missing.length} of ${scenarios.length} scenario(s) have no test with a matching title:`,
    '',
    ...missing.map((s) => `missing: "${s.title}"\n    from: ${s.source}`),
    '',
    'An acceptance test title must equal its scenario title verbatim.',
    `Tests seen: ${listed.length}`,
  ])
}

pass(CHECK, `all ${scenarios.length} scenario(s) have a matching test`)
