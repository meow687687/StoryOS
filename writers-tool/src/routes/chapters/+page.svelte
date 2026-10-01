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
				<h1 class="font-display text-4xl font-semibold tracking-tight text-[var(--theme-text)]">
					Manuscript Editor
				</h1>
				<button
					type="button"
					class="cursor-pointer rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--theme-text-muted)] hover:text-[var(--theme-accent)] transition-colors"
					onclick={() => (showHelpTips = !showHelpTips)}
				>
					{showHelpTips ? '✕ Close Guide' : '💡 Tips & Shortcuts'}
				</button>
			</div>
			<p class="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--theme-text-muted)]">
				<span>{bible.length} bible entries</span>
				<span>·</span>
				<span>{decisions.filter((d) => d.status === 'locked').length} locked decisions</span>
				<span>·</span>
				<span class="inline-flex items-center gap-1.5">
					<span
						class="inline-block h-2 w-2 rounded-full"
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
				class="flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors {readerMode
					? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-300 shadow-xs'
					: 'border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text-muted)] hover:border-[var(--theme-border-strong)]'}"
				onclick={toggleReaderMode}
				title="Toggle Reader Perspective Mode (masks unrevealed secrets and scans for premature reveals)"
			>
				<span>{readerMode ? '👁️ Reader Mode (ON)' : '👁️ Author Omniscient'}</span>
			</button>
			<button
				class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--theme-accent)] bg-[var(--theme-accent-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--theme-accent)] hover:opacity-90"
				onclick={runSocraticInterrogation}
				disabled={busy || !active?.text.trim()}
				title="Run Socratic interrogation on motivations, plot holes, and pacing"
			>
				<span>🎯</span>
				{busy && activeTab === 'interrogate' ? 'Challenging…' : 'Socratic Interrogation'}
			</button>
			<button
				class="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--theme-accent)] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 disabled:opacity-40"
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
		<div class="mt-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-4 text-xs text-[var(--theme-text-muted)] shadow-xs animate-in fade-in duration-200">
			<div class="flex items-center justify-between font-bold text-[var(--theme-text)]">
				<span>Editor Quick Reference & Keyboard Accelerators</span>
				<a href="/guide" class="text-[var(--theme-accent)] underline hover:opacity-80">Open Full Guide →</a>
			</div>
			<div class="mt-2 grid gap-3 sm:grid-cols-3">
				<div>
					<span class="font-semibold text-[var(--theme-text)]">@ Autocomplete</span>
					<p class="mt-0.5 text-[11px]">Type <kbd class="font-mono rounded bg-black/10 px-1 py-0.5">@</kbd> anywhere to insert characters, magic laws, and places from your Bible.</p>
				</div>
				<div>
					<span class="font-semibold text-[var(--theme-text)]">Reader Perspective Mode</span>
					<p class="mt-0.5 text-[11px]">Masks future secrets and catches accidental spoilers before readers discover clues naturally.</p>
				</div>
				<div>
					<span class="font-semibold text-[var(--theme-text)]">Socratic AI Interrogator</span>
					<p class="mt-0.5 text-[11px]">Challenges causality and character motivation without ever ghostwriting your prose.</p>
				</div>
			</div>
		</div>
	{/if}
</header>

<!-- Chapter Selector Tabs -->
<div class="mt-4 flex flex-wrap items-center gap-1.5 border-b border-[var(--theme-border)] pb-2">
	{#each chapters as c (c.id)}
		<button
			role="tab"
			aria-selected={c.id === activeId}
			class="flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors {c.id ===
			activeId
				? 'bg-[var(--theme-accent)] text-white shadow-xs font-semibold'
				: 'text-[var(--theme-text-muted)] hover:bg-[var(--theme-surface-subtle)] hover:text-[var(--theme-text)]'}"
			onclick={() => selectChapter(c.id)}
		>
			<span>{c.title}</span>
			{#if c.act}
				<span class="text-[10px] opacity-75">({c.act})</span>
			{/if}
		</button>
	{/each}
	<button
		class="flex cursor-pointer items-center rounded-md border border-dashed border-[var(--theme-border)] px-3 py-1.5 text-xs text-[var(--theme-text-muted)] hover:border-[var(--theme-border-strong)] hover:text-[var(--theme-text)]"
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
					class="mt-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 shadow-xs"
					aria-label="Editorial Debrief"
				>
					<div class="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--theme-border)] pb-3">
						<div class="flex items-center gap-2">
							<button
								class="cursor-pointer text-xs font-bold uppercase tracking-wider {activeTab ===
								'interrogate'
									? 'text-[var(--theme-accent)] underline decoration-2 underline-offset-4'
									: 'text-[var(--theme-text-faint)] hover:text-[var(--theme-text)]'}"
								onclick={() => (activeTab = 'interrogate')}
							>
								Socratic Interrogator
							</button>
							<span class="text-[var(--theme-text-faint)]">|</span>
							<button
								class="cursor-pointer text-xs font-bold uppercase tracking-wider {activeTab ===
								'continuity'
									? 'text-[var(--theme-accent)] underline decoration-2 underline-offset-4'
									: 'text-[var(--theme-text-faint)] hover:text-[var(--theme-text)]'}"
								onclick={() => (activeTab = 'continuity')}
							>
								Continuity & Lore Checker
							</button>
						</div>

						<div class="flex items-center gap-1.5">
							<button
								class="cursor-pointer rounded border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--theme-text)] hover:border-[var(--theme-border-strong)]"
								onclick={() => (showQuickDecisionForm = !showQuickDecisionForm)}
							>
								{showQuickDecisionForm ? 'Cancel' : '+ Lock Decision'}
							</button>
							<button
								class="cursor-pointer rounded border border-[var(--theme-accent)] bg-[var(--theme-accent-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--theme-accent)] hover:opacity-90"
								onclick={() => (showQuickDisclosureForm = !showQuickDisclosureForm)}
							>
								{showQuickDisclosureForm ? 'Cancel' : '+ Log Secret to Timeline'}
							</button>
						</div>
					</div>

					{#if showQuickDecisionForm}
						<div class="my-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-3 shadow-xs">
							<h4 class="text-xs font-bold text-[var(--theme-text)]">Commit Answer to decisions.md</h4>
							<div class="mt-2 grid gap-2 sm:grid-cols-2">
								<input
									bind:value={quickDecisionTopic}
									placeholder="Topic (e.g. Why Kael trusts Mira)"
									class="rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] px-2 py-1 text-xs text-[var(--theme-text)] placeholder:text-[var(--theme-text-faint)]"
								/>
								<input
									bind:value={quickDecisionAnswer}
									placeholder="Your decision (e.g. She holds the signet ring)"
									class="rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] px-2 py-1 text-xs text-[var(--theme-text)] placeholder:text-[var(--theme-text-faint)]"
								/>
							</div>
							<div class="mt-2 flex justify-end">
								<button
									class="cursor-pointer rounded bg-[var(--theme-accent)] px-3 py-1 text-xs font-medium text-white hover:opacity-90"
									onclick={commitQuickDecision}
								>
									Lock as Canon
								</button>
							</div>
						</div>
					{/if}

					{#if showQuickDisclosureForm}
						<div class="my-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-3 shadow-xs">
							<h4 class="text-xs font-bold text-[var(--theme-text)]">Commit Secret to Event #{activeOrder}</h4>
							<div class="mt-2 flex gap-2">
								<input
									bind:value={quickSecretText}
									placeholder="Secret revealed in this scene (e.g. Kael is carrying the black stone)"
									class="flex-1 rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] px-2 py-1 text-xs text-[var(--theme-text)] placeholder:text-[var(--theme-text-faint)]"
								/>
								<button
									class="cursor-pointer rounded bg-[var(--theme-accent)] px-3 py-1 text-xs font-medium text-white hover:opacity-90"
									onclick={commitQuickDisclosure}
								>
									Log to Event
								</button>
							</div>
						</div>
					{/if}

					{#if error}
						<p class="mt-3 text-xs text-rose-500">{error}</p>
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
				class="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-xs"
			>
				<div class="flex items-center justify-between">
					<h3 class="text-xs font-bold tracking-wider text-[var(--theme-text-muted)] uppercase">
						Continuity Radar ({contradictions.length + knowledgeLeaks.length + accidentalSpoilers.length})
					</h3>
					<span
						class="h-2 w-2 rounded-full {contradictions.length || knowledgeLeaks.length || accidentalSpoilers.length
							? 'bg-rose-500 animate-pulse'
							: 'bg-emerald-500'}"
					></span>
				</div>

				<!-- Accidental Spoilers (Reader Perspective Mode) -->
				{#if accidentalSpoilers.length > 0}
					<div class="mt-2 space-y-1.5">
						<span class="text-[11px] font-bold text-purple-500 uppercase tracking-wide">
							🚨 Accidental Spoiler Alert ({accidentalSpoilers.length})
						</span>
						{#each accidentalSpoilers as sp}
							<div class="rounded-md border border-purple-500/30 bg-purple-500/10 p-2 text-xs text-[var(--theme-text)] leading-tight">
								<strong>{sp.nodeTitle}:</strong> {sp.reason}
							</div>
						{/each}
					</div>
				{/if}

				<!-- Knowledge Leaks Section -->
				{#if knowledgeLeaks.length > 0}
					<div class="mt-2 space-y-1.5">
						<span class="text-[11px] font-bold text-rose-500 uppercase tracking-wide">
							⚠️ Knowledge Leaks ({knowledgeLeaks.length})
						</span>
						{#each knowledgeLeaks as leak}
							<div class="rounded-md border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-[var(--theme-text)] leading-tight">
								<strong>{leak.characterName}:</strong> {leak.reason}
							</div>
						{/each}
					</div>
				{/if}

				<!-- Magic Rule Contradictions -->
				{#if contradictions.length > 0}
					<div class="mt-2 space-y-1.5">
						<span class="text-[11px] font-bold text-rose-500 uppercase tracking-wide">
							🛡️ Magic Rule Conflicts ({contradictions.length})
						</span>
						<ul class="space-y-1 text-xs">
							{#each contradictions as c (c.entryId + c.reason)}
								<li class="rounded-md border border-rose-500/30 bg-rose-500/10 p-2 text-[var(--theme-text)] leading-tight">
									<div class="font-bold">{c.entryName}</div>
									<div class="mt-0.5 text-[11px] opacity-80">{c.reason}</div>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if !contradictions.length && !knowledgeLeaks.length && !accidentalSpoilers.length}
					<p class="mt-2 text-xs leading-relaxed text-[var(--theme-text-muted)]">
						No canon contradictions, knowledge leaks, or accidental spoilers detected.
					</p>
				{/if}

				<!-- Reader Clue Horizon when Reader Mode is Active -->
				{#if readerMode}
					<div class="mt-3 border-t border-[var(--theme-border)] pt-2 text-[11px]">
						<span class="font-bold text-purple-500 uppercase text-[10px]">
							Reader Horizon (Clues Observed: {readerClues.length}):
						</span>
						{#if !readerClues.length}
							<p class="mt-1 text-[var(--theme-text-faint)] italic">No clues planted in story yet.</p>
						{:else}
							<ul class="mt-1 space-y-0.5 text-[var(--theme-text)]">
								{#each readerClues as rc}
									<li>🔍 {rc.title}</li>
								{/each}
							</ul>
						{/if}
					</div>
				{/if}

				<div class="mt-3 flex items-center justify-between border-t border-stone-100 pt-2 text-[11px] text-stone-500">
					<span>Linked: {linked.map((e) => e.name).join(', ') || 'None'}</span>
					<div class="flex gap-2">
						<a href="/timeline" class="font-medium text-[#9a3412] underline hover:text-[#7c2d12]">
							Timeline
						</a>
						<span>·</span>
						<a href="/mysteries" class="font-medium text-[#9a3412] underline hover:text-[#7c2d12]">
							Mysteries
						</a>
					</div>
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
