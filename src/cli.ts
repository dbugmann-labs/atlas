import { readFileSync } from 'node:fs'

export type CliResult = {
  stdout: string
  stderr: string
  exitCode: number
}

const USAGE = 'usage: atlas version\n'

export function runCli(argv: string[]): CliResult {
  const [subcommand, ...rest] = argv

  if (subcommand === undefined) {
    return { stdout: '', stderr: USAGE, exitCode: 1 }
  }

  if (subcommand !== 'version') {
    return { stdout: '', stderr: `unknown subcommand: ${subcommand}\n`, exitCode: 1 }
  }

  if (rest.length > 0) {
    const [extra = ''] = rest
    return { stdout: '', stderr: `unexpected argument: ${extra}\n`, exitCode: 1 }
  }

  return { stdout: `${readPackageVersion()}\n`, stderr: '', exitCode: 0 }
}

function readPackageVersion(): string {
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
    version?: unknown
  }

  if (typeof manifest.version !== 'string') {
    throw new Error('package.json has no string "version" field')
  }

  return manifest.version
}
