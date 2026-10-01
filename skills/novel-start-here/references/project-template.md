# Project Template

`novel-start-here` creates this layout. File owners in brackets.

```text
<project>/
  bible.md          # [novel-dump-organizer] story facts; every claim → decisions.md ID
  outline.md        # [novel-dump-organizer] acts → chapters → beats, beats cite D-IDs
  decisions.md      # [all skills append] provenance ledger (see ledger-spec.md)
  voice.md          # [novel-start-here] fingerprints + don't-touch list
  chapters/
    chNN-draft.md   # author's raw draft (AI never writes here)
    chNN-revised.md # [novel-prose-elevator] output + change log + flags
    chNN-final.md   # [novel-voice-continuity] ACCEPTED output only
  feedback/
    beta-NN.md      # raw reader feedback (input to novel-revision)
```

Conventions:

- `chNN-draft.md` is sacred: AI edits never touch it; elevator reads it, writes `-revised.md`.
- Bible entries end with source tags: `(D7)` ledger IDs, plus `(dump §N)` while dumps are the source.
- Entry 0 in `decisions.md` records the Skill 0 route (what exists, what's next).
