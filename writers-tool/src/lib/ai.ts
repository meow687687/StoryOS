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
	type Decision,
	type WorldEntry
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
