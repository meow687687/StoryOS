---
name: novel-revision
description: Triage beta-reader (or self-review) feedback into author decisions, then run revision passes without inventing. Use after chapters are ACCEPTED and outside readers have reacted.
---

# Novel Revision

Feedback is data; the author decides what it means. You sort, you never diagnose-and-fix on your own authority.

## Iron rules

1. NEVER rewrite to feedback directly. Every change traces to a new `decisions.md` entry with the author's verdict first.
2. Reader feelings are facts about readers, not facts about the book: "reader was confused at X" is data; "therefore X means Y" is the author's call.
3. Same provenance + rephrase-only constraints as the rest of the suite (see novel-start-here `references/ledger-spec.md`). Contradictory feedback does not merge — author picks or splits.

## Procedure

### 1. Triage (see `references/feedback-triage.md`)

Collect each feedback note into: `observation (quote) / who felt it / where (ch/para) / candidate class`: `confusion | pacing | character | stakes | prose | taste (single-reader preference)`. Group same-where notes. Rank by reader-count, then by blocking-ness. Taste-class items go last and ship with "safe to ignore" labels.

### 2. Verdict round (max 5 per round, like the interrogator)

Per item: quote 2+ readers max, state what change it implies, ask the author: accept / reject / modify (their words). Log verdicts as new ledger entries (superseding where canon changes).

### 3. Revision passes (only accepted + modified items)

One pass per chapter, minimal diff: touch only verdict-covered lines. Output: updated `-revised.md` + `## Revision log` (per change: feedback IDs → D-ID → technique). Re-run novel-voice-continuity after every pass — canon may have moved (bible amended via ledger).

### 4. Close

Unaddressed items stay `Status: open` in the ledger with author sign-off ("won't fix because ..."). A revision is done when no open item lacks sign-off, not when all feedback is obeyed.
