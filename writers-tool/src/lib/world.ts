// World Bible model — local-first, pure functions (testable, no AI dependency).
// AI layer lives in ai.ts and is optional; these local rules always work offline.

export type EntryKind =
	| 'character'
	| 'magic'
	| 'place'
	| 'timeline'
	| 'faction'
	| 'mystery'
	| 'lore'
	| 'note';

export type CanonStatus = 'idea' | 'draft' | 'canon' | 'rejected';

export interface WorldEntry {
	id: string;
	kind: EntryKind;
	name: string;
	text: string;
	status?: CanonStatus;
	aliases?: string[];
	unresolvedThreads?: string[];
	attributes?: Record<string, string>;
}

export interface Contradiction {
	entryId: string;
	entryName: string;
	reason: string;
}

export interface EntityMention {
	entryId: string;
	entryName: string;
	kind: EntryKind;
	status: CanonStatus;
	match: string;
	index: number;
}

export interface Decision {
	id: string;
	date: string;
	topic: string;
	decision: string;
	authorWords: string;
	source: string;
	affects: string;
	status: 'locked' | 'draft' | 'superseded';
}

const KIND_HINTS: { kind: EntryKind; words: string[] }[] = [
	{
		kind: 'character',
		words: [
			'born',
			'age',
			'son of',
			'daughter of',
			'prince',
			'queen',
			'king',
			'witch',
			'wizard',
			'he',
			'she',
			'eyes',
			'hair',
			'assassin'
		]
	},
	{
		kind: 'magic',
		words: ['magic', 'spell', 'cannot', 'never', 'only', 'mana', 'curse', 'enchant', 'ritual']
	},
	{
		kind: 'place',
		words: [
			'city',
			'kingdom',
			'forest',
			'castle',
			'river',
			'mountain',
			'village',
			'tavern',
			'tower',
			'citadel'
		]
	},
	{
		kind: 'timeline',
		words: ['year', 'century', 'after', 'before', 'during the war', 'day', 'night of', 'age of']
	},
	{
		kind: 'faction',
		words: ['guild', 'order', 'council', 'clan', 'house of', 'army', 'cult', 'syndicate', 'rebels']
	},
	{
		kind: 'mystery',
		words: ['mystery', 'who killed', 'secret of', 'clue', 'unknown', 'conspiracy', 'riddle', 'murder']
	}
];

export function detectKind(block: string): EntryKind {
	const lower = block.toLowerCase();
	let best: EntryKind = 'note';
	let bestScore = 0;
	for (const hint of KIND_HINTS) {
		let score = 0;
		for (const w of hint.words) {
			const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const regex = new RegExp(`\\b${escaped}\\b`, 'i');
			if (regex.test(lower)) {
				score++;
			}
		}
		if (score > bestScore) {
			bestScore = score;
			best = hint.kind;
		}
	}
	return best;
}

/** Split a messy dump into entries. Blank-line separated blocks; first line = name. */
export function parseDump(dump: string, defaultStatus: CanonStatus = 'canon'): WorldEntry[] {
	const blocks = dump
		.split(/\n\s*\n/)
		.map((b) => b.trim())
		.filter(Boolean);
	return blocks.map((block, i) => {
		const lines = block
			.split('\n')
			.map((l) => l.trim())
			.filter(Boolean);
		const first = lines[0] ?? `Entry ${i + 1}`;
		// Strip markdown heading markers for the name, keep rest as body.
		const name = first.replace(/^#+\s*/, '').slice(0, 80);
		const text = lines.slice(1).join('\n') || block;
		return {
			id: `e${Date.now().toString(36)}-${i}`,
			kind: detectKind(block),
			name,
			text,
			status: defaultStatus,
			aliases: []
		};
	});
}

/** Returns only entries that are canon (or undefined for legacy entries). */
export function canonOnly(entries: WorldEntry[]): WorldEntry[] {
	return entries.filter((e) => !e.status || e.status === 'canon');
}

/** Extract hard rules ("cannot X", "never X", "only X") from magic entries. */
export function extractRules(entries: WorldEntry[]): { entry: WorldEntry; rule: string }[] {
	const rules: { entry: WorldEntry; rule: string }[] = [];
	const pattern = /\b(cannot|can't|never|only|must not|no one can)\b[^.!\n]{3,120}/gi;
	// Only extract rules from Canon entries
	for (const entry of canonOnly(entries)) {
		if (entry.kind !== 'magic') continue;
		const hay = `${entry.name}\n${entry.text}`;
		for (const m of hay.matchAll(pattern)) {
			rules.push({ entry, rule: m[0].trim() });
		}
	}
	return rules;
}

/**
 * Local contradiction check (offline):
 * 1. Magic-rule check: if a canon magic rule's key verb phrase appears in the chapter, flag for review.
 * 2. Unknown-entity nudge is handled by linkedEntities() on the chapter page.
 */
export function checkContradictions(entries: WorldEntry[], chapterText: string): Contradiction[] {
	const out: Contradiction[] = [];
	if (!chapterText.trim()) return out;
	const lower = chapterText.toLowerCase();
	for (const { entry, rule } of extractRules(entries)) {
		// Take significant words from the rule (skip stopwords) and see if chapter echoes them.
		const words = rule
			.toLowerCase()
			.replace(/[^a-z\s']/g, ' ')
			.split(/\s+/)
			.filter(
				(w) =>
					w.length > 3 &&
					!['cannot', "can't", 'never', 'only', 'with', 'from', 'that', 'this'].includes(w)
			);
		const hits = words.filter((w) => lower.includes(w));
		if (hits.length >= 2) {
			out.push({
				entryId: entry.id,
				entryName: entry.name,
				reason: `Possible break of rule "${rule}" (matched: ${hits.slice(0, 4).join(', ')}) — verify intent.`
			});
		}
	}
	return out;
}

/** Fast zero-allocation word counter avoiding string array splitting */
export function countWords(text: string): number {
	if (!text) return 0;
	let count = 0;
	let inWord = false;
	for (let i = 0; i < text.length; i++) {
		const code = text.charCodeAt(i);
		if (code <= 32 || code === 160) {
			inWord = false;
		} else if (!inWord) {
			inWord = true;
			count++;
		}
	}
	return count;
}

interface CachedEntityTarget {
	name: string;
	targetLower: string;
	entry: WorldEntry;
}

let lastEntriesRef: WorldEntry[] | null = null;
let cachedTargets: CachedEntityTarget[] = [];

function getEntityTargets(entries: WorldEntry[]): CachedEntityTarget[] {
	if (entries === lastEntriesRef) return cachedTargets;
	lastEntriesRef = entries;
	const targets: CachedEntityTarget[] = [];
	for (const entry of entries) {
		const names = [entry.name, ...(entry.aliases ?? [])].filter(
			(n) => n && n.trim().length >= 2
		);
		for (const name of names) {
			const trimmed = name.trim();
			targets.push({ name: trimmed, targetLower: trimmed.toLowerCase(), entry });
		}
	}
	targets.sort((a, b) => b.name.length - a.name.length);
	cachedTargets = targets;
	return cachedTargets;
}

/** Find all mentions of world entries in the text (by name or aliases). */
export function findEntityMentions(entries: WorldEntry[], text: string): EntityMention[] {
	if (!text.trim() || !entries.length) return [];
	const mentions: EntityMention[] = [];
	const lower = text.toLowerCase();
	const targets = getEntityTargets(entries);

	// Track occupied character ranges [start, end) to avoid double-matching substrings
	const occupied: [number, number][] = [];
	const isOccupied = (start: number, end: number) => {
		return occupied.some(([s, e]) => Math.max(start, s) < Math.min(end, e));
	};

	for (const { name, targetLower, entry } of targets) {
		let pos = 0;
		while ((pos = lower.indexOf(targetLower, pos)) !== -1) {
			const end = pos + targetLower.length;
			const before = pos > 0 ? lower[pos - 1] : ' ';
			const after = end < lower.length ? lower[end] : ' ';
			const isWordBoundary = /[\s\p{P}]/u.test(before) && /[\s\p{P}]/u.test(after);

			if (isWordBoundary && !isOccupied(pos, end)) {
				occupied.push([pos, end]);
				mentions.push({
					entryId: entry.id,
					entryName: entry.name,
					kind: entry.kind,
					status: entry.status ?? 'canon',
					match: text.slice(pos, end),
					index: pos
				});
			}
			pos = end;
		}
	}

	return mentions.sort((a, b) => a.index - b.index);
}

/** Bible entries mentioned by name in the chapter — the "linked" set. */
export function linkedEntities(entries: WorldEntry[], chapterText: string): WorldEntry[] {
	const lower = chapterText.toLowerCase();
	return entries.filter((e) => {
		const nameTokens = e.name.toLowerCase().split(' ').slice(0, 3).join(' ');
		if (e.name.length > 2 && lower.includes(nameTokens)) return true;
		if (e.aliases?.some((a) => a.length > 2 && lower.includes(a.toLowerCase()))) return true;
		return false;
	});
}

// --- persistence (localStorage, safe for SSR) ---
const BIBLE_KEY = 'writers-tool.bible.v1';
const CHAPTERS_KEY = 'writers-tool.chapters.v1';
const DECISIONS_KEY = 'writers-tool.decisions.v1';

export interface Chapter {
	id: string;
	title: string;
	text: string;
	updatedAt: string;
	act?: string;
	pov?: string;
	goal?: string;
	rulesPinned?: string[];
	threads?: string[];
	status?: CanonStatus;
}

export function loadBible(): WorldEntry[] {
	try {
		if (typeof localStorage === 'undefined') return [];
		return JSON.parse(localStorage.getItem(BIBLE_KEY) ?? '[]') as WorldEntry[];
	} catch {
		return [];
	}
}

export function saveBible(entries: WorldEntry[]): void {
	try {
		localStorage.setItem(BIBLE_KEY, JSON.stringify(entries));
	} catch {
		/* storage full / private mode — ignore */
	}
}

export function loadChapters(): Chapter[] {
	try {
		if (typeof localStorage === 'undefined') return [];
		return JSON.parse(localStorage.getItem(CHAPTERS_KEY) ?? '[]') as Chapter[];
	} catch {
		return [];
	}
}

export function saveChapters(chapters: Chapter[]): void {
	try {
		localStorage.setItem(CHAPTERS_KEY, JSON.stringify(chapters));
	} catch {
		/* ignore */
	}
}

// --- Decisions Ledger ---

export function parseDecisionsMarkdown(md: string): Decision[] {
	const decisions: Decision[] = [];
	const blocks = md.split(/(?=##\s+D\d+)/);

	for (const block of blocks) {
		const trimmed = block.trim();
		if (!trimmed.startsWith('## D')) continue;

		const headerMatch = trimmed.match(/^##\s+(D\d+)\s+—\s+([^\n—]+)\s+—\s+([^\n]+)/);
		const id = headerMatch ? headerMatch[1].trim() : `D${decisions.length + 1}`;
		const date = headerMatch ? headerMatch[2].trim() : new Date().toISOString().slice(0, 10);
		const topic = headerMatch ? headerMatch[3].trim() : 'Decision';

		const getField = (prefix: string): string => {
			const m = trimmed.match(new RegExp(`^-\\s*${prefix}:\\s*([^\n]+)`, 'm'));
			return m ? m[1].trim() : '';
		};

		const decisionText = getField('Decision');
		const authorWords = getField("Author's words");
		const source = getField('Source') || 'editorial';
		const affects = getField('Affects') || 'story';
		const statusRaw = getField('Status').toLowerCase();
		const status = statusRaw.includes('draft')
			? 'draft'
			: statusRaw.includes('superseded')
				? 'superseded'
				: 'locked';

		decisions.push({
			id,
			date,
			topic,
			decision: decisionText || topic,
			authorWords,
			source,
			affects,
			status
		});
	}

	return decisions;
}

export function serializeDecisionsMarkdown(decisions: Decision[]): string {
	const header = '# Decisions: Story Canon Ledger\n\n';
	const items = decisions.map((d) => {
		return `## ${d.id} — ${d.date} — ${d.topic}\n- Decision: ${d.decision}\n- Author's words: ${d.authorWords || '""'}\n- Source: ${d.source}\n- Affects: ${d.affects}\n- Status: ${d.status}\n`;
	});
	return header + items.join('\n');
}

export function loadDecisions(): Decision[] {
	try {
		if (typeof localStorage === 'undefined') return [];
		const raw = localStorage.getItem(DECISIONS_KEY);
		if (raw) return JSON.parse(raw) as Decision[];
	} catch {
		/* ignore */
	}
	return [];
}

export function saveDecisions(decisions: Decision[]): void {
	try {
		localStorage.setItem(DECISIONS_KEY, JSON.stringify(decisions));
	} catch {
		/* ignore */
	}
}

// --- Temporal State & Story Event Ledger ---

export interface DisclosedSecret {
	id: string;
	fact: string;
	disclosedAtOrder: number;
	disclosedToCharacterIds: string[];
	isPublicToReader: boolean;
}

export interface StateMutation {
	id: string;
	characterId: string;
	type: 'injury' | 'relationship' | 'belief' | 'item_acquired' | 'item_lost' | 'healed';
	description: string;
	targetCharacterId?: string;
	polarity?: 'allied' | 'hostile' | 'neutral' | 'suspicious';
	trustDelta?: number;
}

export interface StoryEvent {
	id: string;
	chapterId?: string;
	sceneTitle: string;
	order: number;
	inStoryTime: string;
	locationId?: string;
	locationName?: string;
	participantIds: string[];
	disclosures: DisclosedSecret[];
	mutations: StateMutation[];
	status: CanonStatus;
}

export interface CharacterState {
	characterId: string;
	atEventOrder: number;
	knownSecrets: DisclosedSecret[];
	activeInjuries: string[];
	itemsHeld: string[];
	beliefs: string[];
	relationships: Record<string, { polarity: string; trust: number }>;
}

export interface KnowledgeLeakWarning {
	characterId: string;
	characterName: string;
	secretFact: string;
	reason: string;
}

const EVENTS_KEY = 'writers-tool.events.v1';

export function computeCharacterState(
	characterId: string,
	events: StoryEvent[],
	atOrder?: number
): CharacterState {
	const canonEvents = events
		.filter((e) => !e.status || e.status === 'canon')
		.filter((e) => atOrder === undefined || e.order <= atOrder)
		.sort((a, b) => a.order - b.order);

	const state: CharacterState = {
		characterId,
		atEventOrder: atOrder ?? (canonEvents[canonEvents.length - 1]?.order ?? 0),
		knownSecrets: [],
		activeInjuries: [],
		itemsHeld: [],
		beliefs: [],
		relationships: {}
	};

	for (const ev of canonEvents) {
		// Knowledge Disclosures
		for (const d of ev.disclosures ?? []) {
			if (d.disclosedToCharacterIds?.includes(characterId)) {
				if (!state.knownSecrets.some((s) => s.id === d.id)) {
					state.knownSecrets.push(d);
				}
			}
		}

		// Mutations
		for (const m of ev.mutations ?? []) {
			if (m.characterId !== characterId) continue;

			if (m.type === 'injury') {
				if (!state.activeInjuries.includes(m.description)) {
					state.activeInjuries.push(m.description);
				}
			} else if (m.type === 'healed') {
				state.activeInjuries = state.activeInjuries.filter((inj) => inj !== m.description);
			} else if (m.type === 'item_acquired') {
				if (!state.itemsHeld.includes(m.description)) {
					state.itemsHeld.push(m.description);
				}
			} else if (m.type === 'item_lost') {
				state.itemsHeld = state.itemsHeld.filter((it) => it !== m.description);
			} else if (m.type === 'belief') {
				if (!state.beliefs.includes(m.description)) {
					state.beliefs.push(m.description);
				}
			} else if (m.type === 'relationship' && m.targetCharacterId) {
				const existing = state.relationships[m.targetCharacterId] ?? {
					polarity: 'neutral',
					trust: 50
				};
				const newTrust = Math.max(0, Math.min(100, existing.trust + (m.trustDelta ?? 0)));
				state.relationships[m.targetCharacterId] = {
					polarity: m.polarity ?? existing.polarity,
					trust: newTrust
				};
			}
		}
	}

	return state;
}

/**
 * Detects if the chapter prose references facts that the character cannot know yet.
 */
export function detectKnowledgeLeaks(
	events: StoryEvent[],
	currentOrder: number,
	characterId: string,
	chapterText: string,
	characters: WorldEntry[]
): KnowledgeLeakWarning[] {
	if (!chapterText.trim() || !characterId) return [];
	const warnings: KnowledgeLeakWarning[] = [];
	const lower = chapterText.toLowerCase();

	const characterObj = characters.find((c) => c.id === characterId || c.name === characterId);
	const characterName = characterObj?.name ?? characterId;

	// Collect all canon secrets across all events
	const allCanonEvents = events
		.filter((e) => !e.status || e.status === 'canon')
		.sort((a, b) => a.order - b.order);

	const allSecrets: DisclosedSecret[] = [];
	for (const ev of allCanonEvents) {
		for (const d of ev.disclosures ?? []) {
			allSecrets.push(d);
		}
	}

	for (const secret of allSecrets) {
		// Significant keywords from the secret (exclude stopwords)
		const secretWords = secret.fact
			.toLowerCase()
			.replace(/[^a-z\s']/g, ' ')
			.split(/\s+/)
			.filter(
				(w) =>
					w.length > 3 &&
					!['that', 'this', 'with', 'from', 'they', 'them', 'have', 'were', 'about'].includes(w)
			);

		if (secretWords.length < 2) continue;

		const matchCount = secretWords.filter((w) => lower.includes(w)).length;
		// If at least 2 distinct significant words of the secret are mentioned in the prose
		if (matchCount >= 2 && matchCount >= Math.min(2, secretWords.length)) {
			// Case 1: Secret has not happened yet chronologically (anachronism)
			if (secret.disclosedAtOrder > currentOrder) {
				warnings.push({
					characterId,
					characterName,
					secretFact: secret.fact,
					reason: `Chronological leak: "${secret.fact}" is not revealed until Event ${secret.disclosedAtOrder}, but is mentioned in Event ${currentOrder}.`
				});
			} else {
				// Case 2: Secret has happened in the world, but characterId was never told!
				const wasDisclosedToChar = secret.disclosedToCharacterIds?.includes(characterId);
				if (!wasDisclosedToChar) {
					warnings.push({
						characterId,
						characterName,
						secretFact: secret.fact,
						reason: `Knowledge leak: ${characterName} was never disclosed the secret: "${secret.fact}".`
					});
				}
			}
		}
	}

	return warnings;
}

export function loadEvents(): StoryEvent[] {
	try {
		if (typeof localStorage === 'undefined') return [];
		const raw = localStorage.getItem(EVENTS_KEY);
		if (raw) return JSON.parse(raw) as StoryEvent[];
	} catch {
		/* ignore */
	}
	return [];
}

export function saveEvents(events: StoryEvent[]): void {
	try {
		localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
	} catch {
		/* ignore */
	}
}

// --- Mystery & Foreshadowing Board & Reader Horizon ---

export type MysteryNodeType = 'mystery' | 'clue' | 'red_herring' | 'reveal' | 'consequence';
export type MysteryNodeStatus =
	| 'unplanted'
	| 'planted'
	| 'discovered'
	| 'revealed'
	| 'resolved';

export interface MysteryNode {
	id: string;
	type: MysteryNodeType;
	title: string;
	description: string;
	status: MysteryNodeStatus;
	chapterId?: string;
	revealOrder?: number;
	manuscriptQuote?: string;
	connectedTo: string[]; // Connected Node IDs
	x: number;
	y: number;
}

export interface AccidentalSpoilerWarning {
	nodeId: string;
	nodeTitle: string;
	reason: string;
}

const MYSTERIES_KEY = 'writers-tool.mysteries.v1';

export function detectAccidentalSpoilers(
	mysteries: MysteryNode[],
	currentChapterOrder: number,
	chapterText: string
): AccidentalSpoilerWarning[] {
	if (!chapterText.trim() || !mysteries.length) return [];
	const warnings: AccidentalSpoilerWarning[] = [];
	const lower = chapterText.toLowerCase();

	// Check reveals or confidential twist nodes with a planned revealOrder
	const sensitiveNodes = mysteries.filter(
		(m) =>
			m.type === 'reveal' ||
			(m.revealOrder !== undefined && m.status !== 'revealed' && m.status !== 'resolved')
	);

	for (const node of sensitiveNodes) {
		const targetWords = (node.title + ' ' + node.description)
			.toLowerCase()
			.replace(/[^a-z\s']/g, ' ')
			.split(/\s+/)
			.filter(
				(w) =>
					w.length > 3 &&
					![
						'that',
						'this',
						'with',
						'from',
						'they',
						'them',
						'have',
						'were',
						'about',
						'what',
						'where'
					].includes(w)
			);

		if (targetWords.length < 2) continue;

		const matchCount = targetWords.filter((w) => lower.includes(w)).length;
		// If at least 2 distinct significant words of the confidential reveal appear in draft text
		if (matchCount >= 2 && matchCount >= Math.min(2, targetWords.length)) {
			// Check if this reveal is scheduled for a future chapter
			const plannedOrder = node.revealOrder ?? 999;
			if (plannedOrder > currentChapterOrder) {
				warnings.push({
					nodeId: node.id,
					nodeTitle: node.title,
					reason: `Accidental spoiler: "${node.title}" is a reader secret scheduled for Chapter ${node.revealOrder ?? 'future'}, but appears prematurely in this draft.`
				});
			}
		}
	}

	return warnings;
}

export function loadMysteries(): MysteryNode[] {
	try {
		if (typeof localStorage === 'undefined') return [];
		const raw = localStorage.getItem(MYSTERIES_KEY);
		if (raw) return JSON.parse(raw) as MysteryNode[];
	} catch {
		/* ignore */
	}
	return [];
}

export function saveMysteries(nodes: MysteryNode[]): void {
	try {
		localStorage.setItem(MYSTERIES_KEY, JSON.stringify(nodes));
	} catch {
		/* ignore */
	}
}

// --- Visual World Map & Story Map Models ---

export type PinType = 'city' | 'fortress' | 'citadel' | 'landmark' | 'wilds' | 'water';

export interface MapPin {
	id: string;
	name: string;
	type: PinType;
	x: number; // percentage 0 - 100
	y: number; // percentage 0 - 100
	bibleEntryId?: string;
	description?: string;
}

export interface JourneyWaypoint {
	id: string;
	characterId: string;
	pinId: string;
	dayIndex: number;
	chapterTitle?: string;
	order: number;
}

export interface TravelWarning {
	characterId: string;
	fromPin: string;
	toPin: string;
	distance: number;
	daysAllowed: number;
	reason: string;
}

export interface StoryBeat {
	id: string;
	act: string;
	beatName: string;
	chapterTitle?: string;
	order: number;
	tension: number; // -5 (catastrophe) to +5 (triumph)
	valueShift: string; // e.g. "Hope ➔ Despair"
	summary: string;
}

const MAP_PINS_KEY = 'writers-tool.map_pins.v1';
const JOURNEYS_KEY = 'writers-tool.journeys.v1';
const STORY_BEATS_KEY = 'writers-tool.story_beats.v1';

export function verifyTravelFeasibility(
	pins: MapPin[],
	journeys: JourneyWaypoint[]
): TravelWarning[] {
	const warnings: TravelWarning[] = [];
	const byCharacter: Record<string, JourneyWaypoint[]> = {};

	for (const j of journeys) {
		if (!byCharacter[j.characterId]) byCharacter[j.characterId] = [];
		byCharacter[j.characterId].push(j);
	}

	for (const [charId, waypoints] of Object.entries(byCharacter)) {
		waypoints.sort((a, b) => a.order - b.order);

		for (let i = 0; i < waypoints.length - 1; i++) {
			const curr = waypoints[i];
			const next = waypoints[i + 1];

			const pin1 = pins.find((p) => p.id === curr.pinId);
			const pin2 = pins.find((p) => p.id === next.pinId);

			if (pin1 && pin2 && pin1.id !== pin2.id) {
				const dx = pin2.x - pin1.x;
				const dy = pin2.y - pin1.y;
				const distance = Math.round(Math.sqrt(dx * dx + dy * dy));
				const daysPassed = Math.max(0, next.dayIndex - curr.dayIndex);

				// Max realistic overland travel speed is ~25% map distance per day on horseback/foot
				const maxDistancePossible = Math.max(25, daysPassed * 25);
				if (distance > maxDistancePossible) {
					warnings.push({
						characterId: charId,
						fromPin: pin1.name,
						toPin: pin2.name,
						distance,
						daysAllowed: daysPassed,
						reason: `Implausible travel speed: ${charId} travels ${distance}% across the continent between Day ${curr.dayIndex} and Day ${next.dayIndex} (${daysPassed} day span) without recorded magical transport.`
					});
				}
			}
		}
	}

	return warnings;
}

export function loadMapPins(): MapPin[] {
	try {
		if (typeof localStorage === 'undefined') return [];
		const raw = localStorage.getItem(MAP_PINS_KEY);
		if (raw) return JSON.parse(raw) as MapPin[];
	} catch {
		/* ignore */
	}
	return [];
}

export function saveMapPins(pins: MapPin[]): void {
	try {
		localStorage.setItem(MAP_PINS_KEY, JSON.stringify(pins));
	} catch {
		/* ignore */
	}
}

export function loadJourneys(): JourneyWaypoint[] {
	try {
		if (typeof localStorage === 'undefined') return [];
		const raw = localStorage.getItem(JOURNEYS_KEY);
		if (raw) return JSON.parse(raw) as JourneyWaypoint[];
	} catch {
		/* ignore */
	}
	return [];
}

export function saveJourneys(journeys: JourneyWaypoint[]): void {
	try {
		localStorage.setItem(JOURNEYS_KEY, JSON.stringify(journeys));
	} catch {
		/* ignore */
	}
}

export function loadStoryBeats(): StoryBeat[] {
	try {
		if (typeof localStorage === 'undefined') return [];
		const raw = localStorage.getItem(STORY_BEATS_KEY);
		if (raw) return JSON.parse(raw) as StoryBeat[];
	} catch {
		/* ignore */
	}
	return [];
}

export function saveStoryBeats(beats: StoryBeat[]): void {
	try {
		localStorage.setItem(STORY_BEATS_KEY, JSON.stringify(beats));
	} catch {
		/* ignore */
	}
}



