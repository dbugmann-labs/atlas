## Why

Atlas has no executable entry point. Nothing in the repository yet proves that the toolchain,
the seam convention in `docs/process.md` §8 and the merge-time checks in §7 work end to end on
a real Story. Printing the package version is the smallest externally observable behaviour that
exercises all of them, and it commits the project to no product decision — which matters while
the product is deliberately undefined.

## What Changes

- Adds a command-line entry point with exactly one subcommand, `version`, which writes the
  version of the `atlas` package to standard output and exits successfully.
- Defines how the entry point behaves when it is given a subcommand it does not offer, or no
  subcommand at all: a diagnostic on standard error and a non-zero exit status.
- No product behaviour, no flags, no configuration file, no registry publication. The Epic
  boundary (#3) holds.

## Capabilities

### New Capabilities

- `cli-version`: how the Atlas command-line entry point reports the version of the package it
  was installed from, and how it answers a request it does not recognise.

### Modified Capabilities

None. `openspec/specs/` is empty; this is the first capability.

## Impact

- **Code:** a new command-line seam and a thin executable wrapper around it, plus a `bin` entry
  in `package.json`. Paths and the seam signature are fixed in `design.md`.
- **Specs:** creates `openspec/specs/cli-version/spec.md` at archive time. No existing spec is
  touched, so CI check 2 (spec-diff containment) has exactly one claimed capability.
- **Dependencies:** none added. Node's standard library is sufficient.
- **Process:** this is the first Story to run the pipeline end to end, so it is also the
  evidence for the Phase 4 review of whether checks 3 and 4 earn their keep.
