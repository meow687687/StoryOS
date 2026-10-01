# Novel Skills — AI-assisted novel writing where the author stays the author

Portable `SKILL.md` suite (Claude Code, OpenCode, Cursor). Core promise: **provenance** — every story fact traces to the author's verbatim words in `decisions.md`. The AI organizes, questions, elevates, and checks. It never invents.

## Suite

| Order | Skill | Job |
|---|---|---|
| 0 | `novel-start-here` | Plain-language onboarding, project scaffold, 300-word voice exercise → `voice.md` |
| 1 | `novel-dump-organizer` | Messy dump → story bible → outline → chapter beats; gaps flagged, never filled |
| 2 | `novel-editor-interrogator` | Developmental editor: BLOCKING-first question rounds; answers logged to ledger |
| 3 | `novel-prose-elevator` | Rephrase-only literary elevation + anti-slop + craft micro-lessons on flags |
| 4 | `novel-voice-continuity` | Final gate: voice fingerprints + hard-block on canon violations |
| 5 | `novel-revision` | Beta-feedback triage → author verdicts → minimal-diff revision passes |

## Pipeline

```text
start-here → dump-organizer → editor-interrogator → (draft chapters yourself)
  → prose-elevator → voice-continuity (ACCEPTED) → beta readers → revision → re-gate
```

`chNN-draft.md` is sacred: AI reads it, never writes it.

## Install

```bash
cp -r novel-* ~/.agents/skills/   # Claude Code / generic
# or ~/.config/opencode/skills/ / <project>/.opencode/skills/
```

## Demo

`demo-dump.md` → `demo-bible.md` → `demo-decisions.md`: the Kael/Behra sample worked end-to-end through Skills 1–2 in this repo's history.
