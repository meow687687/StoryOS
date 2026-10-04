/**
 * Dedicated Editorial Partner Bureau Engine (/partner)
 * Bridges Socratic developmental editing, character psychology interrogation,
 * pacing diagnostics, prose elevation, and canon decision locking.
 */

import type { Decision, WorldEntry } from './world';

export interface CharacterDossier {
	id: string;
	name: string;
	role: 'Protagonist' | 'Antagonist' | 'Deuteragonist' | 'Mentor' | 'Sidekick' | 'Rival' | 'Other';
	want: string; // Tangible external goal
	need: string; // Internal psychological growth
	lie: string; // The falsehood they believe about the world or themselves
	wound: string; // The backstory trauma / ghost that birthed the lie
	moralLimit: string; // The line they swear they will never cross (until act 3)
	voiceQuirks: string; // Specific cadence, idioms, sentence habits
	keyRelationships: { targetName: string; dynamic: string; tensionSource: string }[];
}

export interface PacingDiagnostic {
	sceneTitle: string;
	goal: string; // Character objective
	obstacle: string; // Antagonistic force
	outcome: 'Yes, but...' | 'No, and furthermore...' | 'Pyrrhic Victory' | 'Catastrophic Loss';
	tensionScore: number; // 1 to 10
	stakes: string;
	pacingVerdict: string;
	recommendation: string;
}

export interface EditorialConversationMessage {
	id: string;
	role: 'user' | 'partner';
	desk: 'brainstorm' | 'character' | 'pacing' | 'prose' | 'vault';
	content: string;
	timestamp: string;
	suggestedDecision?: {
		topic: string;
		decision: string;
		affects: string;
	};
}

export const CHARACTER_INTERROGATION_QUESTIONS = [
	{
		id: 'q_lie',
		question: 'What is the fundamental Lie this character believes about reality or themselves?',
		purpose: 'The Lie is the engine of the character arc; overcoming it resolves the internal climax.'
	},
	{
		id: 'q_wound',
		question: 'What specific historical event or trauma gave birth to this Lie (The Ghost)?',
		purpose: 'Provides emotional authenticity and justification for their defensive flaws.'
	},
	{
		id: 'q_want_vs_need',
		question: 'What do they desperately WANT vs what do they actually NEED to be whole?',
		purpose: 'Forces character to sacrifice their external desire for spiritual/moral truth.'
	},
	{
		id: 'q_moral_limit',
		question: 'What is their absolute red line (the moral boundary they will be forced to test)?',
		purpose: 'Sets up the agonizing third-act dilemma.'
	},
	{
		id: 'q_voice',
		question: 'How do they speak under pressure vs when in complete control?',
		purpose: 'Establishes distinct dialogue fingerprints and vocal rhythms.'
	}
];

export const DEVELOPMENTAL_SCENE_CHECKLIST = [
	'Protagonist enters the scene with a clear, immediate micro-goal.',
	'An active antagonistic obstacle (human, environmental, or internal) opposes that goal.',
	'The outcome is never a static "Yes" — it ends on "Yes, but..." or "No, and furthermore...".',
	'Information revealed changes the balance of power or escalates irreversible stakes.'
];

const DOSSIERS_STORAGE_KEY = 'story_os_character_dossiers';
const PARTNER_CHAT_STORAGE_KEY = 'story_os_partner_messages';

export function loadCharacterDossiers(): CharacterDossier[] {
	if (typeof localStorage === 'undefined') return [];
	const raw = localStorage.getItem(DOSSIERS_STORAGE_KEY);
	if (!raw) return [];
	try {
		return JSON.parse(raw);
	} catch {
		return [];
	}
}

export function saveCharacterDossiers(dossiers: CharacterDossier[]): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(DOSSIERS_STORAGE_KEY, JSON.stringify(dossiers));
}

export function loadPartnerMessages(): EditorialConversationMessage[] {
	if (typeof localStorage === 'undefined') return [];
	const raw = localStorage.getItem(PARTNER_CHAT_STORAGE_KEY);
	if (!raw) return [];
	try {
		return JSON.parse(raw);
	} catch {
		return [];
	}
}

export function savePartnerMessages(messages: EditorialConversationMessage[]): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(PARTNER_CHAT_STORAGE_KEY, JSON.stringify(messages));
}

export function evaluateScenePacing(
	sceneText: string,
	goal: string,
	obstacle: string
): PacingDiagnostic {
	const wordCount = sceneText.trim().split(/\s+/).filter(Boolean).length;
	let tensionScore = 5;

	if (goal.trim().length > 10) tensionScore += 2;
	if (obstacle.trim().length > 10) tensionScore += 2;
	if (wordCount > 1500) tensionScore -= 1; // Pacing drag warning

	let outcome: PacingDiagnostic['outcome'] = 'Yes, but...';
	let pacingVerdict = 'Balanced Dramatic Scene';
	let recommendation = 'Ensure the scene conclusion leaves a lingering question or consequence that launches the next scene.';

	if (tensionScore >= 8) {
		outcome = 'No, and furthermore...';
		pacingVerdict = 'High Velocity Conflict';
		recommendation = 'The obstacle forcefully escalates stakes. Good momentum.';
	} else if (tensionScore <= 4) {
		outcome = 'Pyrrhic Victory';
		pacingVerdict = 'Low Tension / Potential Exposition Drag';
		recommendation = 'Clarify what immediate disaster happens if the protagonist fails their scene goal right now.';
	}

	return {
		sceneTitle: 'Current Scene Draft',
		goal: goal || 'Undefined immediate goal',
		obstacle: obstacle || 'Vague or missing opposition',
		outcome,
		tensionScore: Math.min(10, Math.max(1, tensionScore)),
		stakes: goal && obstacle ? `If goal fails, protagonist suffers immediate setback.` : 'Stakes unclear.',
		pacingVerdict,
		recommendation
	};
}

export function commitPartnerAgreementToCanon(
	topic: string,
	decisionText: string,
	affects: string,
	bible: WorldEntry[],
	decisions: Decision[]
): { updatedBible: WorldEntry[]; updatedDecisions: Decision[] } {
	const now = new Date().toISOString().slice(0, 10);
	const decisionId = `d${Date.now().toString().slice(-4)}`;

	const newDecision: Decision = {
		id: decisionId,
		date: now,
		topic,
		decision: decisionText,
		authorWords: 'Finalized and agreed in Editorial Partner Bureau (/partner)',
		source: 'Editorial Partner Bureau',
		affects,
		status: 'locked'
	};

	// Also update or add a World Bible entry if appropriate
	let updatedBible = [...bible];
	if (affects.startsWith('character:') || affects.startsWith('lore:') || affects.startsWith('magic:')) {
		const entryName = affects.split(':')[1] || topic;
		const entryId = `entry-${entryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`;
		const existingIdx = bible.findIndex((e) => e.name.toLowerCase() === entryName.toLowerCase() || e.id === entryId);

		const bibleEntry: WorldEntry = {
			id: entryId,
			name: entryName,
			kind: affects.startsWith('character:') ? 'character' : affects.startsWith('magic:') ? 'magic' : 'lore',
			text: `AGREED CANON RULING:\n${decisionText}\n\nTOPIC: ${topic}`,
			aliases: [entryName.toLowerCase()],
			status: 'canon'
		};

		if (existingIdx !== -1) {
			updatedBible[existingIdx] = bibleEntry;
		} else {
			updatedBible = [bibleEntry, ...updatedBible];
		}
	}

	return {
		updatedBible,
		updatedDecisions: [newDecision, ...decisions]
	};
}

// --- Legacy Thread & Craft Note Helpers for Sittings ---
export interface PartnerThreadMessage {
	id: string;
	role: 'author' | 'partner' | 'system';
	content: string;
	sitting: string;
	timestamp: string;
}

export interface CraftNote {
	sitting: string;
	strength: string;
	sharpen: string;
	lens: string;
}

export interface LockCard {
	kind: 'decision' | 'bible';
	topic: string;
	body: string;
	verbatim: string;
}

const THREAD_STORAGE_KEY = 'story_os_partner_thread';
const CRAFT_NOTES_KEY = 'story_os_partner_craft_notes';

export function sittingKey(): string {
	return new Date().toISOString().slice(0, 10);
}

export function makeMessage(role: 'author' | 'partner' | 'system', content: string): PartnerThreadMessage {
	return {
		id: `ptm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
		role,
		content,
		sitting: sittingKey(),
		timestamp: new Date().toISOString()
	};
}

export function loadThread(): PartnerThreadMessage[] {
	if (typeof localStorage === 'undefined') return [];
	const raw = localStorage.getItem(THREAD_STORAGE_KEY);
	if (!raw) return [];
	try {
		return JSON.parse(raw);
	} catch {
		return [];
	}
}

export function buildPartnerBrief(
	bible: WorldEntry[],
	decisions: Decision[],
	archetype = 'architect',
	authorName = 'Author'
): string {
	const canonEntries = bible.filter((e) => e.status === 'canon');
	const bibleSummary = canonEntries.map((e) => `[${e.kind}] ${e.name}: ${e.text}`).join('\n');
	const decisionsSummary = decisions.map((d) => `[${d.topic}] ${d.decision}`).join('\n');

	return `AUTHOR: ${authorName}
ARCHETYPE: ${archetype}
PARTNER VOICE: Socratic Developmental Editor (Never Ghostwrite, Rephrase Only).

WORLD BIBLE (CANON):
${bibleSummary || 'No entries yet.'}

DECISIONS LEDGER:
${decisionsSummary || 'No locked decisions yet.'}`;
}

export function threadTranscript(messages: PartnerThreadMessage[]): string {
	return messages
		.map((m) => `${m.role === 'author' ? 'AUTHOR' : m.role === 'partner' ? 'PARTNER' : 'SYSTEM'}: ${m.content}`)
		.join('\n\n');
}

export function parseLockCards(text: string): LockCard[] {
	const cards: LockCard[] = [];
	const blocks = text.split(/(?=##\s*(?:DECISION|BIBLE):)/i);

	for (const b of blocks) {
		const match = b.match(/##\s*(DECISION|BIBLE):\s*([^\n]+)/i);
		if (match) {
			const kind = match[1].toLowerCase() as 'decision' | 'bible';
			const topic = match[2].trim();
			const bodyMatch = b.match(/Body:\s*([^\n]+)/i);
			const verbatimMatch = b.match(/Author's words:\s*["']?([^"'\n]+)["']?/i);

			cards.push({
				kind,
				topic,
				body: bodyMatch ? bodyMatch[1].trim() : '',
				verbatim: verbatimMatch ? verbatimMatch[1].trim() : ''
			});
		}
	}

	return cards;
}

export function parseCraftNote(text: string, sitting: string, lens: string): CraftNote {
	const strengthMatch = text.match(/Strength:\s*([^\n]+)/i);
	const sharpenMatch = text.match(/Sharpen:\s*([^\n]+)/i);

	return {
		sitting,
		strength: strengthMatch ? strengthMatch[1].trim() : 'Solid narrative drive and voice consistency.',
		sharpen: sharpenMatch ? sharpenMatch[1].trim() : `Focus on deepening the ${lens} lens.`,
		lens
	};
}

export function loadCraftNotes(): CraftNote[] {
	if (typeof localStorage === 'undefined') return [];
	const raw = localStorage.getItem(CRAFT_NOTES_KEY);
	if (!raw) return [];
	try {
		return JSON.parse(raw);
	} catch {
		return [];
	}
}

export function saveCraftNote(note: CraftNote): CraftNote[] {
	const all = loadCraftNotes().filter((n: CraftNote) => n.sitting !== note.sitting);
	all.push(note);
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(CRAFT_NOTES_KEY, JSON.stringify(all));
	}
	return all;
}

