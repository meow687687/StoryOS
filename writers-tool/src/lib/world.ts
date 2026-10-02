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
	auditStatus?: 'accepted' | 'revision_needed' | 'unreviewed';
	auditNotes?: string[];
	auditTimestamp?: string;
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

// --- Sample Story Demo Suite (The Ashen Vow) ---

export const SAMPLE_CHAPTERS: Chapter[] = [
	{
		id: 'c1',
		title: 'Chapter 1 — The Ashen Vow',
		act: 'Act I: The Exile',
		pov: 'Kael',
		goal: 'Conceal the forbidden fire-pact while bargaining for passage at the tavern.',
		text: 'The embers in the hearth hissed as Kael stepped through the doorway of the tavern in Emberhold. His cloak smelled of salt and burned parchment. He kept his right hand inside the wool lining, fingers closed tight around the cold stone.',
		updatedAt: new Date().toISOString(),
		threads: ['Who betrayed the Prince?', 'The missing courier'],
		rulesPinned: ['Fire Pact']
	},
	{
		id: 'c2',
		title: 'Chapter 2 — The Whispering Spire',
		act: 'Act I: The Exile',
		pov: 'Kael',
		goal: 'Meet Lyra and secure the sealed route through the Iron Pass.',
		text: 'Rain drummed against the stained glass of the High Citadel. Lyra did not look up from her celestial charts when Kael entered. "You bring fire into a sanctuary of glass, Prince," she said softly.',
		updatedAt: new Date().toISOString(),
		threads: ['The missing courier'],
		rulesPinned: []
	}
];

export const SAMPLE_BIBLE: WorldEntry[] = [
	{
		id: 'b1',
		name: 'Kael',
		kind: 'character',
		status: 'canon',
		aliases: ['Prince Kael', 'The Exiled Heir'],
		text: 'Exiled heir to the Sunken Throne. Bearer of the forbidden ember seal. Bound by duty to protect his sister over reclaiming his lost kingdom.'
	},
	{
		id: 'b2',
		name: 'Lyra',
		kind: 'character',
		status: 'canon',
		aliases: ['Lady Lyra', 'Stargazer of the Spire'],
		text: 'High Astrologer of the High Citadel. An old ally of Kael who secretly aids the resistance against the Iron Council.'
	},
	{
		id: 'b3',
		name: 'Emberhold',
		kind: 'place',
		status: 'canon',
		aliases: ['The City of Embers'],
		text: 'Ancient port city built upon volcanic basalt cliffs. Known for clandestine black markets and illicit alchemical trade.'
	},
	{
		id: 'b4',
		name: 'High Citadel',
		kind: 'place',
		status: 'canon',
		aliases: ['The Citadel'],
		text: 'Fortress perched high in the northern crags overlooking the Iron Pass.'
	},
	{
		id: 'b5',
		name: 'Fire Pact',
		kind: 'magic',
		status: 'canon',
		aliases: ['Ember Law'],
		text: 'Fire magic cannot summon water. Only bonded mages may call flame. Every conjuration extracts a toll in physical warmth.'
	},
	{
		id: 'b6',
		name: 'Iron Council',
		kind: 'faction',
		status: 'canon',
		aliases: ['The Council'],
		text: 'Oligarchic ruling body that usurped the crown and placed a bounty upon all surviving bloodline mages.'
	}
];

export const SAMPLE_DECISIONS: Decision[] = [
	{
		id: 'D1',
		date: new Date().toISOString().slice(0, 10),
		topic: 'Magic Cost & Limitations',
		decision: 'Fire magic cannot summon water and demands physical body warmth.',
		authorWords: '"Small fragments of warmth per use"',
		source: 'Editorial outline',
		affects: 'bible:magic, chapters:ch1',
		status: 'locked'
	},
	{
		id: 'D2',
		date: new Date().toISOString().slice(0, 10),
		topic: "Kael's Motivation",
		decision: "Kael prioritizes saving his exiled sister over vengeance or the throne.",
		authorWords: '"He is driven by love, not revenge"',
		source: 'Character design document',
		affects: 'character:Kael, theme',
		status: 'locked'
	}
];

export const SAMPLE_EVENTS: StoryEvent[] = [
	{
		id: 'ev1',
		chapterId: 'c1',
		sceneTitle: 'The Ashen Vow',
		order: 1,
		inStoryTime: 'Day 1 (Midnight)',
		participantIds: ['Kael'],
		disclosures: [
			{
				id: 'sec1',
				fact: 'The courier was poisoned by the Iron Council',
				disclosedAtOrder: 1,
				disclosedToCharacterIds: ['Kael'],
				isPublicToReader: true
			}
		],
		mutations: [
			{
				id: 'mut1',
				characterId: 'Kael',
				type: 'item_acquired',
				description: 'Basalt Signet Stone'
			}
		],
		status: 'canon'
	},
	{
		id: 'ev2',
		chapterId: 'c2',
		sceneTitle: 'The Whispering Spire',
		order: 2,
		inStoryTime: 'Day 3 (Dusk)',
		participantIds: ['Kael', 'Lyra'],
		disclosures: [
			{
				id: 'sec2',
				fact: 'The Sunken Vault holds the True Crown',
				disclosedAtOrder: 2,
				disclosedToCharacterIds: ['Lyra', 'Kael'],
				isPublicToReader: true
			}
		],
		mutations: [
			{
				id: 'mut2',
				characterId: 'Kael',
				targetCharacterId: 'Lyra',
				type: 'relationship',
				description: 'Formed alliance with Lyra',
				trustDelta: 25,
				polarity: 'allied'
			}
		],
		status: 'canon'
	}
];

export const SAMPLE_MYSTERIES: MysteryNode[] = [
	{
		id: 'm1',
		type: 'mystery',
		title: 'Who poisoned the royal courier?',
		description: 'The courier died of blackened blood before delivering the sealed decree.',
		status: 'planted',
		chapterId: 'c1',
		connectedTo: ['m2', 'm3'],
		x: 80,
		y: 120
	},
	{
		id: 'm2',
		type: 'clue',
		title: 'Blackened wax seal with snake crest',
		description: 'The wax on the decree bore a serpentine crest instead of the King.',
		status: 'discovered',
		chapterId: 'c1',
		connectedTo: ['m4'],
		x: 320,
		y: 80
	},
	{
		id: 'm3',
		type: 'red_herring',
		title: 'Western Guild rumors',
		description: 'Tavern gossips claim tavern smugglers poisoned the courier for gold.',
		status: 'planted',
		chapterId: 'c1',
		connectedTo: [],
		x: 320,
		y: 240
	},
	{
		id: 'm4',
		type: 'reveal',
		title: 'The Iron Council orchestrated the assassination',
		description: 'Lyra reveals the snake crest belongs to the Chancellor of Iron.',
		status: 'revealed',
		chapterId: 'c2',
		revealOrder: 2,
		connectedTo: [],
		x: 600,
		y: 120
	}
];

export const SAMPLE_PINS: MapPin[] = [
	{ id: 'p1', name: 'Emberhold', type: 'city', x: 22, y: 35 },
	{ id: 'p2', name: 'High Citadel', type: 'citadel', x: 55, y: 20 },
	{ id: 'p3', name: 'Iron Pass', type: 'wilds', x: 40, y: 28 },
	{ id: 'p4', name: 'Sunken Vault', type: 'fortress', x: 75, y: 65 }
];

export const SAMPLE_JOURNEYS: JourneyWaypoint[] = [
	{ id: 'j1', characterId: 'Kael', pinId: 'p1', dayIndex: 1, order: 1, chapterTitle: 'Ch. 1' },
	{ id: 'j2', characterId: 'Kael', pinId: 'p3', dayIndex: 2, order: 2, chapterTitle: 'Ch. 2' },
	{ id: 'j3', characterId: 'Kael', pinId: 'p2', dayIndex: 3, order: 3, chapterTitle: 'Ch. 3' }
];

export const SAMPLE_BEATS: StoryBeat[] = [
	{
		id: 'b1',
		chapterTitle: 'Chapter 1: The Ashen Vow',
		beatName: 'Inciting Incident — The Poisoned Courier',
		act: 'Act I',
		order: 1,
		tension: 3,
		valueShift: 'Safety ➔ Danger',
		summary: 'Kael discovers the assassination and must flee into the cold wilderness.'
	},
	{
		id: 'b2',
		chapterTitle: 'Chapter 2: The Whispering Spire',
		beatName: 'Threshold — Entrance to the Spire',
		act: 'Act I',
		order: 2,
		tension: 5,
		valueShift: 'Isolation ➔ Alliance',
		summary: 'Kael makes contact with Lyra to secure secret routes through the crags.'
	}
];

export function loadSampleStory(): void {
	if (typeof localStorage === 'undefined') return;
	saveChapters(SAMPLE_CHAPTERS);
	saveBible(SAMPLE_BIBLE);
	saveDecisions(SAMPLE_DECISIONS);
	saveEvents(SAMPLE_EVENTS);
	saveMysteries(SAMPLE_MYSTERIES);
	saveMapPins(SAMPLE_PINS);
	saveJourneys(SAMPLE_JOURNEYS);
	saveStoryBeats(SAMPLE_BEATS);
	saveVoiceProfile(SAMPLE_VOICE_PROFILE);
	saveFeedbackItems(SAMPLE_FEEDBACK_ITEMS);
}

export function clearAllStoryData(): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.removeItem(BIBLE_KEY);
	localStorage.removeItem(CHAPTERS_KEY);
	localStorage.removeItem(DECISIONS_KEY);
	localStorage.removeItem(EVENTS_KEY);
	localStorage.removeItem(MYSTERIES_KEY);
	localStorage.removeItem(MAP_PINS_KEY);
	localStorage.removeItem(JOURNEYS_KEY);
	localStorage.removeItem(STORY_BEATS_KEY);
	localStorage.removeItem(VOICE_KEY);
	localStorage.removeItem(FEEDBACK_KEY);
}

// ============================================================================
// NOVEL SKILLS SUITE: Voice Lab, Anti-Slop, Craft Lessons, Beta Triage & Bundle
// ============================================================================

export const VOICE_KEY = 'writers-tool.voice.v1';
export const FEEDBACK_KEY = 'writers-tool.feedback.v1';

export interface VoiceProfile {
	id: string;
	authorName: string;
	sampleTitle: string;
	sampleText: string;
	diction: string;
	sentenceHabit: string;
	avgSentenceLength: number;
	sentenceLengthDistribution: { short: number; medium: number; long: number };
	contractionRate: number; // percentage 0-100
	formality: 'casual' | 'neutral' | 'formal';
	signatureMove: string;
	lessonDepth: 'new_writer' | 'experienced';
	dontTouchList: string[];
	evidenceQuotes: string[];
	updatedAt: string;
}

export interface AntiSlopViolation {
	ruleId: number;
	ruleName: string;
	snippet: string;
	explanation: string;
	fix: string;
	index?: number;
	severity: 'error' | 'warning' | 'info';
}

export interface CraftLesson {
	id: string;
	title: string;
	category:
		| 'telling_vs_showing'
		| 'filter_verbs'
		| 'dialogue_tags'
		| 'repetition'
		| 'abstract_emotion'
		| 'vague_setting'
		| 'unclear_antecedents';
	shortSummary: string;
	explanation: string;
	exampleBad: string;
	exampleGood: string;
	exercisePrompt: string;
}

export type FeedbackClass = 'confusion' | 'pacing' | 'character' | 'stakes' | 'prose' | 'taste';
export type FeedbackVerdict = 'open' | 'accepted' | 'rejected' | 'modified';

export interface BetaFeedbackItem {
	id: string;
	readerName: string;
	chapterId: string;
	chapterTitle?: string;
	paragraphIndex?: number;
	quote: string;
	feedback: string;
	candidateClass: FeedbackClass;
	weight: number;
	verdict: FeedbackVerdict;
	verdictNotes?: string;
	linkedDecisionId?: string;
	createdAt: string;
}

export interface FeedbackCluster {
	chapterId: string;
	chapterTitle?: string;
	paragraphIndex?: number;
	candidateClass: FeedbackClass;
	items: BetaFeedbackItem[];
	totalWeight: number;
	hasConflict: boolean;
	conflictDetails?: string;
}

export interface SentenceRhythmStats {
	lengths: number[];
	avg: number;
	stdDev: number;
	distribution: { short: number; medium: number; long: number }; // short <= 8, med 9-24, long >= 25
	uniformStretches: { startIndex: number; length: number; sentenceLengths: number[] }[];
}

export interface ContractionStats {
	rate: number; // percentage (0-100)
	contractions: number;
	uncontractedPairs: number;
	examples: string[];
}

// --- Craft Micro-Lessons Library ---
export const CRAFT_LESSONS: CraftLesson[] = [
	{
		id: 'telling_vs_showing',
		title: 'Telling vs Showing',
		category: 'telling_vs_showing',
		shortSummary: 'Show one camera-catchable thing.',
		explanation:
			'Name the abstraction, then replace it with one concrete thing a camera could catch — a hand, a sound, or a stopped motion.',
		exampleBad: 'She was furious with the council.',
		exampleGood: 'Her knuckles clicked against the oak table as she stood.',
		exercisePrompt: 'Reply with one sentence: what do the character’s hands or breathing do right now?'
	},
	{
		id: 'filter_verbs',
		title: 'Filter Verbs',
		category: 'filter_verbs',
		shortSummary: 'Drop the lens; keep the object.',
		explanation:
			'Remove filtering verbs (saw, felt, heard, noticed) so the reader experiences the event directly instead of watching the character experience it.',
		exampleBad: 'He heard the wolves howling in the pine woods.',
		exampleGood: 'Wolves howled in the pine woods.',
		exercisePrompt: 'Cut the sensory filter verb and describe the sound or sight as immediate reality.'
	},
	{
		id: 'dialogue_tags',
		title: 'Dialogue Tags',
		category: 'dialogue_tags',
		shortSummary: 'Said + beat beats adverb.',
		explanation:
			'Adverbs in dialogue tags ("he said angrily") signal missing subtext. Use a clean "said" or pair dialogue with a physical action beat.',
		exampleBad: '"Put the lantern down," he ordered threateningly.',
		exampleGood: '"Put the lantern down." He reached for the hilt at his hip.',
		exercisePrompt: 'Replace the adverb with a physical micro-action occurring during or after speech.'
	},
	{
		id: 'repetition',
		title: 'Word Repetition',
		category: 'repetition',
		shortSummary: 'One good detail, once.',
		explanation:
			'Repeating the same substantive adjective or noun within a paragraph weakens both occurrences. Keep only the sharpest instance.',
		exampleBad: 'The cold iron door led into a cold stone tunnel.',
		exampleGood: 'The iron door led into a freezing stone tunnel.',
		exercisePrompt: 'Cut the duplicated descriptor or upgrade the second occurrence to a more precise word.'
	},
	{
		id: 'abstract_emotion',
		title: 'Abstract Emotion',
		category: 'abstract_emotion',
		shortSummary: 'Locate it in the body or room.',
		explanation:
			'Name where the writer feels the emotion: hands, throat, jaw, ribs, or the sudden silence of the room.',
		exampleBad: 'Grief washed over him when he saw the ruins.',
		exampleGood: 'He swallowed hard against the tight knot in his throat.',
		exercisePrompt: 'Where does the physical sensation of this emotion hit in the character’s body?'
	},
	{
		id: 'vague_setting',
		title: 'Vague Setting',
		category: 'vague_setting',
		shortSummary: 'One true detail anchors a room.',
		explanation:
			'A scene set in a "dark chamber" floats in limbo. One authentic physical texture or smell grounds the entire location.',
		exampleBad: 'They sat in an eerie old room.',
		exampleGood: 'Damp saltpeter smelled sharp beneath the peeling plaster.',
		exercisePrompt: 'Give one specific sensory detail (smell, texture, or temperature) unique to this room.'
	},
	{
		id: 'unclear_antecedents',
		title: 'Unclear Antecedents',
		category: 'unclear_antecedents',
		shortSummary: 'Name the noun.',
		explanation:
			'Pronoun soup ("He told him that he should leave") forces the reader to stop and decode. Clarify names and objects explicitly.',
		exampleBad: 'Kael gave the dagger to Vane because he feared he would lose it.',
		exampleGood: 'Kael passed the dagger to Vane, fearing the scout would drop it.',
		exercisePrompt: 'Replace the ambiguous pronoun with the character’s name or distinct role.'
	}
];

// --- 10 Iron Anti-Slop Rules Scanner ---
export function scanAntiSlop(text: string): AntiSlopViolation[] {
	if (!text || !text.trim()) return [];
	const violations: AntiSlopViolation[] = [];
	const words = text.trim().split(/\s+/).filter(Boolean);
	const totalWords = words.length;

	// Rule 1: Em-dash spam — max 1 em-dash per 300 words
	const emDashMatches = text.match(/—|--/g) || [];
	const allowedEmDashes = Math.max(1, Math.floor(totalWords / 300));
	if (emDashMatches.length > allowedEmDashes && emDashMatches.length >= 2) {
		violations.push({
			ruleId: 1,
			ruleName: 'Em-dash spam',
			snippet: `Found ${emDashMatches.length} em-dashes across ${totalWords} words (allowed: ${allowedEmDashes})`,
			explanation: 'Em-dash frequency exceeds 1 per 300 words. Overuse destroys sentence cadence.',
			fix: 'Convert em-dashes to commas, colons, or clean separate sentences.',
			severity: 'warning'
		});
	}

	// Rule 2: "Not X but Y" / "It's not... it's..." pattern ban
	const notXButYRegex =
		/\b(?:it(?:'s|\s+was|\s+is)?\s+not\s+[^,.?!;]+(?:,|\s+but|\s+it(?:'s|\s+was|\s+is))\s+[^.?!;]+|not\s+([a-zA-Z0-9']+),\s*but\s+([a-zA-Z0-9']+))\b/gi;
	let match: RegExpExecArray | null;
	while ((match = notXButYRegex.exec(text)) !== null) {
		violations.push({
			ruleId: 2,
			ruleName: '"Not X but Y" formula',
			snippet: match[0],
			explanation: 'Banned rhetorical formula. State the thing directly without negating first.',
			fix: 'State the reality directly instead of declaring what it is not.',
			index: match.index,
			severity: 'error'
		});
		if (violations.length > 20) break;
	}

	// Rule 3: Purple triads (three-item lyrical lists)
	const purpleTriadRegex =
		/\b([a-zA-Z]+(?:ing|ed)?),\s+([a-zA-Z]+(?:ing|ed)?),?\s+(?:and\s+)([a-zA-Z]+(?:ing|ed)?)\b/gi;
	while ((match = purpleTriadRegex.exec(text)) !== null) {
		const [, w1, w2, w3] = match;
		// Filter out simple coordinate nouns like "apples, oranges, and pears"
		const isParticiple = w1.endsWith('ing') || w1.endsWith('ed');
		const isLong = w1.length > 4 && w2.length > 4 && w3.length > 4;
		if (isParticiple || isLong) {
			violations.push({
				ruleId: 3,
				ruleName: 'Purple triad',
				snippet: match[0],
				explanation: 'Three-item lyrical list detected ("the dust, the dark, the debt"). Max two.',
				fix: 'Cut one item or split into two concrete physical actions.',
				index: match.index,
				severity: 'warning'
			});
		}
		if (violations.length > 20) break;
	}

	// Rule 4: Moralizing / thesis endings
	const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
	const moralizingEndingPatterns = [
		/(?:and\s+)?that\s+was\s+(?:what|why|how|when)\b/i,
		/\b(?:he|she|they|i)\s+realized\s+(?:that\s+)?what\s+it\s+(?:truly\s+)?meant\b/i,
		/\bin\s+the\s+end,\s+(?:he|she|they|it)\b/i,
		/\bit\s+was\s+a\s+lesson\b/i,
		/\bafter\s+all,\s+it\s+was\b/i,
		/\band\s+in\s+that\s+moment,\s+(?:he|she|they)\b/i
	];
	paragraphs.forEach((para, pIdx) => {
		const sentences = para.split(/(?<=[.!?])\s+/).filter(Boolean);
		if (sentences.length > 0) {
			const lastSentence = sentences[sentences.length - 1];
			for (const pat of moralizingEndingPatterns) {
				if (pat.test(lastSentence)) {
					violations.push({
						ruleId: 4,
						ruleName: 'Moralizing / thesis ending',
						snippet: `Para ${pIdx + 1}: "${lastSentence}"`,
						explanation:
							'No thesis or moralizing wrap-up sentences at paragraph/chapter end ("And that was what it meant to...").',
						fix: 'End the paragraph on a sensory image or concrete physical action from the draft.',
						severity: 'error'
					});
					break;
				}
			}
		}
	});

	// Rule 5: Uniform rhythm — 3+ consecutive sentences within ±4 words of each other
	const rhythmStats = calculateSentenceRhythms(text);
	for (const stretch of rhythmStats.uniformStretches) {
		violations.push({
			ruleId: 5,
			ruleName: 'Uniform sentence rhythm',
			snippet: `Sentences ${stretch.startIndex + 1}–${stretch.startIndex + stretch.length} (lengths: ${stretch.sentenceLengths.join(', ')} words)`,
			explanation:
				'3+ consecutive sentences are within ±4 words of each other, creating a monotonous droning cadence.',
			fix: 'Alternate short punches (≤8 words), medium sentences (10–20 words), and long rolls (25+ words).',
			severity: 'warning'
		});
	}

	// Rule 6: AI adjectives & cliché words
	const aiClichéWords = [
		'tapestry',
		'mosaic',
		'symphony',
		'dance of',
		'labyrinth',
		'echo of',
		'whisper of',
		'testament to',
		'palpable',
		'ineffable',
		'liminal',
		'crescendo',
		'kaleidoscope',
		'beacon of',
		'shiver ran down',
		'breath he didn\'t know he was holding',
		'breath she didn\'t know she was holding'
	];
	const lower = text.toLowerCase();
	for (const cliché of aiClichéWords) {
		const idx = lower.indexOf(cliché);
		if (idx !== -1) {
			violations.push({
				ruleId: 6,
				ruleName: 'AI adjective / cliché',
				snippet: text.slice(Math.max(0, idx - 10), Math.min(text.length, idx + cliché.length + 15)),
				explanation: `"${cliché}" is an overused decorative AI cliché.`,
				fix: 'Ground the scene in a concrete world detail or cut entirely.',
				index: idx,
				severity: 'error'
			});
		}
	}

	// Rule 7: Hollow intensifiers
	const intensifiers = ['very', 'deeply', 'truly', 'utterly', 'quite literally', 'incredibly', 'profoundly'];
	for (const int of intensifiers) {
		const intRegex = new RegExp(`\\b${int}\\b`, 'gi');
		while ((match = intRegex.exec(text)) !== null) {
			violations.push({
				ruleId: 7,
				ruleName: 'Hollow intensifier',
				snippet: text.slice(Math.max(0, match.index - 10), Math.min(text.length, match.index + int.length + 15)),
				explanation: `Hollow intensifier "${match[0]}" dilutes narrative punch.`,
				fix: 'Remove the intensifier or choose a stronger, more specific base verb or noun.',
				index: match.index,
				severity: 'warning'
			});
			if (violations.length > 25) break;
		}
	}

	// Rule 8: Dialogue sameness (long unbroken speeches in quotes with 0 contractions)
	const quoteRegex = /"([^"]{120,})"/g;
	while ((match = quoteRegex.exec(text)) !== null) {
		const speech = match[1];
		const hasContractions = /'(?:t|s|re|ve|m|ll|d)\b/i.test(speech);
		const hasFormalTokens = /\b(?:do not|cannot|will not|is not|are not|have not)\b/i.test(speech);
		if (!hasContractions && hasFormalTokens) {
			violations.push({
				ruleId: 8,
				ruleName: 'Dialogue rigidity / sameness',
				snippet: `"${speech.slice(0, 60)}..."`,
				explanation: 'Speech block contains zero contractions, creating an artificial, wooden cadence.',
				fix: 'Loosen character dialogue with natural contractions and speech rhythm unless explicitly formal nobility.',
				index: match.index,
				severity: 'warning'
			});
		}
	}

	// Rule 9: Filter-verb pileup (max 1 per page of saw/felt/heard/knew/realized/wondered)
	const filterVerbsRegex = /\b(?:saw|felt|heard|knew|realized|wondered|noticed|watched)\b/gi;
	paragraphs.forEach((para, pIdx) => {
		const paraMatches = para.match(filterVerbsRegex);
		if (paraMatches && paraMatches.length >= 3) {
			violations.push({
				ruleId: 9,
				ruleName: 'Filter-verb pileup',
				snippet: `Para ${pIdx + 1} contains ${paraMatches.length} filter verbs (${paraMatches.join(', ')})`,
				explanation: 'Filter verbs create distance between reader and action ("she saw the door open").',
				fix: 'Drop the lens, keep the object ("the door opened").',
				severity: 'warning'
			});
		}
	});

	// Rule 10: Symmetry tic (mirrored clauses)
	const symmetryRegex = /\bAs\s+[^,.?!]+,\s+[^.?!]+(?:\.|\;)\s+As\s+[^,.?!]+,\s+[^.?!]+/i;
	if ((match = symmetryRegex.exec(text)) !== null) {
		violations.push({
			ruleId: 10,
			ruleName: 'Symmetry tic',
			snippet: match[0].slice(0, 80) + '...',
			explanation: 'Mirrored syntactic structure back-to-back ("As X, Y. As A, B.").',
			fix: 'Vary the clause structure so consecutive sentences do not mirror each other.',
			index: match.index,
			severity: 'warning'
		});
	}

	return violations;
}

// --- Sentence Rhythm Calculator ---
export function calculateSentenceRhythms(text: string): SentenceRhythmStats {
	if (!text || !text.trim()) {
		return {
			lengths: [],
			avg: 0,
			stdDev: 0,
			distribution: { short: 0, medium: 0, long: 0 },
			uniformStretches: []
		};
	}

	// Split by terminal punctuation followed by space or newline
	const rawSentences = text
		.replace(/([.!?])\s+/g, '$1|')
		.split('|')
		.map((s) => s.trim())
		.filter((s) => s.length > 2);

	const lengths = rawSentences.map((s) => s.split(/\s+/).filter(Boolean).length);
	if (lengths.length === 0) {
		return {
			lengths: [],
			avg: 0,
			stdDev: 0,
			distribution: { short: 0, medium: 0, long: 0 },
			uniformStretches: []
		};
	}

	const sum = lengths.reduce((acc, n) => acc + n, 0);
	const avg = Math.round((sum / lengths.length) * 10) / 10;
	const variance = lengths.reduce((acc, n) => acc + Math.pow(n - avg, 2), 0) / lengths.length;
	const stdDev = Math.round(Math.sqrt(variance) * 10) / 10;

	const distribution = { short: 0, medium: 0, long: 0 };
	lengths.forEach((len) => {
		if (len <= 8) distribution.short++;
		else if (len <= 24) distribution.medium++;
		else distribution.long++;
	});

	// Find stretches of 3+ consecutive sentences within ±4 words
	const uniformStretches: { startIndex: number; length: number; sentenceLengths: number[] }[] = [];
	let currentRun: number[] = [lengths[0]];
	let startIndex = 0;

	for (let i = 1; i < lengths.length; i++) {
		const diff = Math.abs(lengths[i] - currentRun[0]);
		if (diff <= 4) {
			currentRun.push(lengths[i]);
		} else {
			if (currentRun.length >= 3) {
				uniformStretches.push({ startIndex, length: currentRun.length, sentenceLengths: [...currentRun] });
			}
			currentRun = [lengths[i]];
			startIndex = i;
		}
	}
	if (currentRun.length >= 3) {
		uniformStretches.push({ startIndex, length: currentRun.length, sentenceLengths: [...currentRun] });
	}

	return { lengths, avg, stdDev, distribution, uniformStretches };
}

// --- Contraction Rate Calculator ---
export function calculateContractionRate(text: string): ContractionStats {
	if (!text || !text.trim()) {
		return { rate: 0, contractions: 0, uncontractedPairs: 0, examples: [] };
	}

	const contractionRegex = /\b[a-zA-Z]+'(?:t|s|re|ve|m|ll|d)\b/gi;
	const contractionsFound = text.match(contractionRegex) || [];

	const uncontractedRegex =
		/\b(?:do not|does not|did not|cannot|could not|would not|should not|is not|are not|was not|were not|have not|has not|had not|will not|it is|there is|that is|i am|we are|they are)\b/gi;
	const uncontractedFound = text.match(uncontractedRegex) || [];

	const total = contractionsFound.length + uncontractedFound.length;
	const rate = total === 0 ? 50 : Math.round((contractionsFound.length / total) * 100);

	const uniqueExamples = Array.from(new Set(contractionsFound.slice(0, 5)));

	return {
		rate,
		contractions: contractionsFound.length,
		uncontractedPairs: uncontractedFound.length,
		examples: uniqueExamples
	};
}

// --- Voice Metric Extractor ---
export function extractVoiceMetrics(text: string): Partial<VoiceProfile> {
	const rhythms = calculateSentenceRhythms(text);
	const contractions = calculateContractionRate(text);

	let formality: 'casual' | 'neutral' | 'formal' = 'neutral';
	if (contractions.rate > 65 && rhythms.avg < 14) {
		formality = 'casual';
	} else if (contractions.rate < 25 && rhythms.avg > 18) {
		formality = 'formal';
	}

	let sentenceHabit = 'Balanced variation between descriptive phrases and concise beats.';
	if (rhythms.distribution.short > rhythms.distribution.medium + rhythms.distribution.long) {
		sentenceHabit = 'Short punches and staccato cadences. High velocity.';
	} else if (rhythms.distribution.long > rhythms.distribution.short) {
		sentenceHabit = 'Long descriptive rolls and layered subordinate clauses.';
	}

	let diction = 'Concrete sensory vocabulary with direct Anglo-Saxon phrasing.';
	const lower = text.toLowerCase();
	if (lower.includes('ancient') || lower.includes('shadow') || lower.includes('whisper')) {
		diction = 'Atmospheric, somber, with emphasis on tactile weight and silence.';
	}

	return {
		sampleText: text,
		diction,
		sentenceHabit,
		avgSentenceLength: rhythms.avg,
		sentenceLengthDistribution: rhythms.distribution,
		contractionRate: contractions.rate,
		formality,
		signatureMove: 'Anchors action scenes in immediate physical objects and sound textures.',
		lessonDepth: 'experienced',
		dontTouchList: ['sentence fragments in tension scenes', 'tactile monosyllables'],
		evidenceQuotes: text
			.split(/(?<=[.!?])\s+/)
			.filter((s) => s.length > 25)
			.slice(0, 3)
	};
}

// --- Voice Profile Storage ---
export function loadVoiceProfile(): VoiceProfile | null {
	try {
		if (typeof localStorage === 'undefined') return null;
		const raw = localStorage.getItem(VOICE_KEY);
		if (raw) return JSON.parse(raw) as VoiceProfile;
	} catch {
		/* ignore */
	}
	return null;
}

export function saveVoiceProfile(profile: VoiceProfile): void {
	try {
		if (typeof localStorage === 'undefined') return;
		localStorage.setItem(VOICE_KEY, JSON.stringify(profile));
	} catch {
		/* ignore */
	}
}

// --- Beta Feedback Storage & Clustering ---
export function loadFeedbackItems(): BetaFeedbackItem[] {
	try {
		if (typeof localStorage === 'undefined') return [];
		const raw = localStorage.getItem(FEEDBACK_KEY);
		if (raw) return JSON.parse(raw) as BetaFeedbackItem[];
	} catch {
		/* ignore */
	}
	return [];
}

export function saveFeedbackItems(items: BetaFeedbackItem[]): void {
	try {
		if (typeof localStorage === 'undefined') return;
		localStorage.setItem(FEEDBACK_KEY, JSON.stringify(items));
	} catch {
		/* ignore */
	}
}

export function clusterFeedback(items: BetaFeedbackItem[]): FeedbackCluster[] {
	if (!items || items.length === 0) return [];
	const groups: Record<string, BetaFeedbackItem[]> = {};

	for (const item of items) {
		const key = `${item.chapterId}::${item.paragraphIndex ?? 'all'}::${item.candidateClass}`;
		if (!groups[key]) groups[key] = [];
		groups[key].push(item);
	}

	const clusters: FeedbackCluster[] = [];
	for (const group of Object.values(groups)) {
		const first = group[0];
		const totalWeight = group.reduce((sum, it) => sum + it.weight, 0);

		// Detect contradictory opinions (e.g. "too fast" vs "too slow")
		let hasConflict = false;
		let conflictDetails: string | undefined;
		if (first.candidateClass === 'pacing' && group.length > 1) {
			const fastCount = group.filter((g) => /fast|rush/i.test(g.feedback)).length;
			const slowCount = group.filter((g) => /slow|drag|bored/i.test(g.feedback)).length;
			if (fastCount > 0 && slowCount > 0) {
				hasConflict = true;
				conflictDetails = `Conflicting notes: ${fastCount} reader(s) felt rushed while ${slowCount} reader(s) felt it dragged.`;
			}
		}

		clusters.push({
			chapterId: first.chapterId,
			chapterTitle: first.chapterTitle,
			paragraphIndex: first.paragraphIndex,
			candidateClass: first.candidateClass,
			items: group,
			totalWeight,
			hasConflict,
			conflictDetails
		});
	}

	// Rank clusters: multi-reader blocking classes first, taste last
	const classPriority: Record<FeedbackClass, number> = {
		confusion: 6,
		character: 5,
		stakes: 4,
		pacing: 3,
		prose: 2,
		taste: 1
	};

	clusters.sort((a, b) => {
		if (a.candidateClass === 'taste' && b.candidateClass !== 'taste') return 1;
		if (b.candidateClass === 'taste' && a.candidateClass !== 'taste') return -1;
		if (b.items.length !== a.items.length) return b.items.length - a.items.length;
		return classPriority[b.candidateClass] - classPriority[a.candidateClass];
	});

	return clusters;
}

// --- Markdown Serializers & Parsers ---
export function serializeVoiceMarkdown(profile: VoiceProfile): string {
	return `# Voice: ${profile.sampleTitle || 'Project Voice'}
## Fingerprints
1. Diction: ${profile.diction}
2. Sentence habit: ${profile.sentenceHabit} (avg: ${profile.avgSentenceLength} words)
3. Dialogue tic: contraction rate ~${profile.contractionRate}%
4. Formality: ${profile.formality}
5. Signature move: ${profile.signatureMove}

## Calibration
- Lesson depth: ${profile.lessonDepth === 'new_writer' ? 'new writer (explain terms)' : 'experienced (terse craft notes)'}
- Don't-touch list: ${profile.dontTouchList.join(', ')}

## Evidence Quotes
${profile.evidenceQuotes.map((q) => `> "${q}"`).join('\n')}
`;
}

export function parseVoiceMarkdown(md: string): Partial<VoiceProfile> {
	const profile: Partial<VoiceProfile> = {
		dontTouchList: [],
		evidenceQuotes: []
	};

	const lines = md.split('\n');
	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed.startsWith('1. Diction:')) profile.diction = trimmed.replace('1. Diction:', '').trim();
		else if (trimmed.startsWith('2. Sentence habit:')) profile.sentenceHabit = trimmed.replace('2. Sentence habit:', '').trim();
		else if (trimmed.startsWith('4. Formality:')) {
			const form = trimmed.replace('4. Formality:', '').trim().toLowerCase();
			if (form.includes('casual')) profile.formality = 'casual';
			else if (form.includes('formal')) profile.formality = 'formal';
			else profile.formality = 'neutral';
		} else if (trimmed.startsWith('5. Signature move:')) profile.signatureMove = trimmed.replace('5. Signature move:', '').trim();
		else if (trimmed.startsWith("- Don't-touch list:")) {
			profile.dontTouchList = trimmed
				.replace("- Don't-touch list:", '')
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean);
		} else if (trimmed.startsWith('> "')) {
			profile.evidenceQuotes?.push(trimmed.replace(/^>\s*"|"\s*$/g, ''));
		}
	}

	return profile;
}

export function serializeFeedbackMarkdown(items: BetaFeedbackItem[]): string {
	const clusters = clusterFeedback(items);
	let md = '# Beta Reader Feedback Triage\n\n';

	clusters.forEach((c, idx) => {
		const location = c.paragraphIndex !== undefined ? `ch: ${c.chapterId}, para: ${c.paragraphIndex}` : `ch: ${c.chapterId}`;
		const readers = Array.from(new Set(c.items.map((i) => i.readerName))).join(', ');
		md += `### F${idx + 1} — ${readers} — ${location}\n`;
		md += `- Class: ${c.candidateClass} (${c.items.length} reader${c.items.length > 1 ? 's' : ''} → weight ${c.totalWeight})\n`;
		if (c.hasConflict && c.conflictDetails) {
			md += `- Conflict: ${c.conflictDetails}\n`;
		}
		c.items.forEach((item) => {
			md += `  - [${item.readerName}] "${item.quote}": ${item.feedback} (Status: ${item.verdict})\n`;
			if (item.verdictNotes) md += `    Verdict Notes: ${item.verdictNotes}\n`;
		});
		md += '\n';
	});

	return md;
}

export function parseFeedbackMarkdown(md: string): BetaFeedbackItem[] {
	const items: BetaFeedbackItem[] = [];
	const sections = md.split(/(?=###\s+F\d+)/);

	for (const sec of sections) {
		if (!sec.trim().startsWith('###')) continue;
		const headerMatch = sec.match(/###\s+F\d+\s+—\s+([^—]+)\s+—\s+(?:ch:\s*([^,\n]+)(?:,\s*para:\s*(\d+))?)/i);
		const classMatch = sec.match(/- Class:\s*([a-z]+)/i);

		const candidateClass: FeedbackClass =
			classMatch && ['confusion', 'pacing', 'character', 'stakes', 'prose', 'taste'].includes(classMatch[1].toLowerCase())
				? (classMatch[1].toLowerCase() as FeedbackClass)
				: 'confusion';

		const chapterId = headerMatch?.[2]?.trim() ?? 'c1';
		const paragraphIndex = headerMatch?.[3] ? parseInt(headerMatch[3], 10) : undefined;

		const observationLines = sec.match(/\s*-\s*\[([^\]]+)\]\s*"([^"]+)":\s*([^\n]+)/g) || [];
		for (const obs of observationLines) {
			const m = obs.match(/\s*-\s*\[([^\]]+)\]\s*"([^"]+)":\s*([^(]+)(?:\(Status:\s*([a-z]+)\))?/i);
			if (m) {
				const readerName = m[1].trim();
				const quote = m[2].trim();
				const feedback = m[3].trim();
				const verdict = (m[4]?.trim() as FeedbackVerdict) || 'open';
				items.push({
					id: 'f_' + Math.random().toString(36).slice(2, 9),
					readerName,
					chapterId,
					paragraphIndex,
					quote,
					feedback,
					candidateClass,
					weight: 1,
					verdict,
					createdAt: new Date().toISOString()
				});
			}
		}
	}

	return items;
}

// --- Project Bundle Exporter & Importer (JSON agent-compatible) ---
export interface StoryOSProjectBundle {
	version: string;
	exportedAt: string;
	bible: WorldEntry[];
	chapters: Chapter[];
	decisions: Decision[];
	events: StoryEvent[];
	mysteries: MysteryNode[];
	mapPins: MapPin[];
	journeys: JourneyWaypoint[];
	storyBeats: StoryBeat[];
	voiceProfile: VoiceProfile | null;
	feedbackItems: BetaFeedbackItem[];
}

export function exportProjectBundleJson(): string {
	const bundle: StoryOSProjectBundle = {
		version: '1.0.0',
		exportedAt: new Date().toISOString(),
		bible: loadBible(),
		chapters: loadChapters(),
		decisions: loadDecisions(),
		events: loadEvents(),
		mysteries: loadMysteries(),
		mapPins: loadMapPins(),
		journeys: loadJourneys(),
		storyBeats: loadStoryBeats(),
		voiceProfile: loadVoiceProfile(),
		feedbackItems: loadFeedbackItems()
	};
	return JSON.stringify(bundle, null, 2);
}

export function importProjectBundleJson(
	jsonStr: string
): { success: boolean; importedCount: number; errors?: string[] } {
	try {
		const bundle = JSON.parse(jsonStr) as Partial<StoryOSProjectBundle>;
		if (!bundle || typeof bundle !== 'object') {
			return { success: false, importedCount: 0, errors: ['Invalid JSON format'] };
		}

		let importedCount = 0;
		if (Array.isArray(bundle.bible)) {
			saveBible(bundle.bible);
			importedCount += bundle.bible.length;
		}
		if (Array.isArray(bundle.chapters)) {
			saveChapters(bundle.chapters);
			importedCount += bundle.chapters.length;
		}
		if (Array.isArray(bundle.decisions)) {
			saveDecisions(bundle.decisions);
			importedCount += bundle.decisions.length;
		}
		if (Array.isArray(bundle.events)) {
			saveEvents(bundle.events);
			importedCount += bundle.events.length;
		}
		if (Array.isArray(bundle.mysteries)) {
			saveMysteries(bundle.mysteries);
			importedCount += bundle.mysteries.length;
		}
		if (Array.isArray(bundle.mapPins)) {
			saveMapPins(bundle.mapPins);
			importedCount += bundle.mapPins.length;
		}
		if (Array.isArray(bundle.journeys)) {
			saveJourneys(bundle.journeys);
			importedCount += bundle.journeys.length;
		}
		if (Array.isArray(bundle.storyBeats)) {
			saveStoryBeats(bundle.storyBeats);
			importedCount += bundle.storyBeats.length;
		}
		if (bundle.voiceProfile) {
			saveVoiceProfile(bundle.voiceProfile);
			importedCount++;
		}
		if (Array.isArray(bundle.feedbackItems)) {
			saveFeedbackItems(bundle.feedbackItems);
			importedCount += bundle.feedbackItems.length;
		}

		return { success: true, importedCount };
	} catch (err) {
		return { success: false, importedCount: 0, errors: [(err as Error).message] };
	}
}

// Browser file download utility
export function downloadFile(filename: string, content: string, mimeType = 'text/plain'): void {
	if (typeof window === 'undefined' || typeof document === 'undefined') return;
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// --- Sample Voice Profile & Feedback ---
export const SAMPLE_VOICE_PROFILE: VoiceProfile = {
	id: 'voice-sample-1',
	authorName: 'Sumeet',
	sampleTitle: 'The Ashen Vow — Voice Profile',
	sampleText:
		'The courier died before the candle guttered. Frost edged the window glass, thick as grease. Kael did not touch the body; he knew how belladonna smells on skin.',
	diction: 'Tactile, monosyllabic, heavy on metal, cold stone, and breath.',
	sentenceHabit: 'Staccato punches in action scenes; 6 to 14 words average.',
	avgSentenceLength: 11.2,
	sentenceLengthDistribution: { short: 4, medium: 2, long: 0 },
	contractionRate: 72,
	formality: 'casual',
	signatureMove: 'Ends beats on an unsaid gesture or stopping motion.',
	lessonDepth: 'experienced',
	dontTouchList: ['fragments in tension beats', 'archaic verbs for weapons'],
	evidenceQuotes: [
		'Frost edged the window glass, thick as grease.',
		'Kael did not touch the body; he knew how belladonna smells on skin.'
	],
	updatedAt: new Date().toISOString()
};

export const SAMPLE_FEEDBACK_ITEMS: BetaFeedbackItem[] = [
	{
		id: 'fb-1',
		readerName: 'Beta-Reader-Alex',
		chapterId: 'c1',
		chapterTitle: 'Chapter 1: The Ashen Vow',
		paragraphIndex: 3,
		quote: 'Kael took the silver coin without hesitation.',
		feedback: 'Felt abrupt. Why does an assassin trust a coin from a dying courier?',
		candidateClass: 'character',
		weight: 2,
		verdict: 'open',
		createdAt: '2026-10-01T10:00:00Z'
	},
	{
		id: 'fb-2',
		readerName: 'Beta-Reader-Clara',
		chapterId: 'c1',
		chapterTitle: 'Chapter 1: The Ashen Vow',
		paragraphIndex: 3,
		quote: 'He turned toward the gate.',
		feedback: 'The trust beat here felt rushed.',
		candidateClass: 'character',
		weight: 2,
		verdict: 'open',
		createdAt: '2026-10-01T10:30:00Z'
	},
	{
		id: 'fb-3',
		readerName: 'Beta-Reader-Morgan',
		chapterId: 'c2',
		chapterTitle: 'Chapter 2: The Whispering Spire',
		paragraphIndex: 5,
		quote: 'I personally prefer more magical descriptions.',
		feedback: 'Would like to see shimmering violet sparks here.',
		candidateClass: 'taste',
		weight: 1,
		verdict: 'rejected',
		verdictNotes: 'Author intent: Low-magic realism in the lowlands.',
		createdAt: '2026-10-01T11:00:00Z'
	}
];
