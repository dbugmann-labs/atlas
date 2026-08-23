import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { runCli } from '../src/cli.ts'

describe('cli-version', () => {
  it('version prints the package version and exits zero', () => {
    const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
      version: string
    }

    const result = runCli(['version'])

    expect(result.stdout).toBe(`${manifest.version}\n`)
    expect(result.stderr).toBe('')
    expect(result.exitCode).toBe(0)
  })

  it('an unknown subcommand is rejected', () => {
    const result = runCli(['nope'])

    expect(result.stdout).toBe('')
    expect(result.stderr).toContain('nope')
    expect(result.exitCode).not.toBe(0)
  })

  it('no subcommand prints usage and exits non-zero', () => {
    const result = runCli([])

    expect(result.stdout).toBe('')
    expect(result.stderr).toContain('version')
    expect(result.stderr).toMatch(/usage/i)
    expect(result.exitCode).not.toBe(0)
  })

  it('version with extra arguments is rejected', () => {
    const result = runCli(['version', 'first-extra', 'second-extra'])

    expect(result.stdout).toBe('')
    expect(result.stderr).toContain('first-extra')
    expect(result.stderr).not.toContain('second-extra')
    expect(result.exitCode).not.toBe(0)
  })
})
