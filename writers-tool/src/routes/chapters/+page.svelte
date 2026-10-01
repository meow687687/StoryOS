<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
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
		detectAccidentalSpoilers,
		detectKnowledgeLeaks,
		linkedEntities,
		loadBible,
		loadChapters,
		loadDecisions,
		loadEvents,
		loadMysteries,
		saveChapters,
		saveDecisions,
		saveEvents,
		type Chapter,
		type Contradiction,
		type Decision,
		type KnowledgeLeakWarning,
		type MysteryNode,
		type AccidentalSpoilerWarning,
		type StoryEvent,
		type WorldEntry
	} from '$lib/world';

	let bible: WorldEntry[] = $state([]);
	let chapters: Chapter[] = $state([]);
	let decisions: Decision[] = $state([]);
	let events: StoryEvent[] = $state([]);
	let mysteries: MysteryNode[] = $state([]);
	let activeId = $state<string | null>(null);
	let readerMode = $state(false);
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
	let showHelpTips = $state(false);

	// Debounced background diagnostics
	let contradictions = $state<Contradiction[]>([]);
	let linked = $state<WorldEntry[]>([]);
	let knowledgeLeaks = $state<KnowledgeLeakWarning[]>([]);
	let accidentalSpoilers = $state<AccidentalSpoilerWarning[]>([]);

	let analysisTimer: ReturnType<typeof setTimeout> | null = null;
	let saveTimer: ReturnType<typeof setTimeout> | null = null;

	const active = $derived(chapters.find((c) => c.id === activeId) ?? chapters[0]);

	const activeEvent = $derived(
		events.find((e) => e.chapterId === active?.id || e.sceneTitle === active?.title)
	);
	const activeOrder = $derived(
		activeEvent?.order ?? (chapters.findIndex((c) => c.id === active?.id) + 1)
	);

	const readerClues = $derived(
		mysteries.filter(
			(m) => m.type === 'clue' && (m.status === 'planted' || m.status === 'discovered')
		)
	);

	const aiReady = $derived(
		cfg.provider === 'local'
			? false
			: cfg.provider === 'ollama'
				? ollama.running
				: Boolean(cfg.apiKey)
	);

	function runAnalysis() {
		if (!active) {
			contradictions = [];
			linked = [];
			knowledgeLeaks = [];
			accidentalSpoilers = [];
			return;
		}
		contradictions = checkContradictions(bible, active.text);
		linked = linkedEntities(bible, active.text);
		knowledgeLeaks = detectKnowledgeLeaks(events, activeOrder, active.pov || '', active.text, bible);
		accidentalSpoilers = readerMode ? detectAccidentalSpoilers(mysteries, activeOrder, active.text) : [];
	}

	function scheduleAnalysis() {
		if (analysisTimer) clearTimeout(analysisTimer);
		analysisTimer = setTimeout(() => {
			runAnalysis();
			analysisTimer = null;
		}, 350);
	}

	function scheduleSave() {
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			if (active) {
				active.updatedAt = new Date().toISOString();
			}
			saveChapters(chapters);
			saveTimer = null;
		}, 800);
	}

	function flushSave() {
		if (saveTimer) {
			clearTimeout(saveTimer);
			if (active) {
				active.updatedAt = new Date().toISOString();
			}
			saveChapters(chapters);
			saveTimer = null;
		}
	}

	function touch() {
		scheduleSave();
		scheduleAnalysis();
	}

	function selectChapter(id: string) {
		flushSave();
		activeId = id;
		setTimeout(runAnalysis, 10);
	}

	function toggleReaderMode() {
		readerMode = !readerMode;
		runAnalysis();
	}

	onMount(() => {
		bible = loadBible();
		chapters = loadChapters();
		decisions = loadDecisions();
		events = loadEvents();
		mysteries = loadMysteries();
		cfg = loadAIConfig();

		if (!chapters.length) {
			const first: Chapter = {
				id: `c${Date.now().toString(36)}`,
				title: 'Chapter 1',
				act: 'Act I',
				pov: '',
				goal: '',
				text: '',
				updatedAt: new Date().toISOString(),
				threads: [],
				rulesPinned: []
			};
			chapters = [first];
			saveChapters(chapters);
		}

		if (!activeId && chapters.length) activeId = chapters[0].id;
		runAnalysis();

		ollamaStatus().then((s) => {
			ollama = s;
			if (s.running && s.models.length && !s.models.includes(cfg.model)) {
				cfg.model = s.models.includes(DEFAULT_OLLAMA_MODEL) ? DEFAULT_OLLAMA_MODEL : s.models[0];
			}
		});

		const handleBeforeUnload = () => flushSave();
		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
			flushSave();
		};
	});

	onDestroy(() => {
		if (analysisTimer) clearTimeout(analysisTimer);
		flushSave();
	});

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
			<div class="flex items-center gap-3">
				<h1 class="font-display text-4xl font-extrabold tracking-tight text-[var(--theme-text)]">
					Manuscript Editor
				</h1>
				<button
					type="button"
					class="neo-btn px-2.5 py-0.5 text-[11px] font-mono font-bold"
					onclick={() => (showHelpTips = !showHelpTips)}
				>
					{showHelpTips ? '✕ Close Guide' : '💡 Tips & Shortcuts'}
				</button>
			</div>
			<p class="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-[var(--theme-text-muted)]">
				<span>{bible.length} bible entries</span>
				<span>·</span>
				<span>{decisions.filter((d) => d.status === 'locked').length} locked decisions</span>
				<span>·</span>
				<span class="inline-flex items-center gap-1.5 font-bold">
					<span
						class="inline-block h-2.5 w-2.5 rounded-xs border border-[var(--theme-border-strong)]"
						class:bg-emerald-500={cfg.provider === 'ollama' && ollama.running}
						class:bg-stone-400={!(cfg.provider === 'ollama' && ollama.running)}
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

		<div class="flex flex-wrap items-center gap-2">
			<button
				class="neo-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold {readerMode
					? '!bg-purple-600 !text-white'
					: ''}"
				onclick={toggleReaderMode}
				title="Toggle Reader Perspective Mode (masks unrevealed secrets and scans for premature reveals)"
			>
				<span>{readerMode ? '👁️ Reader Mode [ACTIVE]' : '👁️ Author Omniscient'}</span>
			</button>
			<button
				class="neo-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[var(--theme-accent)]"
				onclick={runSocraticInterrogation}
				disabled={busy || !active?.text.trim()}
				title="Run Socratic interrogation on motivations, plot holes, and pacing"
			>
				<span>🎯</span>
				{busy && activeTab === 'interrogate' ? 'Challenging…' : 'Socratic Interrogation'}
			</button>
			<button
				class="neo-btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold disabled:opacity-40"
				onclick={runContinuityCheck}
				disabled={busy || !active?.text.trim()}
				title="Run continuity & magic rule contradiction check"
			>
				<span>🛡️</span>
				{busy && activeTab === 'continuity' ? 'Checking…' : 'Continuity Check'}
			</button>
		</div>
	</div>

	{#if showHelpTips}
		<div class="mt-4 neo-box-sm bg-[var(--theme-surface-subtle)] p-4 text-xs text-[var(--theme-text-muted)] animate-in fade-in duration-200">
			<div class="flex items-center justify-between font-bold text-[var(--theme-text)]">
				<span class="font-mono text-xs uppercase tracking-wider">Editor Quick Reference & Keyboard Accelerators</span>
				<a href="/guide" class="text-[var(--theme-accent)] underline font-bold hover:opacity-80">Open Full Guide →</a>
			</div>
			<div class="mt-2 grid gap-3 sm:grid-cols-3">
				<div>
					<span class="font-bold text-[var(--theme-text)]">@ Autocomplete</span>
					<p class="mt-0.5 text-[11px]">Type <kbd class="font-mono font-bold rounded-xs border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] px-1 py-0.5">@</kbd> anywhere to insert characters, magic laws, and places from your Bible.</p>
				</div>
				<div>
					<span class="font-bold text-[var(--theme-text)]">Reader Perspective Mode</span>
					<p class="mt-0.5 text-[11px]">Masks future secrets and catches accidental spoilers before readers discover clues naturally.</p>
				</div>
				<div>
					<span class="font-bold text-[var(--theme-text)]">Socratic AI Interrogator</span>
					<p class="mt-0.5 text-[11px]">Challenges causality and character motivation without ever ghostwriting your prose.</p>
				</div>
			</div>
		</div>
	{/if}
</header>

<!-- Chapter Selector Tabs: Manuscript Binder Rail -->
<div class="mt-4 flex flex-wrap items-center gap-2 border-b-2 border-[var(--theme-border-strong)] pb-3">
	{#each chapters as c, idx (c.id)}
		<button
			role="tab"
			aria-selected={c.id === activeId}
			class="{c.id === activeId
				? 'neo-btn-primary !px-3 !py-1.5 text-xs font-bold'
				: 'neo-btn !px-3 !py-1.5 text-xs font-bold text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'}"
			onclick={() => selectChapter(c.id)}
		>
			<span class="font-mono opacity-80 mr-0.5">#{idx + 1}</span>
			<span>{c.title}</span>
			{#if c.act}
				<span class="font-mono text-[10px] opacity-80">[{c.act}]</span>
			{/if}
		</button>
	{/each}
	<button
		class="neo-btn !border-dashed !px-3 !py-1.5 text-xs font-mono font-bold text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
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
					class="font-display w-full bg-transparent text-2xl font-bold text-[var(--theme-text)] focus:outline-hidden"
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
					class="mt-4 neo-box p-5"
					aria-label="Editorial Debrief"
				>
					<div class="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[var(--theme-border-strong)] pb-3">
						<div class="flex items-center gap-2">
							<button
								class="cursor-pointer text-xs font-bold font-mono uppercase tracking-wider {activeTab ===
								'interrogate'
									? 'text-[var(--theme-accent)] underline decoration-2 underline-offset-4'
									: 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'}"
								onclick={() => (activeTab = 'interrogate')}
							>
								Socratic Interrogator
							</button>
							<span class="text-[var(--theme-text-faint)] font-bold">|</span>
							<button
								class="cursor-pointer text-xs font-bold font-mono uppercase tracking-wider {activeTab ===
								'continuity'
									? 'text-[var(--theme-accent)] underline decoration-2 underline-offset-4'
									: 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'}"
								onclick={() => (activeTab = 'continuity')}
							>
								Continuity & Lore Checker
							</button>
						</div>

						<div class="flex items-center gap-2">
							<button
								class="neo-btn !px-2.5 !py-1 text-xs font-bold"
								onclick={() => (showQuickDecisionForm = !showQuickDecisionForm)}
							>
								{showQuickDecisionForm ? 'Cancel' : '+ Lock Decision'}
							</button>
							<button
								class="neo-btn !px-2.5 !py-1 text-xs font-bold text-[var(--theme-accent)]"
								onclick={() => (showQuickDisclosureForm = !showQuickDisclosureForm)}
							>
								{showQuickDisclosureForm ? 'Cancel' : '+ Log Secret to Timeline'}
							</button>
						</div>
					</div>

					{#if showQuickDecisionForm}
						<div class="my-3 neo-box-sm bg-[var(--theme-surface-subtle)] p-3">
							<h4 class="text-xs font-bold font-mono text-[var(--theme-text)] uppercase tracking-wide">Commit Answer to decisions.md</h4>
							<div class="mt-2 grid gap-2 sm:grid-cols-2">
								<input
									bind:value={quickDecisionTopic}
									placeholder="Topic (e.g. Why Kael trusts Mira)"
									class="neo-input text-xs"
								/>
								<input
									bind:value={quickDecisionAnswer}
									placeholder="Your decision (e.g. She holds the signet ring)"
									class="neo-input text-xs"
								/>
							</div>
							<div class="mt-2 flex justify-end">
								<button
									class="neo-btn-primary px-3 py-1 text-xs font-bold"
									onclick={commitQuickDecision}
								>
									Lock as Canon
								</button>
							</div>
						</div>
					{/if}

					{#if showQuickDisclosureForm}
						<div class="my-3 neo-box-sm bg-[var(--theme-surface-subtle)] p-3">
							<h4 class="text-xs font-bold font-mono text-[var(--theme-text)] uppercase tracking-wide">Commit Secret to Event #{activeOrder}</h4>
							<div class="mt-2 flex gap-2">
								<input
									bind:value={quickSecretText}
									placeholder="Secret revealed in this scene (e.g. Kael is carrying the black stone)"
									class="neo-input flex-1 text-xs"
								/>
								<button
									class="neo-btn-primary px-3 py-1 text-xs font-bold"
									onclick={commitQuickDisclosure}
								>
									Log to Event
								</button>
							</div>
						</div>
					{/if}

					{#if error}
						<p class="mt-3 text-xs font-bold text-rose-500 font-mono">{error}</p>
					{/if}

					<div class="manuscript mt-3 text-sm leading-relaxed text-[var(--theme-text)] whitespace-pre-wrap">
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
				class="neo-box p-4"
			>
				<div class="flex items-center justify-between">
					<h3 class="text-xs font-bold font-mono tracking-wider text-[var(--theme-text-muted)] uppercase">
						Continuity Radar ({contradictions.length + knowledgeLeaks.length + accidentalSpoilers.length})
					</h3>
					<span
						class="h-2.5 w-2.5 rounded-xs border border-[var(--theme-border-strong)] {contradictions.length || knowledgeLeaks.length || accidentalSpoilers.length
							? 'bg-rose-500 animate-pulse'
							: 'bg-emerald-500'}"
					></span>
				</div>

				<!-- Accidental Spoilers (Reader Perspective Mode) -->
				{#if accidentalSpoilers.length > 0}
					<div class="mt-3 space-y-1.5">
						<span class="text-[11px] font-bold font-mono text-purple-600 dark:text-purple-400 uppercase tracking-wide">
							🚨 Accidental Spoiler Alert ({accidentalSpoilers.length})
						</span>
						{#each accidentalSpoilers as sp}
							<div class="rounded-xs border-2 border-purple-500 bg-purple-500/10 p-2 text-xs text-[var(--theme-text)] leading-tight shadow-[2px_2px_0px_var(--theme-shadow-hard)]">
								<strong>{sp.nodeTitle}:</strong> {sp.reason}
							</div>
						{/each}
					</div>
				{/if}

				<!-- Knowledge Leaks Section -->
				{#if knowledgeLeaks.length > 0}
					<div class="mt-3 space-y-1.5">
						<span class="text-[11px] font-bold font-mono text-rose-600 dark:text-rose-400 uppercase tracking-wide">
							⚠️ Knowledge Leaks ({knowledgeLeaks.length})
						</span>
						{#each knowledgeLeaks as leak}
							<div class="rounded-xs border-2 border-rose-500 bg-rose-500/10 p-2 text-xs text-[var(--theme-text)] leading-tight shadow-[2px_2px_0px_var(--theme-shadow-hard)]">
								<strong>{leak.characterName}:</strong> {leak.reason}
							</div>
						{/each}
					</div>
				{/if}

				<!-- Magic Rule Contradictions -->
				{#if contradictions.length > 0}
					<div class="mt-3 space-y-1.5">
						<span class="text-[11px] font-bold font-mono text-rose-600 dark:text-rose-400 uppercase tracking-wide">
							🛡️ Magic Rule Conflicts ({contradictions.length})
						</span>
						<ul class="space-y-1.5 text-xs">
							{#each contradictions as c (c.entryId + c.reason)}
								<li class="rounded-xs border-2 border-rose-500 bg-rose-500/10 p-2 text-[var(--theme-text)] leading-tight shadow-[2px_2px_0px_var(--theme-shadow-hard)]">
									<div class="font-bold">{c.entryName}</div>
									<div class="mt-0.5 text-[11px] opacity-80">{c.reason}</div>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if !contradictions.length && !knowledgeLeaks.length && !accidentalSpoilers.length}
					<p class="mt-2 text-xs leading-relaxed text-[var(--theme-text-muted)] font-mono">
						No canon contradictions, knowledge leaks, or accidental spoilers detected.
					</p>
				{/if}

				<!-- Reader Clue Horizon when Reader Mode is Active -->
				{#if readerMode}
					<div class="mt-3 border-t-2 border-[var(--theme-border-strong)] pt-2 text-[11px]">
						<span class="font-bold font-mono text-purple-600 dark:text-purple-400 uppercase text-[10px]">
							Reader Horizon (Clues Observed: {readerClues.length}):
						</span>
						{#if !readerClues.length}
							<p class="mt-1 text-[var(--theme-text-faint)] italic font-mono">No clues planted in story yet.</p>
						{:else}
							<ul class="mt-1 space-y-0.5 text-[var(--theme-text)] font-mono">
								{#each readerClues as rc}
									<li>🔍 {rc.title}</li>
								{/each}
							</ul>
						{/if}
					</div>
				{/if}

				<div class="mt-3 flex items-center justify-between border-t-2 border-[var(--theme-border-strong)] pt-2 text-[11px] text-[var(--theme-text-muted)] font-mono">
					<span class="truncate max-w-[170px]" title={linked.map((e) => e.name).join(', ')}>Linked: {linked.map((e) => e.name).join(', ') || 'None'}</span>
					<div class="flex gap-2 font-bold">
						<a href="/timeline" class="text-[var(--theme-accent)] hover:underline">
							Timeline
						</a>
						<span>·</span>
						<a href="/mysteries" class="text-[var(--theme-accent)] hover:underline">
							Mysteries
						</a>
					</div>
				</div>
			</section>

			<!-- AI Provider Settings Drawer -->
			<details class="neo-box-sm bg-[var(--theme-surface-subtle)] p-3 text-xs">
				<summary class="cursor-pointer font-bold font-mono text-[var(--theme-text)] hover:text-[var(--theme-accent)]">
					AI Settings ({cfg.provider})
				</summary>
				<div class="mt-3 space-y-2">
					<label class="block">
						<span class="text-[11px] font-bold font-mono text-[var(--theme-text-muted)] uppercase">Provider</span>
						<select
							bind:value={cfg.provider}
							onchange={saveKey}
							class="neo-input mt-1 w-full text-xs"
						>
							<option value="ollama">Ollama (Local Private AI)</option>
							<option value="openai">OpenAI</option>
							<option value="anthropic">Anthropic</option>
							<option value="local">Offline Rules Only</option>
						</select>
					</label>

					{#if cfg.provider === 'ollama'}
						<label class="block">
							<span class="text-[11px] font-bold font-mono text-[var(--theme-text-muted)] uppercase">Model</span>
							<select
								bind:value={cfg.model}
								onchange={saveKey}
								class="neo-input mt-1 w-full text-xs"
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
							class="neo-btn !px-2 !py-1 text-[11px] font-bold font-mono mt-1"
							onclick={refreshOllama}
						>
							Refresh Ollama Models
						</button>
					{:else if cfg.provider !== 'local'}
						<label class="block">
							<span class="text-[11px] font-bold font-mono text-[var(--theme-text-muted)] uppercase">API Key</span>
							<input
								type="password"
								bind:value={cfg.apiKey}
								onchange={saveKey}
								placeholder="sk-…"
								class="neo-input mt-1 w-full text-xs"
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
