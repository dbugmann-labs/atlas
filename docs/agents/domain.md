# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root: the project's shared vocabulary.
- **`docs/adr/`**: read ADRs that touch the area you're about to work in. `docs/adr/README.md` indexes them.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs`) creates them lazily when terms or decisions actually get resolved.

## File structure

This repo is **single-context**: one `CONTEXT.md` and one `docs/adr/` at the root.

```
/
├── CONTEXT.md                         ← shared vocabulary
├── docs/
│   ├── adr/                           ← numbered decisions, NNNN-kebab-title.md
│   ├── process.md                     ← the reasoning behind AGENTS.md
│   └── parking-lot.md                 ← deferred product detail
├── openspec/
│   ├── specs/<capability>/spec.md     ← what the system does today
│   └── changes/<change-id>/           ← what a change does to that
└── AGENTS.md
```

The multi-context layout (a root `CONTEXT-MAP.md` pointing at per-context `CONTEXT.md` files, with context-scoped `src/<context>/docs/adr/`) is **not in use**. Per `docs/adr/0001-monorepo.md`, this repo becomes a workspace only if the product later splits into several deployables; adopt `CONTEXT-MAP.md` then, not before.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a spec requirement, a change id, a scenario name, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

Note that `CONTEXT.md` currently holds only process vocabulary — the product is not yet defined. Domain terms arrive once product definition begins; until then, don't invent them.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (public repo, free org), but worth reopening because…_
