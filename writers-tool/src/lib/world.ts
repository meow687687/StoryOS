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

/** Find all mentions of world entries in the text (by name or aliases). */
export function findEntityMentions(entries: WorldEntry[], text: string): EntityMention[] {
	if (!text.trim() || !entries.length) return [];
	const mentions: EntityMention[] = [];
	const lower = text.toLowerCase();

	// Collect all targets with their entry, sorted by name length descending
	const targets: { name: string; entry: WorldEntry }[] = [];
	for (const entry of entries) {
		const names = [entry.name, ...(entry.aliases ?? [])].filter(
			(n) => n && n.trim().length >= 2
		);
		for (const name of names) {
			targets.push({ name: name.trim(), entry });
		}
	}
	targets.sort((a, b) => b.name.length - a.name.length);

	// Track occupied character ranges [start, end) to avoid double-matching substrings
	const occupied: [number, number][] = [];
	const isOccupied = (start: number, end: number) => {
		return occupied.some(([s, e]) => Math.max(start, s) < Math.min(end, e));
	};

	for (const { name, entry } of targets) {
		const targetLower = name.toLowerCase();
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
