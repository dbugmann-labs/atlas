## Context

There is no `src/` yet, so there is no existing seam to attach to and this change creates the
first one. Per ADR-0008 Node 24 runs TypeScript directly: no build step, no bundler, no `tsx`.
`erasableSyntaxOnly` is on, so anything that typechecks also runs. Motivation is in
`proposal.md`; the behaviour contract is in `specs/cli-version/spec.md` and is not restated
here.

## Goals / Non-Goals

**Goals:**

- Name one seam, at the top, that every scenario in the delta can be asserted at.
- Keep the executable wrapper thin enough that its correctness is visible in the diff.

**Non-Goals:**

- An argument-parsing library, subcommand registry, or help system. One subcommand, hand-rolled.
- Publishing to a registry, or a `postinstall` step. The `bin` entry exists so the command can
  be run from the workspace; nothing depends on it being installed globally.

## Decisions

### The seam

**`runCli(argv: string[]): CliResult`, exported from `src/cli.ts`**, where

```ts
type CliResult = { stdout: string; stderr: string; exitCode: number }
```

`argv` is the argument list with the node executable and script path already removed. This is
the single seam for this capability, and every acceptance test in this change attaches to it:
one test per `#### Scenario:`, titled verbatim, calling `runCli` and asserting on the returned
record. `src/bin.ts` is the executable wrapper — it slices `process.argv`, writes the two
strings to the two streams and sets `process.exitCode`. It contains no branching and carries no
acceptance test.

*Alternative — spawn the built executable as a child process.* That is the truest top seam for
a CLI: it would catch a wrapper that writes to the wrong stream. Rejected because it makes
every acceptance test a process launch, and because with no build step the thing spawned would
be the same source the function seam already exercises. The residual risk is the wrapper, and
that risk is stated below.

*Alternative — call a `main()` that writes to `process.stdout` directly, and capture the
streams in the test.* Rejected: it mutates global state, is hostile to parallel test runs, and
makes the assertion about a spy rather than about a value.

### Where the version comes from

`runCli` reads the `version` field of the package manifest resolved relative to its own module
URL, not from an environment variable and not from a constant duplicated in source. A constant
would drift from `package.json` silently, and the spec says the reported version is the one
recorded for the installed package.

The manifest is read through a helper *below* the seam, so it is not part of the contract and
can become a build-time constant later without touching a single acceptance test. The
acceptance test for the happy-path scenario reads `package.json` itself for the expected value
rather than hard-coding `0.0.0`, which would break at the first version bump.

### Refusal is by exit status, not by parsing stderr

Every refusal scenario asserts `exitCode !== 0` and an empty `stdout`. The wording of the
diagnostic is deliberately not fixed by the spec beyond "names the offending argument", so
message wording can improve without a spec change.

## Risks / Trade-offs

- **The wrapper is untested.** `src/bin.ts` could write `stdout` to stderr and every acceptance
  test would still pass. → Keep it to three statements with no conditionals, and let review
  (G7) read it as prose. If it ever grows a branch, the seam moves to the process boundary and
  this decision is revisited.
- **Reading `package.json` at runtime couples the CLI to the file being shipped alongside it.**
  → Acceptable while there is no packaging step; ADR-0008 defers packaging with the platform
  decision.
- **`0.0.0` is not a meaningful version.** The command will honestly report a placeholder. →
  Out of scope: this Story specifies the reporting, not the versioning policy.

## Open Questions

None. The grill left nothing open: the invocation form (`version` as a subcommand, not a
`--version` flag) is fixed by the Story title and the Epic boundary, and the manifest is the
only version source that exists.
