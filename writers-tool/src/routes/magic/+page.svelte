<script lang="ts">
	import { onMount } from 'svelte';
	import {
		auditMagicLoopholes,
		buildRecipeFromBlocks,
		commitMagicBlueprintToCanon,
		computeTriangleOfPower,
		convertVaelrionRecipeToBlueprint,
		generateRandomSpark,
		generateRandomVaelrionCombo,
		MAGIC_ARCHETYPES,
		SANDERSON_LAWS_GUIDE,
		VAELRION_BUILDING_BLOCKS,
		VAELRION_RECIPES,
		VAELRION_RESEARCH_NOTES,
		type LoopholeAuditReport,
		type MagicArchetype,
		type MagicBlueprint,
		type TriangleOfPowerScore,
		type VaelrionBuildingBlock,
		type VaelrionRecipe
	} from '$lib/magic';
	import { loadBible, loadDecisions, saveBible, saveDecisions, type Decision, type WorldEntry } from '$lib/world';
	import { toasts } from '$lib/toasts';

	let bible: WorldEntry[] = $state([]);
	let decisions: Decision[] = $state([]);
	let showGuide = $state(false);
	let activeTab = $state<'combo-lab' | 'curated' | 'archetypes'>('combo-lab');

	// Curated Vaelrion Catalog State
	let searchQuery = $state('');
	let selectedCategoryFilter = $state('All');
	let activeVaelrionRecipe = $state<VaelrionRecipe>(VAELRION_RECIPES[0]);

	// Curated Archetype State
	let activeArchetype = $state<MagicArchetype>(MAGIC_ARCHETYPES[0]);

	// Modular Building Block Selections
	const sources = VAELRION_BUILDING_BLOCKS.filter((b) => b.category === 'Source / Fuel');
	const resonances = VAELRION_BUILDING_BLOCKS.filter((b) => b.category === 'Resonance / Modifier');
	const triggers = VAELRION_BUILDING_BLOCKS.filter((b) => b.category === 'Trigger');
	const effects = VAELRION_BUILDING_BLOCKS.filter((b) => b.category === 'Effect Family');
	const costs = VAELRION_BUILDING_BLOCKS.filter((b) => b.category === 'Cost');
	const limitations = VAELRION_BUILDING_BLOCKS.filter((b) => b.category === 'Limitation');

	let selectedSource = $state<VaelrionBuildingBlock>(sources[0]);
	let selectedResonance = $state<VaelrionBuildingBlock>(resonances[0]);
	let selectedTrigger = $state<VaelrionBuildingBlock>(triggers[0]);
	let selectedEffect = $state<VaelrionBuildingBlock>(effects[0]);
	let selectedCost = $state<VaelrionBuildingBlock>(costs[0]);
	let selectedLimitation = $state<VaelrionBuildingBlock>(limitations[0]);

	// Active Workbench Blueprint State
	let blueprint = $state<MagicBlueprint>({
		id: 'magic-initial',
		name: 'Leyline + Geometry',
		summary: 'Ambient magical field / leyline flow channeled through geometric structures.',
		hardness: 4,
		source: VAELRION_RECIPES[0].sourceFuel,
		vector: `Trigger: ${VAELRION_RECIPES[0].trigger} | Control: ${VAELRION_RECIPES[0].intentControl}`,
		cost: VAELRION_RECIPES[0].costConsequence,
		limitations: VAELRION_RECIPES[0].coreLimitation,
		fallout: `World: ${VAELRION_RECIPES[0].worldIntegration}\n\nProgression: ${VAELRION_RECIPES[0].progressionPath}`,
		failureMode: VAELRION_RECIPES[0].failureMode,
		progressionPath: VAELRION_RECIPES[0].progressionPath,
		bestStoryUse: VAELRION_RECIPES[0].bestStoryUse,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	});

	// Reactive Evaluations
	let auditReport = $derived(auditMagicLoopholes(blueprint));
	let triangleScore = $derived(computeTriangleOfPower(blueprint));

	// Filtered Vaelrion Recipes
	let filteredVaelrionRecipes = $derived(
		VAELRION_RECIPES.filter((rec) => {
			const matchesSearch =
				searchQuery === '' ||
				rec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				rec.sourceFuel.toLowerCase().includes(searchQuery.toLowerCase()) ||
				rec.effectFamily.toLowerCase().includes(searchQuery.toLowerCase()) ||
				rec.bestStoryUse.toLowerCase().includes(searchQuery.toLowerCase());

			if (selectedCategoryFilter === 'All') return matchesSearch;
			return matchesSearch && (
				rec.sourceFuel.toLowerCase().includes(selectedCategoryFilter.toLowerCase()) ||
				rec.effectFamily.toLowerCase().includes(selectedCategoryFilter.toLowerCase())
			);
		})
	);

	onMount(() => {
		bible = loadBible();
		decisions = loadDecisions();
	});

	function handleRollComboLab() {
		const newBp = generateRandomVaelrionCombo();
		blueprint = newBp;

		// Sync the dropdown selectors to match the rolled combo if possible
		const matchedSource = sources.find((s) => newBp.source.startsWith(s.name));
		if (matchedSource) selectedSource = matchedSource;

		toasts.success(`Synthesized Combo: ${newBp.name}!`, '⚗️');
	}

	function handleApplyCustomComboBlocks() {
		const newBp = buildRecipeFromBlocks(
			selectedSource,
			selectedResonance,
			selectedTrigger,
			selectedEffect,
			selectedCost,
			selectedLimitation
		);
		blueprint = newBp;
		toasts.success(`Applied 6-Pillar Recipe "${newBp.name}" into Workbench!`, '✨');
	}

	function handleRollSparkDice() {
		const spark = generateRandomSpark();
		blueprint = spark;
		toasts.success(`Rolled Spark: ${spark.name}!`, '🎲');
	}

	function loadCuratedVaelrion(recipe: VaelrionRecipe) {
		activeVaelrionRecipe = recipe;
		blueprint = convertVaelrionRecipeToBlueprint(recipe);
		toasts.success(`Loaded "${recipe.name}" recipe into workbench!`, '📥');
	}

	function loadArchetypeTemplate(arch: MagicArchetype) {
		activeArchetype = arch;
		blueprint = {
			...blueprint,
			name: arch.name,
			summary: arch.tagline,
			hardness: arch.hardness,
			source: arch.source,
			vector: arch.vector,
			cost: arch.cost,
			limitations: arch.limitations,
			fallout: arch.fallout,
			archetypeId: arch.id,
			failureMode: 'Severe physiological and environmental strain on caster.',
			progressionPath: 'Deepening attunement and minimizing backlash.',
			bestStoryUse: arch.tagline,
			updatedAt: new Date().toISOString()
		};
		toasts.success(`Loaded "${arch.name}" template into workbench!`, '📥');
	}

	function handleCommitToCanon() {
		if (!blueprint.name.trim() || !blueprint.limitations.trim()) {
			toasts.warning('Please specify a System Name and Iron Limitations.');
			return;
		}

		const result = commitMagicBlueprintToCanon(blueprint, bible, decisions);
		bible = result.updatedBible;
		decisions = result.updatedDecisions;
		saveBible(bible);
		saveDecisions(decisions);

		toasts.success(`Committed "${blueprint.name}" into World Bible & Decisions!`, '🛡️');
	}
</script>

<svelte:head>
	<title>Magic System Studio & Vaelrion Combo Lab — Story OS</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header / Bureau Toolbar -->
	<header class="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--theme-border)] pb-4">
		<div>
			<div class="flex items-center gap-3">
				<span class="h-9 w-9 rounded-lg bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 text-stone-950 font-black shadow-[0_2px_8px_rgba(0,0,0,0.25)] flex items-center justify-center text-base">
					⚡
				</span>
				<div>
					<h1 class="letterpress-title text-2xl sm:text-3xl font-serif font-bold text-[var(--theme-text)]">
						Magic System Studio
					</h1>
					<p class="font-serif text-xs text-[var(--theme-text-muted)] flex items-center gap-2 mt-0.5">
						<span>Vaelrion Combinatorial Lab</span>
						<span>·</span>
						<span>Sanderson's Laws</span>
						<span>·</span>
						<span>Triangle of Power</span>
					</p>
				</div>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="flex flex-wrap items-center gap-2">
			<button
				type="button"
				class="skeuo-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif font-semibold"
				onclick={() => (showGuide = !showGuide)}
			>
				<span>📜</span>
				<span>{showGuide ? 'Hide Craft Notes' : 'Sanderson & Craft Notes'}</span>
			</button>

			<button
				type="button"
				class="skeuo-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif font-semibold text-amber-700 dark:text-amber-300"
				onclick={handleRollComboLab}
				title="Intelligently roll a new 6-part recipe from Vaelrion building blocks"
			>
				<span>⚗️</span>
				<span>Roll Vaelrion Combo</span>
			</button>

			<button
				type="button"
				class="skeuo-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-serif font-semibold"
				onclick={handleRollSparkDice}
				title="Roll quick prompt dice"
			>
				<span>🎲</span>
				<span>Spark Dice</span>
			</button>

			<button
				type="button"
				class="skeuo-btn-primary flex items-center gap-1.5 px-4 py-1.5 text-xs font-serif font-bold"
				onclick={handleCommitToCanon}
				title="Commit this magic system directly to World Bible & decisions.md"
			>
				<span>🛡️</span>
				<span>Lock into Canon Bible</span>
			</button>
		</div>
	</header>

	<!-- Expandable Craft & Sanderson Research Drawer -->
	{#if showGuide}
		<section class="skeuo-paper-sheet p-5 space-y-4 transition-all animate-in fade-in" aria-label="Sanderson's Laws & Vaelrion Craft Notes">
			<div class="flex items-center justify-between border-b border-[var(--theme-border)] pb-2.5">
				<div class="flex items-center gap-2">
					<span class="font-serif text-sm font-bold text-[var(--theme-accent)]">
						🏛️ Craft Principles: Sanderson Laws & Triangle of Power
					</span>
				</div>
				<button
					type="button"
					class="text-xs font-serif font-semibold text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
					onclick={() => (showGuide = false)}
				>
					✕ Close
				</button>
			</div>

			<!-- Sanderson 4 Laws -->
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{#each SANDERSON_LAWS_GUIDE as law}
					<div class="skeuo-box-sm p-3 bg-[var(--theme-surface-subtle)] space-y-1">
						<span class="rounded bg-[var(--theme-accent)]/15 px-2 py-0.5 font-serif text-[10px] font-bold text-[var(--theme-accent)]">
							{law.number}
						</span>
						<h3 class="font-serif text-xs font-bold text-[var(--theme-text)]">{law.title}</h3>
						<p class="text-[11px] font-serif italic text-[var(--theme-text-muted)]">"{law.maxim}"</p>
						<p class="text-[11px] font-sans leading-relaxed text-[var(--theme-text)]">{law.principle}</p>
					</div>
				{/each}
			</div>

			<!-- Vaelrion Research Foundation -->
			<div class="border-t border-[var(--theme-border)] pt-3">
				<div class="font-serif text-xs font-bold text-[var(--theme-accent)] uppercase tracking-wider mb-2">
					Workbook Research References
				</div>
				<div class="grid gap-2 sm:grid-cols-3">
					{#each VAELRION_RESEARCH_NOTES as note}
						<div class="p-2.5 rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] text-xs space-y-1">
							<div class="font-bold text-[var(--theme-text)] truncate">{note.source}</div>
							<p class="text-[11px] text-[var(--theme-text-muted)] line-clamp-2">{note.principle}</p>
							<p class="text-[10px] italic text-[var(--theme-accent)] line-clamp-2">{note.application}</p>
							{#if note.url}
								<a
									href={note.url}
									target="_blank"
									rel="noreferrer"
									class="text-[10px] text-amber-600 hover:underline block truncate mt-1"
								>
									🔗 Link: {note.url}
								</a>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- Navigation Tabs: Combo Lab vs Curated Systems vs Classic Archetypes -->
	<nav class="flex items-center gap-1 border-b border-[var(--theme-border)] pb-1 text-xs font-serif font-bold">
		<button
			type="button"
			class="px-4 py-2 rounded-t-lg transition-all border-b-2 {activeTab === 'combo-lab'
				? 'border-[var(--theme-accent)] bg-[var(--theme-surface)] text-[var(--theme-accent)] shadow-[inset_0_1px_0_var(--theme-bevel-top)]'
				: 'border-transparent text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface-subtle)]'}"
			onclick={() => (activeTab = 'combo-lab')}
		>
			<span class="flex items-center gap-1.5">
				<span>⚗️</span>
				<span>Modular Combo Lab</span>
				<span class="rounded bg-black/15 px-1.5 py-0.2 text-[10px] font-mono">6 Pillars</span>
			</span>
		</button>

		<button
			type="button"
			class="px-4 py-2 rounded-t-lg transition-all border-b-2 {activeTab === 'curated'
				? 'border-[var(--theme-accent)] bg-[var(--theme-surface)] text-[var(--theme-accent)] shadow-[inset_0_1px_0_var(--theme-bevel-top)]'
				: 'border-transparent text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface-subtle)]'}"
			onclick={() => (activeTab = 'curated')}
		>
			<span class="flex items-center gap-1.5">
				<span>📖</span>
				<span>30 Curated Vaelrion Recipes</span>
				<span class="rounded bg-black/15 px-1.5 py-0.2 text-[10px] font-mono">30</span>
			</span>
		</button>

		<button
			type="button"
			class="px-4 py-2 rounded-t-lg transition-all border-b-2 {activeTab === 'archetypes'
				? 'border-[var(--theme-accent)] bg-[var(--theme-surface)] text-[var(--theme-accent)] shadow-[inset_0_1px_0_var(--theme-bevel-top)]'
				: 'border-transparent text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface-subtle)]'}"
			onclick={() => (activeTab = 'archetypes')}
		>
			<span class="flex items-center gap-1.5">
				<span>🏛️</span>
				<span>12 Sanderson Archetypes</span>
			</span>
		</button>
	</nav>

	<!-- Main Multi-Panel Lab Layout -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
		<!-- Left Catalog Panel (4 cols) -->
		<aside class="space-y-4 lg:col-span-4">
			{#if activeTab === 'combo-lab'}
				<!-- Modular 6-Pillar Slot Machine / Recipe Builder -->
				<div class="skeuo-paper-sheet p-4 bg-[var(--theme-surface)] space-y-4">
					<div class="flex items-center justify-between border-b border-[var(--theme-border)] pb-2">
						<div class="flex items-center gap-2">
							<span class="text-sm">🧪</span>
							<h2 class="font-serif text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
								Mix & Match Building Blocks
							</h2>
						</div>
						<button
							type="button"
							class="text-[11px] font-serif font-bold text-amber-700 dark:text-amber-300 hover:underline"
							onclick={handleRollComboLab}
						>
							🎲 Randomize All
						</button>
					</div>

					<p class="text-[11px] font-serif text-[var(--theme-text-muted)] leading-relaxed">
						Recombine fundamental elements to create unique systems without falling into cliché patterns.
					</p>

					<!-- Pillar Selectors -->
					<div class="space-y-3 text-xs">
						<!-- 1. Source / Fuel -->
						<div class="space-y-1">
							<label for="block-source" class="font-serif font-bold flex items-center justify-between text-[var(--theme-text)]">
								<span>1. Source / Fuel ({sources.length})</span>
								<span class="text-[10px] text-amber-600 font-normal truncate max-w-[120px]">{selectedSource.name}</span>
							</label>
							<select
								id="block-source"
								class="skeuo-groove w-full p-2 text-xs rounded bg-[var(--theme-surface)] text-[var(--theme-text)]"
								bind:value={selectedSource}
							>
								{#each sources as s}
									<option value={s}>{s.name}</option>
								{/each}
							</select>
							<div class="rounded bg-black/5 dark:bg-white/5 p-2 text-[10px] text-[var(--theme-text-muted)]">
								<span class="font-semibold text-[var(--theme-text)]">Meaning:</span> {selectedSource.meaning}
								<br />
								<span class="font-semibold text-emerald-700 dark:text-emerald-400">Pros:</span> {selectedSource.strengths}
							</div>
						</div>

						<!-- 2. Resonance / Modifier -->
						<div class="space-y-1">
							<label for="block-resonance" class="font-serif font-bold flex items-center justify-between text-[var(--theme-text)]">
								<span>2. Resonance / Modifier ({resonances.length})</span>
								<span class="text-[10px] text-amber-600 font-normal">{selectedResonance.name}</span>
							</label>
							<select
								id="block-resonance"
								class="skeuo-groove w-full p-2 text-xs rounded bg-[var(--theme-surface)] text-[var(--theme-text)]"
								bind:value={selectedResonance}
							>
								{#each resonances as r}
									<option value={r}>{r.name}</option>
								{/each}
							</select>
						</div>

						<!-- 3. Trigger -->
						<div class="space-y-1">
							<label for="block-trigger" class="font-serif font-bold flex items-center justify-between text-[var(--theme-text)]">
								<span>3. Trigger ({triggers.length})</span>
								<span class="text-[10px] text-amber-600 font-normal">{selectedTrigger.name}</span>
							</label>
							<select
								id="block-trigger"
								class="skeuo-groove w-full p-2 text-xs rounded bg-[var(--theme-surface)] text-[var(--theme-text)]"
								bind:value={selectedTrigger}
							>
								{#each triggers as t}
									<option value={t}>{t.name}</option>
								{/each}
							</select>
						</div>

						<!-- 4. Effect Family -->
						<div class="space-y-1">
							<label for="block-effect" class="font-serif font-bold flex items-center justify-between text-[var(--theme-text)]">
								<span>4. Effect Family ({effects.length})</span>
								<span class="text-[10px] text-amber-600 font-normal">{selectedEffect.name}</span>
							</label>
							<select
								id="block-effect"
								class="skeuo-groove w-full p-2 text-xs rounded bg-[var(--theme-surface)] text-[var(--theme-text)]"
								bind:value={selectedEffect}
							>
								{#each effects as e}
									<option value={e}>{e.name}</option>
								{/each}
							</select>
						</div>

						<!-- 5. Cost / Consequence -->
						<div class="space-y-1">
							<label for="block-cost" class="font-serif font-bold flex items-center justify-between text-[var(--theme-text)]">
								<span>5. Cost / Toll ({costs.length})</span>
								<span class="text-[10px] text-rose-600 font-normal">{selectedCost.name}</span>
							</label>
							<select
								id="block-cost"
								class="skeuo-groove w-full p-2 text-xs rounded bg-[var(--theme-surface)] text-[var(--theme-text)]"
								bind:value={selectedCost}
							>
								{#each costs as c}
									<option value={c}>{c.name}</option>
								{/each}
							</select>
						</div>

						<!-- 6. Core Limitation -->
						<div class="space-y-1">
							<label for="block-limitation" class="font-serif font-bold flex items-center justify-between text-[var(--theme-text)]">
								<span>6. Core Limitation ({limitations.length})</span>
								<span class="text-[10px] text-amber-600 font-normal">{selectedLimitation.name}</span>
							</label>
							<select
								id="block-limitation"
								class="skeuo-groove w-full p-2 text-xs rounded bg-[var(--theme-surface)] text-[var(--theme-text)]"
								bind:value={selectedLimitation}
							>
								{#each limitations as l}
									<option value={l}>{l.name}</option>
								{/each}
							</select>
						</div>
					</div>

					<button
						type="button"
						class="skeuo-btn-primary w-full py-2 text-xs font-serif font-bold shadow-md"
						onclick={handleApplyCustomComboBlocks}
					>
						✨ Assemble Recipe into Workbench
					</button>
				</div>
			{:else if activeTab === 'curated'}
				<!-- 30 Curated Vaelrion Recipes Gallery -->
				<div class="skeuo-paper-sheet p-4 bg-[var(--theme-surface)] space-y-3">
					<div class="flex items-center justify-between border-b border-[var(--theme-border)] pb-2">
						<h2 class="font-serif text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
							30 Curated Vaelrion Systems
						</h2>
						<span class="font-mono text-[10px] text-[var(--theme-accent)]">
							{filteredVaelrionRecipes.length} shown
						</span>
					</div>

					<!-- Search & Filter Bar -->
					<div class="space-y-2">
						<input
							type="search"
							placeholder="Search by name, fuel, or effect..."
							bind:value={searchQuery}
							class="skeuo-groove w-full p-2 text-xs rounded bg-[var(--theme-surface)]"
						/>
						<div class="flex flex-wrap gap-1">
							{#each ['All', 'Ambient', 'Blood', 'Sound', 'Time', 'Gravity', 'Memory'] as cat}
								<button
									type="button"
									class="px-2 py-0.5 rounded text-[10px] font-serif border {selectedCategoryFilter === cat
										? 'bg-[var(--theme-accent)] text-stone-950 font-bold border-amber-600'
										: 'bg-[var(--theme-surface-subtle)] text-[var(--theme-text-muted)] border-[var(--theme-border)]'}"
									onclick={() => (selectedCategoryFilter = cat)}
								>
									{cat}
								</button>
							{/each}
						</div>
					</div>

					<!-- Recipe List Scrollbox -->
					<div class="max-h-[500px] overflow-y-auto space-y-2 pr-1">
						{#each filteredVaelrionRecipes as rec (rec.id)}
							<div
								class="p-2.5 rounded-lg border transition-all {activeVaelrionRecipe.id === rec.id
									? 'border-[var(--theme-accent)] bg-[var(--theme-surface-subtle)] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
									: 'border-[var(--theme-border)] bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-subtle)]'}"
							>
								<div class="flex items-start justify-between gap-2">
									<div>
										<div class="font-serif font-bold text-xs text-[var(--theme-text)]">
											{rec.id}. {rec.name}
										</div>
										<div class="text-[10px] text-[var(--theme-text-muted)] line-clamp-1 mt-0.5">
											{rec.sourceFuel}
										</div>
									</div>
									<button
										type="button"
										class="skeuo-btn px-2 py-0.5 text-[10px] font-serif font-bold shrink-0 text-[var(--theme-accent)]"
										onclick={() => loadCuratedVaelrion(rec)}
									>
										Load 📥
									</button>
								</div>

								<div class="mt-2 text-[10px] space-y-1">
									<div class="line-clamp-1">
										<span class="font-semibold text-rose-600 dark:text-rose-400">Cost:</span> {rec.costConsequence}
									</div>
									<div class="line-clamp-1">
										<span class="font-semibold text-amber-700 dark:text-amber-300">Failure:</span> {rec.failureMode}
									</div>
									<div class="line-clamp-1 text-[var(--theme-text-muted)]">
										<span class="font-semibold">Story:</span> {rec.bestStoryUse}
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<!-- 12 Classic Sanderson Archetypes -->
				<div class="skeuo-paper-sheet p-4 bg-[var(--theme-surface)] space-y-3">
					<div class="flex items-center justify-between border-b border-[var(--theme-border)] pb-2">
						<h2 class="font-serif text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
							12 Classic Archetypes
						</h2>
						<span class="font-sans text-[10px] text-[var(--theme-text-faint)]">Pick to load</span>
					</div>

					<div class="max-h-[520px] overflow-y-auto space-y-1.5 pr-1">
						{#each MAGIC_ARCHETYPES as arch (arch.id)}
							<button
								type="button"
								class="flex w-full cursor-pointer items-start gap-2.5 rounded-lg border p-2 text-left text-xs transition-all {activeArchetype.id ===
								arch.id
									? 'border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[var(--theme-accent)] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.06),inset_0_1px_0_var(--theme-bevel-top)]'
									: 'border-transparent bg-[var(--theme-surface-subtle)]/50 text-[var(--theme-text)] hover:border-[var(--theme-border)] hover:bg-[var(--theme-surface-subtle)]'}"
								onclick={() => (activeArchetype = arch)}
							>
								<span class="text-base shrink-0">{arch.icon}</span>
								<div class="min-w-0 flex-1">
									<div class="font-bold truncate">{arch.name}</div>
									<div class="text-[10px] opacity-80 line-clamp-1">{arch.tagline}</div>
								</div>
							</button>
						{/each}
					</div>

					{#if activeArchetype}
						<div class="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-3 space-y-2 text-xs">
							<div class="flex items-center justify-between">
								<span class="font-bold text-[var(--theme-accent)]">{activeArchetype.name}</span>
								<span class="rounded bg-black/20 px-1.5 py-0.2 font-mono text-[9px] uppercase">
									Hardness {activeArchetype.hardness}/5
								</span>
							</div>
							<p class="text-[11px] leading-relaxed text-[var(--theme-text)]">{activeArchetype.tagline}</p>
							<button
								type="button"
								class="skeuo-btn-primary w-full py-1 text-xs font-bold"
								onclick={() => loadArchetypeTemplate(activeArchetype)}
							>
								📥 Load as Template
							</button>
						</div>
					{/if}
				</div>
			{/if}
		</aside>

		<!-- Center: 5-Pillar Blueprint Workbench & Failure Modes (5 cols) -->
		<main class="space-y-4 lg:col-span-5">
			<div class="skeuo-paper-sheet p-6 bg-[var(--theme-surface)] space-y-4">
				<!-- System Name & Hardness Gauge -->
				<div class="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--theme-border)] pb-4">
					<div class="min-w-0 flex-1">
						<label for="magic-name" class="block font-serif text-xs font-bold text-[var(--theme-text-muted)]">
							System Designation *
						</label>
						<input
							id="magic-name"
							bind:value={blueprint.name}
							placeholder="e.g. Ashen Sympathy, Leyline Geometry"
							class="letterpress-title mt-1 w-full bg-transparent text-xl font-serif font-bold text-[var(--theme-text)] focus:outline-hidden"
						/>
					</div>

					<!-- Hard vs Soft Magic Slider Gauge -->
					<div class="text-right">
						<div class="flex items-center justify-end gap-2 font-serif text-xs font-bold text-[var(--theme-text)]">
							<span>Hardness:</span>
							<span class="h-5 w-5 rounded bg-amber-600/20 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center">
								{blueprint.hardness}
							</span>
							<span class="text-[11px] font-sans text-[var(--theme-text-muted)]">
								{blueprint.hardness >= 4 ? '(Hard Rules)' : blueprint.hardness <= 2 ? '(Soft Wonder)' : '(Balanced)'}
							</span>
						</div>
						<input
							type="range"
							min="1"
							max="5"
							bind:value={blueprint.hardness}
							class="mt-1 accent-[var(--theme-accent)] cursor-pointer"
						/>
					</div>
				</div>

				<!-- Pillar 1: Source / Fuel -->
				<div>
					<label for="pillar-source" class="block font-serif text-xs font-bold text-[var(--theme-text-muted)]">
						1. Power Source & Fuel (Where energy originates)
					</label>
					<textarea
						id="pillar-source"
						bind:value={blueprint.source}
						rows="2"
						placeholder="e.g. Ambient magical field, biological vitality, tectonic pressure..."
						class="skeuo-groove mt-1 w-full p-2.5 text-xs leading-relaxed"
					></textarea>
				</div>

				<!-- Pillar 2: Medium, Trigger & Vector -->
				<div>
					<label for="pillar-vector" class="block font-serif text-xs font-bold text-[var(--theme-text-muted)]">
						2. Trigger, Vector & Modulation (How power is invoked)
					</label>
					<textarea
						id="pillar-vector"
						bind:value={blueprint.vector}
						rows="2"
						placeholder="e.g. Runic circles, vocal cadence, physical contact, geometric alignment..."
						class="skeuo-groove mt-1 w-full p-2.5 text-xs leading-relaxed"
					></textarea>
				</div>

				<!-- Pillar 3: Physical Cost & Consequence -->
				<div>
					<label for="pillar-cost" class="block font-serif text-xs font-bold text-[var(--theme-text-muted)]">
						3. Physical Cost & Toll (The price paid every single casting)
					</label>
					<textarea
						id="pillar-cost"
						bind:value={blueprint.cost}
						rows="2"
						placeholder="e.g. Severe hypothermia, memory amnesia, capillary rupture, exhaustion..."
						class="skeuo-groove mt-1 w-full p-2.5 text-xs leading-relaxed"
					></textarea>
				</div>

				<!-- Pillar 4: Iron Limitations & Cannot Laws -->
				<div class="rounded-lg border border-amber-600/40 bg-amber-500/10 p-3.5 space-y-1">
					<div class="flex items-center justify-between">
						<label for="pillar-limitations" class="block font-serif text-xs font-bold text-amber-800 dark:text-amber-300">
							🛡️ 4. Iron "Cannot" Laws & Constraints (Manuscript Guardrails)
						</label>
						<span class="font-mono text-[10px] font-semibold text-amber-700 dark:text-amber-400">
							Enforces "cannot / never / only"
						</span>
					</div>
					<textarea
						id="pillar-limitations"
						bind:value={blueprint.limitations}
						rows="2"
						placeholder="e.g. Cannot create matter from nothing; cannot resurrect souls; only works in direct line of sight..."
						class="skeuo-groove w-full p-2.5 text-xs font-mono leading-relaxed"
					></textarea>
					<p class="text-[11px] font-serif text-[var(--theme-text-muted)] italic">
						Continuity engines parse these exact negative boundaries to prevent story-breaking plot holes.
					</p>
				</div>

				<!-- Vaelrion Extension: Failure Mode & Backfire Stakes -->
				<div class="rounded-lg border border-rose-600/30 bg-rose-500/5 p-3 space-y-1">
					<label for="pillar-failure" class="block font-serif text-xs font-bold text-rose-800 dark:text-rose-300">
						💥 5. Failure Mode & Backlash (What happens when magic goes wrong?)
					</label>
					<textarea
						id="pillar-failure"
						bind:value={blueprint.failureMode}
						rows="2"
						placeholder="e.g. Feedback burns distort the pattern and rebound on the caster..."
						class="skeuo-groove w-full p-2.5 text-xs leading-relaxed"
					></textarea>
				</div>

				<!-- Pillar 6: World Fallout & Societal Adaptation -->
				<div>
					<label for="pillar-fallout" class="block font-serif text-xs font-bold text-[var(--theme-text-muted)]">
						6. Societal, Military & Economic Fallout (World Anvil Extrapolation)
					</label>
					<textarea
						id="pillar-fallout"
						bind:value={blueprint.fallout}
						rows="3"
						placeholder="e.g. Fortifications are built around leylines; armies abandon metal armor; legal contracts require oaths..."
						class="skeuo-groove mt-1 w-full p-2.5 text-xs leading-relaxed"
					></textarea>
				</div>
			</div>
		</main>

		<!-- Right: Triangle of Power & Stress-Tester (3 cols) -->
		<aside class="space-y-4 lg:col-span-3">
			<!-- Triangle of Power Visual Balance Card -->
			<div class="skeuo-paper-sheet p-4 bg-[var(--theme-surface)] space-y-3">
				<div class="flex items-center justify-between border-b border-[var(--theme-border)] pb-2">
					<div class="flex items-center gap-1.5">
						<span>⚖️</span>
						<h2 class="font-serif text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
							Triangle of Power
						</h2>
					</div>
					<span
						class="px-2 py-0.5 rounded font-mono text-[9px] font-bold {triangleScore.balanceState ===
						'STRONG_LIMITATIONS'
							? 'bg-emerald-600 text-white'
							: triangleScore.balanceState === 'BALANCED'
								? 'bg-sky-600 text-white'
								: triangleScore.balanceState === 'OVERPOWERED_RISK'
									? 'bg-rose-600 text-white'
									: 'bg-amber-600 text-stone-950'}"
					>
						{triangleScore.balanceState.replace('_', ' ')}
					</span>
				</div>

				<!-- Three Triangle Bars -->
				<div class="space-y-2 text-xs">
					<!-- Ability / Scope -->
					<div>
						<div class="flex items-center justify-between font-serif text-[11px] mb-1">
							<span>💥 Power Scope</span>
							<span class="font-bold">{triangleScore.powerRating}/10</span>
						</div>
						<div class="h-2 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
							<div
								class="h-full bg-amber-500 rounded-full transition-all"
								style="width: {triangleScore.powerRating * 10}%"
							></div>
						</div>
					</div>

					<!-- Cost / Toll -->
					<div>
						<div class="flex items-center justify-between font-serif text-[11px] mb-1">
							<span>🩸 Casting Toll</span>
							<span class="font-bold">{triangleScore.costRating}/10</span>
						</div>
						<div class="h-2 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
							<div
								class="h-full bg-rose-500 rounded-full transition-all"
								style="width: {triangleScore.costRating * 10}%"
							></div>
						</div>
					</div>

					<!-- Limitations -->
					<div>
						<div class="flex items-center justify-between font-serif text-[11px] mb-1">
							<span>⛓️ Strict Limitations</span>
							<span class="font-bold">{triangleScore.limitationRating}/10</span>
						</div>
						<div class="h-2 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
							<div
								class="h-full bg-emerald-500 rounded-full transition-all"
								style="width: {triangleScore.limitationRating * 10}%"
							></div>
						</div>
					</div>
				</div>

				<div class="rounded bg-[var(--theme-surface-subtle)] p-2.5 text-[11px] space-y-1">
					<div class="font-bold text-[var(--theme-accent)]">{triangleScore.verdict}</div>
					<p class="text-[10px] text-[var(--theme-text-muted)] leading-relaxed">
						{triangleScore.recommendation}
					</p>
				</div>
			</div>

			<!-- Loophole Stress-Tester Card -->
			<div class="skeuo-paper-sheet p-4 bg-[var(--theme-surface)] space-y-3">
				<div class="flex items-center justify-between border-b border-[var(--theme-border)] pb-2">
					<h2 class="font-serif text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
						Socratic Stress-Tester
					</h2>
					<span
						class="px-2 py-0.5 rounded font-serif text-[10px] font-bold {auditReport.overallScore ===
						'SOLID'
							? 'bg-emerald-600 text-white'
							: auditReport.overallScore === 'LOOPHOLE_ALERT'
								? 'bg-rose-600 text-white'
								: 'bg-amber-600 text-amber-950'}"
					>
						{auditReport.overallScore.replace('_', ' ')}
					</span>
				</div>

				<div class="space-y-2 max-h-[380px] overflow-y-auto pr-1">
					{#each auditReport.critiques as crit}
						<div class="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-2.5 space-y-1 text-xs">
							<div class="flex items-center justify-between">
								<span class="font-serif font-bold flex items-center gap-1.5">
									<span>{crit.status === 'pass' ? '✓' : crit.status === 'alert' ? '🚨' : '⚠️'}</span>
									<span class="{crit.status === 'pass' ? 'text-emerald-700 dark:text-emerald-300' : crit.status === 'alert' ? 'text-rose-600' : 'text-amber-600'}">
										{crit.title}
									</span>
								</span>
								<span class="font-sans text-[10px] opacity-70">{crit.category}</span>
							</div>
							<p class="text-[11px] font-sans leading-snug text-[var(--theme-text)]">{crit.observation}</p>
							{#if crit.status !== 'pass'}
								<div class="rounded bg-black/10 p-1.5 text-[10px] font-sans text-[var(--theme-text-muted)]">
									<span class="font-bold">Fix:</span> {crit.recommendation}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- Canon Commit Station -->
			<div class="skeuo-paper-sheet p-4 bg-[var(--theme-surface-subtle)] space-y-3">
				<div class="border-b border-[var(--theme-border)] pb-2 text-xs font-bold font-serif uppercase tracking-wider text-[var(--theme-accent)]">
					🛡️ Canon Commit Station
				</div>
				<p class="text-[11px] font-serif text-[var(--theme-text-muted)] leading-relaxed">
					Locking writes a permanent <code class="font-bold">[magic]</code> record into the World Bible and appends a verified decision into <code class="font-bold">decisions.md</code>.
				</p>
				<button
					type="button"
					class="skeuo-btn-primary w-full py-2.5 text-xs font-serif font-bold"
					onclick={handleCommitToCanon}
				>
					Lock into Bible & Decisions.md
				</button>
			</div>
		</aside>
	</div>
</div>
