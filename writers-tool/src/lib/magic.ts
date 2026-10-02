import type { Decision, WorldEntry } from './world';
import {
	VAELRION_BUILDING_BLOCKS,
	VAELRION_RECIPES,
	VAELRION_RESEARCH_NOTES,
	type VaelrionBuildingBlock,
	type VaelrionRecipe,
	type VaelrionResearchNote
} from './vaelrionData';

export {
	VAELRION_BUILDING_BLOCKS,
	VAELRION_RECIPES,
	VAELRION_RESEARCH_NOTES,
	type VaelrionBuildingBlock,
	type VaelrionRecipe,
	type VaelrionResearchNote
};

export interface MagicPillar {
	title: string;
	description: string;
	examples: string[];
}

export interface TriangleOfPowerScore {
	powerRating: number; // 1-10
	costRating: number; // 1-10
	limitationRating: number; // 1-10
	balanceState: 'STRONG_LIMITATIONS' | 'BALANCED' | 'OVERPOWERED_RISK' | 'CRIPPLING_COST';
	verdict: string;
	recommendation: string;
}

export interface MagicBlueprint {
	id: string;
	name: string;
	summary: string;
	hardness: number; // 1 (Soft / Eerie wonder) to 5 (Rigid tactical hard magic)
	source: string; // Pillar 1: Where energy originates
	vector: string; // Pillar 2: Medium / Channel (how it is invoked)
	cost: string; // Pillar 3: Physical price / Depletion (what is consumed)
	limitations: string; // Pillar 4: Iron "Cannot" laws (strict constraints)
	fallout: string; // Pillar 5: Societal, Economic & Military consequences
	archetypeId?: string;
	vaelrionRecipeId?: string;
	failureMode?: string;
	progressionPath?: string;
	bestStoryUse?: string;
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

export interface MagicArchetype {
	id: string;
	name: string;
	tagline: string;
	icon: string;
	hardness: number;
	source: string;
	vector: string;
	cost: string;
	limitations: string;
	fallout: string;
	famousInspirations: string[];
	craftWarning: string;
}

export interface LoopholeAuditReport {
	overallScore: 'SOLID' | 'NEEDS_STRENGTHENING' | 'LOOPHOLE_ALERT';
	critiques: {
		category: 'Military' | 'Economy' | 'Antagonist' | 'Climax';
		title: string;
		status: 'pass' | 'warning' | 'alert';
		observation: string;
		recommendation: string;
	}[];
}

// ============================================================================
// Brandon Sanderson's 3 Laws of Magic & Craft Guide
// ============================================================================

export const SANDERSON_LAWS_GUIDE = [
	{
		number: 'First Law',
		title: 'Understanding Enables Resolution',
		maxim:
			'An author’s ability to solve problems with magic in a satisfying way is directly proportional to how well the reader understands said magic.',
		principle:
			'If the magic solves the climax, the reader must know the rules and costs beforehand; otherwise, victory feels like an unearned cheat. If the magic is mysterious (soft magic), use it to create wonder or dread, but let characters solve problems through wit, courage, and grit.'
	},
	{
		number: 'Second Law',
		title: 'Limitations > Powers',
		maxim: 'Limitations and weaknesses are more interesting than powers.',
		principle:
			'Superman is boring when he punches through planets; he is fascinating when forced to make a moral choice or poisoned by Kryptonite. What your magic CANNOT do, what it COSTS to cast, and what VULNERABILITIES it creates produce 90% of story conflict.'
	},
	{
		number: 'Third Law',
		title: 'Expand Before Adding',
		maxim: 'Expand on what you have already introduced before you add something new.',
		principle:
			'Do not invent a fifth magic system when your first one hasn’t explored how it affects crime, architecture, military siege tactics, marriage contracts, and agricultural labor. A single well-extrapolated rule is richer than twenty shallow spells.'
	},
	{
		number: 'Zeroth Law',
		title: 'The Law of Internal Consistency',
		maxim: 'Err on the side of awesome, but keep the promises you make to the reader.',
		principle:
			'A magic system does not have to obey real-world physics, but it must obey its own internal logic. If you state in Chapter 2 that iron blocks teleportation, a villain escaping an iron cage in Chapter 20 without an established cost breaks the contract with the reader.'
	}
];

// ============================================================================
// 12 Curated Magic Archetypes Database
// ============================================================================

export const MAGIC_ARCHETYPES: MagicArchetype[] = [
	{
		id: 'sympathetic-thermodynamic',
		name: 'Sympathetic Thermodynamics',
		tagline: 'Energy conservation across linked physical matter.',
		icon: '🔥',
		hardness: 5,
		source: 'Thermal, kinetic, and chemical energy drawn from ambient heat or a linked external fire.',
		vector: 'Physical sympathy: a wax poppet, a drop of blood, or a matching material alloy acting as a conduit.',
		cost: 'Binder’s chills (hypothermia): pulling heat faster than the body can generate it freezes blood in veins.',
		limitations: 'Energy cannot be created from nothing; efficiency drops exponentially over distance; cannot link objects with zero structural similarity.',
		fallout: 'Blacksmiths and candle-makers hold immense leverage; armies carry charcoal braziers into battle to fuel war-binders.',
		famousInspirations: ['Sympathy (The Name of the Wind)', 'Thermal Transmutation (Fullmetal Alchemist)'],
		craftWarning: 'Watch out for perpetual motion loopholes: always make the energy transmission imperfect with heat dissipation.'
	},
	{
		id: 'blood-somatic',
		name: 'Blood & Somatic Vitality',
		tagline: 'Life force and anatomical toll as fuel.',
		icon: '🩸',
		hardness: 4,
		source: 'The metabolic vitality circulating in fresh, oxygenated arterial blood.',
		vector: 'Ritual silver lancets, painted blood sigils, or subcutaneous carving of flesh.',
		cost: 'Severe anemia, organ necrosis, arterial scarring, and irreversible loss of motor control with overuse.',
		limitations: 'Cannot use dried or coagulated blood; cannot steal blood from an unwilling person without direct flesh-to-flesh wound contact; cannot resurrect dead tissue.',
		fallout: 'Bloodline dynastic cartels hoard fertile heirs; vampires or blood-farmers form an underground criminal aristocracy.',
		famousInspirations: ['Blood Magic (Dragon Age)', 'Hemalurgy (Mistborn)', 'Gideon the Ninth'],
		craftWarning: 'If casters can use enemy blood freely, they become godlike in seconds. Restrict casting to self-blood or strictly fresh consensual extraction.'
	},
	{
		id: 'linguistic-true-names',
		name: 'Linguistic & True Names',
		tagline: 'The primordial language that commanded creation into existence.',
		icon: '📜',
		hardness: 4,
		source: 'The vibrational geometry of the first language spoken by gods or celestial architects.',
		vector: 'Spoken syllables pronounced with absolute tonal precision and vocal resonance.',
		cost: 'Laryngeal bleeding, loss of speech, mental fatigue, and semantic satiation (forgetting normal words).',
		limitations: 'Cannot speak a true name while lying or emotionally compromised; names change if the entity undergoes radical personal trauma; cannot speak faster than breath allows.',
		fallout: 'People hide their true birth names behind aliases, masking guilds, and deaf-mute guardians; naming records are locked in subterranean vaults.',
		famousInspirations: ['Old Speech (Earthsea)', 'Naming (The Kingkiller Chronicle)', 'Eragon / Ancient Language'],
		craftWarning: 'Beware of instant verbal combat kills: ensure true names require deep observation, empathy, or time to deduce.'
	},
	{
		id: 'equivalent-exchange',
		name: 'Equivalent Exchange & Alchemy',
		tagline: 'Matter and form rearranged under strict mass and elemental parity.',
		icon: '⚖️',
		hardness: 5,
		source: 'The subterranean resonance of tectonic plates and natural atomic lattice bonds.',
		vector: 'Inscribed transmutative circles on chalk, slate, cloth, or metallic cuffs.',
		cost: 'Rebound feedback: any error in chemical calculation tears the equivalent mass from the caster’s own limbs or organs.',
		limitations: 'Cannot synthesize human souls or conscious minds; cannot transmute elements without identical atomic precursors; circles require physical continuity.',
		fallout: 'State alchemists are drafted as heavy artillery; currency is made of rare non-transmutable alloys (e.g. meteoritic star-iron).',
		famousInspirations: ['Alchemy (Fullmetal Alchemist)', 'The Golden Sun'],
		craftWarning: 'If materials can be duplicated, the economy collapses. Keep raw material costs immutable.'
	},
	{
		id: 'ingestion-catalyst',
		name: 'Ingestion & Metabolic Catalysts',
		tagline: 'Digestive burn of refined minerals and chemical catalysts.',
		icon: '🧪',
		hardness: 5,
		source: 'Latent spiritual investiture unlocked when specific purified reagents contact gastric acids.',
		vector: 'Swallowed metal vials, ground mineral powders, or alchemical elixirs.',
		cost: 'Heavy metal toxicity, severe stomach ulceration, and withdrawal tremors when the burn extinguishes.',
		limitations: 'Powers terminate the exact second the catalyst is completely digested; impure alloys lead to violent poisoning; cannot burn while unconscious.',
		fallout: 'Guilds of precision metallurgists and chemists hold monopolies; thieves carry glass or wood weapons to bypass metal-pulling sentinels.',
		famousInspirations: ['Allomancy (Mistborn)', 'Witcher Potions (The Witcher)'],
		craftWarning: 'Make sure your catalyst supplies are finite so characters must manage inventory under siege.'
	},
	{
		id: 'celestial-orbital',
		name: 'Celestial & Orbital Tides',
		tagline: 'Power wax and wanes with planetary bodies and solar flares.',
		icon: '🌙',
		hardness: 4,
		source: 'The gravitational and light radiation cast by moons, comets, eclipses, and stellar conjunctions.',
		vector: 'Optical lenses, mirrored silver basins, and orienting rituals aligned to planetary axes.',
		cost: 'Helpless vulnerability: during celestial troughs, casters are physically weaker than ordinary humans and suffer insomnia.',
		limitations: 'Powers strictly depend on sky visibility and orbital geometry; cannot cast underground or during thick overcast weather without parabolic mirrors.',
		fallout: 'Wars and treaties are scheduled around lunar almanacs; fortresses are built deep beneath mountains to shield from sky-gazing seers.',
		famousInspirations: ['Water/Firebending (Avatar: The Last Airbender)', 'Solar Exalted', 'A Song of Ice and Fire (Red Comet)'],
		craftWarning: 'Because timing is predictable, characters must plan around timetables, preventing arbitrary mid-fight surprises.'
	},
	{
		id: 'memory-toll',
		name: 'Memory-Toll & Identity Currency',
		tagline: 'Trading past recollections and identity for present miracle.',
		icon: '🧠',
		hardness: 4,
		source: 'The neural and emotional tapestry of lived human memory.',
		vector: 'Introspective focus, silver needles tapping temples, or unweaving woven memory cords.',
		cost: 'Irreversible amnesia: the caster permanently forgets their mother’s face, childhood home, or beloved’s name.',
		limitations: 'Cannot burn artificial or secondhand memories; shallow memories yield minuscule power; forgetting a loved one makes future emotional magic impossible.',
		fallout: 'Veterans are hollow husks who remember only war; wealthy nobility buy orphans to adopt and groom for memory harvesting.',
		famousInspirations: ['Memory Magic (The Library at Mount Char)', 'Copperminds (Mistborn)', 'Torment: Tides of Numenera'],
		craftWarning: 'The emotional tragedy is the heart of this system: ensure the sacrificed memory has poignant narrative weight.'
	},
	{
		id: 'contract-spirit-oath',
		name: 'Contract & Spirit Oaths',
		tagline: 'Legalistic bargaining with metaphysical entities.',
		icon: '📜',
		hardness: 4,
		source: 'Ancient elemental spirits, demons, or ancestral pacts bound by primordial law.',
		vector: 'Signed parchment contracts in indelible ink, witnessed handshakes, or ritual taboos.',
		cost: 'Strict personal prohibitions: the caster must never tell a lie, must never touch gold, or owes three years of servitude.',
		limitations: 'Spirits exploit any loophole in the wording; breaking a clause results in immediate forfeiture of the soul or spontaneous combustion; cannot compel an unwilling spirit without true leverage.',
		fallout: 'Lawyers and barristers are the highest order of sorcerers; courtrooms are fortified magical proving grounds.',
		famousInspirations: ['Pacts (Chainsaw Man)', 'Nen Vows (Hunter x Hunter)', 'Bartimaeus Sequence'],
		craftWarning: 'The joy of this system is linguistic trickery: the antagonist and protagonist should win by out-lawyering each other.'
	},
	{
		id: 'sound-resonance',
		name: 'Harmonic Sound & Resonance',
		tagline: 'Acoustic frequency manipulation that shatters or harmonizes matter.',
		icon: '🎶',
		hardness: 4,
		source: 'The natural resonant vibrational frequencies that hold crystalline and atomic lattices together.',
		vector: 'Tuning forks, throat chanting, whistling bells, and hollowed bone instruments.',
		cost: 'Permanent hearing loss, inner-ear equilibrium vertigo, and skull fractures from feedback vibrations.',
		limitations: 'Cannot propagate in a vacuum; silenced or gagged casters are powerless; sound waves cannot bend around dampening felt or vacuum glass.',
		fallout: 'Guards wear sound-dampening wool helmets; assassins use silent felt throwing daggers; belltowers are planetary defense systems.',
		famousInspirations: ['Tone magic (The Wheel of Time)', 'The Broken Earth (Orogeny via seismic resonance)'],
		craftWarning: 'Remember that sound travels at 343 m/s: at long distances, the spell arrives visibly delayed after the flash.'
	},
	{
		id: 'geometric-runic',
		name: 'Geometric Circuits & Runes',
		tagline: 'Architectural precision and mathematical arrays.',
		icon: '📐',
		hardness: 5,
		source: 'Ambient static charge channeled through specific geometric angles and ratios (Golden Ratio, Pi).',
		vector: 'Carved stone channels, etched copper wire, dyed conductive ink, or embroidered gold thread.',
		cost: 'Intense mental focus during drafting; ink degradation; catastrophic explosions if an angle is off by 0.5 degrees.',
		limitations: 'Static: runes cannot move unless carved onto rigid armatures; scratching a rune instantly breaks the circuit; cannot channel power without closed loops.',
		fallout: 'Civil engineering and municipal magic power running aqueducts and streetlamps; saboteurs carry scratching chisels.',
		famousInspirations: ['Aondor (Elantris)', 'Rithmatist (Brandon Sanderson)', 'The Runelords'],
		craftWarning: 'Because it relies on physical craft, combat requires pre-drawn preparation or portable engraved discs.'
	},
	{
		id: 'dream-oneiric',
		name: 'Oneiric & Dream Weaving',
		tagline: 'Manipulating collective unconsciousness and slumbering reality.',
		icon: '💤',
		hardness: 2,
		source: 'The hypnagogic realm generated by millions of sleeping minds dreaming simultaneously.',
		vector: 'Incense smoke, slumbering trance, lucid dreaming anchors, or woven dreamcatchers.',
		cost: 'Sleep paralysis, night terrors, somatic somnambulism, and losing the boundary between dream and waking reality.',
		limitations: 'Cannot enter the mind of an awake or completely dreamless sleeper; cannot directly damage physical objects without psychogenic psychosomatic shock; power evaporates at waking dawn.',
		fallout: 'Guards take stimulants to stay awake for days; nightmare-catchers patrol the barracks of sleeping kings; sleep sanctuaries are protected neutral territory.',
		famousInspirations: ['Sandman (Neil Gaiman)', 'Inception', 'The Wheel of Time (Tel’aran’rhiod)'],
		craftWarning: 'Because dreams can do anything, ground the rules firmly: what happens when the dreamer wakes up? Never use "it was all just a dream" as a resolution.'
	},
	{
		id: 'shadow-umbral',
		name: 'Shadow & Umbral Theft',
		tagline: 'Extinguishing photons to bend light and reality.',
		icon: '🌑',
		hardness: 4,
		source: 'The dark void between atoms and the penumbra cast behind opaque solid bodies.',
		vector: 'Snuffing candles, stepping between cast silhouettes, or swallowing luminescence.',
		cost: 'Photophobia (sunlight burns eyes and skin), color-blindness, and gradual fading into transparency.',
		limitations: 'Power is zero in absolute pure pitch darkness (no silhouettes exist); power is zero in harsh uniform stadium floodlights (no shadow exists); needs high-contrast light borders.',
		fallout: 'Cities keep lanterns burning 24/7 on penalty of death; shadow-binders operate strictly during twilight or lantern-lit back alleys.',
		famousInspirations: ['Shadow and Bone (The Darkling)', 'Mistborn (Tin/Zinc gloom)', 'Dishonored'],
		craftWarning: 'The dependency on shadows means lighting is a weapon: clever foes simply ignite a magnesium flare to dispel the caster.'
	}
];

// ============================================================================
// Randomizer Spark Generator
// ============================================================================

export const SPARK_SOURCES = [
	'Subterranean tectonic ley lines humming through volcanic obsidian veins',
	'The dying radiation of a shattered second moon orbiting in rings',
	'Ancestral ghosts lingering in the calcium of family crypts',
	'Ambient body heat drawn from nearby warm-blooded organisms',
	'The linguistic names of celestial architects buried under old ruins',
	'Ingested alchemical mercury tinctures and lead salts',
	'The psychological weight of unforgiven guilt and unresolved trauma',
	'Pure sound vibrations resonated through hollow crystal caverns'
];

export const SPARK_VECTORS = [
	'Deliberate silver needles tapped into anatomical nerve junctions',
	'Complex geometric circles inscribed with chalk mixed with sea salt',
	'Short, harsh phrases spoken in a dead grammatical voice',
	'Painted blood sigils upon animal vellum or human skin',
	'Tuned brass tuning forks struck against iron anvils',
	'Swallowed glass beads containing pressurized mercury vapors',
	'Mirror reflections aligned along the solar azimuth at noon',
	'Threaded silk cords woven with intricate knots that release power when untied'
];

export const SPARK_COSTS = [
	'Severe hypothermia: blood chills and fingers blacken from frostbite',
	'Irreversible memory loss: casters forget personal relationships and childhood names',
	'Accelerated aging: hair grays and bones become brittle per second of use',
	'Temporary total blindness lasting three times the duration of the spell',
	'Emotional exhaustion: casters sink into clinical apathy and numbness for days',
	'Blood vessel rupture: capillaries burst across eyes and cheeks',
	'Attracting invisible planar predators that hunt the scent of expended magic',
	'The permanent loss of physical sense of taste and smell'
];

export const SPARK_LIMITATIONS = [
	'Cannot affect, move, or transmute living cold-worked iron or steel',
	'Cannot be invoked within 100 paces of running freshwater or deep ocean waves',
	'Cannot resurrect, reanimate, or replicate human consciousness or dead flesh',
	'Cannot create matter or energy from nothing: mass must be conserved exactly',
	'Power is strictly nullified while the caster is under a closed roof or ceiling',
	'Cannot harm anyone of shared biological maternal bloodline',
	'Cannot cast while speaking or harboring a deliberate lie',
	'Only works between astronomical sunset and dawn: useless in direct solar rays'
];

export const SPARK_FALLOUTS = [
	'Guilds of metallurgists and salt-miners hold absolute political sway over kings',
	'Warfare has abandoned metal plate armor in favor of dense layered silk and horn',
	'A thriving black market trades adopted orphans specifically for memory harvesting',
	'Cities burn pressurized whale-oil lanterns all night to eliminate shadow-stalkers',
	'Courts employ blind deaf-mute adjudicators to prevent auditory voice compulsion',
	'Casters are branded with silver tattoos at puberty and monitored by the Inquisition',
	'Currency is denominated not in gold, but in stabilized fuel catalysts',
	'Fortresses are built with rounded walls and zero sharp corners to prevent rune circuits'
];

export function generateRandomSpark(): MagicBlueprint {
	const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
	const id = 'spark-' + Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 6);

	const adjectives = ['Ashen', 'Umbral', 'Harmonic', 'Somatic', 'Crystalline', 'Obsidian', 'Verdant', 'Gilded'];
	const nouns = ['Sympathy', 'Resonance', 'Transmutation', 'Weave', 'Tithe', 'Circuit', 'Oaths', 'Catalyst'];

	const name = `${rand(adjectives)} ${rand(nouns)}`;
	const now = new Date().toISOString();

	return {
		id,
		name,
		summary: `A hard magic system where power is fueled by ${rand(SPARK_COSTS).toLowerCase()}, bound by strict limitations.`,
		hardness: 4,
		source: rand(SPARK_SOURCES),
		vector: rand(SPARK_VECTORS),
		cost: rand(SPARK_COSTS),
		limitations: rand(SPARK_LIMITATIONS),
		fallout: rand(SPARK_FALLOUTS),
		createdAt: now,
		updatedAt: now
	};
}

// ============================================================================
// Socratic Loopholes & Stress-Testing Auditor
// ============================================================================

export function auditMagicLoopholes(bp: MagicBlueprint): LoopholeAuditReport {
	const critiques: LoopholeAuditReport['critiques'] = [];
	const text = `${bp.name} ${bp.source} ${bp.vector} ${bp.cost} ${bp.limitations} ${bp.fallout}`.toLowerCase();

	// 1. The Military Question
	const hasMilitaryMention = text.includes('war') || text.includes('army') || text.includes('soldier') || text.includes('armor') || text.includes('weapon') || text.includes('fortress');
	if (!hasMilitaryMention) {
		critiques.push({
			category: 'Military',
			title: 'Unaccounted Military Exploitation',
			status: 'warning',
			observation: 'No mention of how armies, warlords, or empires weaponize or defend against this magic in warfare.',
			recommendation: 'Specify how common soldiers counter casters (e.g., iron shields, dampening wool, flanking tactics, sniper crossbows).'
		});
	} else {
		critiques.push({
			category: 'Military',
			title: 'Tactical War Adaptation',
			status: 'pass',
			observation: 'Military tactics or arms races are accounted for in the system fallout.',
			recommendation: 'Ensure small squad battles in your draft reflect these military countermeasures.'
		});
	}

	// 2. The Economy Question
	const hasInfiniteResource = text.includes('gold') || text.includes('create') || text.includes('free') || text.includes('infinite') || text.includes('matter from nothing');
	const hasConservation = text.includes('cannot create') || text.includes('conservation') || text.includes('cost') || text.includes('expensive') || text.includes('fuel');
	if (hasInfiniteResource && !hasConservation) {
		critiques.push({
			category: 'Economy',
			title: 'Economic Hyper-Inflation Risk',
			status: 'alert',
			observation: 'System suggests matter creation or transmutation without strict conservation, which would collapse medieval/trade economies.',
			recommendation: 'Add an iron rule: magic cannot create precious metals or food, or magic-created goods dissolve after 12 hours.'
		});
	} else {
		critiques.push({
			category: 'Economy',
			title: 'Economic Stability & Trade',
			status: 'pass',
			observation: 'Scarcity and tangible fuel costs protect against currency collapse and infinite resource exploits.',
			recommendation: 'Feature black-market prices for catalysts or fuels in character dialogue.'
		});
	}

	// 3. The Antagonist Loophole Question
	const hasCannot = text.includes('cannot') || text.includes('never') || text.includes('only') || text.includes('must not');
	if (!hasCannot) {
		critiques.push({
			category: 'Antagonist',
			title: 'Missing "Cannot" Constraints',
			status: 'alert',
			observation: 'No strict negative constraints found. A ruthless antagonist with vast resources has no physical boundaries to overcome.',
			recommendation: 'Add at least two strict "CANNOT" laws (e.g. Cannot affect iron, cannot penetrate running water, cannot resurrect souls).'
		});
	} else {
		critiques.push({
			category: 'Antagonist',
			title: 'Firm Limitation Boundary',
			status: 'pass',
			observation: 'Strict negative rules constrain what power cannot achieve, giving clever protagonists and antagonists defined obstacles.',
			recommendation: 'Let the antagonist discover an unexpected consequence of the limitation rather than breaking it.'
		});
	}

	// 4. The Climax Stakes Question
	const hasHighCost = text.includes('permanent') || text.includes('loss') || text.includes('chill') || text.includes('blood') || text.includes('exhaust') || text.includes('burn');
	if (!hasHighCost) {
		critiques.push({
			category: 'Climax',
			title: 'Low Stakes / Cheap Miracles',
			status: 'warning',
			observation: 'Casting cost appears trivial. If casting magic has no physical or emotional price, resolving the final battle feels cheap.',
			recommendation: 'Escalate the personal cost for maximum dramatic tension during the third-act climax.'
		});
	} else {
		critiques.push({
			category: 'Climax',
			title: 'High-Stakes Dramatic Cost',
			status: 'pass',
			observation: 'The physical, psychological, or material cost escalates with power, creating genuine dramatic peril.',
			recommendation: 'In the climax, force the protagonist to pay the ultimate personal cost to secure victory.'
		});
	}

	const alertCount = critiques.filter((c) => c.status === 'alert').length;
	const warningCount = critiques.filter((c) => c.status === 'warning').length;

	const overallScore =
		alertCount > 0 ? 'LOOPHOLE_ALERT' : warningCount > 1 ? 'NEEDS_STRENGTHENING' : 'SOLID';

	return {
		overallScore,
		critiques
	};
}

// ============================================================================
// Direct Canon Commit Bridge
// ============================================================================

export function commitMagicBlueprintToCanon(
	bp: MagicBlueprint,
	bible: WorldEntry[],
	decisions: Decision[]
): { updatedBible: WorldEntry[]; updatedDecisions: Decision[] } {
	const entryId = `mag-${bp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`;

	// Synthesize standard World Bible entry with "cannot/never/only" syntax
	const bibleText = `${bp.name} is a canonical magic system in this world.

SOURCE: ${bp.source}
MEDIUM & VECTOR: ${bp.vector}
FUEL & COST: ${bp.cost}

IRON LIMITATIONS & CANNOT LAWS:
${bp.limitations}

SOCIETAL & MILITARY FALLOUT:
${bp.fallout}
`;

	const existingIdx = bible.findIndex((e) => e.id === entryId || e.name === bp.name);
	const newEntry: WorldEntry = {
		id: entryId,
		name: bp.name,
		kind: 'magic',
		text: bibleText,
		aliases: [bp.name.toLowerCase(), `${bp.name} magic`],
		status: 'canon'
	};

	let updatedBible: WorldEntry[];
	if (existingIdx !== -1) {
		updatedBible = [...bible];
		updatedBible[existingIdx] = newEntry;
	} else {
		updatedBible = [newEntry, ...bible];
	}

	// Create locked entry in Decisions Ledger (decisions.md)
	const decisionId = `d${Date.now().toString().slice(-4)}`;
	const newDecision: Decision = {
		id: decisionId,
		date: new Date().toISOString().slice(0, 10),
		topic: `Magic System: ${bp.name}`,
		decision: `Locked 5-pillar magic rules for ${bp.name}. Hardness: ${bp.hardness}/5. Limitations: "${bp.limitations}"`,
		authorWords: `Finalized ${bp.name} rules in Magic Studio`,
		source: 'Magic System Studio (/magic)',
		affects: `bible:magic:${bp.name}`,
		status: 'locked'
	};

	const updatedDecisions = [newDecision, ...decisions];

	return {
		updatedBible,
		updatedDecisions
	};
}

// ============================================================================
// Vaelrion Combo Lab & Triangle of Power Engine
// ============================================================================

export function convertVaelrionRecipeToBlueprint(recipe: VaelrionRecipe): MagicBlueprint {
	const now = new Date().toISOString();
	// Derive a sensible hardness (default to 4 for structured hard systems)
	const hardness = recipe.coreLimitation && recipe.coreLimitation.length > 20 ? 4 : 3;

	const vectorParts: string[] = [];
	if (recipe.trigger) vectorParts.push(`Trigger: ${recipe.trigger}`);
	if (recipe.intentControl) vectorParts.push(`Control: ${recipe.intentControl}`);
	if (recipe.accessEligibility) vectorParts.push(`Access: ${recipe.accessEligibility}`);
	if (recipe.secondaryResonance) vectorParts.push(`Resonance: ${recipe.secondaryResonance}`);

	const falloutParts: string[] = [];
	if (recipe.worldIntegration) falloutParts.push(`World Integration: ${recipe.worldIntegration}`);
	if (recipe.progressionPath) falloutParts.push(`Progression: ${recipe.progressionPath}`);
	if (recipe.abuseRiskWarning) falloutParts.push(`Design Risk: ${recipe.abuseRiskWarning}`);

	return {
		id: `vaelrion-${recipe.id || Date.now().toString(36)}`,
		name: recipe.name,
		summary: `${recipe.sourceFuel} paired with ${recipe.secondaryResonance || 'strict intent'}. Effects: ${recipe.effectFamily}.`,
		hardness,
		source: recipe.sourceFuel,
		vector: vectorParts.join(' | '),
		cost: recipe.costConsequence || 'Energy drain and physical strain.',
		limitations: recipe.coreLimitation || 'Cannot violate natural conservation.',
		fallout: falloutParts.join('\n\n'),
		vaelrionRecipeId: recipe.id,
		failureMode: recipe.failureMode,
		progressionPath: recipe.progressionPath,
		bestStoryUse: recipe.bestStoryUse,
		notes: `Research Basis: ${recipe.researchBasis || 'Sanderson & World Anvil'} (${recipe.referenceUrl || 'N/A'})`,
		createdAt: now,
		updatedAt: now
	};
}

export function computeTriangleOfPower(bp: MagicBlueprint): TriangleOfPowerScore {
	const text = `${bp.name} ${bp.source} ${bp.vector} ${bp.cost} ${bp.limitations} ${bp.fallout} ${bp.summary}`.toLowerCase();

	// 1. Power / Scope Rating (1-10)
	let powerRating = 4;
	if (text.includes('portal') || text.includes('teleport') || text.includes('resurrect') || text.includes('god') || text.includes('destroy')) powerRating += 3;
	if (text.includes('blast') || text.includes('shockwave') || text.includes('transform') || text.includes('mind') || text.includes('command')) powerRating += 2;
	if (text.includes('ward') || text.includes('sensing') || text.includes('small') || text.includes('narrow') || text.includes('localized')) powerRating -= 1;
	powerRating = Math.max(1, Math.min(10, powerRating));

	// 2. Cost / Price Rating (1-10)
	let costRating = 3;
	if (text.includes('permanent') || text.includes('lifespan') || text.includes('amnesia') || text.includes('death') || text.includes('rebound')) costRating += 4;
	if (text.includes('blood') || text.includes('frostbite') || text.includes('injury') || text.includes('fatigue') || text.includes('organ')) costRating += 2;
	if (text.includes('burn') || text.includes('exhaust') || text.includes('depletion')) costRating += 1;
	if (text.includes('free') || text.includes('easy') || text.includes('effortless')) costRating -= 3;
	costRating = Math.max(1, Math.min(10, costRating));

	// 3. Limitation / Boundary Rating (1-10)
	let limitationRating = 3;
	const cannotMatches = (text.match(/cannot|never|only|must not|fails if|requires/g) || []).length;
	limitationRating += Math.min(5, cannotMatches * 1.5);
	if (text.includes('range') || text.includes('line of sight') || text.includes('closed') || text.includes('touch')) limitationRating += 1;
	limitationRating = Math.round(Math.max(1, Math.min(10, limitationRating)));

	// Balance Evaluation according to Sanderson's Second Law (Limitations > Powers)
	let balanceState: TriangleOfPowerScore['balanceState'] = 'BALANCED';
	let verdict = 'Balanced System: Powers and checks are evenly weighted.';
	let recommendation = 'Maintain the established boundaries during climactic set pieces.';

	if (limitationRating >= powerRating + 1 && costRating >= 4) {
		balanceState = 'STRONG_LIMITATIONS';
		verdict = 'Sanderson Ideal (Limitations > Powers): Deep narrative tension and creative problem solving.';
		recommendation = 'Highlight clever character circumventions of the rules rather than overpowering enemies.';
	} else if (powerRating > limitationRating + 2 && costRating < 5) {
		balanceState = 'OVERPOWERED_RISK';
		verdict = 'Overpowered Alert: Abilities outstrip costs and limitations.';
		recommendation = 'Introduce strict "CANNOT" laws or increase personal toll to prevent tension deflation.';
	} else if (costRating >= 8 && powerRating <= 4) {
		balanceState = 'CRIPPLING_COST';
		verdict = 'Excessive Penalty: The cost is so catastrophic that characters can almost never justify using it.';
		recommendation = 'Add tiered costs: minor casting causes fatigue, extreme casting triggers permanent consequences.';
	}

	return {
		powerRating,
		costRating,
		limitationRating,
		balanceState,
		verdict,
		recommendation
	};
}

export function buildRecipeFromBlocks(
	source: VaelrionBuildingBlock,
	resonance: VaelrionBuildingBlock,
	trigger: VaelrionBuildingBlock,
	effect: VaelrionBuildingBlock,
	cost: VaelrionBuildingBlock,
	limitation: VaelrionBuildingBlock
): MagicBlueprint {
	const now = new Date().toISOString();
	const name = `${source.name.split('/')[0].trim()} + ${resonance.name.split('/')[0].trim()}`;
	const id = 'combo-' + Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 6);

	return {
		id,
		name,
		summary: `${source.name} modified by ${resonance.name}. Manifests as ${effect.name.toLowerCase()} effects.`,
		hardness: 4,
		source: `${source.name}: ${source.meaning}. (Strengths: ${source.strengths})`,
		vector: `Trigger: ${trigger.name} (${trigger.meaning}) | Modulated by: ${resonance.name} (${resonance.meaning})`,
		cost: `${cost.name}: ${cost.meaning}. Risk: ${cost.risks}`,
		limitations: `Iron Rule: ${limitation.name} constraints apply. ${limitation.meaning}. Cannot bypass ${limitation.name.toLowerCase()} boundaries.`,
		fallout: `Societal Impact: World built around ${source.name.toLowerCase()} availability. Military employs specialized counters against ${effect.name.toLowerCase()}.`,
		failureMode: `Backfire: ${cost.risks || 'Unstable rebound disrupting caster equilibrium'}.`,
		progressionPath: `Masters refine ${trigger.name.toLowerCase()} and minimize ${cost.name.toLowerCase()} exposure.`,
		bestStoryUse: `High-stakes problem solving where overcoming ${limitation.name.toLowerCase()} creates dramatic tension.`,
		createdAt: now,
		updatedAt: now
	};
}

export function generateRandomVaelrionCombo(): MagicBlueprint {
	const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

	const sources = VAELRION_BUILDING_BLOCKS.filter((b) => b.category === 'Source / Fuel');
	const resonances = VAELRION_BUILDING_BLOCKS.filter((b) => b.category === 'Resonance / Modifier');
	const triggers = VAELRION_BUILDING_BLOCKS.filter((b) => b.category === 'Trigger');
	const effects = VAELRION_BUILDING_BLOCKS.filter((b) => b.category === 'Effect Family');
	const costs = VAELRION_BUILDING_BLOCKS.filter((b) => b.category === 'Cost');
	const limitations = VAELRION_BUILDING_BLOCKS.filter((b) => b.category === 'Limitation');

	return buildRecipeFromBlocks(
		rand(sources),
		rand(resonances),
		rand(triggers),
		rand(effects),
		rand(costs),
		rand(limitations)
	);
}

