<script lang="ts">
	import { onMount } from 'svelte';
	import {
		CHARACTER_INTERROGATION_QUESTIONS,
		commitPartnerAgreementToCanon,
		DEVELOPMENTAL_SCENE_CHECKLIST,
		evaluateScenePacing,
		loadCharacterDossiers,
		loadPartnerMessages,
		saveCharacterDossiers,
		savePartnerMessages,
		type CharacterDossier,
		type EditorialConversationMessage,
		type PacingDiagnostic
	} from '$lib/partner';
	import { loadBible, loadDecisions, saveBible, saveDecisions, type Decision, type WorldEntry } from '$lib/world';
	import { toasts } from '$lib/toasts';
	import { scanAntiSlop, calculateSentenceRhythms, calculateContractionRate } from '$lib/world';

	let bible: WorldEntry[] = $state([]);
	let decisions: Decision[] = $state([]);
	let activeDesk = $state<'brainstorm' | 'character' | 'pacing' | 'prose' | 'vault'>('brainstorm');

	// Character Dossier State
	let dossiers: CharacterDossier[] = $state([]);
	let selectedDossier = $state<CharacterDossier | null>(null);

	// Pacing Diagnostic State
	let sceneGoal = $state('');
	let sceneObstacle = $state('');
	let sampleSceneText = $state('');
	let pacingReport = $derived(evaluateScenePacing(sampleSceneText, sceneGoal, sceneObstacle));

	// Prose Doctor State
	let proseText = $state('');
	let slopViolations = $derived(scanAntiSlop(proseText));
	let proseRhythm = $derived(calculateSentenceRhythms(proseText));
	let contractionRate = $derived(calculateContractionRate(proseText));

	// Partner Discussion Stream
	let messages: EditorialConversationMessage[] = $state([]);
	let inputMessage = $state('');

	// Brainstorm quick prompts
	const BRAINSTORM_TEMPLATES = [
		{ label: '🔥 Escalate the Central Conflict', prompt: 'How can we raise the stakes in this act so the protagonist is forced into an impossible moral choice?' },
		{ label: '🌀 Subvert a Classic Trope', prompt: 'Take our central premise and suggest 3 ways to invert the expected genre cliches.' },
		{ label: '🎭 Character Dilemma', prompt: 'What agonizing dilemma would pit this character\'s internal NEED against their external WANT?' },
		{ label: '🗡️ Antagonist Justification', prompt: 'Help make the antagonist\'s philosophy terrifyingly logical and sympathetic.' }
	];

	onMount(() => {
		bible = loadBible();
		decisions = loadDecisions();
		dossiers = loadCharacterDossiers();
		messages = loadPartnerMessages();

		if (dossiers.length === 0) {
			const initialDossier: CharacterDossier = {
				id: 'char-1',
				name: 'Kaelen Vane',
				role: 'Protagonist',
				want: 'Recover his sister’s stolen memory crystal from the High Citadel.',
				need: 'Accept that grief cannot be undone and stop sacrificing living companions for dead memories.',
				lie: 'If I just endure enough suffering, I can rewrite the tragedy of the past.',
				wound: 'Failed to guard the sanctum during the eclipse siege 5 years ago, resulting in his sister’s fall.',
				moralLimit: 'Refuses to use blood or sacrifice innocent civilians regardless of desperation.',
				voiceQuirks: 'Speaks in terse, clipped declaratives when stressed; never uses filler adjectives.',
				keyRelationships: [
					{ targetName: 'Sister Alyssa', dynamic: 'Guilt-driven devotion', tensionSource: 'He clings to her memory while she wanted him to live.' },
					{ targetName: 'Archivist Thorne', dynamic: 'Uneasy transactional alliance', tensionSource: 'Thorne knows the true cost of the memory crystals.' }
				]
			};
			dossiers = [initialDossier];
			saveCharacterDossiers(dossiers);
		}
		selectedDossier = dossiers[0];
	});

	function handleSendMessage() {
		if (!inputMessage.trim()) return;

		const userMsg: EditorialConversationMessage = {
			id: `msg-${Date.now()}-u`,
			role: 'user',
			desk: activeDesk,
			content: inputMessage.trim(),
			timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
		};

		// Socratic Editorial Partner Response Logic
		let responseText = '';
		let suggestedRuling: EditorialConversationMessage['suggestedDecision'] | undefined;

		if (activeDesk === 'brainstorm') {
			responseText = `Here is how we sharpen this idea: Let's ensure the solution introduces a secondary, irreversible complication. If the protagonist succeeds here, what unanticipated price does it force them to pay in the next scene?`;
			suggestedRuling = {
				topic: `Premise: ${inputMessage.slice(0, 30)}...`,
				decision: `Established consequence: protagonist's action triggers irrevocable fallout in the next act.`,
				affects: `lore:${inputMessage.slice(0, 20)}`
			};
		} else if (activeDesk === 'character') {
			responseText = `To deepen this character: Notice if their Lie ("${selectedDossier?.lie || 'self-preservation'}") directly clashes with their immediate goal. Force them to choose between their comfort and the truth.`;
			suggestedRuling = {
				topic: `Character Arc: ${selectedDossier?.name || 'Protagonist'}`,
				decision: `Locked character moral limitation: ${selectedDossier?.moralLimit || 'Refuses to sacrifice innocents'}.`,
				affects: `character:${selectedDossier?.name || 'Character'}`
			};
		} else if (activeDesk === 'pacing') {
			responseText = `Pacing evaluation: The scene has a clear goal, but ensure the turnaround at the climax isn't a simple victory. Make it a "Yes, but..." outcome that forces an immediate tactical pivot.`;
		} else {
			responseText = `Editorial analysis noted. Let's record this as an immutable ruling in our decisions ledger so we maintain 100% canon consistency across the manuscript.`;
		}

		const partnerMsg: EditorialConversationMessage = {
			id: `msg-${Date.now()}-p`,
			role: 'partner',
			desk: activeDesk,
			content: responseText,
			timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
			suggestedDecision: suggestedRuling
		};

		messages = [...messages, userMsg, partnerMsg];
		savePartnerMessages(messages);
		inputMessage = '';
	}

	function handleLockSuggestedDecision(ruling: NonNullable<EditorialConversationMessage['suggestedDecision']>) {
		const result = commitPartnerAgreementToCanon(ruling.topic, ruling.decision, ruling.affects, bible, decisions);
		bible = result.updatedBible;
		decisions = result.updatedDecisions;
		saveBible(bible);
		saveDecisions(decisions);
		toasts.success(`Locked decision "${ruling.topic}" directly into decisions.md!`, '🔒');
	}

	function handleAddNewDossier() {
		const newD: CharacterDossier = {
			id: `char-${Date.now().toString(36)}`,
			name: 'New Character',
			role: 'Protagonist',
			want: '',
			need: '',
			lie: '',
			wound: '',
			moralLimit: '',
			voiceQuirks: '',
			keyRelationships: []
		};
		dossiers = [newD, ...dossiers];
		selectedDossier = newD;
		saveCharacterDossiers(dossiers);
		toasts.success('Created new character dossier!', '🎭');
	}
</script>

<svelte:head>
	<title>Editorial Partner & Socratic Bureau — Story OS</title>
</svelte:head>

<div class="space-y-6">
	<!-- Top Editorial Bureau Header -->
	<header class="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--theme-border)] pb-4">
		<div class="flex items-center gap-3">
			<span class="h-9 w-9 rounded-lg bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 text-stone-950 font-black shadow-[0_2px_8px_rgba(0,0,0,0.25)] flex items-center justify-center text-base">
				🤝
			</span>
			<div>
				<h1 class="letterpress-title text-2xl sm:text-3xl font-serif font-bold text-[var(--theme-text)]">
					Editorial Partner Bureau
				</h1>
				<p class="font-serif text-xs text-[var(--theme-text-muted)] flex items-center gap-2 mt-0.5">
					<span>Socratic Developmental Editing</span>
					<span>·</span>
					<span>Character Psychology</span>
					<span>·</span>
					<span>Pacing Diagnostics</span>
					<span>·</span>
					<span>Canon Lock</span>
				</p>
			</div>
		</div>

		<div class="flex items-center gap-2 text-xs font-serif">
			<span class="rounded bg-emerald-600/15 border border-emerald-600/30 px-2.5 py-1 text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1.5">
				<span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
				Partner Ready (Non-Ghostwriting)
			</span>
		</div>
	</header>

	<!-- 5 Core Desks Navigation Strip -->
	<nav class="flex flex-wrap items-center gap-1 border-b border-[var(--theme-border)] pb-1 text-xs font-serif font-bold">
		<button
			type="button"
			class="px-4 py-2 rounded-t-lg transition-all border-b-2 {activeDesk === 'brainstorm'
				? 'border-[var(--theme-accent)] bg-[var(--theme-surface)] text-[var(--theme-accent)] shadow-[inset_0_1px_0_var(--theme-bevel-top)]'
				: 'border-transparent text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface-subtle)]'}"
			onclick={() => (activeDesk = 'brainstorm')}
		>
			<span class="flex items-center gap-1.5">
				<span>🛋️</span>
				<span>1. Brainstorm Lounge</span>
			</span>
		</button>

		<button
			type="button"
			class="px-4 py-2 rounded-t-lg transition-all border-b-2 {activeDesk === 'character'
				? 'border-[var(--theme-accent)] bg-[var(--theme-surface)] text-[var(--theme-accent)] shadow-[inset_0_1px_0_var(--theme-bevel-top)]'
				: 'border-transparent text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface-subtle)]'}"
			onclick={() => (activeDesk = 'character')}
		>
			<span class="flex items-center gap-1.5">
				<span>🎭</span>
				<span>2. Character Interrogation</span>
			</span>
		</button>

		<button
			type="button"
			class="px-4 py-2 rounded-t-lg transition-all border-b-2 {activeDesk === 'pacing'
				? 'border-[var(--theme-accent)] bg-[var(--theme-surface)] text-[var(--theme-accent)] shadow-[inset_0_1px_0_var(--theme-bevel-top)]'
				: 'border-transparent text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface-subtle)]'}"
			onclick={() => (activeDesk = 'pacing')}
		>
			<span class="flex items-center gap-1.5">
				<span>⏱️</span>
				<span>3. Pacing Diagnostics</span>
			</span>
		</button>

		<button
			type="button"
			class="px-4 py-2 rounded-t-lg transition-all border-b-2 {activeDesk === 'prose'
				? 'border-[var(--theme-accent)] bg-[var(--theme-surface)] text-[var(--theme-accent)] shadow-[inset_0_1px_0_var(--theme-bevel-top)]'
				: 'border-transparent text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface-subtle)]'}"
			onclick={() => (activeDesk = 'prose')}
		>
			<span class="flex items-center gap-1.5">
				<span>🩺</span>
				<span>4. Prose Doctor</span>
			</span>
		</button>

		<button
			type="button"
			class="px-4 py-2 rounded-t-lg transition-all border-b-2 {activeDesk === 'vault'
				? 'border-[var(--theme-accent)] bg-[var(--theme-surface)] text-[var(--theme-accent)] shadow-[inset_0_1px_0_var(--theme-bevel-top)]'
				: 'border-transparent text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface-subtle)]'}"
			onclick={() => (activeDesk = 'vault')}
		>
			<span class="flex items-center gap-1.5">
				<span>🏛️</span>
				<span>5. Canon Agreement Vault</span>
				<span class="rounded bg-black/15 px-1.5 py-0.2 text-[10px] font-mono">{decisions.length}</span>
			</span>
		</button>
	</nav>

	<!-- Main Multi-Desk Working Canvas -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
		<!-- Left Workspace Panel (7 cols) -->
		<div class="space-y-4 lg:col-span-7">
			{#if activeDesk === 'brainstorm'}
				<!-- Brainstorm Lounge -->
				<div class="skeuo-paper-sheet p-5 bg-[var(--theme-surface)] space-y-4">
					<div class="border-b border-[var(--theme-border)] pb-2.5">
						<h2 class="font-serif text-sm font-bold text-[var(--theme-accent)] flex items-center gap-2">
							<span>🛋️</span>
							<span>Story & Premise Brainstorming Lounge</span>
						</h2>
						<p class="font-serif text-xs text-[var(--theme-text-muted)] mt-0.5">
							Socratically interrogate plot points, subvert expected tropes, and test high-concept loglines.
						</p>
					</div>

					<div class="grid gap-2 sm:grid-cols-2">
						{#each BRAINSTORM_TEMPLATES as t}
							<button
								type="button"
								class="p-2.5 text-left rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] hover:border-[var(--theme-accent)] transition-all text-xs space-y-1"
								onclick={() => (inputMessage = t.prompt)}
							>
								<div class="font-bold text-[var(--theme-text)]">{t.label}</div>
								<div class="text-[11px] text-[var(--theme-text-muted)] line-clamp-2">{t.prompt}</div>
							</button>
						{/each}
					</div>

					<div class="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-3 space-y-2 text-xs">
						<div class="font-bold text-[var(--theme-text)]">💡 Socratic Craft Principle: The Rule of Two Complications</div>
						<p class="text-[11px] text-[var(--theme-text-muted)] leading-relaxed">
							When brainstorming a scene resolution, avoid clean victories. Force every win to birth a secondary tactical complication or cost that immediately drives the next chapter.
						</p>
					</div>
				</div>
			{:else if activeDesk === 'character'}
				<!-- Character Interrogation & Arc Builder -->
				<div class="skeuo-paper-sheet p-5 bg-[var(--theme-surface)] space-y-4">
					<div class="flex items-center justify-between border-b border-[var(--theme-border)] pb-2.5">
						<div>
							<h2 class="font-serif text-sm font-bold text-[var(--theme-accent)] flex items-center gap-2">
								<span>🎭</span>
								<span>Character Psychology & Arc Interrogator</span>
							</h2>
							<p class="font-serif text-xs text-[var(--theme-text-muted)] mt-0.5">
								Every arc is powered by: Lie → Ghost/Wound → Want vs Need → Red Line.
							</p>
						</div>
						<button
							type="button"
							class="skeuo-btn px-2.5 py-1 text-xs font-serif font-bold text-amber-700 dark:text-amber-300"
							onclick={handleAddNewDossier}
						>
							+ New Character
						</button>
					</div>

					<!-- Character Selector Tabs -->
					<div class="flex flex-wrap gap-1 border-b border-[var(--theme-border)] pb-2">
						{#each dossiers as d}
							<button
								type="button"
								class="px-3 py-1 rounded text-xs font-serif font-bold border transition-all {selectedDossier?.id === d.id
									? 'bg-[var(--theme-accent)] text-stone-950 border-amber-600'
									: 'bg-[var(--theme-surface-subtle)] text-[var(--theme-text-muted)] border-[var(--theme-border)]'}"
								onclick={() => (selectedDossier = d)}
							>
								{d.name} ({d.role})
							</button>
						{/each}
					</div>

					{#if selectedDossier}
						<div class="space-y-3 text-xs">
							<div class="grid gap-3 sm:grid-cols-2">
								<div>
									<label for="char-name" class="font-serif font-bold text-[var(--theme-text-muted)] block">Character Name</label>
									<input id="char-name" bind:value={selectedDossier.name} class="skeuo-groove w-full p-2 text-xs rounded mt-1" />
								</div>
								<div>
									<label for="char-role" class="font-serif font-bold text-[var(--theme-text-muted)] block">Story Role</label>
									<select id="char-role" bind:value={selectedDossier.role} class="skeuo-groove w-full p-2 text-xs rounded mt-1 bg-[var(--theme-surface)]">
										<option value="Protagonist">Protagonist</option>
										<option value="Antagonist">Antagonist</option>
										<option value="Deuteragonist">Deuteragonist</option>
										<option value="Mentor">Mentor</option>
										<option value="Rival">Rival</option>
										<option value="Other">Other</option>
									</select>
								</div>
							</div>

							<!-- The Lie & Ghost -->
							<div>
								<label for="char-lie" class="font-serif font-bold text-[var(--theme-text-muted)] block">1. The Lie They Believe</label>
								<textarea id="char-lie" bind:value={selectedDossier.lie} rows="2" class="skeuo-groove w-full p-2 text-xs rounded mt-1" placeholder="The flawed worldview driving their defensiveness..."></textarea>
							</div>

							<div>
								<label for="char-wound" class="font-serif font-bold text-[var(--theme-text-muted)] block">2. The Backstory Wound (The Ghost)</label>
								<textarea id="char-wound" bind:value={selectedDossier.wound} rows="2" class="skeuo-groove w-full p-2 text-xs rounded mt-1" placeholder="The historical event that birthed the Lie..."></textarea>
							</div>

							<!-- Want vs Need -->
							<div class="grid gap-3 sm:grid-cols-2">
								<div>
									<label for="char-want" class="font-serif font-bold text-amber-700 dark:text-amber-300 block">3. External WANT</label>
									<textarea id="char-want" bind:value={selectedDossier.want} rows="2" class="skeuo-groove w-full p-2 text-xs rounded mt-1" placeholder="The physical trophy/goal..."></textarea>
								</div>
								<div>
									<label for="char-need" class="font-serif font-bold text-emerald-700 dark:text-emerald-300 block">4. Internal NEED</label>
									<textarea id="char-need" bind:value={selectedDossier.need} rows="2" class="skeuo-groove w-full p-2 text-xs rounded mt-1" placeholder="The spiritual truth they must embrace..."></textarea>
								</div>
							</div>

							<!-- Moral Red Line -->
							<div>
								<label for="char-limit" class="font-serif font-bold text-rose-700 dark:text-rose-300 block">5. The Moral Red Line (Will be tested at Act 3)</label>
								<input id="char-limit" bind:value={selectedDossier.moralLimit} class="skeuo-groove w-full p-2 text-xs rounded mt-1" placeholder="The line they swear never to cross..." />
							</div>

							<button
								type="button"
								class="skeuo-btn-primary w-full py-2 text-xs font-serif font-bold"
								onclick={() => {
									saveCharacterDossiers(dossiers);
									toasts.success(`Saved "${selectedDossier?.name}" character dossier!`, '💾');
								}}
							>
								💾 Save Character Dossier
							</button>
						</div>
					{/if}
				</div>
			{:else if activeDesk === 'pacing'}
				<!-- Pacing Diagnostics & Scene Goals -->
				<div class="skeuo-paper-sheet p-5 bg-[var(--theme-surface)] space-y-4">
					<div class="border-b border-[var(--theme-border)] pb-2.5">
						<h2 class="font-serif text-sm font-bold text-[var(--theme-accent)] flex items-center gap-2">
							<span>⏱️</span>
							<span>Developmental Pacing & Scene Conflict Diagnostic</span>
						</h2>
						<p class="font-serif text-xs text-[var(--theme-text-muted)] mt-0.5">
							Test whether this scene carries real dramatic tension or suffers from exposition drag.
						</p>
					</div>

					<div class="space-y-3 text-xs">
						<div>
							<label for="scene-goal" class="font-serif font-bold text-[var(--theme-text-muted)] block">1. Immediate Scene Goal (What does the character enter wanting?)</label>
							<input id="scene-goal" bind:value={sceneGoal} class="skeuo-groove w-full p-2 text-xs rounded mt-1" placeholder="e.g. Steal the cipher key from the commander's desk" />
						</div>

						<div>
							<label for="scene-obstacle" class="font-serif font-bold text-[var(--theme-text-muted)] block">2. Antagonistic Opposition (What actively prevents them?)</label>
							<input id="scene-obstacle" bind:value={sceneObstacle} class="skeuo-groove w-full p-2 text-xs rounded mt-1" placeholder="e.g. The commander unexpectedly returns with a patrol" />
						</div>

						<div>
							<label for="scene-text" class="font-serif font-bold text-[var(--theme-text-muted)] block">3. Paste Scene Draft (Optional for word-count & density analysis)</label>
							<textarea id="scene-text" bind:value={sampleSceneText} rows="4" class="skeuo-groove w-full p-2 text-xs rounded mt-1" placeholder="Paste scene draft text here..."></textarea>
						</div>

						<!-- Diagnostic Result Card -->
						<div class="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-3 space-y-2">
							<div class="flex items-center justify-between">
								<span class="font-bold text-[var(--theme-text)]">Pacing Assessment</span>
								<span class="rounded bg-amber-600/20 text-amber-800 dark:text-amber-300 px-2 py-0.5 font-bold font-mono text-[10px]">
									Tension Score: {pacingReport.tensionScore}/10
								</span>
							</div>
							<div class="text-[11px] font-bold text-[var(--theme-accent)]">Outcome: {pacingReport.outcome} ({pacingReport.pacingVerdict})</div>
							<p class="text-[11px] text-[var(--theme-text-muted)]">{pacingReport.recommendation}</p>
						</div>

						<!-- Scene Checklist -->
						<div class="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 text-xs space-y-1.5">
							<div class="font-bold text-[var(--theme-text)]">Scene Vitality Checklist:</div>
							{#each DEVELOPMENTAL_SCENE_CHECKLIST as item}
								<div class="flex items-start gap-2 text-[11px] text-[var(--theme-text-muted)]">
									<span class="text-emerald-600 font-bold">✓</span>
									<span>{item}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{:else if activeDesk === 'prose'}
				<!-- Prose Doctor & Anti-Slop Suite -->
				<div class="skeuo-paper-sheet p-5 bg-[var(--theme-surface)] space-y-4">
					<div class="border-b border-[var(--theme-border)] pb-2.5">
						<h2 class="font-serif text-sm font-bold text-[var(--theme-accent)] flex items-center gap-2">
							<span>🩺</span>
							<span>Prose Doctor: Anti-Slop & Rhythm Diagnostics</span>
						</h2>
						<p class="font-serif text-xs text-[var(--theme-text-muted)] mt-0.5">
							Automated enforcement of the 10 Iron Anti-Slop Rules and sentence cadence variety.
						</p>
					</div>

					<textarea
						bind:value={proseText}
						rows="6"
						class="skeuo-groove w-full p-3 text-xs font-serif leading-relaxed"
						placeholder="Paste prose sample to diagnose filter verbs, rhythm monotony, purple triads, and AI clichés..."
					></textarea>

					<!-- Diagnostics Results Grid -->
					<div class="grid gap-3 sm:grid-cols-3 text-xs">
						<div class="p-2.5 rounded border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] space-y-1">
							<div class="font-bold text-[var(--theme-text)]">Anti-Slop Linter</div>
							<div class="text-sm font-bold {slopViolations.length === 0 ? 'text-emerald-600' : 'text-rose-600'}">
								{slopViolations.length === 0 ? '✓ 0 Violations' : `🚨 ${slopViolations.length} Violations`}
							</div>
						</div>

						<div class="p-2.5 rounded border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] space-y-1">
							<div class="font-bold text-[var(--theme-text)]">Rhythm Variance</div>
							<div class="text-sm font-bold {proseRhythm.uniformStretches.length > 0 ? 'text-amber-600' : 'text-emerald-600'}">
								{proseRhythm.uniformStretches.length > 0 ? '⚠️ Monotonous' : '✓ Dynamic Cadence'}
							</div>
						</div>

						<div class="p-2.5 rounded border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] space-y-1">
							<div class="font-bold text-[var(--theme-text)]">Contraction Rate</div>
							<div class="text-sm font-bold text-[var(--theme-accent)] font-mono">
								{contractionRate.rate}% Natural
							</div>
						</div>
					</div>

					{#if slopViolations.length > 0}
						<div class="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
							{#each slopViolations as v}
								<div class="p-2 rounded border border-rose-600/30 bg-rose-500/10 text-xs space-y-0.5">
									<div class="font-bold text-rose-700 dark:text-rose-300">{v.ruleName}</div>
									<div class="text-[11px] text-[var(--theme-text)]">"{v.snippet}"</div>
									<div class="text-[10px] text-[var(--theme-text-muted)] italic">Fix: {v.fix}</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<!-- Canon Agreement & Decisions Vault -->
				<div class="skeuo-paper-sheet p-5 bg-[var(--theme-surface)] space-y-4">
					<div class="flex items-center justify-between border-b border-[var(--theme-border)] pb-2.5">
						<div>
							<h2 class="font-serif text-sm font-bold text-[var(--theme-accent)] flex items-center gap-2">
								<span>🏛️</span>
								<span>Canon Agreement & Decisions Vault</span>
							</h2>
							<p class="font-serif text-xs text-[var(--theme-text-muted)] mt-0.5">
								Immutable record of all story agreements anchored directly into <code class="font-bold">decisions.md</code>.
							</p>
						</div>
						<span class="rounded bg-black/15 px-2 py-0.5 font-mono text-xs font-bold">
							{decisions.length} Locked
						</span>
					</div>

					<div class="max-h-[480px] overflow-y-auto space-y-2 pr-1">
						{#each decisions as d}
							<div class="p-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-xs space-y-1.5">
								<div class="flex items-center justify-between">
									<span class="font-bold text-[var(--theme-accent)]">{d.topic}</span>
									<span class="font-mono text-[10px] text-[var(--theme-text-muted)]">{d.date} · {d.id}</span>
								</div>
								<p class="text-[11px] text-[var(--theme-text)] leading-relaxed">{d.decision}</p>
								<div class="flex items-center justify-between text-[10px] text-[var(--theme-text-muted)] pt-1 border-t border-[var(--theme-border)]/50">
									<span>Affects: <code class="font-mono">{d.affects}</code></span>
									<span class="rounded bg-emerald-600/20 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.2">🔒 Locked</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Right Discussion & Partner Dialogue Dock (5 cols) -->
		<aside class="space-y-4 lg:col-span-5">
			<div class="skeuo-paper-sheet p-4 bg-[var(--theme-surface)] flex flex-col h-[680px]">
				<div class="flex items-center justify-between border-b border-[var(--theme-border)] pb-2 mb-3">
					<div class="flex items-center gap-2">
						<span class="text-base">💬</span>
						<h3 class="font-serif text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
							Editorial Partner Stream
						</h3>
					</div>
					<button
						type="button"
						class="text-[10px] font-serif text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
						onclick={() => {
							messages = [];
							savePartnerMessages([]);
							toasts.info('Cleared discussion stream.');
						}}
					>
						Clear Stream
					</button>
				</div>

				<!-- Message Stream Scrollbox -->
				<div class="flex-1 overflow-y-auto space-y-3 pr-1">
					{#if messages.length === 0}
						<div class="p-4 text-center text-xs font-serif text-[var(--theme-text-muted)] space-y-2 mt-12">
							<span class="text-3xl block">🛋️</span>
							<p>Your Editorial Partner is ready.</p>
							<p class="text-[11px] opacity-80">
								Ask a question, test a plot twist, or interrogate a character motivation to begin.
							</p>
						</div>
					{/if}

					{#each messages as msg}
						<div class="flex flex-col {msg.role === 'user' ? 'items-end' : 'items-start'}">
							<div
								class="max-w-[90%] rounded-lg p-3 text-xs leading-relaxed {msg.role === 'user'
									? 'bg-[var(--theme-accent)] text-stone-950 font-serif font-medium shadow-sm'
									: 'bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)] text-[var(--theme-text)] font-serif'}"
							>
								<div class="flex items-center justify-between gap-2 mb-1 text-[10px] opacity-75">
									<span class="font-bold">{msg.role === 'user' ? 'Author' : 'Editorial Partner'}</span>
									<span class="font-mono">{msg.timestamp}</span>
								</div>
								<p class="whitespace-pre-wrap">{msg.content}</p>

								{#if msg.suggestedDecision}
									<div class="mt-2.5 pt-2 border-t border-black/15 dark:border-white/15 space-y-1.5">
										<div class="font-bold text-[10px] text-amber-800 dark:text-amber-300">
											📌 Proposed Canon Agreement:
										</div>
										<div class="text-[10px] bg-black/10 dark:bg-white/10 p-1.5 rounded">
											{msg.suggestedDecision.decision}
										</div>
										<button
											type="button"
											class="skeuo-btn-primary w-full py-1 text-[10px] font-serif font-bold shadow-sm"
											onclick={() => handleLockSuggestedDecision(msg.suggestedDecision!)}
										>
											🔒 Lock into decisions.md
										</button>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>

				<!-- Message Input Bar -->
				<div class="pt-3 border-t border-[var(--theme-border)] mt-2">
					<form
						onsubmit={(e) => {
							e.preventDefault();
							handleSendMessage();
						}}
						class="flex items-center gap-2"
					>
						<input
							type="text"
							bind:value={inputMessage}
							placeholder="Consult partner on {activeDesk}..."
							class="skeuo-groove flex-1 p-2 text-xs rounded bg-[var(--theme-surface)] text-[var(--theme-text)]"
						/>
						<button
							type="submit"
							class="skeuo-btn-primary px-4 py-2 text-xs font-serif font-bold shrink-0"
						>
							Send ↵
						</button>
					</form>
				</div>
			</div>
		</aside>
	</div>
</div>
