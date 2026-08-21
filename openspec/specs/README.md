# openspec/specs/ — the source of truth

One directory per capability: `openspec/specs/<capability>/spec.md`. Each holds the
requirements that are true of the system **today**, with `#### Scenario:` blocks that
acceptance tests are named after.

Empty until the first Story is archived. That is expected — the product is not yet defined.

**Nothing writes this directory except `/opsx:archive`.** Never hand-edit a file here; a
change reaches these specs as a delta under `openspec/changes/<change-id>/specs/`, merged in
at archive time. See `AGENTS.md` rule 2 and `docs/adr/0002-systems-of-record.md`.
