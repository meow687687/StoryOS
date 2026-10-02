import { describe, expect, it } from 'vitest';
import {
	auditMagicLoopholes,
	commitMagicBlueprintToCanon,
	generateRandomSpark,
	MAGIC_ARCHETYPES,
	SANDERSON_LAWS_GUIDE,
	type MagicBlueprint
} from './magic';
import type { Decision, WorldEntry } from './world';

describe('SANDERSON_LAWS_GUIDE', () => {
	it('contains the 4 core Brandon Sanderson laws with maxims and principles', () => {
		expect.assertions(6);
		expect(SANDERSON_LAWS_GUIDE).toHaveLength(4);
		expect(SANDERSON_LAWS_GUIDE[0].title).toBe('Understanding Enables Resolution');
		expect(SANDERSON_LAWS_GUIDE[1].title).toBe('Limitations > Powers');
		expect(SANDERSON_LAWS_GUIDE[2].title).toBe('Expand Before Adding');
		expect(SANDERSON_LAWS_GUIDE[3].title).toBe('The Law of Internal Consistency');
		expect(SANDERSON_LAWS_GUIDE[1].maxim).toContain('Limitations and weaknesses are more interesting');
	});
});

describe('MAGIC_ARCHETYPES', () => {
	it('has 12 curated magic archetypes with full 5-pillar specifications', () => {
		expect.assertions(3);
		expect(MAGIC_ARCHETYPES).toHaveLength(12);

		const allHavePillars = MAGIC_ARCHETYPES.every(
			(arch) =>
				arch.id &&
				arch.name &&
				arch.source &&
				arch.vector &&
				arch.cost &&
				arch.limitations &&
				arch.fallout &&
				arch.craftWarning &&
				arch.famousInspirations.length > 0 &&
				arch.hardness >= 1 &&
				arch.hardness <= 5
		);
		expect(allHavePillars).toBe(true);

		const names = MAGIC_ARCHETYPES.map((a) => a.name);
		expect(names).toContain('Sympathetic Thermodynamics');
	});

	it('includes diverse hardness ratings across the spectrum', () => {
		expect.assertions(3);
		const softArchetypes = MAGIC_ARCHETYPES.filter((a) => a.hardness <= 2);
		const hardArchetypes = MAGIC_ARCHETYPES.filter((a) => a.hardness >= 4);

		expect(softArchetypes.length).toBeGreaterThanOrEqual(1);
		expect(hardArchetypes.length).toBeGreaterThanOrEqual(4);
		expect(MAGIC_ARCHETYPES.some((a) => a.id === 'dream-oneiric')).toBe(true);
	});
});

describe('generateRandomSpark', () => {
	it('generates a valid 5-pillar MagicBlueprint with non-empty fields', () => {
		expect.assertions(8);
		const spark = generateRandomSpark();

		expect(spark.id).toBeTruthy();
		expect(spark.name.length).toBeGreaterThan(3);
		expect(spark.summary).toBeTruthy();
		expect(spark.hardness).toBe(4);
		expect(spark.source).toBeTruthy();
		expect(spark.vector).toBeTruthy();
		expect(spark.cost).toBeTruthy();
		expect(spark.limitations).toBeTruthy();
	});

	it('generates distinct IDs across separate rolls', () => {
		expect.assertions(1);
		const s1 = generateRandomSpark();
		const s2 = generateRandomSpark();
		expect(s1.id !== s2.id || s1.name !== s2.name).toBe(true);
	});
});

describe('auditMagicLoopholes (Stress-Tester)', () => {
	it('flags an alert when negative "cannot" constraints are missing', () => {
		expect.assertions(3);
		const looseBlueprint: MagicBlueprint = {
			id: 'bp-loose',
			name: 'Loose Magic',
			summary: 'Free power without constraints.',
			hardness: 3,
			source: 'Ether',
			vector: 'Hands',
			cost: 'Mild tiredness',
			limitations: 'Difficult to learn and takes meditation.',
			fallout: 'Wizards are respected in the army and war.',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		const audit = auditMagicLoopholes(looseBlueprint);
		const antCritique = audit.critiques.find((c) => c.category === 'Antagonist');

		expect(antCritique?.status).toBe('alert');
		expect(antCritique?.title).toBe('Missing "Cannot" Constraints');
		expect(audit.overallScore).toBe('LOOPHOLE_ALERT');
	});

	it('passes when iron negative constraints and military fallout exist', () => {
		expect.assertions(3);
		const solidBlueprint: MagicBlueprint = {
			id: 'bp-solid',
			name: 'Allomantic Iron',
			summary: 'Push and pull on metals.',
			hardness: 5,
			source: 'Digested trace metals in the stomach.',
			vector: 'Allomantic lines anchored to iron.',
			cost: 'Metal poisoning and violent physical exhaustion.',
			limitations: 'Cannot push metals pierced through flesh without tremendous investiture. Never affects aluminum.',
			fallout: 'War tactics use obsidian and bone weapons to prevent army archers being deflected.',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		const audit = auditMagicLoopholes(solidBlueprint);
		expect(audit.overallScore).toBe('SOLID');
		expect(audit.critiques.find((c) => c.category === 'Antagonist')?.status).toBe('pass');
		expect(audit.critiques.find((c) => c.category === 'Military')?.status).toBe('pass');
	});

	it('flags an alert if system generates infinite resource/gold without conservation', () => {
		expect.assertions(2);
		const infiniteGoldBlueprint: MagicBlueprint = {
			id: 'bp-gold',
			name: 'Midas Touch',
			summary: 'Alchemy creates unlimited gold and free wealth.',
			hardness: 4,
			source: 'Solar rays',
			vector: 'Fingertip touch',
			cost: 'None, free unlimited creation',
			limitations: 'Only works during midday.',
			fallout: 'Kings love gold in war.',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		const audit = auditMagicLoopholes(infiniteGoldBlueprint);
		const ecoCritique = audit.critiques.find((c) => c.category === 'Economy');

		expect(ecoCritique?.status).toBe('alert');
		expect(ecoCritique?.title).toBe('Economic Hyper-Inflation Risk');
	});
});

describe('commitMagicBlueprintToCanon', () => {
	it('bridges a blueprint directly into World Bible and Decisions ledger', () => {
		expect.assertions(7);
		const bp: MagicBlueprint = {
			id: 'bp-1',
			name: 'Mist Weaving',
			summary: 'Condensing fog into razor threads.',
			hardness: 5,
			source: 'River mist and damp condensation.',
			vector: 'Silver needles and silk gloves.',
			cost: 'Extreme thermal chill and finger frostbite.',
			limitations: 'Cannot hold shape in dry arid air; never works without ambient humidity.',
			fallout: 'River pirates dominate trade routes while desert cities are immune.',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		const initialBible: WorldEntry[] = [];
		const initialDecisions: Decision[] = [];

		const { updatedBible, updatedDecisions } = commitMagicBlueprintToCanon(
			bp,
			initialBible,
			initialDecisions
		);

		expect(updatedBible).toHaveLength(1);
		expect(updatedBible[0].kind).toBe('magic');
		expect(updatedBible[0].name).toBe('Mist Weaving');
		expect(updatedBible[0].text).toContain('IRON LIMITATIONS & CANNOT LAWS');
		expect(updatedBible[0].text).toContain('Cannot hold shape in dry arid air');

		expect(updatedDecisions).toHaveLength(1);
		expect(updatedDecisions[0].status).toBe('locked');
	});

	it('updates existing magic entry in bible if re-committed', () => {
		expect.assertions(3);
		const bp: MagicBlueprint = {
			id: 'bp-updated',
			name: 'Mist Weaving',
			summary: 'Updated summary.',
			hardness: 5,
			source: 'River mist',
			vector: 'Silver needles',
			cost: 'Fingers freeze',
			limitations: 'Cannot operate in direct fire',
			fallout: 'Pirate dominance',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		const existingEntry: WorldEntry = {
			id: 'mag-mist-weaving',
			name: 'Mist Weaving',
			kind: 'magic',
			text: 'Old draft text',
			status: 'canon'
		};

		const { updatedBible } = commitMagicBlueprintToCanon(bp, [existingEntry], []);

		expect(updatedBible).toHaveLength(1);
		expect(updatedBible[0].id).toBe('mag-mist-weaving');
		expect(updatedBible[0].text).toContain('Cannot operate in direct fire');
	});
});
