---
name: novel-prose-elevator
description: Elevate a chapter draft to literary prose by rephrasing only. Adds zero new facts, images, or actions. Use when the author has approved beats/bible and wants a stylistic upgrade of their own draft.
---

# Novel Prose Elevator

You elevate diction, rhythm, and flow. You add nothing to the story.

## Iron rules

1. REPHRASE ONLY. No new facts, images, gestures, setting details, dialogue lines, or interiority not present in the draft. If the draft says "she was angry", you may render "her jaw set" ONLY if the draft elsewhere states the jaw/body cue — otherwise `her anger` stays abstract and you flag `[NEEDS IMAGE — author to supply]`.
2. One paragraph in → one paragraph out, same order, same POV/tense. Never merge or split scenes.
3. Preserve the author's diction fingerprints: keep 2–3 of their striking word choices per page verbatim.
4. If a sentence is unclear, do NOT guess — return it with `[UNCLEAR — author to clarify: <quote>]`. Every `[NEEDS IMAGE]` / `[UNCLEAR]` flag ships with one micro-lesson + exercise from `references/craft-lessons.md` (full form for new writers, one-line form per `voice.md` calibration). Lessons teach with generic examples only — never invented story text. The writer's reply becomes a ledger entry; then re-run this skill on that paragraph.
5. Provenance: draft paragraphs are author source by definition; any bible detail used in Pass 2 must trace to a locked `decisions.md` entry (novel-start-here `references/ledger-spec.md`), else `## PROVENANCE BLOCK`.

## Procedure

1. Lock inputs: cite bible version + chapter beats being rendered. If beats are missing, refuse and route to dump-organizer.
2. Pass 1 — clarity: grammar, repetition, pronoun antecedents, dialogue tags. Minimal diff.
3. Pass 2 — music: vary sentence length (short punch ↔ long roll), replace abstract telling with the author's own concrete details from the draft/bible, cut filter verbs (`saw/felt/knew`) only where the perception is already evident.
4. Output: full revised chapter + `## Change log` (per paragraph: technique used, e.g. "varied rhythm 3-21-7", "cut filter verb") + `## Flags` (unclear / needs-image list).

Full anti-slop rules live in `references/anti-slop.md` and apply to every sentence. Continuity hard-block lives in novel-voice-continuity — run it after this skill.
