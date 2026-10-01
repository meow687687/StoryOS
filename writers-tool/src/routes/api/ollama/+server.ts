import { json, type RequestHandler } from '@sveltejs/kit';

// Server-side proxy to Ollama. The browser never talks to :11434 directly,
// so no OLLAMA_ORIGINS CORS setup is needed. Override with OLLAMA_URL env
// when Ollama runs on another host.
const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';

interface ChatBody {
	action: 'chat';
	model: string;
	system: string;
	prompt: string;
}

/** GET /api/ollama → { models: string[], running: true } or { models: [], running: false } */
export const GET: RequestHandler = async () => {
	try {
		const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(4000) });
		if (!res.ok) return json({ models: [], running: false });
		const data = await res.json();
		const models = (data.models ?? []).map((m: { name: string }) => m.name);
		return json({ models, running: true });
	} catch {
		return json({ models: [], running: false });
	}
};

/** POST /api/ollama { action: 'chat', model, system, prompt } → { text } */
export const POST: RequestHandler = async ({ request }) => {
	let body: ChatBody;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}
	if (body.action !== 'chat' || !body.model || !body.prompt) {
		return json({ error: 'Expected { action: "chat", model, system, prompt }' }, { status: 400 });
	}
	try {
		const res = await fetch(`${OLLAMA_URL}/api/chat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: body.model,
				stream: false,
				messages: [
					{ role: 'system', content: body.system ?? '' },
					{ role: 'user', content: body.prompt }
				]
			}),
			signal: AbortSignal.timeout(120000)
		});
		if (!res.ok) {
			const detail = await res.text().catch(() => '');
			return json(
				{ error: `Ollama error ${res.status}: ${detail.slice(0, 200)}` },
				{ status: 502 }
			);
		}
		const data = await res.json();
		return json({ text: data.message?.content ?? '' });
	} catch (e) {
		const msg =
			e instanceof Error && e.name === 'TimeoutError'
				? 'Ollama timed out'
				: 'Ollama unreachable — is `ollama serve` running?';
		return json({ error: msg }, { status: 503 });
	}
};
