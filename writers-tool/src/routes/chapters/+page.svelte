<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import {
		aiDraftHelp,
		aiInterrogate,
		aiElevateProse,
		aiAuditVoiceContinuity,
		DEFAULT_OLLAMA_MODEL,
		loadAIConfig,
		ollamaStatus,
		saveAIConfig,
		type AIConfig,
		type ProseElevationResult,
		type VoiceAuditResult
	} from '$lib/ai';
	import DistractionFreeEditor from '$lib/DistractionFreeEditor.svelte';
	import EntityDossierModal from '$lib/EntityDossierModal.svelte';
	import StoryContextHUD from '$lib/StoryContextHUD.svelte';
	import { toasts } from '$lib/toasts';
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
		loadVoiceProfile,
		saveChapters,
		saveDecisions,
		saveEvents,
		scanAntiSlop,
		type AntiSlopViolation,
		type Chapter,
		type Contradiction,
		type Decision,
		type KnowledgeLeakWarning,
		type MysteryNode,
		type AccidentalSpoilerWarning,
		type StoryEvent,
		type VoiceProfile,
		type WorldEntry
	} from '$lib/world';

	let bible: WorldEntry[] = $state([]);
	let chapters: Chapter[] = $state([]);
	let decisions: Decision[] = $state([]);
	let events: StoryEvent[] = $state([]);
	let mysteries: MysteryNode[] = $state([]);
	let voiceProfile = $state<VoiceProfile | null>(null);
	let activeId = $state<string | null>(null);
	let readerMode = $state(false);
	let cfg: AIConfig = $state({ provider: 'ollama', apiKey: '', model: DEFAULT_OLLAMA_MODEL });
	let ollama = $state({ running: false, models: [] as string[] });

	// Modals and Active Entity
	let selectedEntity = $state<WorldEntry | null>(null);

	// Analysis Reports
	let interrogationReport = $state('');
	let continuityReport = $state('');
	let elevationResult = $state<ProseElevationResult | null>(null);
	let auditResult = $state<VoiceAuditResult | null>(null);
	let busy = $state(false);
	let activeTab: 'interrogate' | 'continuity' | 'elevator' | 'gate' = $state('interrogate');
	let error = $state('');
	let appliedNotification = $state(false);
	let diffMode = $state<'side_by_side' | 'elevated'>('side_by_side');
	let exerciseAnswerInputs = $state<Record<string, string>>({});

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
	let antiSlopViolations = $state<AntiSlopViolation[]>([]);

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
			antiSlopViolations = [];
			return;
		}
		contradictions = checkContradictions(bible, active.text);
		linked = linkedEntities(bible, active.text);
		knowledgeLeaks = detectKnowledgeLeaks(events, activeOrder, active.pov || '', active.text, bible);
		accidentalSpoilers = readerMode ? detectAccidentalSpoilers(mysteries, activeOrder, active.text) : [];
		antiSlopViolations = scanAntiSlop(active.text);
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
		voiceProfile = loadVoiceProfile();
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

	async function runProseElevator() {
		if (!active || !active.text.trim()) return;
		busy = true;
		error = '';
		activeTab = 'elevator';
		try {
			elevationResult = await aiElevateProse(cfg, voiceProfile, bible, decisions, active.text);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Prose elevation failed';
		} finally {
			busy = false;
		}
	}

	function applyElevationDiff() {
		if (!active || !elevationResult?.elevatedText) return;
		active.text = elevationResult.elevatedText;
		touch();
		appliedNotification = true;
		setTimeout(() => {
			appliedNotification = false;
		}, 3000);
	}

	async function runVoiceContinuityGate() {
		if (!active || !active.text.trim()) return;
		busy = true;
		error = '';
		activeTab = 'gate';
		try {
			auditResult = await aiAuditVoiceContinuity(cfg, voiceProfile, bible, active.text);
			if (auditResult.status === 'ACCEPTED') {
				active.auditStatus = 'accepted';
				active.auditTimestamp = new Date().toISOString();
				active.auditNotes = ['Certified clean: 0 canon blocks, 0 anti-slop violations.'];
				saveChapters(chapters);
			} else {
				active.auditStatus = 'revision_needed';
				active.auditNotes = auditResult.blocks.map((b) => b.resolutionPrompt);
				saveChapters(chapters);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Audit failed';
		} finally {
			busy = false;
		}
	}

	function commitCraftAnswer(flagIndex: number, flag: { quote: string; lesson: string; exercise: string }) {
		const answer = exerciseAnswerInputs[flagIndex];
		if (!answer || !answer.trim()) return;

		const nextId = `D${decisions.length + 1}`;
		const entry: Decision = {
			id: nextId,
			date: new Date().toISOString().slice(0, 10),
			topic: `Craft Lesson: Grounding for "${flag.quote}"`,
			decision: answer.trim(),
			authorWords: `"${answer.trim()}"`,
			source: `Prose Elevator Micro-Lesson on ${active?.title ?? 'chapter'}`,
			affects: active?.title ?? 'manuscript',
			status: 'locked'
		};
		decisions = [entry, ...decisions];
		saveDecisions(decisions);
		exerciseAnswerInputs[flagIndex] = '';
		appliedNotification = true;
		setTimeout(() => {
			appliedNotification = false;
		}, 2500);
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
		toasts.success(`Decision locked into decisions.md!`, '🛡️');
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
		toasts.success(`Secret logged to Scene #${activeOrder} in Timeline!`, '⏳');
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
				class="skeuo-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold {readerMode
					? '!bg-purple-700 !text-white'
					: ''}"
				onclick={toggleReaderMode}
				title="Toggle Reader Perspective Mode (masks unrevealed secrets and scans for premature reveals)"
			>
				<span>{readerMode ? '👁️ Reader Mode [ACTIVE]' : '👁️ Author Omniscient'}</span>
			</button>
			<button
				class="skeuo-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--theme-accent)]"
				onclick={runSocraticInterrogation}
				disabled={busy || !active?.text.trim()}
				title="Run Socratic interrogation on motivations, plot holes, and pacing"
			>
				<span>🎯</span>
				{busy && activeTab === 'interrogate' ? 'Challenging…' : 'Socratic Interrogation'}
			</button>
			<button
				class="skeuo-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
				onclick={runContinuityCheck}
				disabled={busy || !active?.text.trim()}
				title="Run continuity & magic rule contradiction check"
			>
				<span>🛡️</span>
				{busy && activeTab === 'continuity' ? 'Checking…' : 'Continuity Check'}
			</button>
			<button
				class="skeuo-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400"
				onclick={runProseElevator}
				disabled={busy || !active?.text.trim()}
				title="Run Prose Elevator: Anti-slop check, sentence rhythm variation, and craft micro-lessons"
			>
				<span>🎙️</span>
				{busy && activeTab === 'elevator' ? 'Elevating…' : 'Prose Elevator'}
				{#if antiSlopViolations.length > 0}
					<span class="rounded bg-rose-500 px-1.5 py-0.2 text-[10px] text-white font-mono">
						{antiSlopViolations.length}
					</span>
				{/if}
			</button>
			<button
				class="skeuo-btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold {active?.auditStatus === 'accepted' ? '!border-emerald-600 !bg-emerald-500 !text-black' : ''}"
				onclick={runVoiceContinuityGate}
				disabled={busy || !active?.text.trim()}
				title="Run Voice & Continuity Gate: Audit chapter for official ACCEPTED certification"
			>
				<span>🛡️</span>
				{#if active?.auditStatus === 'accepted'}
					✓ ACCEPTED
				{:else}
					{busy && activeTab === 'gate' ? 'Auditing…' : 'Quality Gate'}
				{/if}
			</button>
		</div>
	</div>

	{#if showHelpTips}
		<div class="mt-4 skeuo-box-sm bg-[var(--theme-surface-subtle)] p-4 text-xs text-[var(--theme-text-muted)] animate-in fade-in duration-200">
			<div class="flex items-center justify-between font-serif font-bold text-[var(--theme-text)]">
				<span class="text-xs tracking-wide">Editor Quick Reference & Keyboard Accelerators</span>
				<a href="/guide" class="text-[var(--theme-accent)] underline hover:opacity-80 font-sans">Open Full Guide →</a>
			</div>
			<div class="mt-2 grid gap-3 sm:grid-cols-3">
				<div>
					<span class="font-bold text-[var(--theme-text)]">@ Autocomplete</span>
					<p class="mt-0.5 text-[11px] leading-relaxed">Type <kbd class="font-mono font-bold rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] px-1 py-0.5">@</kbd> anywhere to insert characters, magic laws, and places from your Bible.</p>
				</div>
				<div>
					<span class="font-bold text-[var(--theme-text)]">Reader Perspective Mode</span>
					<p class="mt-0.5 text-[11px] leading-relaxed">Masks future secrets and catches accidental spoilers before readers discover clues naturally.</p>
				</div>
				<div>
					<span class="font-bold text-[var(--theme-text)]">Socratic AI Interrogator</span>
					<p class="mt-0.5 text-[11px] leading-relaxed">Challenges causality and character motivation without ever ghostwriting your prose.</p>
				</div>
			</div>
		</div>
	{/if}
</header>

<!-- Chapter Selector Tabs: Manuscript Binder Rail -->
<div class="mt-4 flex flex-wrap items-center gap-1.5 border-b border-[var(--theme-border)] pb-2">
	{#each chapters as c, idx (c.id)}
		<button
			role="tab"
			aria-selected={c.id === activeId}
			class="flex items-center gap-1.5 rounded-t-lg border border-b-0 px-3.5 py-1.5 text-xs font-serif font-semibold transition-all {c.id === activeId
				? 'border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-accent)] shadow-[0_-2px_6px_rgba(0,0,0,0.06),inset_0_1px_0_var(--theme-bevel-top)]'
				: 'border-transparent bg-[var(--theme-surface-subtle)] text-[var(--theme-text-muted)] hover:border-[var(--theme-border)] hover:text-[var(--theme-text)]'}"
			onclick={() => selectChapter(c.id)}
		>
			<span class="font-mono text-[11px] opacity-70">#{idx + 1}</span>
			<span>{c.title}</span>
			{#if c.act}
				<span class="text-[10px] opacity-75">[{c.act}]</span>
			{/if}
			{#if c.auditStatus === 'accepted'}
				<span class="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.8)]"></span>
			{/if}
		</button>
	{/each}
	<button
		class="skeuo-btn !border-dashed !px-3 !py-1 text-xs font-serif font-semibold text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
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
			<div class="flex flex-wrap items-center justify-between gap-3">
				<input
					bind:value={active.title}
					oninput={touch}
					placeholder="Chapter Title"
					class="letterpress-title flex-1 bg-transparent text-2xl sm:text-3xl font-serif font-bold text-[var(--theme-text)] focus:outline-hidden"
				/>
				<div class="flex items-center gap-2">
					{#if active.auditStatus === 'accepted'}
						<span
							class="skeuo-seal px-3 py-1 font-serif text-[11px] font-bold bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 text-stone-950 shadow-[0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.7)]"
						>
							🛡️ CANON ACCEPTED
						</span>
					{:else if active.auditStatus === 'revision_needed'}
						<span
							class="skeuo-badge border border-amber-600 bg-amber-400/20 px-2.5 py-0.5 font-serif text-[11px] font-bold text-amber-700 dark:text-amber-300"
						>
							⚠️ Revision Needed
						</span>
					{/if}
				</div>
			</div>

			<!-- Distraction-Free Writing Canvas with Ambient Entity Links -->
			<DistractionFreeEditor
				bind:text={active.text}
				{bible}
				{decisions}
				voice={voiceProfile}
				{cfg}
				ontouch={touch}
				onselectentity={(ent) => (selectedEntity = ent)}
			/>

			<!-- Interrogation & Novel Skills Analysis Panel -->
			{#if interrogationReport || continuityReport || elevationResult || auditResult || antiSlopViolations.length > 0 || error}
				<section
					class="mt-4 skeuo-paper-sheet p-5"
					aria-label="Editorial Debrief"
				>
					<!-- Tab Navigation Rail -->
					<div class="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--theme-border)] pb-3">
						<div class="flex flex-wrap items-center gap-3">
							<button
								class="cursor-pointer text-xs font-serif font-bold transition-all {activeTab ===
								'interrogate'
									? 'text-[var(--theme-accent)] border-b-2 border-[var(--theme-accent)] pb-1'
									: 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'}"
								onclick={() => (activeTab = 'interrogate')}
							>
								Socratic Interrogator
							</button>
							<span class="text-[var(--theme-border)] font-normal">|</span>
							<button
								class="cursor-pointer text-xs font-serif font-bold transition-all {activeTab ===
								'continuity'
									? 'text-[var(--theme-accent)] border-b-2 border-[var(--theme-accent)] pb-1'
									: 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'}"
								onclick={() => (activeTab = 'continuity')}
							>
								Continuity & Lore
							</button>
							<span class="text-[var(--theme-border)] font-normal">|</span>
							<button
								class="cursor-pointer text-xs font-serif font-bold flex items-center gap-1.5 transition-all {activeTab ===
								'elevator'
									? 'text-[var(--theme-accent)] border-b-2 border-[var(--theme-accent)] pb-1'
									: 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'}"
								onclick={() => (activeTab = 'elevator')}
							>
								<span>Prose Elevator & Anti-Slop</span>
								{#if antiSlopViolations.length > 0}
									<span class="rounded bg-rose-500 px-1.5 py-0.2 font-mono text-[9px] text-white">
										{antiSlopViolations.length}
									</span>
								{:else}
									<span class="rounded bg-emerald-500 px-1.5 py-0.2 font-mono text-[9px] text-black">
										✓
									</span>
								{/if}
							</button>
							<span class="text-[var(--theme-border)] font-normal">|</span>
							<button
								class="cursor-pointer text-xs font-serif font-bold flex items-center gap-1.5 transition-all {activeTab ===
								'gate'
									? 'text-[var(--theme-accent)] border-b-2 border-[var(--theme-accent)] pb-1'
									: 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'}"
								onclick={() => (activeTab = 'gate')}
							>
								<span>Quality Gate</span>
								{#if active.auditStatus === 'accepted'}
									<span class="rounded bg-emerald-500 px-1.5 py-0.2 font-mono text-[9px] text-black">
										PASSED
									</span>
								{/if}
							</button>
						</div>

						<div class="flex items-center gap-2">
							<button
								class="skeuo-btn !px-2.5 !py-1 text-xs font-serif font-semibold"
								onclick={() => (showQuickDecisionForm = !showQuickDecisionForm)}
							>
								{showQuickDecisionForm ? 'Cancel' : '+ Lock Decision'}
							</button>
							<button
								class="skeuo-btn !px-2.5 !py-1 text-xs font-serif font-semibold text-[var(--theme-accent)]"
								onclick={() => (showQuickDisclosureForm = !showQuickDisclosureForm)}
							>
								{showQuickDisclosureForm ? 'Cancel' : '+ Log Secret to Timeline'}
							</button>
						</div>
					</div>

					{#if appliedNotification}
						<div class="my-3 rounded-md border-2 border-emerald-600 bg-emerald-500/15 p-2 text-xs font-bold text-emerald-800 dark:text-emerald-200">
							✓ Applied changes / decision locked into decisions.md!
						</div>
					{/if}

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

					<!-- Tab 1: Socratic Interrogator -->
					{#if activeTab === 'interrogate'}
						<div class="manuscript mt-3 text-sm leading-relaxed text-[var(--theme-text)] whitespace-pre-wrap">
							{interrogationReport || 'Click "Socratic Interrogation" above to test motivations, plot holes, and scene goals.'}
						</div>

					<!-- Tab 2: Continuity & Lore Checker -->
					{:else if activeTab === 'continuity'}
						<div class="manuscript mt-3 text-sm leading-relaxed text-[var(--theme-text)] whitespace-pre-wrap">
							{continuityReport || 'Click "Continuity Check" above to scan for magic rule contradictions.'}
						</div>

					<!-- Tab 3: Prose Elevator & Anti-Slop -->
					{:else if activeTab === 'elevator'}
						<div class="mt-3 space-y-4">
							<!-- Anti-Slop Scanner Status Bar -->
							<div class="rounded-lg border-2 border-[var(--theme-border-strong)] bg-[var(--theme-surface-subtle)] p-3 text-xs">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<span class="font-bold uppercase font-mono">Anti-Slop Linter (10 Iron Rules):</span>
										{#if antiSlopViolations.length === 0}
											<span class="neo-badge bg-emerald-500 text-black font-black text-[10px]">
												0 VIOLATIONS (CLEAN)
											</span>
										{:else}
											<span class="neo-badge bg-rose-500 text-white font-black text-[10px]">
												{antiSlopViolations.length} VIOLATION{antiSlopViolations.length > 1 ? 'S' : ''} DETECTED
											</span>
										{/if}
									</div>
									<button
										type="button"
										class="neo-btn-primary px-3 py-1 text-xs font-bold"
										disabled={busy}
										onclick={runProseElevator}
									>
										{busy ? 'Elevating…' : '⚡ Run Literary Elevation Pass'}
									</button>
								</div>

								{#if antiSlopViolations.length > 0}
									<div class="mt-3 space-y-2 border-t border-[var(--theme-border-strong)] pt-2">
										{#each antiSlopViolations as v}
											<div class="rounded-md border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] p-2">
												<div class="flex items-center gap-2">
													<span class="neo-badge text-[9px] uppercase {v.severity === 'error' ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'}">
														Rule #{v.ruleId}: {v.ruleName}
													</span>
													<span class="font-mono text-[11px] text-[var(--theme-text-muted)]">"{v.snippet}"</span>
												</div>
												<p class="mt-1 text-[11px] text-[var(--theme-text)]">{v.explanation}</p>
												<p class="mt-0.5 font-bold text-[10px] text-[var(--theme-accent)]">Fix: {v.fix}</p>
											</div>
										{/each}
									</div>
								{/if}
							</div>

							<!-- Elevation Results & Craft Micro-Lessons -->
							{#if elevationResult}
								<div class="space-y-4">
									<!-- Change Log -->
									<div class="rounded-lg border border-[var(--theme-border-strong)] bg-[var(--theme-surface-subtle)] p-3 text-xs">
										<h4 class="font-bold uppercase font-mono text-[var(--theme-accent)]">Pass 1 & 2 Change Log:</h4>
										<ul class="mt-1.5 space-y-1 text-[11px] list-disc list-inside">
											{#each elevationResult.changeLog as log}
												<li>{log}</li>
											{/each}
										</ul>
									</div>

									<!-- Craft Flags with Micro-Lessons -->
									{#if elevationResult.craftFlags.length > 0}
										<div class="space-y-2">
											<h4 class="font-bold uppercase font-mono text-xs text-amber-600 dark:text-amber-400">
												Craft Micro-Lessons & Exercises ({elevationResult.craftFlags.length})
											</h4>
											{#each elevationResult.craftFlags as flag, idx}
												<div class="rounded-lg border-2 border-amber-500 bg-amber-500/10 p-3 text-xs space-y-2">
													<div class="flex items-center gap-2">
														<span class="neo-badge bg-amber-500 text-black font-black text-[9px]">
															[{flag.type} — "{flag.quote}"]
														</span>
													</div>
													<p class="text-[11px] text-[var(--theme-text)]">
														<strong>Craft Lesson:</strong> {flag.lesson}
													</p>
													<div class="rounded-md border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] p-2">
														<label for={`craft-exercise-${idx}`} class="block font-bold text-[11px] text-[var(--theme-accent)]">
															Exercise: {flag.exercise}
														</label>
														<div class="mt-1.5 flex gap-2">
															<input
																id={`craft-exercise-${idx}`}
																type="text"
																bind:value={exerciseAnswerInputs[idx]}
																placeholder="Your concrete detail (e.g. her fingers twitched around the pommel)"
																class="neo-input flex-1 p-1.5 text-xs"
															/>
															<button
																type="button"
																class="neo-btn-primary px-2.5 py-1 text-xs font-bold"
																onclick={() => commitCraftAnswer(idx, flag)}
															>
																🔒 Lock as Decision
															</button>
														</div>
													</div>
												</div>
											{/each}
										</div>
									{/if}

									<!-- Elevation Text Diff Comparison -->
									<div class="rounded-lg border-2 border-[var(--theme-border-strong)] bg-[var(--theme-surface)] p-4 space-y-3">
										<div class="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
											<div class="flex items-center gap-2 font-mono text-xs font-bold">
												<span>Display Mode:</span>
												<button
													type="button"
													class="px-2 py-0.5 rounded-xs border {diffMode === 'side_by_side' ? 'bg-[var(--theme-accent)] text-[var(--theme-accent-fg)]' : 'bg-[var(--theme-surface-subtle)]'}"
													onclick={() => (diffMode = 'side_by_side')}
												>
													Side-by-Side Diff
												</button>
												<button
													type="button"
													class="px-2 py-0.5 rounded-xs border {diffMode === 'elevated' ? 'bg-[var(--theme-accent)] text-[var(--theme-accent-fg)]' : 'bg-[var(--theme-surface-subtle)]'}"
													onclick={() => (diffMode = 'elevated')}
												>
													Elevated Text Only
												</button>
											</div>

											<button
												type="button"
												class="neo-btn-primary px-3 py-1.5 text-xs font-bold"
												onclick={applyElevationDiff}
											>
												✓ Apply Elevated Prose to Chapter Draft
											</button>
										</div>

										{#if diffMode === 'side_by_side'}
											<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
												<div class="space-y-1">
													<span class="font-bold text-[var(--theme-text-muted)] uppercase">Original Draft:</span>
													<div class="max-h-80 overflow-auto p-3 rounded-md bg-[var(--theme-surface-subtle)] whitespace-pre-wrap leading-relaxed">
														{active.text}
													</div>
												</div>
												<div class="space-y-1">
													<span class="font-bold text-[var(--theme-accent)] uppercase">Elevated (Rhythm Varied, 0 Slop):</span>
													<div class="max-h-80 overflow-auto p-3 rounded-md bg-[var(--theme-surface-subtle)] border border-[var(--theme-accent)] whitespace-pre-wrap leading-relaxed">
														{elevationResult.elevatedText}
													</div>
												</div>
											</div>
										{:else}
											<div class="max-h-80 overflow-auto p-3 rounded-md bg-[var(--theme-surface-subtle)] font-mono text-xs whitespace-pre-wrap leading-relaxed">
												{elevationResult.elevatedText}
											</div>
										{/if}
									</div>
								</div>
							{/if}
						</div>

					<!-- Tab 4: Voice & Continuity Quality Gate -->
					{:else if activeTab === 'gate'}
						<div class="mt-3 space-y-4">
							<div class="flex items-center justify-between border-b pb-2">
								<div>
									<h4 class="font-display text-sm font-bold uppercase">Voice & Continuity Final Quality Gate</h4>
									<p class="text-xs text-[var(--theme-text-muted)]">
										Audits chapter against all 10 anti-slop rules, canon bible laws, and author voice fingerprints.
									</p>
								</div>
								<button
									type="button"
									class="neo-btn-primary px-4 py-1.5 text-xs font-bold"
									disabled={busy}
									onclick={runVoiceContinuityGate}
								>
									{busy ? 'Auditing…' : '🛡️ Audit Chapter for Acceptance'}
								</button>
							</div>

							{#if auditResult}
								<!-- Status Banner -->
								{#if auditResult.status === 'ACCEPTED'}
									<div class="neo-box border-4 border-emerald-600 bg-emerald-500/20 p-5 space-y-2">
										<div class="flex items-center gap-2">
											<span class="text-2xl">🏆</span>
											<h3 class="font-display text-lg font-black text-emerald-800 dark:text-emerald-200 uppercase tracking-tight">
												CHAPTER STATUS: ACCEPTED — CANON CERTIFIED
											</h3>
										</div>
										<p class="text-xs font-bold text-emerald-900 dark:text-emerald-100">
											{auditResult.summary}
										</p>
									</div>
								{:else if auditResult.status === 'CONTINUITY_BLOCK'}
									<div class="neo-box border-4 border-rose-600 bg-rose-500/20 p-5 space-y-3">
										<div class="flex items-center gap-2">
											<span class="text-2xl">⛔</span>
											<h3 class="font-display text-lg font-black text-rose-800 dark:text-rose-200 uppercase tracking-tight">
												CONTINUITY BLOCK — CHAPTER REJECTED
											</h3>
										</div>
										<p class="text-xs font-bold text-rose-900 dark:text-rose-100">
											{auditResult.summary}
										</p>

										<div class="space-y-2 pt-2 border-t border-rose-500/30">
											{#each auditResult.blocks as b}
												<div class="rounded-md border border-rose-600 bg-[var(--theme-surface)] p-2.5 text-xs space-y-1">
													<div class="font-bold text-rose-600">{b.chapterQuote}</div>
													<div class="text-[11px] opacity-80">{b.bibleQuote}</div>
													<div class="font-bold text-[10px] text-[var(--theme-accent)]">Fix: {b.resolutionPrompt}</div>
												</div>
											{/each}
										</div>
									</div>
								{:else}
									<div class="neo-box border-4 border-amber-600 bg-amber-500/20 p-4">
										<span class="font-bold text-amber-800 dark:text-amber-200 uppercase font-mono">
											⚠️ Revisions Recommended ({auditResult.antiSlopViolations.length} craft warning(s))
										</span>
									</div>
								{/if}

								<!-- 5-Point Quality Checklist -->
								<div class="rounded-lg border-2 border-[var(--theme-border-strong)] bg-[var(--theme-surface-subtle)] p-4 space-y-2">
									<h4 class="font-mono text-xs font-bold uppercase text-[var(--theme-text-muted)]">
										Official Audit Checklist:
									</h4>
									<div class="space-y-1.5 text-xs font-mono">
										{#each auditResult.checklist as check}
											<div class="flex items-center gap-2">
												{#if check.passed}
													<span class="text-emerald-500 font-bold">✓</span>
													<span class="text-[var(--theme-text)]">{check.item}</span>
												{:else}
													<span class="text-rose-500 font-bold">✕</span>
													<span class="text-rose-500 font-bold">{check.item}</span>
												{/if}
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					{/if}
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
						Continuity Radar ({contradictions.length + knowledgeLeaks.length + accidentalSpoilers.length + antiSlopViolations.length})
					</h3>
					<span
						class="h-2.5 w-2.5 rounded-xs border border-[var(--theme-border-strong)] {contradictions.length || knowledgeLeaks.length || accidentalSpoilers.length || antiSlopViolations.length
							? 'bg-rose-500 animate-pulse'
							: 'bg-emerald-500'}"
					></span>
				</div>

				<!-- Anti-Slop Alerts -->
				{#if antiSlopViolations.length > 0}
					<div class="mt-3 space-y-1.5">
						<span class="text-[11px] font-bold font-mono text-amber-600 dark:text-amber-400 uppercase tracking-wide">
							🎙️ Anti-Slop Alerts ({antiSlopViolations.length})
						</span>
						<ul class="space-y-1.5 text-xs">
							{#each antiSlopViolations.slice(0, 3) as v}
								<li class="rounded-xs border border-amber-500 bg-amber-500/10 p-2 text-[var(--theme-text)] leading-tight">
									<div class="font-bold text-[10px] text-amber-700 dark:text-amber-300">Rule #{v.ruleId}: {v.ruleName}</div>
									<div class="mt-0.5 font-mono text-[10px] opacity-80">"{v.snippet}"</div>
								</li>
							{/each}
							{#if antiSlopViolations.length > 3}
								<li class="text-[10px] font-mono text-[var(--theme-text-muted)] text-right">
									+ {antiSlopViolations.length - 3} more (open Prose Elevator tab)
								</li>
							{/if}
						</ul>
					</div>
				{/if}

				<!-- Accidental Spoilers (Reader Perspective Mode) -->
				{#if accidentalSpoilers.length > 0}
					<div class="mt-3 space-y-1.5">
						<span class="text-[11px] font-bold font-mono text-purple-600 dark:text-purple-400 uppercase tracking-wide">
							🚨 Accidental Spoiler Alert ({accidentalSpoilers.length})
						</span>
						{#each accidentalSpoilers as sp}
							<div class="rounded-lg border border-purple-500/40 bg-purple-500/10 p-2.5 text-xs text-[var(--theme-text)] leading-snug shadow-xs">
								<strong class="font-serif">{sp.nodeTitle}:</strong> {sp.reason}
							</div>
						{/each}
					</div>
				{/if}

				<!-- Knowledge Leaks Section -->
				{#if knowledgeLeaks.length > 0}
					<div class="mt-3 space-y-1.5">
						<span class="text-[11px] font-bold font-serif text-rose-600 dark:text-rose-400 uppercase tracking-wide">
							⚠️ Knowledge Leaks ({knowledgeLeaks.length})
						</span>
						{#each knowledgeLeaks as leak}
							<div class="rounded-lg border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-[var(--theme-text)] leading-snug shadow-xs">
								<strong class="font-serif">{leak.characterName}:</strong> {leak.reason}
							</div>
						{/each}
					</div>
				{/if}

				<!-- Magic Rule Contradictions -->
				{#if contradictions.length > 0}
					<div class="mt-3 space-y-1.5">
						<span class="text-[11px] font-bold font-serif text-rose-600 dark:text-rose-400 uppercase tracking-wide">
							🛡️ Magic Rule Conflicts ({contradictions.length})
						</span>
						<ul class="space-y-1.5 text-xs">
							{#each contradictions as c (c.entryId + c.reason)}
								<li class="rounded-lg border border-rose-500/40 bg-rose-500/10 p-2.5 text-[var(--theme-text)] leading-snug shadow-xs">
									<div class="font-serif font-bold">{c.entryName}</div>
									<div class="mt-0.5 text-[11px] opacity-85 leading-relaxed">{c.reason}</div>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if !contradictions.length && !knowledgeLeaks.length && !accidentalSpoilers.length && !antiSlopViolations.length}
					<p class="mt-2 text-xs leading-relaxed text-[var(--theme-text-muted)] font-serif italic">
						No canon contradictions, knowledge leaks, accidental spoilers, or anti-slop violations detected.
					</p>
				{/if}

				<!-- Reader Clue Horizon when Reader Mode is Active -->
				{#if readerMode}
					<div class="mt-3 border-t border-[var(--theme-border)] pt-2 text-[11px]">
						<span class="font-bold font-serif text-purple-600 dark:text-purple-400 text-[11px]">
							Reader Horizon (Clues Observed: {readerClues.length}):
						</span>
						{#if !readerClues.length}
							<p class="mt-1 text-[var(--theme-text-faint)] italic font-serif">No clues planted in story yet.</p>
						{:else}
							<ul class="mt-1 space-y-0.5 text-[var(--theme-text)] font-sans">
								{#each readerClues as rc}
									<li>🔍 {rc.title}</li>
								{/each}
							</ul>
						{/if}
					</div>
				{/if}

				<div class="mt-3 flex items-center justify-between border-t border-[var(--theme-border)] pt-2 text-[11px] text-[var(--theme-text-muted)] font-serif">
					<span class="truncate max-w-[170px]" title={linked.map((e) => e.name).join(', ')}>Linked: {linked.map((e) => e.name).join(', ') || 'None'}</span>
					<div class="flex gap-2 font-bold font-sans">
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
			<details class="skeuo-box-sm bg-[var(--theme-surface-subtle)] p-3 text-xs">
				<summary class="cursor-pointer font-serif font-bold text-[var(--theme-text)] hover:text-[var(--theme-accent)]">
					AI Settings ({cfg.provider})
				</summary>
				<div class="mt-3 space-y-2">
					<label class="block">
						<span class="text-[11px] font-serif font-semibold text-[var(--theme-text-muted)]">Provider</span>
						<select
							bind:value={cfg.provider}
							onchange={saveKey}
							class="skeuo-groove mt-1 w-full p-2 text-xs"
						>
							<option value="ollama">Ollama (Local Private AI)</option>
							<option value="openai">OpenAI</option>
							<option value="anthropic">Anthropic</option>
							<option value="local">Offline Rules Only</option>
						</select>
					</label>

					{#if cfg.provider === 'ollama'}
						<label class="block">
							<span class="text-[11px] font-serif font-semibold text-[var(--theme-text-muted)]">Model</span>
							<select
								bind:value={cfg.model}
								onchange={saveKey}
								class="skeuo-groove mt-1 w-full p-2 text-xs"
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
							class="skeuo-btn !px-2.5 !py-1 text-[11px] font-serif font-semibold mt-1"
							onclick={refreshOllama}
						>
							Refresh Ollama Models
						</button>
					{:else if cfg.provider !== 'local'}
						<label class="block">
							<span class="text-[11px] font-serif font-semibold text-[var(--theme-text-muted)]">API Key</span>
							<input
								type="password"
								bind:value={cfg.apiKey}
								onchange={saveKey}
								placeholder="sk-…"
								class="skeuo-groove mt-1 w-full p-2 text-xs"
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
