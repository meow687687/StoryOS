<script lang="ts">
	import {
		aiDraftHelp,
		aiInterrogate,
		DEFAULT_OLLAMA_MODEL,
		loadAIConfig,
		ollamaStatus,
		saveAIConfig,
		type AIConfig
	} from '$lib/ai';
	import DistractionFreeEditor from '$lib/DistractionFreeEditor.svelte';
	import EntityDossierModal from '$lib/EntityDossierModal.svelte';
	import StoryContextHUD from '$lib/StoryContextHUD.svelte';
	import {
		checkContradictions,
		detectKnowledgeLeaks,
		linkedEntities,
		loadBible,
		loadChapters,
		loadDecisions,
		loadEvents,
		saveChapters,
		saveDecisions,
		saveEvents,
		type Chapter,
		type Decision,
		type StoryEvent,
		type WorldEntry
	} from '$lib/world';

	let bible: WorldEntry[] = $state([]);
	let chapters: Chapter[] = $state([]);
	let decisions: Decision[] = $state([]);
	let events: StoryEvent[] = $state([]);
	let activeId = $state<string | null>(null);
	let cfg: AIConfig = $state({ provider: 'ollama', apiKey: '', model: DEFAULT_OLLAMA_MODEL });
	let ollama = $state({ running: false, models: [] as string[] });

	// Modals and Active Entity
	let selectedEntity = $state<WorldEntry | null>(null);

	// Analysis Reports
	let interrogationReport = $state('');
	let continuityReport = $state('');
	let busy = $state(false);
	let activeTab: 'interrogate' | 'continuity' = $state('interrogate');
	let error = $state('');

	// Fast Record Decision from Interrogation
	let quickDecisionTopic = $state('');
	let quickDecisionAnswer = $state('');
	let showQuickDecisionForm = $state(false);

	// Quick Disclosure commit to Event Ledger
	let quickSecretText = $state('');
	let showQuickDisclosureForm = $state(false);

	$effect(() => {
		bible = loadBible();
		chapters = loadChapters();
		decisions = loadDecisions();
		events = loadEvents();
		cfg = loadAIConfig();

		if (!chapters.length) {
			const first: Chapter = {
				id: `c${Date.now().toString(36)}`,
				title: 'Chapter 1 — The Ashen Vow',
				act: 'Act I: The Exile',
				pov: 'Kael',
				goal: 'Conceal the forbidden fire-pact while bargaining for passage at the tavern.',
				text: 'The embers in the hearth hissed as Kael stepped through the doorway of the tavern in Emberhold. His cloak smelled of salt and burned parchment. He kept his right hand inside the wool lining, fingers closed tight around the cold stone.',
				updatedAt: new Date().toISOString(),
				threads: ['Who betrayed the Prince?', 'The missing courier'],
				rulesPinned: []
			};
			chapters = [first];
			saveChapters(chapters);
		}

		if (!activeId && chapters.length) activeId = chapters[0].id;

		ollamaStatus().then((s) => {
			ollama = s;
			if (s.running && s.models.length && !s.models.includes(cfg.model)) {
				cfg.model = s.models.includes(DEFAULT_OLLAMA_MODEL) ? DEFAULT_OLLAMA_MODEL : s.models[0];
			}
		});
	});

	const active = $derived(chapters.find((c) => c.id === activeId) ?? chapters[0]);
	const contradictions = $derived(active ? checkContradictions(bible, active.text) : []);
	const linked = $derived(active ? linkedEntities(bible, active.text) : []);

	const activeEvent = $derived(
		events.find((e) => e.chapterId === active?.id || e.sceneTitle === active?.title)
	);
	const activeOrder = $derived(
		activeEvent?.order ?? (chapters.findIndex((c) => c.id === active?.id) + 1)
	);

	const knowledgeLeaks = $derived(
		active ? detectKnowledgeLeaks(events, activeOrder, active.pov || '', active.text, bible) : []
	);

	const aiReady = $derived(
		cfg.provider === 'local'
			? false
			: cfg.provider === 'ollama'
				? ollama.running
				: Boolean(cfg.apiKey)
	);

	function touch() {
		if (!active) return;
		active.updatedAt = new Date().toISOString();
		saveChapters(chapters);
	}

	function newChapter() {
		const nextNum = chapters.length + 1;
		const c: Chapter = {
			id: `c${Date.now().toString(36)}`,
			title: `Chapter ${nextNum}`,
			act: active?.act ?? 'Act I',
			pov: active?.pov ?? '',
			goal: '',
			text: '',
			threads: [],
			rulesPinned: [],
			updatedAt: new Date().toISOString()
		};
		chapters = [...chapters, c];
		activeId = c.id;
		saveChapters(chapters);
	}

	async function runSocraticInterrogation() {
		if (!active || !active.text.trim()) return;
		busy = true;
		error = '';
		activeTab = 'interrogate';
		try {
			interrogationReport = await aiInterrogate(
				cfg,
				bible,
				decisions,
				active.text,
				active.goal
			);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Interrogation failed';
		} finally {
			busy = false;
		}
	}

	async function runContinuityCheck() {
		if (!active || !active.text.trim()) return;
		busy = true;
		error = '';
		activeTab = 'continuity';
		try {
			continuityReport = await aiDraftHelp(cfg, bible, active.text);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Continuity check failed';
		} finally {
			busy = false;
		}
	}

	function commitQuickDecision() {
		if (!quickDecisionTopic.trim() || !quickDecisionAnswer.trim()) return;
		const nextId = `D${decisions.length + 1}`;
		const entry: Decision = {
			id: nextId,
			date: new Date().toISOString().slice(0, 10),
			topic: quickDecisionTopic.trim(),
			decision: quickDecisionAnswer.trim(),
			authorWords: `"${quickDecisionAnswer.trim()}"`,
			source: `Socratic interrogation on ${active?.title ?? 'chapter'}`,
			affects: active?.title ?? 'manuscript',
			status: 'locked'
		};
		decisions = [entry, ...decisions];
		saveDecisions(decisions);
		quickDecisionTopic = '';
		quickDecisionAnswer = '';
		showQuickDecisionForm = false;
	}

	function commitQuickDisclosure() {
		if (!quickSecretText.trim() || !active) return;
		const nextSecId = `sec${Date.now().toString(36)}`;
		const disclosure: import('$lib/world').DisclosedSecret = {
			id: nextSecId,
			fact: quickSecretText.trim(),
			disclosedAtOrder: activeOrder,
			disclosedToCharacterIds: active.pov ? [active.pov] : [],
			isPublicToReader: true
		};

		const existingEv = events.find(
			(e) => e.chapterId === active.id || e.sceneTitle === active.title
		);
		if (existingEv) {
			existingEv.disclosures = [...(existingEv.disclosures ?? []), disclosure];
		} else {
			events.push({
				id: `ev${Date.now().toString(36)}`,
				chapterId: active.id,
				sceneTitle: active.title,
				order: activeOrder,
				inStoryTime: `Day ${activeOrder}`,
				participantIds: active.pov ? [active.pov] : [],
				disclosures: [disclosure],
				mutations: [],
				status: 'canon'
			});
		}
		saveEvents(events);
		quickSecretText = '';
		showQuickDisclosureForm = false;
	}

	function saveKey() {
		saveAIConfig(cfg);
	}

	async function refreshOllama() {
		ollama = await ollamaStatus();
	}
</script>

<header class="max-w-6xl">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="font-display text-4xl font-semibold tracking-tight text-[#1c1917]">
				Manuscript Editor
			</h1>
			<p class="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#57534e]">
				<span>{bible.length} bible entries</span>
				<span>·</span>
				<span>{decisions.filter((d) => d.status === 'locked').length} locked decisions</span>
				<span>·</span>
				<span class="inline-flex items-center gap-1.5">
					<span
						class="inline-block h-2 w-2 rounded-full"
						class:bg-green-600={cfg.provider === 'ollama' && ollama.running}
						class:bg-stone-300={!(cfg.provider === 'ollama' && ollama.running)}
					></span>
					{cfg.provider === 'ollama' && ollama.running
						? `Ollama (${cfg.model})`
						: cfg.provider === 'local'
							? 'Offline rules'
							: cfg.apiKey
								? `${cfg.provider} connected`
								: 'Offline rules'}
				</span>
			</p>
		</div>

		<div class="flex items-center gap-2">
			<button
				class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#9a3412] bg-[#9a3412]/5 px-3 py-1.5 text-xs font-semibold text-[#9a3412] hover:bg-[#9a3412]/10"
				onclick={runSocraticInterrogation}
				disabled={busy || !active?.text.trim()}
				title="Run Socratic interrogation on motivations, plot holes, and pacing"
			>
				<span>🎯</span>
				{busy && activeTab === 'interrogate' ? 'Challenging…' : 'Socratic Interrogation'}
			</button>
			<button
				class="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#9a3412] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#7c2d12] disabled:opacity-40"
				onclick={runContinuityCheck}
				disabled={busy || !active?.text.trim()}
				title="Run continuity & magic rule contradiction check"
			>
				<span>🛡️</span>
				{busy && activeTab === 'continuity' ? 'Checking…' : 'Continuity Check'}
			</button>
		</div>
	</div>
</header>

<!-- Chapter Selector Tabs -->
<div class="mt-4 flex flex-wrap items-center gap-1.5 border-b border-[#e7e0d3] pb-2">
	{#each chapters as c (c.id)}
		<button
			role="tab"
			aria-selected={c.id === activeId}
			class="flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors {c.id ===
			activeId
				? 'bg-[#292524] text-white shadow-xs'
				: 'text-[#57534e] hover:bg-stone-100 hover:text-[#1c1917]'}"
			onclick={() => (activeId = c.id)}
		>
			<span>{c.title}</span>
			{#if c.act}
				<span class="text-[10px] opacity-70">({c.act})</span>
			{/if}
		</button>
	{/each}
	<button
		class="flex cursor-pointer items-center rounded-md border border-dashed border-[#e7e0d3] px-3 py-1.5 text-xs text-[#57534e] hover:bg-stone-50"
		onclick={newChapter}
	>
		+ new scene
	</button>
</div>

{#if active}
	<div class="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
		<!-- Main Writing Column -->
		<div class="min-w-0 space-y-4">
			<!-- Title and Act Header -->
			<div class="flex items-center gap-3">
				<input
					bind:value={active.title}
					oninput={touch}
					placeholder="Chapter Title"
					class="font-display w-full bg-transparent text-2xl font-bold text-[#1c1917] focus:outline-hidden"
				/>
			</div>

			<!-- Distraction-Free Writing Canvas with Ambient Entity Links -->
			<DistractionFreeEditor
				bind:text={active.text}
				{bible}
				ontouch={touch}
				onselectentity={(ent) => (selectedEntity = ent)}
			/>

			<!-- Interrogation & Analysis Panel -->
			{#if interrogationReport || continuityReport || error}
				<section
					class="mt-4 rounded-xl border border-[#e7e0d3] bg-[#faf7f2]/95 p-5 shadow-xs"
					aria-label="Editorial Debrief"
				>
					<div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#e7e0d3] pb-3">
						<div class="flex items-center gap-2">
							<button
								class="cursor-pointer text-xs font-bold uppercase tracking-wider {activeTab ===
								'interrogate'
									? 'text-[#9a3412] underline decoration-2 underline-offset-4'
									: 'text-stone-400 hover:text-stone-700'}"
								onclick={() => (activeTab = 'interrogate')}
							>
								Socratic Interrogator
							</button>
							<span class="text-stone-300">|</span>
							<button
								class="cursor-pointer text-xs font-bold uppercase tracking-wider {activeTab ===
								'continuity'
									? 'text-[#9a3412] underline decoration-2 underline-offset-4'
									: 'text-stone-400 hover:text-stone-700'}"
								onclick={() => (activeTab = 'continuity')}
							>
								Continuity & Lore Checker
							</button>
						</div>

						<div class="flex items-center gap-1.5">
							<button
								class="cursor-pointer rounded bg-[#292524] px-2.5 py-1 text-xs font-medium text-white hover:bg-black"
								onclick={() => (showQuickDecisionForm = !showQuickDecisionForm)}
							>
								{showQuickDecisionForm ? 'Cancel' : '+ Lock Decision'}
							</button>
							<button
								class="cursor-pointer rounded border border-[#9a3412] px-2.5 py-1 text-xs font-medium text-[#9a3412] hover:bg-[#9a3412]/10"
								onclick={() => (showQuickDisclosureForm = !showQuickDisclosureForm)}
							>
								{showQuickDisclosureForm ? 'Cancel' : '+ Log Secret to Timeline'}
							</button>
						</div>
					</div>

					{#if showQuickDecisionForm}
						<div class="my-3 rounded-lg border border-[#e7e0d3] bg-white p-3 shadow-xs">
							<h4 class="text-xs font-bold text-[#1c1917]">Commit Answer to decisions.md</h4>
							<div class="mt-2 grid gap-2 sm:grid-cols-2">
								<input
									bind:value={quickDecisionTopic}
									placeholder="Topic (e.g. Why Kael trusts Mira)"
									class="rounded border border-[#e7e0d3] px-2 py-1 text-xs"
								/>
								<input
									bind:value={quickDecisionAnswer}
									placeholder="Your decision (e.g. She holds the signet ring)"
									class="rounded border border-[#e7e0d3] px-2 py-1 text-xs"
								/>
							</div>
							<div class="mt-2 flex justify-end">
								<button
									class="cursor-pointer rounded bg-[#9a3412] px-3 py-1 text-xs font-medium text-white hover:bg-[#7c2d12]"
									onclick={commitQuickDecision}
								>
									Lock as Canon
								</button>
							</div>
						</div>
					{/if}

					{#if showQuickDisclosureForm}
						<div class="my-3 rounded-lg border border-[#e7e0d3] bg-white p-3 shadow-xs">
							<h4 class="text-xs font-bold text-[#1c1917]">Commit Secret to Event #{activeOrder}</h4>
							<div class="mt-2 flex gap-2">
								<input
									bind:value={quickSecretText}
									placeholder="Secret revealed in this scene (e.g. Kael is carrying the black stone)"
									class="flex-1 rounded border border-[#e7e0d3] px-2 py-1 text-xs"
								/>
								<button
									class="cursor-pointer rounded bg-[#9a3412] px-3 py-1 text-xs font-medium text-white hover:bg-[#7c2d12]"
									onclick={commitQuickDisclosure}
								>
									Log to Event
								</button>
							</div>
						</div>
					{/if}

					{#if error}
						<p class="mt-3 text-xs text-rose-700">{error}</p>
					{/if}

					<div class="manuscript mt-3 text-sm leading-relaxed text-[#292524] whitespace-pre-wrap">
						{activeTab === 'interrogate'
							? interrogationReport || 'Click "Socratic Interrogation" above to test motivations and plot causality.'
							: continuityReport || 'Click "Continuity Check" above to scan for magic rule violations.'}
					</div>
				</section>
			{/if}
		</div>

		<!-- Right Sidebar: Story Context HUD & Immediate Contradictions -->
		<aside class="space-y-4">
			<!-- Collapsible Story Context HUD -->
			<StoryContextHUD chapter={active} {bible} ontouch={touch} />

			<!-- Continuity Radar Box -->
			<section
				aria-label="Continuity Radar"
				class="rounded-xl border border-[#e7e0d3] bg-white p-4 shadow-xs"
			>
				<div class="flex items-center justify-between">
					<h3 class="text-xs font-bold tracking-wider text-[#78716c] uppercase">
						Continuity Radar ({contradictions.length + knowledgeLeaks.length})
					</h3>
					<span
						class="h-2 w-2 rounded-full {contradictions.length || knowledgeLeaks.length ? 'bg-rose-500' : 'bg-emerald-500'}"
					></span>
				</div>

				<!-- Knowledge Leaks Section -->
				{#if knowledgeLeaks.length > 0}
					<div class="mt-2 space-y-1.5">
						<span class="text-[11px] font-bold text-rose-800 uppercase tracking-wide">
							⚠️ Knowledge Leaks ({knowledgeLeaks.length})
						</span>
						{#each knowledgeLeaks as leak}
							<div class="rounded-md border border-rose-300 bg-rose-50/80 p-2 text-xs text-rose-900 leading-tight">
								<strong>{leak.characterName}:</strong> {leak.reason}
							</div>
						{/each}
					</div>
				{/if}

				<!-- Magic Rule Contradictions -->
				{#if contradictions.length > 0}
					<div class="mt-2 space-y-1.5">
						<span class="text-[11px] font-bold text-rose-800 uppercase tracking-wide">
							🛡️ Magic Rule Conflicts ({contradictions.length})
						</span>
						<ul class="space-y-1 text-xs">
							{#each contradictions as c (c.entryId + c.reason)}
								<li class="rounded-md border border-rose-200 bg-rose-50/50 p-2 text-rose-900 leading-tight">
									<div class="font-bold">{c.entryName}</div>
									<div class="mt-0.5 text-[11px] text-rose-700">{c.reason}</div>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if !contradictions.length && !knowledgeLeaks.length}
					<p class="mt-2 text-xs leading-relaxed text-stone-500">
						No canon contradictions or knowledge leaks detected in current text.
					</p>
				{/if}

				<div class="mt-3 flex items-center justify-between border-t border-stone-100 pt-2 text-[11px] text-stone-500">
					<span>Linked: {linked.map((e) => e.name).join(', ') || 'None'}</span>
					<a href="/timeline" class="font-medium text-[#9a3412] underline hover:text-[#7c2d12]">
						Timeline View →
					</a>
				</div>
			</section>

			<!-- AI Provider Settings Drawer -->
			<details class="rounded-xl border border-[#e7e0d3] bg-[#faf7f2]/80 p-3 text-xs">
				<summary class="cursor-pointer font-semibold text-[#57534e] hover:text-[#1c1917]">
					AI Settings ({cfg.provider})
				</summary>
				<div class="mt-3 space-y-2">
					<label class="block">
						<span class="text-[11px] font-medium text-stone-600">Provider</span>
						<select
							bind:value={cfg.provider}
							onchange={saveKey}
							class="mt-1 w-full rounded border border-[#e7e0d3] bg-white px-2 py-1 text-xs"
						>
							<option value="ollama">Ollama (Local Private AI)</option>
							<option value="openai">OpenAI</option>
							<option value="anthropic">Anthropic</option>
							<option value="local">Offline Rules Only</option>
						</select>
					</label>

					{#if cfg.provider === 'ollama'}
						<label class="block">
							<span class="text-[11px] font-medium text-stone-600">Model</span>
							<select
								bind:value={cfg.model}
								onchange={saveKey}
								class="mt-1 w-full rounded border border-[#e7e0d3] bg-white px-2 py-1 text-xs"
							>
								{#each ollama.models as m}
									<option value={m}>{m}</option>
								{/each}
								{#if !ollama.models.includes(cfg.model)}
									<option value={cfg.model}>{cfg.model}</option>
								{/if}
							</select>
						</label>
						<button
							class="cursor-pointer underline text-[11px] text-stone-600"
							onclick={refreshOllama}
						>
							Refresh Ollama Models
						</button>
					{:else if cfg.provider !== 'local'}
						<label class="block">
							<span class="text-[11px] font-medium text-stone-600">API Key</span>
							<input
								type="password"
								bind:value={cfg.apiKey}
								onchange={saveKey}
								placeholder="sk-…"
								class="mt-1 w-full rounded border border-[#e7e0d3] bg-white px-2 py-1 text-xs"
							/>
						</label>
					{/if}
				</div>
			</details>
		</aside>
	</div>
{/if}

<!-- Entity Dossier Popup Modal -->
<EntityDossierModal entry={selectedEntity} onclose={() => (selectedEntity = null)} />
