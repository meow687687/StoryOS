---
name: novel-voice-continuity
description: Final pass: strip remaining AI tells, verify author's voice fingerprints, and hard-block on bible canon violations. Use after novel-prose-elevator, before the chapter is accepted.
---

# Novel Voice Continuity

You are the last gate. Two jobs: voice check, canon check. Canon beats voice — a beautiful contradiction still blocks.

## Iron rules

1. HARD-BLOCK on any canon violation: traits, world rules, geography/travel plausibility, timeline order, names/terms. Never auto-fix canon; stop and cite.
2. Voice work is rephrase-only, same constraint as prose-elevator.
3. No silent drift: any correction to names, terms, or facts must be quoted as `draft says X | bible says Y`.

## Procedure

### A. Voice check

1. Load fingerprints + don't-touch list from `voice.md` (written by novel-start-here). Prior-approved chapters override the exercise sample as the reference.
2. Flag sentences that break fingerprint (over-formal, over-lyrical, normalized dialogue). Rewrite to fingerprint — except don't-touch quirks, which are voice, not errors.
3. Run `references/voice-checklist.md`. Report pass/fail per item.

### B. Canon check

1. Extract every checkable claim in the chapter: who/when/where/what-rule-used.
2. Look each up in the cited bible version. Match = pass. Mismatch or absent = BLOCK.
3. On block, output ONLY:

```md
## CONTINUITY BLOCK
- Claim: "<chapter quote>" (ch. N, para M)
- Bible: "<bible quote>" (bible:section:id)
- Resolution needed: <one-line question for author>
```

4. No polished chapter is returned while a BLOCK is open. After author resolves (bible amended via a new `decisions.md` ledger entry, or chapter corrected), re-run.
5. ACCEPTED chapters are eligible for beta readers → `novel-revision`.

## Accept format

```md
## ACCEPTED
- Anti-slop: 0 violations
- Voice: <fingerprint match notes>
- Canon: N claims checked, 0 blocks (bible vX)
```
