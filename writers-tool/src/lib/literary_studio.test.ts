import { describe, expect, it } from 'vitest';
import {
	handleSmartEnter,
	paginateManuscriptText
} from './pagination';
import {
	DEFAULT_TYPOGRAPHY,
	LITERARY_FONTS,
	TACTILE_THEMES,
	loadTypographySettings,
	saveTypographySettings
} from './themes';
import {
	HIGHLIGHT_PALETTE,
	addComment,
	addHighlight,
	deleteComment,
	deleteHighlight,
	loadComments,
	loadHighlights
} from './annotations';
import {
	WRITER_ARCHETYPES,
	loadActiveArchetype,
	saveActiveArchetype
} from './archetypes';
import {
	CHARACTER_INTERROGATION_QUESTIONS,
	commitPartnerAgreementToCanon,
	evaluateScenePacing
} from './partner';
import type { Decision, WorldEntry } from './world';

describe('Smart Enter Transitions (Pagination & Scene Breaks)', () => {
	it('handles single Enter as standard paragraph break', () => {
		const text = 'First line';
		const res = handleSmartEnter(text, text.length, '✦ ✦ ✦');
		expect(res.actionType).toBe('paragraph');
		expect(res.updatedText).toBe('First line\n');
		expect(res.newCursorPos).toBe(11);
	});

	it('handles double Enter as ornamental scene break (✦ ✦ ✦)', () => {
		const text = 'First line\n';
		const res = handleSmartEnter(text, text.length, '✦ ✦ ✦');
		expect(res.actionType).toBe('scene_break');
		expect(res.updatedText).toBe('First line\n\n✦ ✦ ✦\n\n');
	});

	it('handles triple Enter as new chapter break marker', () => {
		const text = 'First line\n\n';
		const res = handleSmartEnter(text, text.length, '✦ ✦ ✦');
		expect(res.actionType).toBe('chapter_break');
		expect(res.updatedText).toBe('First line\n\n# Chapter New\n\n');
	});

	it('paginates manuscript text into structured pages with running headers & footers', () => {
		const novelTitle = 'Shadows of Eldoria';
		const chapterTitle = 'The Awakening';
		const rawText = Array(20).fill('This is a descriptive paragraph detailing the arrival of rain over the obsidian citadel walls.').join('\n');

		const pages = paginateManuscriptText(novelTitle, chapterTitle, 1, rawText, 100);
		expect(pages.length).toBeGreaterThanOrEqual(2);
		expect(pages[0].isChapterStart).toBe(true);
		expect(pages[0].chapterTitle).toBe(chapterTitle);
		expect(pages[0].footerText).toBe('1');
		expect(pages[1].footerText).toBe('2');
		expect(pages[1].headerLeft).toBe(novelTitle);
	});
});

describe('Literary Typesetting & 8-Theme Engine', () => {
	it('contains 8 distinct tactile skeuomorphic themes', () => {
		expect(TACTILE_THEMES).toHaveLength(8);
		const ids = TACTILE_THEMES.map((t) => t.id);
		expect(ids).toContain('antique-parchment');
		expect(ids).toContain('royal-bureau');
		expect(ids).toContain('obsidian-ink');
		expect(ids).toContain('midnight-velvet');
		expect(ids).toContain('warm-linen');
		expect(ids).toContain('forest-sage');
		expect(ids).toContain('cyber-monokai');
		expect(ids).toContain('classic-typescript');
	});

	it('contains editorial and dyslexic-friendly font stacks', () => {
		const ids = LITERARY_FONTS.map((f) => f.id);
		expect(ids).toContain('newsreader');
		expect(ids).toContain('eb-garamond');
		expect(ids).toContain('merriweather');
		expect(ids).toContain('jetbrains-mono');
		expect(ids).toContain('opendyslexic');
	});

	it('provides valid default typography settings', () => {
		expect(DEFAULT_TYPOGRAPHY.fontSize).toBe(18);
		expect(DEFAULT_TYPOGRAPHY.lineHeight).toBe(1.8);
		expect(DEFAULT_TYPOGRAPHY.firstLineIndent).toBe(1.5);
		expect(DEFAULT_TYPOGRAPHY.textAlign).toBe('justify');
	});
});

describe('Annotations, Multi-Ink Highlights & Margin Notes', () => {
	it('contains 5 highlight ink pigments', () => {
		expect(HIGHLIGHT_PALETTE).toHaveLength(5);
		const colors = HIGHLIGHT_PALETTE.map((h) => h.color);
		expect(colors).toContain('amber');
		expect(colors).toContain('emerald');
		expect(colors).toContain('rose');
		expect(colors).toContain('indigo');
		expect(colors).toContain('gold');
	});

	it('adds, loads, and deletes highlights and comments', () => {
		const chapterId = 'test-c1';
		const hl = addHighlight(chapterId, 0, 10, 'Sample text', 'emerald');
		expect(hl.id).toBeTruthy();
		expect(hl.color).toBe('emerald');

		const cm = addComment(chapterId, 'Check historical accuracy', 'Sample text', hl.id);
		expect(cm.content).toBe('Check historical accuracy');
		expect(cm.status).toBe('open');

		deleteHighlight(hl.id);
		deleteComment(cm.id);
	});
});

describe('Adaptive Writer Archetypes', () => {
	it('defines Pantser, Plotter, and Plantser presets', () => {
		expect(WRITER_ARCHETYPES.pantser.name).toContain('Pantser');
		expect(WRITER_ARCHETYPES.pantser.layout.typewriterMode).toBe(true);
		expect(WRITER_ARCHETYPES.plotter.layout.showBeatTree).toBe(true);
		expect(WRITER_ARCHETYPES.plantser.layout.showMarginRail).toBe(true);
	});
});

describe('Editorial Partner Bureau Engine (/partner)', () => {
	it('contains the 5 core character interrogation questions', () => {
		expect(CHARACTER_INTERROGATION_QUESTIONS).toHaveLength(5);
		expect(CHARACTER_INTERROGATION_QUESTIONS[0].id).toBe('q_lie');
		expect(CHARACTER_INTERROGATION_QUESTIONS[1].id).toBe('q_wound');
		expect(CHARACTER_INTERROGATION_QUESTIONS[2].id).toBe('q_want_vs_need');
	});

	it('evaluates developmental scene pacing and tension score', () => {
		const diag = evaluateScenePacing(
			'The infiltration into the archive began under the cover of thunderstorm.',
			'Infiltrate the archive to steal the cipher key',
			'The Grand Inquisitor has doubled the sentry patrol'
		);

		expect(diag.tensionScore).toBeGreaterThanOrEqual(7);
		expect(diag.outcome).toBe('No, and furthermore...');
		expect(diag.pacingVerdict).toContain('High Velocity');
	});

	it('commits an editorial agreement into decisions.md and the World Bible', () => {
		const existingBible: WorldEntry[] = [];
		const existingDecisions: Decision[] = [];

		const { updatedBible, updatedDecisions } = commitPartnerAgreementToCanon(
			'Kaelen Vane Moral Limit',
			'Kaelen will never sacrifice innocent civilians even to save his sister.',
			'character:Kaelen Vane',
			existingBible,
			existingDecisions
		);

		expect(updatedDecisions).toHaveLength(1);
		expect(updatedDecisions[0].decision).toContain('never sacrifice innocent civilians');
		expect(updatedBible).toHaveLength(1);
		expect(updatedBible[0].name).toBe('Kaelen Vane');
		expect(updatedBible[0].kind).toBe('character');
	});
});
