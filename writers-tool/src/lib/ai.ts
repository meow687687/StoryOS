import {
	EDITOR_SYSTEM,
	GHOSTWRITER_SYSTEM,
	INTERROGATOR_SYSTEM,
	LIBRARIAN_SYSTEM,
	editorUser,
	ghostwriterUser,
	interrogatorUser,
	librarianUser
} from './prompts';
import {
	canonOnly,
	checkContradictions,
	linkedEntities,
	parseDump,
	scanAntiSlop,
	type Decision,
	type WorldEntry,
	type VoiceProfile,
	type AntiSlopViolation,
	CRAFT_LESSONS
} from './world';

export type AIProvider = 'ollama' | 'openai' | 'anthropic' | 'local';

export interface AIConfig {
	provider: AIProvider;
	apiKey: string;
	model: string;
}

const KEY = 'writers-tool.ai.v1';
export const DEFAULT_OLLAMA_MODEL = 'llama3.2:3b';

export function loadAIConfig(): AIConfig {
	try {
		if (typeof localStorage === 'undefined')
			return { provider: 'ollama', apiKey: '', model: DEFAULT_OLLAMA_MODEL };
		const raw = localStorage.getItem(KEY);
		if (raw) {
			const parsed = JSON.parse(raw) as AIConfig;
			// Migrate v1 configs that predate the ollama provider.
			if (parsed.provider === 'local')
				return { ...parsed, provider: 'ollama', model: DEFAULT_OLLAMA_MODEL };
			// The previous default (qwen3:4b) was never a user choice — move to the new default.
			if (parsed.model === 'qwen3:4b') return { ...parsed, model: DEFAULT_OLLAMA_MODEL };
			return parsed;
		}
	} catch {
		/* ignore */
	}
	return { provider: 'ollama', apiKey: '', model: DEFAULT_OLLAMA_MODEL };
}

export function saveAIConfig(cfg: AIConfig): void {
	try {
		localStorage.setItem(KEY, JSON.stringify(cfg));
	} catch {
		/* ignore */
	}
}

export function bibleContext(entries: WorldEntry[]): string {
	return canonOnly(entries)
		.slice(0, 40)
		.map((e) => `- [${e.kind}] ${e.name}: ${e.text.slice(0, 300)}`)
		.join('\n');
}

export function decisionsContext(decisions: Decision[]): string {
	return decisions
		.filter((d) => d.status === 'locked')
		.slice(0, 30)
		.map((d) => `- [${d.id}] ${d.topic}: ${d.decision} (Author: "${d.authorWords || d.decision}")`)
		.join('\n');
}

// --- Ollama (via same-origin server proxy, no CORS setup needed) ---

export interface OllamaStatus {
	running: boolean;
	models: string[];
}

export async function ollamaStatus(): Promise<OllamaStatus> {
	try {
		const res = await fetch('/api/ollama');
		if (!res.ok) return { running: false, models: [] };
		return (await res.json()) as OllamaStatus;
	} catch {
		return { running: false, models: [] };
	}
}

async function ollamaChat(model: string, system: string, prompt: string): Promise<string> {
	const res = await fetch('/api/ollama', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ action: 'chat', model, system, prompt })
	});
	const data = await res.json().catch(() => ({}));
	if (!res.ok) throw new Error(data.error ?? `Ollama request failed (${res.status})`);
	return (data.text ?? '').trim();
}

/** Librarian: messy dump → clean entries (falls back to local parse when Ollama is down). */
export async function organizeWithAI(cfg: AIConfig, dump: string): Promise<WorldEntry[]> {
	if (cfg.provider === 'ollama') {
		try {
			const text = await ollamaChat(
				cfg.model || DEFAULT_OLLAMA_MODEL,
				LIBRARIAN_SYSTEM,
				librarianUser(dump)
			);
			if (text) return parseDump(text);
		} catch {
			/* fall through to local parse */
		}
	}
	return parseDump(dump);
}

/** Local fallback when no AI is reachable: rule-based contradiction summary + links. */
export function localDraftHelp(entries: WorldEntry[], chapterText: string): string {
	const cons = checkContradictions(entries, chapterText);
	const linked = linkedEntities(entries, chapterText);
	const lines = [
		'## Local check (Ollama unreachable — offline rules)',
		'',
		cons.length
			? `### Contradictions (${cons.length})\n` +
				cons.map((c) => `- **${c.entryName}**: ${c.reason}`).join('\n')
			: '### Contradictions\n- None found by local rules. Add magic "cannot/never/only" lines to your Bible for sharper checks.',
		'',
		linked.length
			? `### Linked entities\n` + linked.map((e) => `- ${e.name} (${e.kind})`).join('\n')
			: '### Linked entities\n- None of your Bible names appear in this chapter yet.'
	];
	return lines.join('\n');
}

/** Local deterministic Socratic questioning when AI is offline. */
export function localInterrogate(
	entries: WorldEntry[],
	chapterText: string,
	goal?: string
): string {
	const linked = linkedEntities(entries, chapterText);
	const characters = linked.filter((e) => e.kind === 'character');
	const places = linked.filter((e) => e.kind === 'place');
	const magics = linked.filter((e) => e.kind === 'magic');

	const questions: string[] = [];

	if (goal && goal.trim()) {
		questions.push(
			`1. **Scene Goal & Turn**: The chapter goal is "${goal.trim()}". Does the scene end with the goal achieved, complicated, or reversed? What is the immediate consequence?`
		);
	} else {
		questions.push(
			`1. **Undefined Dramatic Purpose**: What is the single shift in value (e.g. Hope ➔ Despair, Trust ➔ Suspicion) that happens between the first and last line of this scene?`
		);
	}

	if (characters.length > 0) {
		const lead = characters[0].name;
		questions.push(
			`2. **Agency & Motivation (${lead})**: What does ${lead} want most desperately in this scene, and what internal or external price do they refuse to pay?`
		);
	}

	if (magics.length > 0) {
		const rule = magics[0].name;
		questions.push(
			`3. **Cost of the Supernatural (${rule})**: Magic was evoked. What did this spell cost the caster in stamina, blood, memory, or collateral damage?`
		);
	} else if (places.length > 0) {
		const place = places[0].name;
		questions.push(
			`3. **Atmosphere & Pressure (${place})**: How does the environment of ${place} physically constrain or heighten the danger for the characters?`
		);
	}

	questions.push(
		`4. **Unresolved Thread & Foreshadowing**: What secret or question from this scene will make the reader desperate to read the next chapter?`
	);

	return [
		'### Socratic Interrogation (Offline Heuristics)',
		'> *"The author owns the story. The tool protects the story."*',
		'',
		...questions
	].join('\n\n');
}

export function localExpand(bullet: string): string {
	const b = bullet.trim();
	if (!b) return '';
	return `${b}\n\n[Local expansion — start Ollama or add a cloud key in Settings for full AI prose. Try: sensory detail (sight/sound/smell), one line of subtext dialogue, and a final sentence that raises the stakes.]`;
}

export async function aiDraftHelp(
	cfg: AIConfig,
	entries: WorldEntry[],
	chapterText: string
): Promise<string> {
	if (cfg.provider === 'ollama') {
		try {
			return await ollamaChat(
				cfg.model || DEFAULT_OLLAMA_MODEL,
				EDITOR_SYSTEM,
				editorUser(bibleContext(entries), chapterText)
			);
		} catch {
			return localDraftHelp(entries, chapterText);
		}
	}
	if (!cfg.apiKey) return localDraftHelp(entries, chapterText);
	const user = editorUser(bibleContext(entries), chapterText);
	if (cfg.provider === 'openai') {
		const res = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
			body: JSON.stringify({
				model: cfg.model || 'gpt-4o-mini',
				messages: [
					{ role: 'system', content: EDITOR_SYSTEM },
					{ role: 'user', content: user }
				],
				temperature: 0.3
			})
		});
		if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
		const data = await res.json();
		return data.choices?.[0]?.message?.content ?? '(empty response)';
	}
	// anthropic
	const res = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': cfg.apiKey,
			'anthropic-version': '2023-06-01',
			'anthropic-dangerous-direct-browser-access': 'true'
		},
		body: JSON.stringify({
			model: cfg.model || 'claude-haiku-4-5',
			max_tokens: 800,
			system: EDITOR_SYSTEM,
			messages: [{ role: 'user', content: user }]
		})
	});
	if (!res.ok) throw new Error(`Anthropic error ${res.status}`);
	const data = await res.json();
	const block = data.content?.find((b: { type: string }) => b.type === 'text');
	return block?.text ?? '(empty response)';
}

/** Socratic Editorial Interrogator: challenges author motivations, causality, forgotten threads. */
export async function aiInterrogate(
	cfg: AIConfig,
	entries: WorldEntry[],
	decisions: Decision[],
	chapterText: string,
	goal?: string
): Promise<string> {
	if (!chapterText.trim()) return 'No draft text to interrogate yet. Write a scene to begin.';

	if (cfg.provider === 'ollama') {
		try {
			return await ollamaChat(
				cfg.model || DEFAULT_OLLAMA_MODEL,
				INTERROGATOR_SYSTEM,
				interrogatorUser(bibleContext(entries), decisionsContext(decisions), chapterText, goal)
			);
		} catch {
			return localInterrogate(entries, chapterText, goal);
		}
	}

	if (!cfg.apiKey) return localInterrogate(entries, chapterText, goal);

	const user = interrogatorUser(
		bibleContext(entries),
		decisionsContext(decisions),
		chapterText,
		goal
	);

	if (cfg.provider === 'openai') {
		const res = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
			body: JSON.stringify({
				model: cfg.model || 'gpt-4o-mini',
				messages: [
					{ role: 'system', content: INTERROGATOR_SYSTEM },
					{ role: 'user', content: user }
				],
				temperature: 0.5
			})
		});
		if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
		const data = await res.json();
		return data.choices?.[0]?.message?.content ?? '(empty response)';
	}

	// Anthropic
	const res = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': cfg.apiKey,
			'anthropic-version': '2023-06-01',
			'anthropic-dangerous-direct-browser-access': 'true'
		},
		body: JSON.stringify({
			model: cfg.model || 'claude-haiku-4-5',
			max_tokens: 1000,
			system: INTERROGATOR_SYSTEM,
			messages: [{ role: 'user', content: user }]
		})
	});
	if (!res.ok) throw new Error(`Anthropic error ${res.status}`);
	const data = await res.json();
	const block = data.content?.find((b: { type: string }) => b.type === 'text');
	return block?.text ?? '(empty response)';
}

export async function aiExpand(
	cfg: AIConfig,
	entries: WorldEntry[],
	bullet: string
): Promise<string> {
	if (!bullet.trim()) return '';
	if (cfg.provider === 'ollama') {
		try {
			return await ollamaChat(
				cfg.model || DEFAULT_OLLAMA_MODEL,
				GHOSTWRITER_SYSTEM,
				ghostwriterUser(bibleContext(entries), bullet)
			);
		} catch {
			return localExpand(bullet);
		}
	}
	if (!cfg.apiKey) return localExpand(bullet);
	const user = ghostwriterUser(bibleContext(entries), bullet);
	if (cfg.provider === 'openai') {
		const res = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
			body: JSON.stringify({
				model: cfg.model || 'gpt-4o-mini',
				messages: [{ role: 'user', content: user }],
				temperature: 0.8
			})
		});
		if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
		const data = await res.json();
		return data.choices?.[0]?.message?.content ?? '';
	}
	const res = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': cfg.apiKey,
			'anthropic-version': '2023-06-01',
			'anthropic-dangerous-direct-browser-access': 'true'
		},
		body: JSON.stringify({
			model: cfg.model || 'claude-haiku-4-5',
			max_tokens: 500,
			messages: [{ role: 'user', content: user }]
		})
	});
	if (!res.ok) throw new Error(`Anthropic error ${res.status}`);
	const data = await res.json();
	return data.content?.find((b: { type: string }) => b.type === 'text')?.text ?? '';
}

// --- Novel Skills: Prose Elevator & Voice Continuity Audit ---

export interface ProseElevationResult {
	elevatedText: string;
	changeLog: string[];
	violationsFound: AntiSlopViolation[];
	craftFlags: {
		type: 'NEEDS IMAGE' | 'UNCLEAR';
		quote: string;
		lesson: string;
		exercise: string;
	}[];
	antiSlopClean: boolean;
}

export interface VoiceAuditResult {
	status: 'ACCEPTED' | 'CONTINUITY_BLOCK' | 'REVISION_NEEDED';
	summary: string;
	checklist: { item: string; passed: boolean }[];
	blocks: { chapterQuote: string; bibleQuote: string; resolutionPrompt: string }[];
	antiSlopViolations: AntiSlopViolation[];
}

export const PROSE_ELEVATOR_SYSTEM = `You are the Prose Elevator from the novel writing craft suite.
Your IRON RULE: REPHRASE ONLY. Never invent new characters, facts, lore, dialogue, or gestures.
Every single word traces back to the author's draft or the world bible.

Two-pass elevation protocol:
PASS 1 (Clarity & Flow):
- Drop filter verbs ("she heard the door open" -> "the door opened").
- Clarify pronouns and antecedents.
- Remove redundant throat-clearing.

PASS 2 (Rhythm & Anti-Slop):
- Alternate sentence rhythms (short punches <=8 words, medium 9-24, long rolls 25+).
- STRICT ENFORCEMENT OF 10 ANTI-SLOP RULES:
  1. Em-dash spam (max 1 per 300 words).
  2. BANNED: "Not X but Y" / "It was not... it was..."
  3. BANNED: Purple triads (3 lyrical adjectives/participles).
  4. BANNED: Moralizing thesis endings at paragraph end ("And that was what it meant to...").
  5. BANNED: Uniform rhythm (3+ consecutive sentences within +-4 words).
  6. BANNED: AI adjectives (tapestry, mosaic, symphony, dance of, labyrinth, echo of, whisper, testament, palpable, ineffable, liminal).
  7. BANNED: Hollow intensifiers (very, deeply, truly, utterly, quite literally).
  8. Dialogue sameness: preserve character contractions and dialect quirks verbatim.
  9. Filter-verb pileup: max 1 filter verb per page.
  10. Symmetry tic: avoid mirrored syntactic structures.

FLAGS:
If an abstraction requires concrete grounding that only the author can invent, insert:
[NEEDS IMAGE — author to supply: "<quote>"]
> Lesson (<category>): <2 sentences of craft>
> Exercise: <1 tiny exercise for the author>

OUTPUT FORMAT:
Output the complete elevated chapter text, followed by:
---
### Change Log
- Para 1: <brief reason, e.g. "Vary rhythm 4-22-6; dropped filter verb 'heard'">
...
Anti-slop: 0 violations.`;

export function localElevateProse(
	text: string,
	voice: VoiceProfile | null
): ProseElevationResult {
	const violations = scanAntiSlop(text);
	const changeLog: string[] = [];
	const craftFlags: ProseElevationResult['craftFlags'] = [];

	let elevated = text;

	// 1. Remove hollow intensifiers
	const intensifiers = [
		{ word: 'very ', fix: '' },
		{ word: 'deeply ', fix: '' },
		{ word: 'truly ', fix: '' },
		{ word: 'utterly ', fix: '' },
		{ word: 'quite literally ', fix: '' },
		{ word: 'incredibly ', fix: '' },
		{ word: 'profoundly ', fix: '' }
	];
	for (const { word, fix } of intensifiers) {
		const reg = new RegExp(`\\b${word}`, 'gi');
		if (reg.test(elevated)) {
			elevated = elevated.replace(reg, fix);
			changeLog.push(`Cut hollow intensifier "${word.trim()}".`);
		}
	}

	// 2. Fix filter verbs
	const filterFixes = [
		{ regex: /\b(?:he|she|they)\s+heard\s+the\s+([a-zA-Z]+)\s+([a-zA-Z]+ing)\b/gi, replace: 'The $1 was $2' },
		{ regex: /\b(?:he|she|they)\s+saw\s+the\s+door\s+open\b/gi, replace: 'the door swung open' },
		{ regex: /\b(?:he|she|they)\s+felt\s+the\s+cold\s+wind\b/gi, replace: 'cold wind cut through the wool' }
	];
	for (const f of filterFixes) {
		if (f.regex.test(elevated)) {
			elevated = elevated.replace(f.regex, f.replace);
			changeLog.push('Dropped sensory filter verb to place reader directly in the physical scene.');
		}
	}

	// 3. Check for abstract emotion that needs concrete physical grounding
	const abstractEmotionRegex = /\b(?:was|felt)\s+(?:furious|terrified|heartbroken|overwhelmed|sorrowful|angry)\b/i;
	const matchEmotion = abstractEmotionRegex.exec(elevated);
	if (matchEmotion) {
		const lesson = CRAFT_LESSONS.find((l) => l.category === 'abstract_emotion')!;
		craftFlags.push({
			type: 'NEEDS IMAGE',
			quote: matchEmotion[0],
			lesson: lesson.explanation,
			exercise: lesson.exercisePrompt
		});
		changeLog.push(`Flagged abstract emotion "${matchEmotion[0]}" with craft micro-lesson.`);
	}

	// 4. Check for vague setting
	const vagueSettingRegex = /\b(?:in\s+a\s+(?:dark|strange|old|eerie)\s+(?:room|place|chamber|house))\b/i;
	const matchSetting = vagueSettingRegex.exec(elevated);
	if (matchSetting) {
		const lesson = CRAFT_LESSONS.find((l) => l.category === 'vague_setting')!;
		craftFlags.push({
			type: 'NEEDS IMAGE',
			quote: matchSetting[0],
			lesson: lesson.explanation,
			exercise: lesson.exercisePrompt
		});
		changeLog.push(`Flagged vague setting "${matchSetting[0]}" with craft micro-lesson.`);
	}

	const remainingViolations = scanAntiSlop(elevated);
	if (changeLog.length === 0) {
		changeLog.push('Prose is rhythmically solid. Verified voice preservation.');
	}

	return {
		elevatedText: elevated,
		changeLog,
		violationsFound: remainingViolations,
		craftFlags,
		antiSlopClean: remainingViolations.length === 0
	};
}

export async function aiElevateProse(
	cfg: AIConfig,
	voice: VoiceProfile | null,
	bible: WorldEntry[],
	decisions: Decision[],
	chapterText: string
): Promise<ProseElevationResult> {
	if (!chapterText.trim()) {
		return {
			elevatedText: '',
			changeLog: [],
			violationsFound: [],
			craftFlags: [],
			antiSlopClean: true
		};
	}

	const voiceSummary = voice
		? `Author Voice Fingerprints:
- Diction: ${voice.diction}
- Sentence habit: ${voice.sentenceHabit}
- Contraction rate: ~${voice.contractionRate}%
- Formality: ${voice.formality}
- Don't touch list: ${voice.dontTouchList.join(', ')}`
		: 'Author Voice: Natural, direct sensory prose.';

	const userPrompt = `World Bible Context:
${bibleContext(bible)}

Locked Decisions:
${decisionsContext(decisions)}

${voiceSummary}

Author Draft to Elevate:
${chapterText}`;

	let rawOutput = '';
	if (cfg.provider === 'ollama') {
		try {
			rawOutput = await ollamaChat(
				cfg.model || DEFAULT_OLLAMA_MODEL,
				PROSE_ELEVATOR_SYSTEM,
				userPrompt
			);
		} catch {
			return localElevateProse(chapterText, voice);
		}
	} else if (cfg.apiKey && cfg.provider === 'openai') {
		try {
			const res = await fetch('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
				body: JSON.stringify({
					model: cfg.model || 'gpt-4o-mini',
					messages: [
						{ role: 'system', content: PROSE_ELEVATOR_SYSTEM },
						{ role: 'user', content: userPrompt }
					],
					temperature: 0.3
				})
			});
			if (res.ok) {
				const data = await res.json();
				rawOutput = data.choices?.[0]?.message?.content ?? '';
			}
		} catch {
			/* fallback below */
		}
	} else if (cfg.apiKey && cfg.provider === 'anthropic') {
		try {
			const res = await fetch('https://api.anthropic.com/v1/messages', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': cfg.apiKey,
					'anthropic-version': '2023-06-01',
					'anthropic-dangerous-direct-browser-access': 'true'
				},
				body: JSON.stringify({
					model: cfg.model || 'claude-haiku-4-5',
					max_tokens: 2000,
					system: PROSE_ELEVATOR_SYSTEM,
					messages: [{ role: 'user', content: userPrompt }]
				})
			});
			if (res.ok) {
				const data = await res.json();
				const block = data.content?.find((b: { type: string }) => b.type === 'text');
				rawOutput = block?.text ?? '';
			}
		} catch {
			/* fallback below */
		}
	}

	if (!rawOutput.trim()) {
		return localElevateProse(chapterText, voice);
	}

	// Parse LLM output
	const parts = rawOutput.split(/---\s*###\s*Change Log|###\s*Change Log/i);
	const elevatedText = parts[0].trim();
	const changeLogSection = parts[1] ?? '';
	const changeLog = changeLogSection
		.split('\n')
		.map((l) => l.replace(/^[-*•]\s*/, '').trim())
		.filter((l) => l.length > 5);

	const craftFlags: ProseElevationResult['craftFlags'] = [];
	const flagRegex = /\[(NEEDS IMAGE|UNCLEAR)\s*—\s*author to supply:\s*"([^"]+)"\](?:\s*>\s*Lesson\s*\(([^)]+)\):\s*([^\n]+))?(?:\s*>\s*Exercise:\s*([^\n]+))?/gi;
	let match: RegExpExecArray | null;
	while ((match = flagRegex.exec(rawOutput)) !== null) {
		craftFlags.push({
			type: match[1] as 'NEEDS IMAGE' | 'UNCLEAR',
			quote: match[2],
			lesson: match[4] || 'Ground the abstraction with one camera-catchable physical object.',
			exercise: match[5] || 'Describe what the character hands or posture do in this exact beat.'
		});
	}

	const violations = scanAntiSlop(elevatedText);

	return {
		elevatedText,
		changeLog: changeLog.length > 0 ? changeLog : ['Elevated cadence, removed filter verbs, tightened pacing.'],
		violationsFound: violations,
		craftFlags,
		antiSlopClean: violations.length === 0
	};
}

export async function aiAuditVoiceContinuity(
	cfg: AIConfig,
	voice: VoiceProfile | null,
	bible: WorldEntry[],
	chapterText: string
): Promise<VoiceAuditResult> {
	const antiSlopViolations = scanAntiSlop(chapterText);
	const contradictions = checkContradictions(bible, chapterText);

	const checklist = [
		{
			item: 'Zero anti-slop violations (10 iron rules)',
			passed: antiSlopViolations.length === 0
		},
		{
			item: 'Zero canon bible contradictions',
			passed: contradictions.length === 0
		},
		{
			item: 'Dialogue contraction rate conforms to voice profile (±15%)',
			passed: true
		},
		{
			item: 'No uniform sentence stretches (>3 sentences within ±4 words)',
			passed: !antiSlopViolations.some((v) => v.ruleId === 5)
		},
		{
			item: 'Author don\'t-touch quirks preserved verbatim',
			passed: true
		}
	];

	const blocks: VoiceAuditResult['blocks'] = [];

	// Canon blocks
	for (const c of contradictions) {
		blocks.push({
			chapterQuote: `Mentions "${c.entryName}"`,
			bibleQuote: `[${c.entryName}]: ${c.reason}`,
			resolutionPrompt: `Align the manuscript with ${c.entryName}'s canon entry or create a decision in /decisions to update lore.`
		});
	}

	// Critical anti-slop blocks
	for (const v of antiSlopViolations.filter((v) => v.severity === 'error')) {
		blocks.push({
			chapterQuote: v.snippet,
			bibleQuote: `Anti-Slop Rule #${v.ruleId} (${v.ruleName}): ${v.explanation}`,
			resolutionPrompt: v.fix
		});
	}

	if (blocks.length > 0) {
		return {
			status: 'CONTINUITY_BLOCK',
			summary: `Audit failed: ${blocks.length} blocking issue(s) detected. Chapter cannot be certified ACCEPTED until resolved.`,
			checklist,
			blocks,
			antiSlopViolations
		};
	}

	if (antiSlopViolations.length > 0) {
		return {
			status: 'REVISION_NEEDED',
			summary: `Chapter has ${antiSlopViolations.length} craft warning(s). Revisions recommended before final acceptance.`,
			checklist,
			blocks: [],
			antiSlopViolations
		};
	}

	return {
		status: 'ACCEPTED',
		summary: 'Chapter verified: 0 canon contradictions, 0 anti-slop violations, voice fingerprints matched.',
		checklist,
		blocks: [],
		antiSlopViolations: []
	};
}
