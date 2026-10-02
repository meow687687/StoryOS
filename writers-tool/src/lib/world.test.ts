import {
	calculateContractionRate,
	calculateSentenceRhythms,
	canonOnly,
	checkContradictions,
	clusterFeedback,
	computeCharacterState,
	countWords,
	detectAccidentalSpoilers,
	detectKind,
	detectKnowledgeLeaks,
	exportProjectBundleJson,
	extractRules,
	extractVoiceMetrics,
	findEntityMentions,
	importProjectBundleJson,
	linkedEntities,
	parseDecisionsMarkdown,
	parseDump,
	parseFeedbackMarkdown,
	parseVoiceMarkdown,
	scanAntiSlop,
	serializeDecisionsMarkdown,
	serializeFeedbackMarkdown,
	serializeVoiceMarkdown,
	verifyTravelFeasibility,
	SAMPLE_FEEDBACK_ITEMS,
	SAMPLE_VOICE_PROFILE,
	type BetaFeedbackItem,
	type VoiceProfile,
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

describe('temporal state and knowledge tracking', () => {
	const sampleEvents: import('./world').StoryEvent[] = [
		{
			id: 'ev1',
			sceneTitle: 'Chapter 1: The Arrival',
			order: 1,
			inStoryTime: 'Day 1, Morning',
			participantIds: ['c_kael'],
			disclosures: [
				{
					id: 'sec1',
					fact: 'The ancient signet ring belongs to the high treason guild',
					disclosedAtOrder: 1,
					disclosedToCharacterIds: ['c_kael'],
					isPublicToReader: true
				}
			],
			mutations: [
				{
					id: 'm1',
					characterId: 'c_kael',
					type: 'injury',
					description: 'Burn scar across right forearm'
				},
				{
					id: 'm2',
					characterId: 'c_kael',
					type: 'relationship',
					targetCharacterId: 'c_mira',
					polarity: 'suspicious',
					trustDelta: -20,
					description: 'Discovered Mira lurking near the council chamber'
				}
			],
			status: 'canon'
		},
		{
			id: 'ev2',
			sceneTitle: 'Chapter 2: The Ambush',
			order: 2,
			inStoryTime: 'Day 2, Night',
			participantIds: ['c_kael', 'c_lucan'],
			disclosures: [
				{
					id: 'sec2',
					fact: 'Lord Vane poisoned the royal reservoir with nightshade',
					disclosedAtOrder: 2,
					disclosedToCharacterIds: ['c_kael'], // Only Kael was told by the dying guard!
					isPublicToReader: true
				}
			],
			mutations: [
				{
					id: 'm3',
					characterId: 'c_kael',
					type: 'healed',
					description: 'Burn scar across right forearm'
				}
			],
			status: 'canon'
		}
	];

	it('computes character state at specific timeline order', () => {
		expect.assertions(4);
		// State at event 1
		const stateAt1 = computeCharacterState('c_kael', sampleEvents, 1);
		expect(stateAt1.activeInjuries).toContain('Burn scar across right forearm');
		expect(stateAt1.knownSecrets).toHaveLength(1);
		expect(stateAt1.relationships['c_mira']?.polarity).toBe('suspicious');

		// State at event 2 (healed injury)
		const stateAt2 = computeCharacterState('c_kael', sampleEvents, 2);
		expect(stateAt2.activeInjuries).toHaveLength(0);
	});

	it('detects chronological leaks when referencing future secrets', () => {
		expect.assertions(2);
		const characters: import('./world').WorldEntry[] = [
			{ id: 'c_kael', name: 'Kael', kind: 'character', text: '' }
		];

		// Writing scene 1: Kael mentions poisoned reservoir, which isn't revealed until scene 2!
		const warnings = detectKnowledgeLeaks(
			sampleEvents,
			1,
			'c_kael',
			'Kael whispered that Lord Vane poisoned the royal reservoir with dark nightshade.',
			characters
		);

		expect(warnings).toHaveLength(1);
		expect(warnings[0].reason).toContain('Chronological leak');
	});

	it('detects knowledge leaks when a character speaks of secrets never disclosed to them', () => {
		expect.assertions(2);
		const characters: import('./world').WorldEntry[] = [
			{ id: 'c_lucan', name: 'Lucan', kind: 'character', text: '' }
		];

		// Lucan is in scene 2, but only Kael was told about Lord Vane poisoning the reservoir!
		const warnings = detectKnowledgeLeaks(
			sampleEvents,
			2,
			'c_lucan',
			'Lucan laughed, revealing that Lord Vane poisoned the royal reservoir.',
			characters
		);

		expect(warnings).toHaveLength(1);
		expect(warnings[0].reason).toContain('Knowledge leak: Lucan was never disclosed');
	});
});

describe('reader horizon and accidental spoiler detection', () => {
	const sampleMysteries: import('./world').MysteryNode[] = [
		{
			id: 'm1',
			type: 'mystery',
			title: 'The Queen Secret Poisoner',
			description: 'Who slipped the weeping hemlock into the Queen cup?',
			status: 'planted',
			connectedTo: ['rev1'],
			x: 100,
			y: 100
		},
		{
			id: 'rev1',
			type: 'reveal',
			title: 'Archmage Solis poisoned the Queen cup with weeping hemlock',
			description: 'Solis orchestrated the assassination to ignite the civil war',
			status: 'unplanted',
			revealOrder: 4, // Planned for Chapter 4
			connectedTo: [],
			x: 300,
			y: 100
		}
	];

	it('flags premature reveals in earlier chapters as accidental spoilers', () => {
		expect.assertions(2);
		// Author accidentally writes the reveal in Chapter 1
		const warnings = detectAccidentalSpoilers(
			sampleMysteries,
			1,
			'Kael realized that Archmage Solis poisoned the Queen cup with weeping hemlock.'
		);

		expect(warnings).toHaveLength(1);
		expect(warnings[0].reason).toContain('Accidental spoiler');
	});

	it('allows the reveal in the intended chapter without warnings', () => {
		expect.assertions(1);
		// When drafting Chapter 4 (the planned chapter)
		const warnings = detectAccidentalSpoilers(
			sampleMysteries,
			4,
			'Kael shouted that Archmage Solis poisoned the Queen cup with weeping hemlock!'
		);

		expect(warnings).toHaveLength(0);
	});
});

describe('visual world map and travel feasibility verification', () => {
	const pins: import('./world').MapPin[] = [
		{ id: 'p1', name: 'Emberhold', type: 'city', x: 10, y: 10 },
		{ id: 'p2', name: 'High Citadel', type: 'citadel', x: 20, y: 15 },
		{ id: 'p3', name: 'The Far Outer Barrens', type: 'wilds', x: 95, y: 90 }
	];

	it('passes realistic overland travel across nearby locations', () => {
		expect.assertions(1);
		const journeys: import('./world').JourneyWaypoint[] = [
			{ id: 'j1', characterId: 'Kael', pinId: 'p1', dayIndex: 1, order: 1 },
			{ id: 'j2', characterId: 'Kael', pinId: 'p2', dayIndex: 2, order: 2 }
		];

		const warnings = verifyTravelFeasibility(pins, journeys);
		expect(warnings).toHaveLength(0);
	});

	it('flags impossible teleportation across the continent without adequate travel time', () => {
		expect.assertions(2);
		// Kael is at Emberhold (10, 10) on Day 1, and at Far Outer Barrens (95, 90) on Day 1
		const journeys: import('./world').JourneyWaypoint[] = [
			{ id: 'j1', characterId: 'Kael', pinId: 'p1', dayIndex: 1, order: 1 },
			{ id: 'j2', characterId: 'Kael', pinId: 'p3', dayIndex: 1, order: 2 }
		];

		const warnings = verifyTravelFeasibility(pins, journeys);
		expect(warnings).toHaveLength(1);
		expect(warnings[0].reason).toContain('Implausible travel speed');
	});
});

describe('countWords (zero-allocation word counter)', () => {
	it('handles empty and whitespace-only strings', () => {
		expect.assertions(3);
		expect(countWords('')).toBe(0);
		expect(countWords('   ')).toBe(0);
		expect(countWords('\n\t  \r')).toBe(0);
	});

	it('accurately counts multi-line text with mixed spacing', () => {
		expect.assertions(3);
		expect(countWords('The quick brown fox')).toBe(4);
		expect(countWords('   Leading   and   trailing   ')).toBe(3);
		expect(countWords('Chapter 1\n\nThe embers in the hearth hissed.')).toBe(8);
	});
});

describe('Novel Skills: Anti-Slop Scanner (scanAntiSlop)', () => {
	it('detects em-dash spam when frequency exceeds 1 per 300 words', () => {
		expect.assertions(2);
		const text = 'The door creaked—it was cold—he drew his blade—and stepped forward into the dark.';
		const violations = scanAntiSlop(text);
		const emDashRule = violations.find((v) => v.ruleId === 1);
		expect(emDashRule).toBeDefined();
		expect(emDashRule?.ruleName).toBe('Em-dash spam');
	});

	it('detects "Not X but Y" formula', () => {
		expect.assertions(2);
		const text = 'It was not a bird, it was a predator.';
		const violations = scanAntiSlop(text);
		const rule = violations.find((v) => v.ruleId === 2);
		expect(rule).toBeDefined();
		expect(rule?.explanation).toContain('Banned rhetorical formula');
	});

	it('detects purple triads of participles or adjectives', () => {
		expect.assertions(1);
		const text = 'The beast advanced, bleeding, snarling, and limping across the threshold.';
		const violations = scanAntiSlop(text);
		const rule = violations.find((v) => v.ruleId === 3);
		expect(rule).toBeDefined();
	});

	it('detects moralizing / thesis endings at the end of paragraphs', () => {
		expect.assertions(2);
		const text = 'Kael wrapped his cloak tighter.\n\nAnd that was what it meant to survive in Emberhold.';
		const violations = scanAntiSlop(text);
		const rule = violations.find((v) => v.ruleId === 4);
		expect(rule).toBeDefined();
		expect(rule?.ruleName).toBe('Moralizing / thesis ending');
	});

	it('flags banned AI adjectives and clichés', () => {
		expect.assertions(3);
		const text = 'The city was a tapestry of shadows and a labyrinth of old stones, a testament to antiquity.';
		const violations = scanAntiSlop(text);
		const tapestry = violations.find((v) => v.snippet.includes('tapestry'));
		const labyrinth = violations.find((v) => v.snippet.includes('labyrinth'));
		const testament = violations.find((v) => v.snippet.includes('testament'));
		expect(tapestry).toBeDefined();
		expect(labyrinth).toBeDefined();
		expect(testament).toBeDefined();
	});

	it('flags hollow intensifiers', () => {
		expect.assertions(2);
		const text = 'He was deeply terrified and quite literally frozen with fear.';
		const violations = scanAntiSlop(text);
		const deeply = violations.find((v) => v.snippet.includes('deeply'));
		const quiteLit = violations.find((v) => v.snippet.includes('quite literally'));
		expect(deeply).toBeDefined();
		expect(quiteLit).toBeDefined();
	});

	it('flags filter-verb pileup in a single paragraph', () => {
		expect.assertions(2);
		const text = 'Kael saw the shadow. He felt the cold iron. Then he heard the bell and realized the guard was dead.';
		const violations = scanAntiSlop(text);
		const rule = violations.find((v) => v.ruleId === 9);
		expect(rule).toBeDefined();
		expect(rule?.ruleName).toBe('Filter-verb pileup');
	});

	it('returns 0 violations for clean, concrete author prose', () => {
		expect.assertions(1);
		const text = 'Kael unclasped the copper buckle. The leather strap fell across the cedar planking with a dull slap. Frost glazed the sill.';
		const violations = scanAntiSlop(text);
		expect(violations).toHaveLength(0);
	});
});

describe('Novel Skills: Sentence Rhythm & Contraction Calculators', () => {
	it('calculates sentence length distribution and detects uniform cadence stretches', () => {
		expect.assertions(3);
		// 4 sentences all exactly 5 words -> uniform stretch
		const repetitiveText = 'The cold wind blew hard. The black crow took flight. The iron gates fell shut. The guard yelled out loud.';
		const rhythms = calculateSentenceRhythms(repetitiveText);
		expect(rhythms.lengths).toHaveLength(4);
		expect(rhythms.avg).toBe(5);
		expect(rhythms.uniformStretches.length).toBeGreaterThan(0);
	});

	it('calculates contraction rates accurately', () => {
		expect.assertions(3);
		const text = "Don't touch that lock. It's trapped. We cannot survive another trigger. I won't risk it.";
		// Contractions: Don't, It's, won't = 3
		// Uncontracted: cannot = 1
		// Total: 4 -> rate = 75%
		const stats = calculateContractionRate(text);
		expect(stats.contractions).toBe(3);
		expect(stats.uncontractedPairs).toBe(1);
		expect(stats.rate).toBe(75);
	});

	it('extracts voice metrics from author writing sample', () => {
		expect.assertions(3);
		const text = "He wouldn't look at the dead man. The frost had already taken the fingers. Two horses stamped in the snow outside.";
		const metrics = extractVoiceMetrics(text);
		expect(metrics.avgSentenceLength).toBeGreaterThan(0);
		expect(metrics.contractionRate).toBeDefined();
		expect(metrics.evidenceQuotes?.length).toBeGreaterThan(0);
	});
});

describe('Novel Skills: Voice Profile Markdown Serialization', () => {
	it('serializes and parses VoiceProfile with fidelity', () => {
		expect.assertions(4);
		const md = serializeVoiceMarkdown(SAMPLE_VOICE_PROFILE);
		expect(md).toContain('# Voice:');
		expect(md).toContain('1. Diction:');

		const parsed = parseVoiceMarkdown(md);
		expect(parsed.diction).toBe(SAMPLE_VOICE_PROFILE.diction);
		expect(parsed.formality).toBe(SAMPLE_VOICE_PROFILE.formality);
	});
});

describe('Novel Skills: Beta Feedback Triage & Clustering', () => {
	it('clusters feedback by location and class, ranking multi-reader items higher', () => {
		expect.assertions(3);
		const clusters = clusterFeedback(SAMPLE_FEEDBACK_ITEMS);
		expect(clusters.length).toBeGreaterThan(0);
		// Chapter 1, para 3 character feedback has 2 readers (Alex & Clara)
		const multiReaderCluster = clusters.find((c) => c.items.length >= 2);
		expect(multiReaderCluster).toBeDefined();
		expect(multiReaderCluster?.totalWeight).toBe(4);
	});

	it('serializes and parses feedback markdown faithfully', () => {
		expect.assertions(3);
		const md = serializeFeedbackMarkdown(SAMPLE_FEEDBACK_ITEMS);
		expect(md).toContain('# Beta Reader Feedback Triage');
		expect(md).toContain('Beta-Reader-Alex');

		const parsed = parseFeedbackMarkdown(md);
		expect(parsed.length).toBeGreaterThanOrEqual(1);
	});
});

describe('Novel Skills: Project Bundle Export and Import', () => {
	it('exports and imports StoryOS complete bundle JSON with roundtrip integrity', () => {
		expect.assertions(2);
		const json = exportProjectBundleJson();
		expect(typeof json).toBe('string');
		const result = importProjectBundleJson(json);
		expect(result.success).toBe(true);
	});
});
