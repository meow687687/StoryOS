import {
	buildPartnerBrief,
	loadCraftNotes,
	loadThread,
	makeMessage,
	parseCraftNote,
	parseLockCards,
	saveCraftNote,
	sittingKey,
	threadTranscript
} from './partner';
import { describe, expect, it } from 'vitest';

describe('partner thread', () => {
	it('briefs fresh from bible truth plus archetype voice', () => {
		expect.assertions(4);
		const brief = buildPartnerBrief(
			[
				{
					id: 'e1',
					kind: 'magic',
					name: 'Ashcraft',
					text: 'Ashcraft cannot raise the dead.',
					status: 'canon',
					aliases: []
				}
			],
			[],
			'architect',
			'Ada'
		);
		expect(brief).toContain('AUTHOR: Ada');
		expect(brief).toContain('PARTNER VOICE:');
		expect(brief).toContain('Ashcraft');
		expect(brief).toContain('WORLD BIBLE (CANON');
	});

	it('stamps messages with sitting dividers', () => {
		expect.assertions(2);
		const m = makeMessage('author', 'a dump');
		expect(m.sitting).toBe(sittingKey());
		expect(m.role).toBe('author');
	});

	it('starts empty when nothing is stored', () => {
		expect.assertions(1);
		expect(loadThread()).toEqual([]);
	});

	it('parses lock drafts with verbatim proof attached', () => {
		expect.assertions(4);
		const cards = parseLockCards(
			`## DECISION: Kael spares the courier\nBody: Mercy over orders, this once.\nAuthor's words: "let him run, just this once"\n\n## BIBLE: Ashcraft\nBody: Ashcraft cannot raise the dead.\nAuthor's words: "death is a one-way door"`
		);
		expect(cards).toHaveLength(2);
		expect(cards[0].kind).toBe('decision');
		expect(cards[0].verbatim).toContain('let him run');
		expect(cards[1].kind).toBe('bible');
	});

	it('yields nothing when nothing converged', () => {
		expect.assertions(1);
		expect(parseLockCards('Nothing converged yet.')).toEqual([]);
	});

	it('builds an author-first transcript slice', () => {
		expect.assertions(2);
		const t = threadTranscript([
			makeMessage('author', 'fire cannot summon water'),
			makeMessage('partner', 'What does it cost him?')
		]);
		expect(t).toContain('AUTHOR: fire cannot summon water');
		expect(t).toContain('PARTNER: What does it cost him?');
	});

	it('parses craft notes and falls back to the lens when offline', () => {
		expect.assertions(4);
		const note = parseCraftNote(
			'Strength: You named the cost.\nSharpen: Push the timeline next.',
			'2026-10-04',
			'causality'
		);
		expect(note.strength).toContain('named the cost');
		expect(note.sharpen).toContain('timeline');
		const fallback = parseCraftNote('', '2026-10-04', 'causality');
		expect(fallback.sharpen).toContain('causality');
		expect(fallback.sitting).toBe('2026-10-04');
	});

	it('keeps one craft note per sitting', () => {
		expect.assertions(2);
		expect(loadCraftNotes()).toEqual([]);
		const notes = saveCraftNote(parseCraftNote('', sittingKey(), 'voice'));
		expect(notes.filter((n) => n.sitting === sittingKey())).toHaveLength(1);
	});
});
