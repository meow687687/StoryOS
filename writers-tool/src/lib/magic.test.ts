import { describe, expect, it } from 'vitest';
import {
	auditMagicLoopholes,
	buildRecipeFromBlocks,
	commitMagicBlueprintToCanon,
	computeTriangleOfPower,
	convertVaelrionRecipeToBlueprint,
	generateRandomSpark,
	generateRandomVaelrionCombo,
	MAGIC_ARCHETYPES,
	SANDERSON_LAWS_GUIDE,
	VAELRION_BUILDING_BLOCKS,
	VAELRION_RECIPES,
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

describe('Vaelrion Combo Lab & Building Blocks', () => {
	it('loads 30 curated Vaelrion recipes with complete schemas', () => {
		expect.assertions(3);
		expect(VAELRION_RECIPES).toHaveLength(30);
		expect(VAELRION_RECIPES[0].name).toBe('Leyline + Geometry');
		expect(VAELRION_RECIPES[0].sourceFuel).toContain('Ambient magical field');
	});

	it('loads 65 modular building blocks across all 6 categories', () => {
		expect.assertions(7);
		expect(VAELRION_BUILDING_BLOCKS.length).toBeGreaterThanOrEqual(60);
		const categories = new Set(VAELRION_BUILDING_BLOCKS.map((b) => b.category));
		expect(categories.has('Source / Fuel')).toBe(true);
		expect(categories.has('Resonance / Modifier')).toBe(true);
		expect(categories.has('Trigger')).toBe(true);
		expect(categories.has('Effect Family')).toBe(true);
		expect(categories.has('Cost')).toBe(true);
		expect(categories.has('Limitation')).toBe(true);
	});

	it('converts a VaelrionRecipe into a valid MagicBlueprint', () => {
		expect.assertions(6);
		const recipe = VAELRION_RECIPES[1]; // Weather + Emotional Resonance
		const bp = convertVaelrionRecipeToBlueprint(recipe);

		expect(bp.name).toBe('Weather + Emotional Resonance');
		expect(bp.source).toBe(recipe.sourceFuel);
		expect(bp.cost).toBe(recipe.costConsequence);
		expect(bp.limitations).toBe(recipe.coreLimitation);
		expect(bp.failureMode).toBe(recipe.failureMode);
		expect(bp.vaelrionRecipeId).toBe(recipe.id);
	});

	it('builds a custom recipe from building blocks and generates random combos', () => {
		expect.assertions(4);
		const randomCombo = generateRandomVaelrionCombo();

		expect(randomCombo.id).toBeTruthy();
		expect(randomCombo.name).toContain('+');
		expect(randomCombo.source).toBeTruthy();
		expect(randomCombo.limitations.toLowerCase()).toContain('cannot');
	});

	it('evaluates Triangle of Power according to Sanderson 2nd Law', () => {
		expect.assertions(4);
		const strongLimitationBp: MagicBlueprint = {
			id: 'test-triangle',
			name: 'Rigid Thermal Binding',
			summary: 'Localized heat transfer.',
			hardness: 5,
			source: 'Thermal ambient',
			vector: 'Copper rods',
			cost: 'Severe frostbite, hypothermia, permanent vein necrosis',
			limitations: 'Cannot create matter; cannot cross running water; never works without direct touch; fails if ambient temperature drops below freezing',
			fallout: 'Armies use thick wool blankets.',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		const score = computeTriangleOfPower(strongLimitationBp);
		expect(score.limitationRating).toBeGreaterThanOrEqual(5);
		expect(score.costRating).toBeGreaterThanOrEqual(4);
		expect(score.balanceState).toBe('STRONG_LIMITATIONS');
		expect(score.verdict).toContain('Sanderson Ideal');
	});
});

