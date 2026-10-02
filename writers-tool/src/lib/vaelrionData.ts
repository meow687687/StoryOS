// Auto-generated from Vaelrion_Magic_System_Combo_Lab.xlsx
export interface VaelrionRecipe {
  id: string;
  name: string;
  sourceFuel: string;
  secondaryResonance: string;
  accessEligibility: string;
  intentControl: string;
  trigger: string;
  effectFamily: string;
  coreLimitation: string;
  costConsequence: string;
  failureMode: string;
  progressionPath: string;
  worldIntegration: string;
  bestStoryUse: string;
  abuseRiskWarning: string;
  researchBasis: string;
  referenceUrl: string;
}

export interface VaelrionBuildingBlock {
  category: 'Source / Fuel' | 'Resonance / Modifier' | 'Trigger' | 'Effect Family' | 'Cost' | 'Limitation';
  name: string;
  meaning: string;
  strengths: string;
  risks: string;
  canCombineWith: string;
}

export interface VaelrionResearchNote {
  source: string;
  principle: string;
  application: string;
  url: string;
}

export const VAELRION_RECIPES: VaelrionRecipe[] = [
  {
    "id": "1",
    "name": "Leyline + Geometry",
    "sourceFuel": "Ambient magical field / leyline flow",
    "secondaryResonance": "Geometric structure",
    "accessEligibility": "Only users who can sense/align with local flow",
    "intentControl": "Shape and route the field through patterns",
    "trigger": "Trace or construct a valid geometric form",
    "effectFamily": "Barriers, blasts, wards, portals, area control",
    "coreLimitation": "Works only where the local field is strong enough; geometry must be correct",
    "costConsequence": "Pattern setup time; wrong geometry can rebound",
    "failureMode": "Feedback burns or distorts the pattern and can injure the caster",
    "progressionPath": "Learn more complex structures; improve sensing range; reduce setup time",
    "worldIntegration": "Cities, roads, ruins, temples and fortifications can be built around magical geometry",
    "bestStoryUse": "Sieges, ancient ruins, engineering, puzzle-like magic",
    "abuseRiskWarning": "Can become universal problem-solver if geometry has no strict scope",
    "researchBasis": "World Anvil: magic as natural law; Sanderson: limitations create strategy",
    "referenceUrl": "https://academy.worldanvil.com/blog/magic-systems-worldbuilders-guide ; https://www.brandonsanderson.com/blogs/blog/sandersons-second-law"
  },
  {
    "id": "2",
    "name": "Weather + Emotional Resonance",
    "sourceFuel": "Atmospheric energy",
    "secondaryResonance": "Emotional state acts as a modifier",
    "accessEligibility": "Users with a matching affinity to a weather pattern",
    "intentControl": "Emotion influences intensity, not basic access",
    "trigger": "Breath, gesture, or entering a weather condition",
    "effectFamily": "Wind, rain, pressure, static, fog, temperature shifts",
    "coreLimitation": "Mood cannot create weather from nothing; scale depends on available atmosphere",
    "costConsequence": "Repeated use reinforces the triggering emotional state",
    "failureMode": "Loss of control during emotional spikes; local weather backlash",
    "progressionPath": "Emotional regulation + environmental awareness",
    "worldIntegration": "Weather-sensitive agriculture, sailing, festivals, war logistics",
    "bestStoryUse": "Character-driven magic where psychology matters",
    "abuseRiskWarning": "Avoid 'angry = fire'; emotional state should modify a defined capability",
    "researchBasis": "Sanderson: tying limits to character depth; World Anvil: emotion/perception as a magic category",
    "referenceUrl": "https://www.brandonsanderson.com/blogs/blog/sandersons-second-law ; https://academy.worldanvil.com/blog/magic-systems-worldbuilders-guide"
  },
  {
    "id": "3",
    "name": "Celestial Cycle + Blood",
    "sourceFuel": "Solar/lunar/cosmic conditions",
    "secondaryResonance": "Blood acts as a biological key",
    "accessEligibility": "Rare users whose blood can synchronize with a celestial event",
    "intentControl": "Channel a celestial condition into one defined effect",
    "trigger": "Ritual at a specific celestial phase",
    "effectFamily": "Gates, enhancement, divination, light distortion",
    "coreLimitation": "Only works during narrow celestial windows",
    "costConsequence": "Blood loss and long-term physical depletion",
    "failureMode": "Wrong timing can partially open the effect and strand energy",
    "progressionPath": "Better prediction; more efficient blood use; access to rarer events",
    "worldIntegration": "Calendars, observatories, royal astrologers, pilgrimage sites",
    "bestStoryUse": "Major rituals, rare emergencies, ancient prophecy",
    "abuseRiskWarning": "If every rare event solves the plot, tension collapses",
    "researchBasis": "World Anvil: special conditions/limitations; research notes on cost vs limitation",
    "referenceUrl": "https://blog.worldanvil.com/worldbuilding/creating-magic-items-the-triangle-of-power/"
  },
  {
    "id": "4",
    "name": "Geological Pressure + Ritual",
    "sourceFuel": "Heat, pressure and mineral energy",
    "secondaryResonance": "Ritual sequence",
    "accessEligibility": "Users trained to read local geology",
    "intentControl": "Release or redirect stored geological force",
    "trigger": "Pressure-point activation via tools or stance",
    "effectFamily": "Stone shaping, shockwaves, seismic sensing, mineral growth",
    "coreLimitation": "Must be connected to a compatible geological structure",
    "costConsequence": "Physical strain and internal pressure injuries",
    "failureMode": "Local fractures or cave-ins",
    "progressionPath": "Study geology; improve precision; use different minerals",
    "worldIntegration": "Mines, mountains, volcanic zones and fortresses become strategic resources",
    "bestStoryUse": "Mining economies, warfare, ancient ruins",
    "abuseRiskWarning": "Avoid continent-scale earthquakes without proportional setup and cost",
    "researchBasis": "World Anvil: natural/elemental magic; Sanderson: meaningful limits",
    "referenceUrl": "https://academy.worldanvil.com/blog/magic-systems-worldbuilders-guide ; https://www.brandonsanderson.com/blogs/blog/sandersons-second-law"
  },
  {
    "id": "5",
    "name": "Life Force + Symbiosis",
    "sourceFuel": "Living biological energy",
    "secondaryResonance": "Bond with a creature, plant, or ecosystem",
    "accessEligibility": "Users capable of sustaining a stable symbiotic link",
    "intentControl": "Borrow or exchange biological functions",
    "trigger": "Touch, feeding, shared breath, or maintained bond",
    "effectFamily": "Healing, enhanced senses, adaptation, rapid growth",
    "coreLimitation": "Cannot create life from nothing; borrowed traits depend on the partner",
    "costConsequence": "The user also takes on strain, pain, or metabolic demand",
    "failureMode": "If the bond breaks abruptly, both sides can be harmed",
    "progressionPath": "Deepen the bond; establish multiple specialized partnerships",
    "worldIntegration": "Biomes and species evolve around magical symbiosis",
    "bestStoryUse": "Exploration, survival, companion bonds",
    "abuseRiskWarning": "Can erase physical danger if adaptation is too broad",
    "researchBasis": "World Anvil: life/nature and transformation categories; cost/limit framework",
    "referenceUrl": "https://academy.worldanvil.com/blog/magic-systems-worldbuilders-guide"
  },
  {
    "id": "6",
    "name": "Sound + Rhythm + Breath",
    "sourceFuel": "Acoustic energy",
    "secondaryResonance": "Rhythm and breathing pattern",
    "accessEligibility": "Users trained in precise vocal or percussive control",
    "intentControl": "Shape effects through frequency, tempo, and resonance",
    "trigger": "Voice, instrument, stomp, pulse, or synchronized breathing",
    "effectFamily": "Stunning, vibration, barriers, communication, structural resonance",
    "coreLimitation": "Range and effect depend on uninterrupted rhythm and line-of-effect",
    "costConsequence": "Breath exhaustion, hearing damage, vocal injury",
    "failureMode": "Broken rhythm can invert or collapse the effect",
    "progressionPath": "Faster recovery, wider frequency control, complex multi-phase patterns",
    "worldIntegration": "Music, military signals, rituals, architecture, communication networks",
    "bestStoryUse": "Battles, ceremonies, teamwork, covert signaling",
    "abuseRiskWarning": "Do not let any sound produce any effect; define frequency bands or effect families",
    "researchBasis": "World Anvil: symbols/sound-adjacent categories; Sanderson: clear rules enable problem solving",
    "referenceUrl": "https://academy.worldanvil.com/blog/magic-systems-worldbuilders-guide ; https://www.brandonsanderson.com/faq/knowledge-base/what-are-sandersons-laws-of-magic/"
  },
  {
    "id": "7",
    "name": "Light + Shadow + Line of Sight",
    "sourceFuel": "Light and absence of light",
    "secondaryResonance": "Position and visual geometry",
    "accessEligibility": "Users able to perceive magical light/shadow boundaries",
    "intentControl": "Manipulate existing light/shadow relationships",
    "trigger": "Direct gaze, hand line, or aligned surfaces",
    "effectFamily": "Illusions, concealment, refraction, blinding, shadow shaping",
    "coreLimitation": "Cannot affect what the user cannot establish a visual relation to",
    "costConsequence": "Temporary eye strain or sensory distortion",
    "failureMode": "Self-blindness or accidental concealment of allies",
    "progressionPath": "Better perception; indirect reflection tricks; multi-target control",
    "worldIntegration": "Architecture and clothing evolve around anti-glare, reflective and shadow-resistant materials",
    "bestStoryUse": "Stealth, investigation, duels, horror scenes",
    "abuseRiskWarning": "Avoid turning it into generic teleportation or omniscience",
    "researchBasis": "Sanderson: limitations should create tactical decisions",
    "referenceUrl": "https://www.brandonsanderson.com/blogs/blog/sandersons-second-law"
  },
  {
    "id": "8",
    "name": "Heat + Conservation",
    "sourceFuel": "Thermal energy",
    "secondaryResonance": "Energy transfer",
    "accessEligibility": "Users with thermal sensitivity or training",
    "intentControl": "Move, store, or redistribute heat rather than create it freely",
    "trigger": "Touch, conductive medium, or thermal focus",
    "effectFamily": "Heating, cooling, melting, frost, thermal shields",
    "coreLimitation": "Heat must come from somewhere and go somewhere",
    "costConsequence": "Burns, hypothermia, dehydration",
    "failureMode": "Runaway thermal feedback can injure the user",
    "progressionPath": "Increase storage capacity and transfer efficiency",
    "worldIntegration": "Cooking, metallurgy, medicine, climate control, warfare",
    "bestStoryUse": "Industrial worldbuilding and clever combat",
    "abuseRiskWarning": "Without conservation, every fight becomes an instant win button",
    "researchBasis": "World Anvil: price/logic thought experiments; Sanderson: power should meet limitations",
    "referenceUrl": "https://blog.worldanvil.com/worldbuilding/magic-systems-getting-started-worldbuilding/ ; https://www.brandonsanderson.com/blogs/blog/sandersons-second-law"
  },
  {
    "id": "9",
    "name": "Motion + Momentum",
    "sourceFuel": "Kinetic energy",
    "secondaryResonance": "User's own motion/momentum",
    "accessEligibility": "Users able to sense and synchronize with motion",
    "intentControl": "Amplify, redirect, dampen, or transfer momentum",
    "trigger": "Physical movement or contact with a moving object",
    "effectFamily": "Dash, impact redirection, projectile control, braking",
    "coreLimitation": "Cannot create infinite momentum; needs an existing vector",
    "costConsequence": "Joint/muscle strain and accumulated recoil",
    "failureMode": "Misread vector sends the user in the wrong direction",
    "progressionPath": "Better vector reading; chained redirects; finer damping",
    "worldIntegration": "Transportation, construction, sports, martial arts and siegecraft",
    "bestStoryUse": "Highly tactical combat",
    "abuseRiskWarning": "Make physics-like rules consistent and readable",
    "researchBasis": "Sanderson: limitations create struggle and clever solutions",
    "referenceUrl": "https://www.brandonsanderson.com/blogs/blog/sandersons-second-law"
  },
  {
    "id": "10",
    "name": "Gravity + Anchors",
    "sourceFuel": "Gravitational interaction",
    "secondaryResonance": "Physical or magical anchors",
    "accessEligibility": "Users who can establish a valid anchor point",
    "intentControl": "Increase, reduce, or redirect local pull within a set zone",
    "trigger": "Touch, marked anchor, or fixed object",
    "effectFamily": "Weight shifts, pinning, leaps, localized gravity wells",
    "coreLimitation": "Must remain within a defined radius and anchor network",
    "costConsequence": "Vertigo, crushed joints, balance loss",
    "failureMode": "Anchor failure can fling the user or collapse the zone",
    "progressionPath": "More anchors, better precision, lower radius cost",
    "worldIntegration": "Fortifications, elevators, ships, architecture, battlefield control",
    "bestStoryUse": "Tactical combat and engineering",
    "abuseRiskWarning": "Avoid global gravity manipulation early",
    "researchBasis": "Sanderson: limitation > raw power; World Anvil: limitation/condition",
    "referenceUrl": "https://www.brandonsanderson.com/blogs/blog/sandersons-second-law ; https://academy.worldanvil.com/blog/magic-systems-worldbuilders-guide"
  },
  {
    "id": "11",
    "name": "Memory + Information",
    "sourceFuel": "Recorded or retained information",
    "secondaryResonance": "Memory as the medium",
    "accessEligibility": "Users with unusually strong recall or trained mnemonic techniques",
    "intentControl": "Reconstruct, compare, or externalize remembered information",
    "trigger": "Deliberate recall of a specific memory",
    "effectFamily": "Echoes, memory playback, pattern detection, truth reconstruction",
    "coreLimitation": "Cannot retrieve memories that never existed or were destroyed beyond recovery",
    "costConsequence": "Using memories erodes clarity or emotional attachment",
    "failureMode": "Important memories may become fragmented or inaccurate",
    "progressionPath": "Improved indexing, greater recall precision, safer storage",
    "worldIntegration": "Courts, historians, spies, libraries, oral traditions",
    "bestStoryUse": "Mystery solving and investigation",
    "abuseRiskWarning": "Do not let it become perfect lie detection or omniscience",
    "researchBasis": "World Anvil: perception/mind category; opacity between creator, character, reader",
    "referenceUrl": "https://academy.worldanvil.com/blog/magic-systems-worldbuilders-guide ; https://blog.worldanvil.com/worldbuilding/magic-systems-getting-started-worldbuilding/"
  },
  {
    "id": "12",
    "name": "Names + Language",
    "sourceFuel": "Semantic / linguistic power",
    "secondaryResonance": "True naming or precise language",
    "accessEligibility": "Users who understand the target well enough to name it accurately",
    "intentControl": "A statement defines, binds, or redirects a limited property",
    "trigger": "Spoken or written phrase using a valid name",
    "effectFamily": "Binding, command, identification, weakening, unlocking",
    "coreLimitation": "A name only affects the property it truly corresponds to; false understanding fails",
    "costConsequence": "Voice, memory, or vocabulary degradation with repeated high-level use",
    "failureMode": "Misnaming can cause unpredictable semantic backlash",
    "progressionPath": "Learn older languages; discover deeper meanings; improve linguistic precision",
    "worldIntegration": "Politics, law, religion, education and archives become magical power centers",
    "bestStoryUse": "Mystery, diplomacy, ancient lore",
    "abuseRiskWarning": "If names control everything, every conflict becomes a naming contest",
    "researchBasis": "World Anvil: runes/language; Sanderson: rules and reader understanding",
    "referenceUrl": "https://academy.worldanvil.com/blog/magic-systems-worldbuilders-guide ; https://www.brandonsanderson.com/faq/knowledge-base/what-are-sandersons-laws-of-magic/"
  },
  {
    "id": "13",
    "name": "Dreams + Sleep",
    "sourceFuel": "Dream-state mental energy",
    "secondaryResonance": "Depth of sleep",
    "accessEligibility": "Users able to enter or stabilize dream states",
    "intentControl": "Alter, observe, or navigate dream constructs",
    "trigger": "Sleep, trance, or induced dream",
    "effectFamily": "Dream communication, symbolic scouting, memory processing, nightmare defense",
    "coreLimitation": "Effects weaken or fail while the target is fully awake",
    "costConsequence": "Sleep debt, hallucinations, blurred dream/reality boundaries",
    "failureMode": "Failure can trap fragments of the user's consciousness in a dream",
    "progressionPath": "Improve dream control; anchor identity; shared dream techniques",
    "worldIntegration": "Hospitals, temples, artists, spies, prisons and secret societies",
    "bestStoryUse": "Psychological arcs, mystery, surreal sequences",
    "abuseRiskWarning": "Do not let dreams become unrestricted reality editing",
    "researchBasis": "World Anvil: perception/emotion/illusion and soft vs hard utility",
    "referenceUrl": "https://academy.worldanvil.com/blog/magic-systems-worldbuilders-guide"
  },
  {
    "id": "14",
    "name": "Belief + Ritual",
    "sourceFuel": "Collective belief / faith",
    "secondaryResonance": "Ritual consensus and repetition",
    "accessEligibility": "Users connected to a community or doctrine",
    "intentControl": "Ritual creates a shared magical pattern",
    "trigger": "Repeated ceremony, collective prayer, symbolic action",
    "effectFamily": "Wards, blessings, communal protection, miracles with narrow scope",
    "coreLimitation": "Strength depends on participation, continuity, or coherence",
    "costConsequence": "Loss of faith can destabilize an established effect",
    "failureMode": "Backlash can affect an entire community",
    "progressionPath": "Grow networks, refine rituals, preserve traditions",
    "worldIntegration": "Religion influences politics, festivals, law and architecture",
    "bestStoryUse": "Faction building and cultural worldbuilding",
    "abuseRiskWarning": "Avoid literal 'belief makes anything true'; define fixed domains",
    "researchBasis": "World Anvil: divine magic and cultural integration; Sanderson: magic should serve story",
    "referenceUrl": "https://academy.worldanvil.com/blog/magic-systems-worldbuilders-guide"
  },
  {
    "id": "15",
    "name": "Oath + Contract",
    "sourceFuel": "Binding force of promises",
    "secondaryResonance": "Intent and exact wording",
    "accessEligibility": "Only participants who knowingly accept the terms",
    "intentControl": "Magic enforces declared conditions",
    "trigger": "Spoken oath, written contract, blood seal, or mutual consent",
    "effectFamily": "Restrictions, protection, compelled conditions, penalties",
    "coreLimitation": "The magic can enforce only what was clearly agreed",
    "costConsequence": "Breaking terms causes a proportional consequence",
    "failureMode": "Ambiguous wording can produce literal or unintended outcomes",
    "progressionPath": "More complex contracts with greater risks and stronger safeguards",
    "worldIntegration": "Law, diplomacy, mercenary work, marriage rites, treaties",
    "bestStoryUse": "Political arcs and betrayals",
    "abuseRiskWarning": "If contracts are perfect, deception becomes impossible; allow interpretation gaps",
    "researchBasis": "World Anvil: costs/limits and divine/ritual systems",
    "referenceUrl": "https://academy.worldanvil.com/blog/magic-systems-worldbuilders-guide ; https://blog.worldanvil.com/worldbuilding/magic-systems-getting-started-worldbuilding/"
  },
  {
    "id": "16",
    "name": "Relationship + Bond",
    "sourceFuel": "Interpersonal resonance",
    "secondaryResonance": "Mutual trust, loyalty, dependency, or shared experience",
    "accessEligibility": "A relationship must be reciprocal or sufficiently meaningful",
    "intentControl": "Magic strengthens through alignment between people",
    "trigger": "Touch, proximity, shared ritual, or emotional synchronization",
    "effectFamily": "Protection, sensing, coordinated abilities, power transfer",
    "coreLimitation": "Weakens when trust/connection weakens; cannot be manufactured instantly",
    "costConsequence": "Pain or emotional shock can propagate through the bond",
    "failureMode": "One partner's collapse can destabilize the other",
    "progressionPath": "Deepen bonds; form teams; specialize complementary roles",
    "worldIntegration": "Families, armies, guilds and cultures develop bond traditions",
    "bestStoryUse": "Romance, friendship, sacrifice and teamwork",
    "abuseRiskWarning": "Avoid reducing relationships to a numeric 'friendship stat'",
    "researchBasis": "Sanderson: character depth through limitations; World Anvil: magic affects culture",
    "referenceUrl": "https://www.brandonsanderson.com/blogs/blog/sandersons-second-law ; https://academy.worldanvil.com/blog/magic-systems-worldbuilders-guide"
  },
  {
    "id": "17",
    "name": "Blood + Lineage",
    "sourceFuel": "Biological inheritance",
    "secondaryResonance": "Ancestral traits or magical markers",
    "accessEligibility": "Only compatible bloodlines can awaken it",
    "intentControl": "Inherited pattern determines a narrow ability family",
    "trigger": "Birth, initiation, or blood-keyed ritual",
    "effectFamily": "Specialized inherited techniques, sensing, adaptation",
    "coreLimitation": "Bloodline determines access, not mastery or moral worth",
    "costConsequence": "Pushing inherited traits can damage organs or shorten lifespan",
    "failureMode": "Conflicting lineages create instability",
    "progressionPath": "Mastery can move beyond family tradition through training",
    "worldIntegration": "Nobility, clans, succession and discrimination become tied to magic",
    "bestStoryUse": "Political conflict and family secrets",
    "abuseRiskWarning": "This can fight Vaelrion's theme if bloodline equals destiny; keep agency stronger than inheritance",
    "researchBasis": "World Anvil: biological/blood magic; theme-alignment principle is our synthesis",
    "referenceUrl": "https://academy.worldanvil.com/blog/magic-systems-worldbuilders-guide"
  },
  {
    "id": "18",
    "name": "Body + Metabolism",
    "sourceFuel": "The user's own biological resources",
    "secondaryResonance": "Calories, fluids, oxygen, electrolytes",
    "accessEligibility": "Any person with the physiological capacity can potentially learn it",
    "intentControl": "Convert bodily resources into a controlled magical output",
    "trigger": "Breathing pattern, pulse, movement, or muscle activation",
    "effectFamily": "Strengthening, regeneration, heat, reflexes, temporary adaptation",
    "coreLimitation": "Output limited by what the body can safely supply",
    "costConsequence": "Starvation, dehydration, tissue damage, exhaustion",
    "failureMode": "Metabolic collapse or organ failure at extremes",
    "progressionPath": "Conditioning increases safe output and recovery",
    "worldIntegration": "Medicine, athletics, military training and nutrition become magical industries",
    "bestStoryUse": "Training arcs and survival",
    "abuseRiskWarning": "Can be too close to 'stamina bar'; keep distinctive thresholds and tradeoffs",
    "researchBasis": "World Anvil: biological magic; cost/limitations guidance",
    "referenceUrl": "https://academy.worldanvil.com/blog/magic-systems-worldbuilders-guide"
  },
  {
    "id": "19",
    "name": "Sacrifice + Exchange",
    "sourceFuel": "Equivalent magical exchange",
    "secondaryResonance": "Value assigned by the system or ritual",
    "accessEligibility": "Users able to define and complete a valid exchange",
    "intentControl": "Give up one thing to obtain another",
    "trigger": "Explicit sacrifice with a clear target",
    "effectFamily": "Creation, transfer, restoration, unlocking",
    "coreLimitation": "The system cannot grant more value than the exchange can justify",
    "costConsequence": "Permanent loss of the sacrificed resource",
    "failureMode": "An invalid valuation causes incomplete or distorted outcomes",
    "progressionPath": "Learn what the system considers valuable; optimize exchanges",
    "worldIntegration": "Economy, black markets, temples and warfare revolve around magical resources",
    "bestStoryUse": "Moral dilemmas and costly miracles",
    "abuseRiskWarning": "'Equivalent exchange' gets vague fast unless value has rules",
    "researchBasis": "World Anvil: costs as inputs; Sanderson: costs must matter",
    "referenceUrl": "https://blog.worldanvil.com/worldbuilding/creating-magic-items-the-triangle-of-power/ ; https://www.brandonsanderson.com/blogs/blog/sandersons-second-law"
  },
  {
    "id": "20",
    "name": "Probability + Risk",
    "sourceFuel": "Potential outcomes / uncertainty",
    "secondaryResonance": "Risk willingly accepted",
    "accessEligibility": "Users who can perceive branching likelihoods to a limited degree",
    "intentControl": "Bias an uncertain outcome rather than guarantee it",
    "trigger": "Gamble, coin toss, deliberate risk, or chosen uncertainty",
    "effectFamily": "Chance nudging, improbable escapes, rare coincidence shaping",
    "coreLimitation": "Cannot directly force a deterministic event",
    "costConsequence": "The user takes on accumulating risk or misfortune elsewhere",
    "failureMode": "Bad probability debt creates cascading failure",
    "progressionPath": "Improve forecasting, narrow the choice set, reduce collateral risk",
    "worldIntegration": "Gambling, insurance, markets, warfare and divination change dramatically",
    "bestStoryUse": "High-stakes plots and mind games",
    "abuseRiskWarning": "Can destroy tension if it guarantees success",
    "researchBasis": "World Anvil: balance and plot-breaking caution; our synthesis of risk as limitation",
    "referenceUrl": "https://academy.worldanvil.com/blog/magic-systems-worldbuilders-guide"
  },
  {
    "id": "21",
    "name": "Entropy + Decay",
    "sourceFuel": "Natural tendency toward breakdown",
    "secondaryResonance": "Time exposed to the target",
    "accessEligibility": "Users trained to identify structural weakness",
    "intentControl": "Accelerate or redirect decay already present",
    "trigger": "Touch, mark, or prolonged observation",
    "effectFamily": "Rust, rot, fatigue, erosion, entropy sensing",
    "coreLimitation": "Cannot destroy anything instantly if there is no vulnerable process to accelerate",
    "costConsequence": "The caster's own tissues or tools may age faster",
    "failureMode": "Feedback can cause local uncontrolled decay",
    "progressionPath": "Improve precision; choose specific materials or processes",
    "worldIntegration": "Architecture, warfare, archaeology and waste management adapt to it",
    "bestStoryUse": "Dark magic, ruins, assassinations, environmental storytelling",
    "abuseRiskWarning": "If it becomes instant disintegration, every physical defense is useless",
    "researchBasis": "World Anvil: necromancy/decay and limitations; Sanderson: weaknesses should create interesting play",
    "referenceUrl": "https://academy.worldanvil.com/blog/magic-systems-worldbuilders-guide ; https://www.brandonsanderson.com/blogs/blog/sandersons-second-law"
  },
  {
    "id": "22",
    "name": "Time + Duration",
    "sourceFuel": "Temporal flow",
    "secondaryResonance": "Duration and rate differentials",
    "accessEligibility": "Rare practitioners who can sense temporal states",
    "intentControl": "Speed up, slow down, or preserve a defined interval",
    "trigger": "Marking a duration, synchronized pulse, or prepared field",
    "effectFamily": "Acceleration, slowing, stasis of small targets, time-window manipulation",
    "coreLimitation": "No true reversal without a separate, much rarer rule",
    "costConsequence": "Aging, lost subjective time, memory gaps",
    "failureMode": "Temporal misalignment leaves the user out of sync",
    "progressionPath": "Increase precision, shrink affected area, improve synchronization",
    "worldIntegration": "Calendars, medicine, transport and war planning are transformed",
    "bestStoryUse": "Late-stage magic and ancient phenomena",
    "abuseRiskWarning": "Time magic is inherently plot-breaking unless tightly scoped",
    "researchBasis": "World Anvil: plot-breaking risk; Sanderson: limitations and consistency",
    "referenceUrl": "https://academy.worldanvil.com/blog/magic-systems-worldbuilders-guide ; https://www.brandonsanderson.com/blogs/blog/sandersons-second-law"
  },
  {
    "id": "23",
    "name": "Space + Distance",
    "sourceFuel": "Spatial geometry",
    "secondaryResonance": "Distance and connected locations",
    "accessEligibility": "Users who can establish two valid spatial references",
    "intentControl": "Reduce effective distance or create a short-lived connection",
    "trigger": "Paired marks, line, map, coordinate or anchor",
    "effectFamily": "Short teleport, portals, storage folds, spatial sensing",
    "coreLimitation": "Only works between prepared/known anchors or within a fixed range",
    "costConsequence": "Disorientation, spatial sickness, tissue shear",
    "failureMode": "Bad coordinates create partial displacement or failed transit",
    "progressionPath": "More stable anchors, longer range, safer payloads",
    "worldIntegration": "Trade, military logistics, diplomacy and geography change",
    "bestStoryUse": "Travel, exploration and escape sequences",
    "abuseRiskWarning": "Teleportation can trivialize travel if unrestricted",
    "researchBasis": "World Anvil: source/utility and limitations",
    "referenceUrl": "https://academy.worldanvil.com/blog/magic-systems-worldbuilders-guide ; https://blog.worldanvil.com/worldbuilding/magic-systems-getting-started-worldbuilding/"
  },
  {
    "id": "24",
    "name": "Artifact + Attunement",
    "sourceFuel": "Stored magical charge in an object",
    "secondaryResonance": "Compatibility / attunement",
    "accessEligibility": "Only compatible users can draw full performance",
    "intentControl": "Object defines a narrow function",
    "trigger": "Touch, command phrase, blood, gesture, or insertion of a key",
    "effectFamily": "Weapons, tools, shields, gates, storage, utility effects",
    "coreLimitation": "Artifact has a defined function and cannot exceed its internal design",
    "costConsequence": "Attunement strain, ownership conflict, or gradual personality influence",
    "failureMode": "Using beyond design causes cracking, backlash, or loss of function",
    "progressionPath": "Repair, upgrade, attune multiple compatible artifacts",
    "worldIntegration": "Museums, royal vaults, black markets, inheritance and archaeology",
    "bestStoryUse": "Ancient relics and progression",
    "abuseRiskWarning": "Artifacts must not become universal Swiss-army magic",
    "researchBasis": "World Anvil: enchanted objects and Triangle of Power",
    "referenceUrl": "https://academy.worldanvil.com/blog/magic-systems-worldbuilders-guide ; https://blog.worldanvil.com/worldbuilding/creating-magic-items-the-triangle-of-power/"
  },
  {
    "id": "25",
    "name": "Spirit + Territory",
    "sourceFuel": "Local spiritual/ecological presence",
    "secondaryResonance": "Place-based affinity",
    "accessEligibility": "Users recognized by or allied with local spirits",
    "intentControl": "Negotiate, borrow, or command a limited local phenomenon",
    "trigger": "Offering, pact, ritual boundary, or ecological interaction",
    "effectFamily": "Animal influence, plant growth, weatherlet effects, local wards, sensing",
    "coreLimitation": "Power drops sharply outside the spirit's domain",
    "costConsequence": "Debt to the spirit, changed behavior, territorial obligations",
    "failureMode": "Spirit rejection or ecological backlash",
    "progressionPath": "Build reputation with spirits; learn local ecosystems",
    "worldIntegration": "Settlements, sacred groves, rivers and mountains gain magical politics",
    "bestStoryUse": "Exploration and culture-specific magic",
    "abuseRiskWarning": "Avoid turning every region into a generic elemental biome",
    "researchBasis": "World Anvil: nature, divine and regional magic; magic tied to culture",
    "referenceUrl": "https://academy.worldanvil.com/blog/magic-systems-worldbuilders-guide"
  },
  {
    "id": "26",
    "name": "Emotion + Sensory Feedback",
    "sourceFuel": "Emotional arousal / affective energy",
    "secondaryResonance": "Sensory stimulus",
    "accessEligibility": "Users whose nervous system can channel a specific emotional band",
    "intentControl": "Intensity and stability of emotion affect precision",
    "trigger": "Touch, smell, sound, memory trigger, or controlled stimulus",
    "effectFamily": "Barriers, enhancement, fear suppression, empathy, sensory alteration",
    "coreLimitation": "Emotion cannot broaden the base ability; it only modulates it",
    "costConsequence": "Emotional aftereffects and sensory overload",
    "failureMode": "Feedback can imprint another person's emotion onto the caster",
    "progressionPath": "Training in emotional regulation and sensory gating",
    "worldIntegration": "Medicine, therapy, interrogation, performance and combat doctrine",
    "bestStoryUse": "Character development and psychologically tense scenes",
    "abuseRiskWarning": "Avoid making emotions moral labels or simple power currencies",
    "researchBasis": "Sanderson: mood-linked limitations; World Anvil: emotion/mind category",
    "referenceUrl": "https://www.brandonsanderson.com/blogs/blog/sandersons-second-law ; https://academy.worldanvil.com/blog/magic-systems-worldbuilders-guide"
  },
  {
    "id": "27",
    "name": "Knowledge + Understanding",
    "sourceFuel": "Information about systems",
    "secondaryResonance": "Depth of comprehension",
    "accessEligibility": "Users who genuinely understand the target domain",
    "intentControl": "Magic becomes more precise as understanding improves",
    "trigger": "Study, observation, diagrams, experimentation, teaching",
    "effectFamily": "Manipulating known structures, analysis, counter-magic",
    "coreLimitation": "Unknown mechanisms resist or cannot be safely altered",
    "costConsequence": "Cognitive overload, headaches, memory saturation",
    "failureMode": "False understanding produces a wrong or dangerous result",
    "progressionPath": "Study expands capability without automatically raising raw power",
    "worldIntegration": "Academies, libraries, research guilds and magical professions become central",
    "bestStoryUse": "Mystery, science-like magic and progression",
    "abuseRiskWarning": "Can punish ignorance so hard that characters need exposition dumps",
    "researchBasis": "Sanderson: reader understanding and consistent rule use; World Anvil: hard systems as riddle-like",
    "referenceUrl": "https://www.brandonsanderson.com/faq/knowledge-base/what-are-sandersons-laws-of-magic/ ; https://blog.worldanvil.com/worldbuilding/magic-systems-getting-started-worldbuilding/"
  },
  {
    "id": "28",
    "name": "Architecture + Spatial Pattern",
    "sourceFuel": "Built environment / geometry",
    "secondaryResonance": "Structures act as magical circuits",
    "accessEligibility": "Users trained to construct or inhabit compatible structures",
    "intentControl": "Building layout determines how force flows",
    "trigger": "Activation at keystones, doors, foundations or alignments",
    "effectFamily": "Wards, storage, communication, transport, city-scale effects",
    "coreLimitation": "The structure must remain intact and correctly aligned",
    "costConsequence": "Repair burden, resource cost, dependency on fixed sites",
    "failureMode": "Damage to a keystone can cascade through the entire network",
    "progressionPath": "More efficient designs, modular structures, portable anchors",
    "worldIntegration": "Cities become magical machines; architecture becomes strategic",
    "bestStoryUse": "Worldbuilding, sieges, ancient cities and civilization design",
    "abuseRiskWarning": "If buildings can do everything, mobile characters become irrelevant",
    "researchBasis": "World Anvil: magic integrated into technology/culture; limitations create story",
    "referenceUrl": "https://academy.worldanvil.com/blog/magic-systems-worldbuilders-guide ; https://blog.worldanvil.com/worldbuilding/how-to-start-a-new-world/"
  },
  {
    "id": "29",
    "name": "Music + Group Synchronization",
    "sourceFuel": "Collective rhythm / harmonic resonance",
    "secondaryResonance": "Multiple users acting as one system",
    "accessEligibility": "Requires synchronized participants with compatible patterns",
    "intentControl": "Group intent determines combined effect",
    "trigger": "Singing, instruments, movement, or coordinated breathing",
    "effectFamily": "Large barriers, boosts, communication, ceremonial effects",
    "coreLimitation": "Every participant must stay synchronized; complexity rises with group size",
    "costConsequence": "Shared fatigue and feedback across the group",
    "failureMode": "One broken link can destabilize the whole formation",
    "progressionPath": "Training improves synchronization and role specialization",
    "worldIntegration": "Armies, rituals, festivals and guilds develop musical combat/utility traditions",
    "bestStoryUse": "Team battles, rituals, emotional scenes",
    "abuseRiskWarning": "Large groups can become automatic superweapons without positional constraints",
    "researchBasis": "Our synthesis using rhythm, bond, and hard-limit principles",
    "referenceUrl": "https://www.brandonsanderson.com/blogs/blog/sandersons-second-law ; https://academy.worldanvil.com/blog/magic-systems-worldbuilders-guide"
  },
  {
    "id": "30",
    "name": "Soul + Resolve + Cost",
    "sourceFuel": "Personal spiritual core / soul",
    "secondaryResonance": "Resolve, identity coherence, emotional state",
    "accessEligibility": "Only souls capable of resonance can awaken it",
    "intentControl": "Resolve stabilizes and shapes the magical expression",
    "trigger": "Intent, gesture, focus, ritual, or emotionally significant trigger",
    "effectFamily": "Personalized abilities, enhancement, defensive or conceptual expressions",
    "coreLimitation": "Soul cannot access every expression; compatibility and internal stability limit scope",
    "costConsequence": "Soul strain, identity distortion, physical/spiritual damage; rare powers can have unique costs",
    "failureMode": "Conflicted intent can weaken or distort the effect; catastrophic overreach can damage the soul",
    "progressionPath": "Growth through experience, training, self-knowledge, and stronger resolve",
    "worldIntegration": "Religion, psychology, initiation rites and social status can develop around it",
    "bestStoryUse": "Lucan's core system candidate; character-linked progression",
    "abuseRiskWarning": "Do not let 'willpower = infinite power'; resolve must have defined mechanics",
    "researchBasis": "Sanderson: limitations/costs create depth; World Anvil: soul/divine/bio sources and multiple systems",
    "referenceUrl": "https://www.brandonsanderson.com/blogs/blog/sandersons-second-law ; https://academy.worldanvil.com/blog/magic-systems-worldbuilders-guide"
  }
];

export const VAELRION_BUILDING_BLOCKS: VaelrionBuildingBlock[] = [
  {
    "category": "Source / Fuel",
    "name": "Ambient environmental field",
    "meaning": "Magic is already present in the world",
    "strengths": "High world integration; accessible to many",
    "risks": "Can feel generic if source has no identity",
    "canCombineWith": "Weather, geography, geometry, celestial, life"
  },
  {
    "category": "Source / Fuel",
    "name": "Celestial phenomena",
    "meaning": "Stars, moons, eclipses, cosmic cycles",
    "strengths": "Rare and dramatic; natural calendar hooks",
    "risks": "Can become too convenient",
    "canCombineWith": "Blood, ritual, timing, divination"
  },
  {
    "category": "Source / Fuel",
    "name": "Weather / atmosphere",
    "meaning": "Pressure, storms, humidity, wind, temperature",
    "strengths": "Naturally changes with location and season",
    "risks": "Requires environmental logic",
    "canCombineWith": "Emotion, sound, thermodynamics"
  },
  {
    "category": "Source / Fuel",
    "name": "Geology / minerals",
    "meaning": "Heat, pressure, crystal/mineral structures",
    "strengths": "Excellent for kingdoms, industry, ruins",
    "risks": "Can become resource-fetching gameplay only",
    "canCombineWith": "Geometry, artifacts, terrain"
  },
  {
    "category": "Source / Fuel",
    "name": "Life / biology",
    "meaning": "Living processes and ecosystems",
    "strengths": "Strong for medicine and ecology",
    "risks": "Needs clear boundary on resurrection/healing",
    "canCombineWith": "Symbiosis, blood, territory"
  },
  {
    "category": "Source / Fuel",
    "name": "Sound / vibration",
    "meaning": "Frequency, rhythm, resonance",
    "strengths": "Visually and aurally distinctive",
    "risks": "Can become vague without defined frequency rules",
    "canCombineWith": "Breath, music, architecture"
  },
  {
    "category": "Source / Fuel",
    "name": "Light / shadow",
    "meaning": "Presence/absence of photons or magical illumination",
    "strengths": "Great visual identity and stealth possibilities",
    "risks": "Easy to overreach into omnipotence",
    "canCombineWith": "Line of sight, geometry, celestial"
  },
  {
    "category": "Source / Fuel",
    "name": "Heat / energy transfer",
    "meaning": "Movement of thermal energy",
    "strengths": "Strong physical logic",
    "risks": "Needs conservation or equivalent rule",
    "canCombineWith": "Weather, motion, geology"
  },
  {
    "category": "Source / Fuel",
    "name": "Motion / kinetic",
    "meaning": "Movement and momentum",
    "strengths": "Excellent for tactical action",
    "risks": "Can be too physics-heavy to write",
    "canCombineWith": "Gravity, body, weapons"
  },
  {
    "category": "Source / Fuel",
    "name": "Information / knowledge",
    "meaning": "What is known and understood",
    "strengths": "Supports mystery and intelligent characters",
    "risks": "Can punish characters with exposition",
    "canCombineWith": "Memory, language, geometry"
  },
  {
    "category": "Source / Fuel",
    "name": "Memory",
    "meaning": "Stored personal or external memory",
    "strengths": "Emotionally powerful and mystery-friendly",
    "risks": "Avoid perfect omniscience",
    "canCombineWith": "Names, knowledge, dreams"
  },
  {
    "category": "Source / Fuel",
    "name": "Language / names",
    "meaning": "Meaning encoded in symbols and words",
    "strengths": "Excellent lore and ancient-language hooks",
    "risks": "Risk of 'say the right word, win'",
    "canCombineWith": "Contracts, runes, knowledge"
  },
  {
    "category": "Source / Fuel",
    "name": "Dreams",
    "meaning": "Dream-state cognition",
    "strengths": "Surreal, intimate, mysterious",
    "risks": "Risk of reality becoming meaningless",
    "canCombineWith": "Emotion, memory, perception"
  },
  {
    "category": "Source / Fuel",
    "name": "Belief / faith",
    "meaning": "Collective conviction and ritual",
    "strengths": "Strong culture/faction integration",
    "risks": "Must define what belief cannot do",
    "canCombineWith": "Divine, oaths, community"
  },
  {
    "category": "Source / Fuel",
    "name": "Oaths / contracts",
    "meaning": "Promises and consent",
    "strengths": "Natural political/social hooks",
    "risks": "Perfect contracts kill ambiguity",
    "canCombineWith": "Language, sacrifice, belief"
  },
  {
    "category": "Source / Fuel",
    "name": "Relationships / bonds",
    "meaning": "Mutual connection",
    "strengths": "Excellent character integration",
    "risks": "Avoid turning love/friendship into a stat",
    "canCombineWith": "Emotion, group sync, soul"
  },
  {
    "category": "Source / Fuel",
    "name": "Blood / lineage",
    "meaning": "Inherited biology or identity markers",
    "strengths": "Strong dynasty/clan hooks",
    "risks": "Can conflict with theme of self-determination",
    "canCombineWith": "Body, sacrifice, artifacts"
  },
  {
    "category": "Source / Fuel",
    "name": "Body / metabolism",
    "meaning": "Calories, fluids, oxygen, nerves",
    "strengths": "Grounded costs and training",
    "risks": "Can become generic stamina",
    "canCombineWith": "Heat, motion, healing"
  },
  {
    "category": "Source / Fuel",
    "name": "Sacrifice / exchange",
    "meaning": "Giving something up to gain something",
    "strengths": "Natural dramatic cost",
    "risks": "Needs clear valuation rules",
    "canCombineWith": "Blood, memories, artifacts, oaths"
  },
  {
    "category": "Source / Fuel",
    "name": "Probability / risk",
    "meaning": "Uncertainty",
    "strengths": "Great for tension and gambles",
    "risks": "Very easy to break causality",
    "canCombineWith": "Fate, knowledge, choice"
  },
  {
    "category": "Source / Fuel",
    "name": "Entropy / decay",
    "meaning": "Breakdown and aging processes",
    "strengths": "Excellent dark-fantasy identity",
    "risks": "Easy to make instant-kill",
    "canCombineWith": "Time, matter, touch"
  },
  {
    "category": "Source / Fuel",
    "name": "Time",
    "meaning": "Rate and duration",
    "strengths": "Huge narrative possibilities",
    "risks": "Extremely plot-breaking",
    "canCombineWith": "Celestial, anchors, knowledge"
  },
  {
    "category": "Source / Fuel",
    "name": "Space",
    "meaning": "Distance and spatial relation",
    "strengths": "Exploration and logistics",
    "risks": "Teleportation can trivialize travel",
    "canCombineWith": "Geometry, anchors, maps"
  },
  {
    "category": "Source / Fuel",
    "name": "Artifacts / relics",
    "meaning": "Stored or encoded magic",
    "strengths": "Lets non-mages interact with magic",
    "risks": "Can become infinite toolboxes",
    "canCombineWith": "Attunement, names, blood"
  },
  {
    "category": "Source / Fuel",
    "name": "Spirits / local consciousness",
    "meaning": "Place-bound entities",
    "strengths": "Strong regional identity",
    "risks": "Requires clear spirit ecology",
    "canCombineWith": "Territory, nature, oaths"
  },
  {
    "category": "Resonance / Modifier",
    "name": "Emotion",
    "meaning": "Affects stability/intensity",
    "strengths": "Character-linked",
    "risks": "Avoid simplistic emotion-element mapping",
    "canCombineWith": "Soul, weather, sensory"
  },
  {
    "category": "Resonance / Modifier",
    "name": "Resolve",
    "meaning": "Affects consistency and endurance",
    "strengths": "Connects character growth to magic",
    "risks": "Must be more than 'try harder'",
    "canCombineWith": "Soul, oath, belief"
  },
  {
    "category": "Resonance / Modifier",
    "name": "Knowledge",
    "meaning": "Affects precision and scope",
    "strengths": "Rewards learning",
    "risks": "Can require exposition dumps",
    "canCombineWith": "Information, language, geometry"
  },
  {
    "category": "Resonance / Modifier",
    "name": "Relationship",
    "meaning": "Affects cooperation/strength",
    "strengths": "Strong emotional stakes",
    "risks": "Needs reciprocity rules",
    "canCombineWith": "Bond, music, soul"
  },
  {
    "category": "Resonance / Modifier",
    "name": "Location",
    "meaning": "Affects availability/strength",
    "strengths": "Makes geography matter",
    "risks": "Can make characters helpless away from home",
    "canCombineWith": "Leylines, spirits, weather, architecture"
  },
  {
    "category": "Trigger",
    "name": "Intent + focus",
    "meaning": "Mental decision starts effect",
    "strengths": "Simple and flexible",
    "risks": "Can feel like wish magic",
    "canCombineWith": "Resolve, knowledge"
  },
  {
    "category": "Trigger",
    "name": "Gesture / movement",
    "meaning": "Body pattern activates magic",
    "strengths": "Cinematic and trainable",
    "risks": "Gesture can become arbitrary",
    "canCombineWith": "Motion, sound, body"
  },
  {
    "category": "Trigger",
    "name": "Words / names",
    "meaning": "Language activates magic",
    "strengths": "Great for lore and contracts",
    "risks": "Need precise semantics",
    "canCombineWith": "Language, belief, oath"
  },
  {
    "category": "Trigger",
    "name": "Ritual",
    "meaning": "Sequence + preparation",
    "strengths": "Great for large effects",
    "risks": "Slow for spontaneous combat",
    "canCombineWith": "Celestial, sacrifice, belief"
  },
  {
    "category": "Trigger",
    "name": "Touch / contact",
    "meaning": "Physical connection",
    "strengths": "Easy to understand",
    "risks": "Limits range",
    "canCombineWith": "Body, blood, artifacts"
  },
  {
    "category": "Trigger",
    "name": "Object / focus",
    "meaning": "Artifact or tool channels effect",
    "strengths": "Supports crafting and economy",
    "risks": "Can become equipment treadmill",
    "canCombineWith": "Artifacts, geometry"
  },
  {
    "category": "Trigger",
    "name": "Environmental condition",
    "meaning": "Specific weather/place/time",
    "strengths": "Creates preparation and strategy",
    "risks": "Can feel contrived if too frequent",
    "canCombineWith": "Weather, celestial, territory"
  },
  {
    "category": "Trigger",
    "name": "Shared synchronization",
    "meaning": "Multiple actors coordinate",
    "strengths": "Great teamwork identity",
    "risks": "Hard to use alone",
    "canCombineWith": "Music, bonds, rituals"
  },
  {
    "category": "Effect Family",
    "name": "Elemental / natural",
    "meaning": "Matter/energy expressions",
    "strengths": "Readable and versatile",
    "risks": "Familiar unless differentiated",
    "canCombineWith": "Weather, geology, heat"
  },
  {
    "category": "Effect Family",
    "name": "Force / motion",
    "meaning": "Push, pull, momentum, pressure",
    "strengths": "Tactical",
    "risks": "Needs clear physical scope",
    "canCombineWith": "Motion, gravity"
  },
  {
    "category": "Effect Family",
    "name": "Transformation",
    "meaning": "Change state/form",
    "strengths": "Visually powerful",
    "risks": "Easy to become all-purpose",
    "canCombineWith": "Biology, entropy, space"
  },
  {
    "category": "Effect Family",
    "name": "Perception / illusion",
    "meaning": "Alter sensing or interpretation",
    "strengths": "Excellent mystery/psychology",
    "risks": "Risk of cheap twists",
    "canCombineWith": "Light, dreams, emotion"
  },
  {
    "category": "Effect Family",
    "name": "Binding / restriction",
    "meaning": "Limit movement/action",
    "strengths": "Great for combat and politics",
    "risks": "Can over-control characters",
    "canCombineWith": "Oaths, language, geometry"
  },
  {
    "category": "Effect Family",
    "name": "Information / divination",
    "meaning": "Reveal or infer hidden data",
    "strengths": "Useful for mysteries",
    "risks": "Can kill suspense",
    "canCombineWith": "Memory, knowledge, dreams"
  },
  {
    "category": "Effect Family",
    "name": "Traversal / space",
    "meaning": "Move through distance",
    "strengths": "Great for exploration",
    "risks": "Can erase geography",
    "canCombineWith": "Space, celestial, geometry"
  },
  {
    "category": "Effect Family",
    "name": "Healing / restoration",
    "meaning": "Repair or stabilize",
    "strengths": "High utility",
    "risks": "Can erase stakes",
    "canCombineWith": "Life, body, exchange"
  },
  {
    "category": "Effect Family",
    "name": "Summoning / manifestation",
    "meaning": "Bring or shape something",
    "strengths": "Good spectacle",
    "risks": "Creates infinite inventory risk",
    "canCombineWith": "Artifacts, names, territory"
  },
  {
    "category": "Effect Family",
    "name": "Influence / mental",
    "meaning": "Affect thoughts/emotions",
    "strengths": "Strong but sensitive",
    "risks": "Can erase character agency",
    "canCombineWith": "Emotion, dreams, belief"
  },
  {
    "category": "Cost",
    "name": "Physical injury",
    "meaning": "Damage to body",
    "strengths": "Immediate and concrete",
    "risks": "Can become repetitive",
    "canCombineWith": "Body, motion, heat"
  },
  {
    "category": "Cost",
    "name": "Memory loss",
    "meaning": "Lose information or memories",
    "strengths": "Strong for mystery",
    "risks": "Can feel cruel if overused",
    "canCombineWith": "Memory, names, dreams"
  },
  {
    "category": "Cost",
    "name": "Sensory degradation",
    "meaning": "Vision/hearing/touch changes",
    "strengths": "Interesting long-term consequence",
    "risks": "Needs careful representation",
    "canCombineWith": "Celestial, sound, perception"
  },
  {
    "category": "Cost",
    "name": "Emotional imprint",
    "meaning": "Magic changes emotional state",
    "strengths": "Connects character to system",
    "risks": "Risk of flattening psychology",
    "canCombineWith": "Emotion, bond"
  },
  {
    "category": "Cost",
    "name": "Lifespan",
    "meaning": "Use consumes future life",
    "strengths": "Simple stakes",
    "risks": "May discourage repeated use entirely",
    "canCombineWith": "Time, sacrifice"
  },
  {
    "category": "Cost",
    "name": "Resource depletion",
    "meaning": "Blood, calories, minerals, etc.",
    "strengths": "Economic/worldbuilding hooks",
    "risks": "Can become crafting chores",
    "canCombineWith": "Blood, body, geology"
  },
  {
    "category": "Cost",
    "name": "Relationship damage",
    "meaning": "Magic harms or changes bonds",
    "strengths": "Powerful for character drama",
    "risks": "Must be used carefully",
    "canCombineWith": "Bond, oaths"
  },
  {
    "category": "Cost",
    "name": "Identity drift",
    "meaning": "Repeated use alters self-concept",
    "strengths": "Excellent for soul systems",
    "risks": "Requires subtle handling",
    "canCombineWith": "Soul, names, dreams"
  },
  {
    "category": "Cost",
    "name": "Debt / obligation",
    "meaning": "Power creates future obligation",
    "strengths": "Great for factions/gods",
    "risks": "Needs explicit enforcement",
    "canCombineWith": "Oaths, spirits, belief"
  },
  {
    "category": "Limitation",
    "name": "Range",
    "meaning": "Only works within a fixed distance",
    "strengths": "Easy to understand",
    "risks": "Can be generic",
    "canCombineWith": "Space, force, perception"
  },
  {
    "category": "Limitation",
    "name": "Duration",
    "meaning": "Effect expires",
    "strengths": "Natural tension",
    "risks": "Needs clear timing",
    "canCombineWith": "Time, rituals, artifacts"
  },
  {
    "category": "Limitation",
    "name": "Environment",
    "meaning": "Needs specific conditions",
    "strengths": "Makes world matter",
    "risks": "Can feel convenient if overused",
    "canCombineWith": "Weather, celestial, territory"
  },
  {
    "category": "Limitation",
    "name": "Compatibility",
    "meaning": "Only some users can access it",
    "strengths": "Supports rarity",
    "risks": "Can become chosen-one logic",
    "canCombineWith": "Soul, blood, artifacts"
  },
  {
    "category": "Limitation",
    "name": "Preparation",
    "meaning": "Needs setup/time",
    "strengths": "Encourages planning",
    "risks": "Weak in fast scenes",
    "canCombineWith": "Geometry, ritual, architecture"
  },
  {
    "category": "Limitation",
    "name": "Knowledge",
    "meaning": "Requires understanding",
    "strengths": "Rewards learning",
    "risks": "Can turn into exposition",
    "canCombineWith": "Information, language"
  },
  {
    "category": "Limitation",
    "name": "Tradeoff",
    "meaning": "One benefit reduces another",
    "strengths": "Creates meaningful decisions",
    "risks": "Needs careful balancing",
    "canCombineWith": "Any source"
  },
  {
    "category": "Limitation",
    "name": "Single-domain scope",
    "meaning": "Ability has a narrow conceptual range",
    "strengths": "Keeps powers distinct",
    "risks": "Can become restrictive",
    "canCombineWith": "Concept, elemental, language"
  }
];

export const VAELRION_RESEARCH_NOTES: VaelrionResearchNote[] = [
  {
    "source": "Brandon Sanderson \u2014 Second Law",
    "principle": "Limitations are often more interesting than raw powers; costs and weaknesses can create struggle, tension, and depth.",
    "application": "Each combo includes a limitation, cost/consequence, and failure mode rather than just a cool ability.",
    "url": "https://www.brandonsanderson.com/blogs/blog/sandersons-second-law"
  },
  {
    "source": "Brandon Sanderson \u2014 Laws overview",
    "principle": "Magic rules should be understandable enough that readers can follow problem-solving; the laws are guidelines, not absolute rules.",
    "application": "Combos are written as modular recipes rather than mandatory rules, so you can make a softer or harder system later.",
    "url": "https://www.brandonsanderson.com/faq/knowledge-base/what-are-sandersons-laws-of-magic/"
  },
  {
    "source": "Brandon Sanderson \u2014 Third Law",
    "principle": "Expand what you already have before adding new systems.",
    "application": "The Mix & Match sheet encourages recombining sources, triggers, costs and effects before inventing more categories.",
    "url": "https://www.brandonsanderson.com/blogs/blog/sandersons-third-law-of-magic"
  },
  {
    "source": "World Anvil \u2014 Magic Systems Guide (2026)",
    "principle": "Magic can be classified by utility/control, ubiquity/power, and schools/domains; source, cost, limitations, users and world integration are key questions.",
    "application": "The workbook separates source/fuel, resonance, trigger, effect, cost, limitation and world integration.",
    "url": "https://academy.worldanvil.com/blog/magic-systems-worldbuilders-guide"
  },
  {
    "source": "World Anvil \u2014 Getting Started with Magic Systems",
    "principle": "A single source can simplify explanation, while multiple sources can work if they are distinct; opacity can separate what the creator knows from what characters/readers know.",
    "application": "We kept many possible fuels but treat them as candidate architectures rather than saying Vaelrion must have all of them.",
    "url": "https://blog.worldanvil.com/worldbuilding/magic-systems-getting-started-worldbuilding/"
  },
  {
    "source": "World Anvil \u2014 Triangle of Power",
    "principle": "Ability, cost and limitation need to carry comparable design weight for powerful effects; conditions are different from costs.",
    "application": "Each combo explicitly separates effect, cost/consequence and limitation.",
    "url": "https://blog.worldanvil.com/worldbuilding/creating-magic-items-the-triangle-of-power/"
  }
];
