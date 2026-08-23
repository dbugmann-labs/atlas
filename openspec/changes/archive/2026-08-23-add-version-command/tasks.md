## 1. The seam

- [x] 1.1 Create `src/cli.ts` with the `CliResult` type and an exported `runCli(argv: string[])`
  that throws `not implemented`; verify `pnpm run typecheck` exits 0. The seam exists before any
  test does, per `design.md`.

## 2. Scenarios — one red-green cycle each, in delta order

Each task below takes exactly one `#### Scenario:` from `specs/cli-version/spec.md`, writes one
acceptance test in `tests/cli-version.test.ts` whose title is that scenario title verbatim,
watches it fail, then makes it pass. Never write two of these tests before the first one is
green (`AGENTS.md` rule 3).

- [x] 2.1 `version prints the package version and exits zero` — verify with `pnpm run test`: the
  named test is red before the implementation and green after, and it reads the expected value
  from `package.json` rather than hard-coding it.
- [x] 2.2 `an unknown subcommand is rejected` — verify with `pnpm run test`: red then green, and
  test 2.1 still passes.
- [x] 2.3 `no subcommand prints usage and exits non-zero` — verify with `pnpm run test`: red then
  green, with the usage line naming `version`.
- [x] 2.4 `version with extra arguments is rejected` — verify with `pnpm run test`: red then
  green, and the diagnostic names the first unexpected argument.

## 3. Executable wrapper

- [x] 3.1 Add `src/bin.ts`: slice `process.argv`, call `runCli`, write `stdout` and `stderr` to
  their streams, set `process.exitCode`. No conditionals. Verify by hand:
  `node src/bin.ts version` prints the version on stdout and exits 0; `node src/bin.ts nope`
  prints nothing on stdout and exits non-zero (`node src/bin.ts nope > /dev/null` shows the
  diagnostic and `echo $?` is non-zero).
- [x] 3.2 Add the `bin` entry for `atlas` to `package.json` pointing at `src/bin.ts`; verify the
  field resolves to a runnable executable —
  `node "$(node -p "require('./package.json').bin.atlas")" version` prints the same string as
  step 3.1. Do not verify with `pnpm exec atlas`: pnpm links only the bins of dependencies, and
  the workspace root is not its own dependency, so that name never resolves here. The entry is
  the record of which file is the executable.

## 4. Gates

- [x] 4.1 `pnpm run verify` exits 0 (lint, typecheck, test).
- [x] 4.2 `pnpm exec openspec validate add-version-command --strict` exits 0, and every
  `#### Scenario:` in the delta has a test of the same name — confirm with
  `pnpm run check:scenarios`.
- [x] 4.3 `/code-review` reports nothing unresolved on either axis (G7).

Archiving is not a task here. It is the last commit on this branch, run by the janitor after
G7, and `openspec validate --archived` requires every box above to be ticked before it.
