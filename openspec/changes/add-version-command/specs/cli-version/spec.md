## Purpose

Describes how the Atlas command-line entry point reports the version of the package it was
installed from, and how it answers an invocation it does not recognise. It is the contract a
script or a package manager relies on when it asks Atlas which version is present.

## ADDED Requirements

### Requirement: Version reporting

The command-line entry point SHALL report the version of the `atlas` package when it is invoked
with the `version` subcommand. The reported version MUST be the version recorded for the
installed package, written to standard output as a single line with no prefix, label or other
decoration, so that a caller can consume it without parsing. The entry point MUST exit with
status 0.

#### Scenario: version prints the package version and exits zero

- **WHEN** the entry point is invoked with the single argument `version`
- **THEN** standard output is the package version followed by a line ending, and nothing else
- **AND** standard error is empty
- **AND** the exit status is 0

#### Scenario: version with extra arguments is rejected

- **WHEN** the entry point is invoked with `version` followed by one or more further arguments
- **THEN** standard output is empty
- **AND** standard error names the first unexpected argument
- **AND** the exit status is non-zero

### Requirement: Unrecognised invocations

The command-line entry point SHALL refuse any invocation it does not recognise rather than
guessing. It MUST write a diagnostic to standard error, MUST write nothing to standard output,
and MUST exit with a non-zero status, so that a caller can distinguish a refusal from a
successful report by exit status alone.

#### Scenario: an unknown subcommand is rejected

- **WHEN** the entry point is invoked with a single argument that is not `version`
- **THEN** standard output is empty
- **AND** standard error names the unrecognised subcommand
- **AND** the exit status is non-zero

#### Scenario: no subcommand prints usage and exits non-zero

- **WHEN** the entry point is invoked with no arguments at all
- **THEN** standard output is empty
- **AND** standard error carries a usage line naming the subcommands the entry point accepts
- **AND** the exit status is non-zero
