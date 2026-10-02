import { describe, expect, it } from 'vitest';
import {
	computeWordDiff,
	inlineTransformProse,
	type AIConfig
} from './ai';
import type { WorldEntry } from './world';

const localCfg: AIConfig = {
	provider: 'local',
	apiKey: '',
	model: 'local-rules'
};

const sampleBible: WorldEntry[] = [
	{
		id: 'e1',
		kind: 'character',
		name: 'Kael',
		text: 'Kael has scarred hands and blue eyes. He cannot wield iron weapons due to a childhood curse.',
		status: 'canon'
	},
	{
		id: 'e2',
		kind: 'magic',
		name: 'Blood Iron Law',
		text: 'Blood iron cannot harm the royal bloodline directly.',
		status: 'canon'
	}
];

describe('Inline AI & Word Diff Engine', () => {
	it('computeWordDiff accurately identifies added, removed, and matching words', () => {
		const original = 'He felt a cold wind.';
		const updated = 'A cold wind struck.';
		const diff = computeWordDiff(original, updated);

		expect(diff.length).toBeGreaterThan(0);
		expect(diff.some((d) => d.type === 'removed')).toBe(true);
		expect(diff.some((d) => d.type === 'added')).toBe(true);
		expect(diff.some((d) => d.type === 'same' && d.value.includes('cold'))).toBe(true);
	});

	it('inlineTransformProse strips filter verbs and clichés in sensory mode', async () => {
		const passage = 'He felt that a palpable tapestry of shadow fell across the stones.';
		const result = await inlineTransformProse(localCfg, {
			selectedText: passage,
			action: 'sensory',
			bible: sampleBible,
			decisions: [],
			voice: null
		});

		expect(result.transformedText).not.toContain('He felt that');
		expect(result.transformedText).not.toContain('tapestry of');
		expect(result.transformedText).not.toContain('palpable');
		expect(result.antiSlopFixed).toBeGreaterThan(0);
	});

	it('inlineTransformProse contracts speech and cleans tags in dialogue mode', async () => {
		const passage = '"I do not know where she went," he intoned.';
		const result = await inlineTransformProse(localCfg, {
			selectedText: passage,
			action: 'dialogue',
			bible: sampleBible,
			decisions: [],
			voice: null
		});

		expect(result.transformedText).toContain("don't");
		expect(result.transformedText).not.toContain('he intoned');
		expect(result.antiSlopFixed).toBeGreaterThan(0);
	});

	it('inlineTransformProse warns on canon contradiction in canon mode', async () => {
		const passage = 'Kael wielded the heavy iron sword with both hands.';
		const result = await inlineTransformProse(localCfg, {
			selectedText: passage,
			action: 'canon',
			bible: sampleBible,
			decisions: [],
			voice: null
		});

		expect(result.canonWarnings).toBeDefined();
		expect(result.canonWarnings?.length).toBeGreaterThan(0);
		expect(result.canonWarnings?.[0]).toContain('Kael');
	});

	it('inlineTransformProse punches uniform rhythm into alternating cadence', async () => {
		const passage =
			'The shadows stretched along the cold stone floor of the corridor. The wind whistled through the cracked window panes above them.';
		const result = await inlineTransformProse(localCfg, {
			selectedText: passage,
			action: 'rhythm',
			bible: sampleBible,
			decisions: [],
			voice: null
		});

		expect(result.transformedText).toBeDefined();
		expect(result.antiSlopFixed).toBeGreaterThan(0);
	});
});
