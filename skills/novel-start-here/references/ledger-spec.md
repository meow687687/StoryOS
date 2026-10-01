# Provenance Ledger Spec (`decisions.md`)

The ledger is the authorship proof. Every story fact must trace to the author's verbatim words. Any claim in bible/outline/chapters without a ledger entry is UNPROVEN and blocks (see rule below).

## Entry format

```md
## D7 — 2026-09-30 — Cargo identity
- Decision: The smuggled cargo is a girl.
- Author's words: "it's a girl, she's maybe twelve, she hums when scared"
- Source: dump §1 / editorial round 1 / voice exercise / revision round 2
- Affects: bible:characters, outline:act1:beat1
- Status: locked | open | superseded-by:D12
```

Rules:

- IDs sequential (`D1, D2...`). Never reuse or delete; supersede.
- `Author's words` is verbatim quote, not paraphrase. No quote = no entry.
- `Status: open` items are questions the author hasn't answered; they appear in Open Questions.
- Corrections create new entries superseding old ones; history is preserved.

## Hard block rule (binding on all novel-* skills)

Before emitting bible/outline/beats/prose/revision output, check: does every story claim trace to a `Status: locked` ledger entry (or a fresh author statement in this turn, which you log as a new entry first)? If any claim lacks backing:

```md
## PROVENANCE BLOCK
- Claim: "<output sentence/fact>"
- Missing: no ledger entry; author's words needed
- Question: <one-line question to establish it>
```

Emit the block, not the output. Never bridge with invented backing.
