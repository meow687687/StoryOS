import { ARCHETYPES, archetypeMeta, loadProfile } from './profile';
import { describe, expect, it } from 'vitest';

describe('author profile', () => {
	it('offers exactly the three grilled archetypes', () => {
		expect.assertions(2);
		expect(ARCHETYPES.map((a) => a.id).sort()).toEqual(['architect', 'discovery', 'reviser']);
		expect(archetypeMeta('architect').starterKinds).toContain('timeline');
	});

	it('each archetype tunes voice, starter bible, and craft lens', () => {
		expect.assertions(3);
		for (const arch of ARCHETYPES) {
			expect(
				arch.partnerVoice.length > 0 &&
					arch.starterKinds.length > 0 &&
					arch.craftLens.length > 0
			).toBe(true);
		}
	});

	it('returns null when no profile is stored', () => {
		expect.assertions(1);
		expect(loadProfile()).toBeNull();
	});
});
