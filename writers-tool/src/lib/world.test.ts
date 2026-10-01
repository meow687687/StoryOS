import {
	canonOnly,
	checkContradictions,
	detectKind,
	extractRules,
	findEntityMentions,
	linkedEntities,
	parseDecisionsMarkdown,
	parseDump,
	serializeDecisionsMarkdown,
	type WorldEntry
} from './world';
import { describe, expect, it } from 'vitest';

describe('parseDump', () => {
	it('splits blocks and detects kinds', () => {
		expect.assertions(3);
		const entries = parseDump(
			'Kael\nA young prince, son of the king.\n\nFire Pact\nFire magic cannot summon water. Only ash remains.'
		);
		expect(entries).toHaveLength(2);
		expect(entries[0].kind).toBe('character');
		expect(entries[1].kind).toBe('magic');
	});

	it('handles empty input', () => {
		expect.assertions(1);
		expect(parseDump('   \n  ')).toEqual([]);
	});
});

describe('magic rules + contradictions', () => {
	it('extracts cannot/only rules from canon', () => {
		expect.assertions(2);
		const entries = parseDump(
			'Fire Pact\nFire magic cannot summon water. Only bonded mages may call flame.'
		);
		const rules = extractRules(entries);
		expect(rules.length).toBeGreaterThanOrEqual(1);
		expect(rules[0].rule.toLowerCase()).toContain('cannot');
	});

	it('flags a chapter echoing a rule', () => {
		expect.assertions(2);
		const entries = parseDump('Fire Pact\nFire magic cannot summon water from ash.');
		const hits = checkContradictions(entries, 'Kael raised his hand and summoned water from ash.');
		expect(hits).toHaveLength(1);
		expect(hits[0].entryName).toBe('Fire Pact');
	});

	it('ignores rules marked as idea or rejected', () => {
		expect.assertions(1);
		const entry: WorldEntry = {
			id: 'm1',
			name: 'Rejected Rule',
			kind: 'magic',
			text: 'Fire magic cannot summon water.',
			status: 'rejected'
		};
		const hits = checkContradictions([entry], 'Kael raised his hand and summoned water from ash.');
		expect(hits).toHaveLength(0);
	});

	it('stays quiet when unrelated', () => {
		expect.assertions(1);
		const entries = parseDump('Fire Pact\nFire magic cannot summon water.');
		expect(checkContradictions(entries, 'They shared bread in the tavern.')).toEqual([]);
	});
});

describe('ambient entity recognition', () => {
	it('finds entity mentions with aliases and word boundaries', () => {
		expect.assertions(3);
		const entries: WorldEntry[] = [
			{
				id: 'e1',
				name: 'Kael',
				aliases: ['Prince Kael', 'The Exiled'],
				kind: 'character',
				text: 'A prince in exile.',
				status: 'canon'
			},
			{
				id: 'e2',
				name: 'Emberhold',
				kind: 'place',
				text: 'A mountain fortress.',
				status: 'canon'
			}
		];

		const text = 'At dusk, Prince Kael arrived at the gates of Emberhold.';
		const mentions = findEntityMentions(entries, text);

		expect(mentions).toHaveLength(2);
		expect(mentions[0].match).toBe('Prince Kael');
		expect(mentions[1].match).toBe('Emberhold');
	});
});

describe('helpers', () => {
	it('links entities by name', () => {
		expect.assertions(1);
		const entries = parseDump('Kael\nA prince.\n\nEmberhold\nA mountain city.');
		expect(
			linkedEntities(entries, 'Kael rode to Emberhold.')
				.map((e) => e.name)
				.sort()
		).toEqual(['Emberhold', 'Kael']);
	});

	it('detectKind defaults to note', () => {
		expect.assertions(1);
		expect(detectKind('some random scribble about breakfast')).toBe('note');
	});

	it('detectKind recognizes faction and mystery', () => {
		expect.assertions(2);
		expect(detectKind('The Cinder Council\nThe ruling guild of high mages.')).toBe('faction');
		expect(detectKind('The King Murder\nWho killed the king in his chambers?')).toBe('mystery');
	});
});

describe('decisions ledger serialization', () => {
	it('parses and serializes decisions markdown faithfully', () => {
		expect.assertions(4);
		const sampleMd = `## D1 — 2026-09-30 — Sister identity
- Decision: Mira is Kael's sister.
- Author's words: "Sister, confirmed"
- Source: editorial round 1
- Affects: bible:characters:Mira
- Status: locked
`;

		const parsed = parseDecisionsMarkdown(sampleMd);
		expect(parsed).toHaveLength(1);
		expect(parsed[0].id).toBe('D1');
		expect(parsed[0].topic).toBe('Sister identity');
		expect(parsed[0].status).toBe('locked');
	});
});
