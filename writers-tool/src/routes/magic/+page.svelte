<script lang="ts">
	import { onMount } from 'svelte';
	import {
		auditMagicLoopholes,
		commitMagicBlueprintToCanon,
		generateRandomSpark,
		MAGIC_ARCHETYPES,
		SANDERSON_LAWS_GUIDE,
		type LoopholeAuditReport,
		type MagicArchetype,
		type MagicBlueprint
	} from '$lib/magic';
	import { loadBible, loadDecisions, saveBible, saveDecisions, type Decision, type WorldEntry } from '$lib/world';
	import { loadAIConfig, ollamaStatus, type AIConfig } from '$lib/ai';
	import { toasts } from '$lib/toasts';

	let bible: WorldEntry[] = $state([]);
	let decisions: Decision[] = $state([]);
	let cfg: AIConfig = $state({ provider: 'ollama', apiKey: '', model: 'llama3.2:3b' });
	let showGuide = $state(false);
	let activeArchetype = $state<MagicArchetype>(MAGIC_ARCHETYPES[0]);
	let busy = $state(false);

	// Active Workbench Blueprint State
	let blueprint = $state<MagicBlueprint>({
		id: 'magic-initial',
		name: 'Blood & Somatic Vitality',
		summary: 'Life force and anatomical toll as fuel.',
		hardness: 4,
		source: MAGIC_ARCHETYPES[1].source,
		vector: MAGIC_ARCHETYPES[1].vector,
		cost: MAGIC_ARCHETYPES[1].cost,
		limitations: MAGIC_ARCHETYPES[1].limitations,
		fallout: MAGIC_ARCHETYPES[1].fallout,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	});

	let auditReport = $derived(auditMagicLoopholes(blueprint));

	onMount(() => {
		bible = loadBible();
		decisions = loadDecisions();
		cfg = loadAIConfig();
	});

	function handleRollSpark() {
		const spark = generateRandomSpark();
		blueprint = spark;
		toasts.success(`Rolled new spark: ${spark.name}!`, '🎲');
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
			updatedAt: new Date().toISOString()
		};
		toasts.success(`Loaded "${arch.name}" template into workbench!`, '📥');
	}

	function runAudit() {
		// Reactive audit handled via $derived(auditMagicLoopholes(blueprint))
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
	<title>Magic System Studio & Arcanum Lab — Story OS</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header / Master Bureau Toolbar -->
	<header class="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--theme-border-strong)] pb-4">
		<div>
			<div class="flex items-center gap-3">
				<span class="skeuo-seal h-8 w-8 text-sm bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 text-stone-950 font-black shadow-[0_2px_6px_rgba(0,0,0,0.3)]">
					✨
				</span>
				<h1 class="font-display text-3xl font-extrabold tracking-tight text-[var(--theme-text)]">
					Magic System Studio
				</h1>
				<span class="rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface-subtle)] px-2 py-0.5 font-mono text-xs font-bold text-[var(--theme-accent)]">
					Arcanum Lab
				</span>
			</div>
			<p class="mt-1 font-mono text-xs text-[var(--theme-text-muted)]">
				Grounded in Brandon Sanderson's Laws of Magic · Limitations > Powers · Expand Before Adding
			</p>
		</div>

		<!-- Action Buttons -->
		<div class="flex flex-wrap items-center gap-2">
			<button
				type="button"
				class="skeuo-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
				onclick={() => (showGuide = !showGuide)}
			>
				<span>📖</span>
				<span>{showGuide ? 'Hide Research Guide' : 'Sanderson Craft Guide'}</span>
			</button>

			<button
				type="button"
				class="skeuo-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-300"
				onclick={handleRollSpark}
				title="Roll randomized combination to break creative block"
			>
				<span>🎲</span>
				<span>Roll Spark Dice</span>
			</button>

			<button
				type="button"
				class="skeuo-btn-primary flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold"
				onclick={handleCommitToCanon}
				title="Commit this magic system directly to World Bible & decisions.md"
			>
				<span>🛡️</span>
				<span>Lock into Canon Bible</span>
			</button>
		</div>
	</header>

	<!-- Expandable Sanderson's 3 Laws Craft Guide Drawer -->
	{#if showGuide}
		<section class="skeuo-paper p-5 space-y-4 transition-all animate-in fade-in" aria-label="Sanderson's Laws of Magic">
			<div class="flex items-center justify-between border-b border-[var(--theme-border)] pb-2.5">
				<div class="flex items-center gap-2">
					<span class="font-display text-sm font-bold uppercase tracking-wider text-[var(--theme-accent)]">
						🏛️ Brandon Sanderson's Laws of Magic & Craft Principles
					</span>
				</div>
				<button
					type="button"
					class="text-xs font-bold text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
					onclick={() => (showGuide = false)}
				>
					✕ Close
				</button>
			</div>

			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{#each SANDERSON_LAWS_GUIDE as law}
					<div class="skeuo-box p-3.5 bg-[var(--theme-surface-subtle)] space-y-1.5">
						<span class="rounded bg-[var(--theme-accent)]/20 px-1.5 py-0.2 font-mono text-[10px] font-black text-[var(--theme-accent)]">
							{law.number}
						</span>
						<h3 class="font-display text-xs font-bold text-[var(--theme-text)]">{law.title}</h3>
						<p class="text-[11px] font-bold italic text-[var(--theme-text-muted)]">"{law.maxim}"</p>
						<p class="text-[11px] leading-relaxed text-[var(--theme-text)]">{law.principle}</p>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- 3-Column Main Lab Grid -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
		<!-- Left: 12 Archetypes Compendium (3 cols) -->
		<aside class="space-y-4 lg:col-span-3">
			<div class="skeuo-box p-4 bg-[var(--theme-surface)] space-y-3">
				<div class="flex items-center justify-between border-b border-[var(--theme-border)] pb-2">
					<h2 class="font-display text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
						12 Curated Archetypes
					</h2>
					<span class="font-mono text-[10px] text-[var(--theme-text-faint)]">Pick to load</span>
				</div>

				<div class="max-h-[580px] overflow-y-auto space-y-1.5 pr-1">
					{#each MAGIC_ARCHETYPES as arch (arch.id)}
						<button
							type="button"
							class="flex w-full cursor-pointer items-start gap-2.5 rounded-lg border p-2 text-left text-xs transition-all {activeArchetype.id ===
							arch.id
								? 'border-[var(--theme-border-strong)] bg-[var(--theme-btn-primary-gradient,var(--theme-accent))] text-[var(--theme-accent-fg)] font-bold shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)]'
								: 'border-transparent bg-[var(--theme-surface-subtle)] text-[var(--theme-text)] hover:border-[var(--theme-border)] hover:bg-[var(--theme-surface)]'}"
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

				<!-- Active Archetype Dossier Preview Card -->
				{#if activeArchetype}
					<div class="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-3 space-y-2 text-xs">
						<div class="flex items-center justify-between">
							<span class="font-bold text-[var(--theme-accent)]">{activeArchetype.name}</span>
							<span class="rounded bg-black/20 px-1.5 py-0.2 font-mono text-[9px] uppercase">
								Hardness {activeArchetype.hardness}/5
							</span>
						</div>
						<p class="text-[11px] leading-relaxed text-[var(--theme-text)]">{activeArchetype.tagline}</p>
						<div class="text-[10px] text-[var(--theme-text-muted)]">
							<span class="font-bold">Examples:</span> {activeArchetype.famousInspirations.join(', ')}
						</div>
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
		</aside>

		<!-- Center: 5-Pillar Blueprint Builder (6 cols) -->
		<main class="space-y-4 lg:col-span-6">
			<div class="skeuo-paper p-6 space-y-5">
				<!-- System Name & Hardness Gauge -->
				<div class="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--theme-border)] pb-4">
					<div class="min-w-0 flex-1">
						<label for="magic-name" class="block font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
							Magic System Name *
						</label>
						<input
							id="magic-name"
							bind:value={blueprint.name}
							oninput={runAudit}
							placeholder="e.g. Ashen Sympathy, Blood Iron Law"
							class="font-display mt-1 w-full bg-transparent text-xl font-bold text-[var(--theme-text)] focus:outline-hidden"
						/>
					</div>

					<!-- Hard vs Soft Magic Slider Gauge -->
					<div class="text-right">
						<div class="flex items-center justify-end gap-2 font-mono text-xs font-bold text-[var(--theme-text)]">
							<span>Hardness:</span>
							<span class="skeuo-seal h-5 w-5 bg-amber-600 text-stone-950 font-black text-[10px]">
								{blueprint.hardness}
							</span>
							<span class="text-[10px] text-[var(--theme-text-muted)]">
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

				<!-- Pillar 1: Source / Wellspring -->
				<div>
					<label for="pillar-source" class="block font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
						1. Power Source & Wellspring (Where does energy originate?)
					</label>
					<textarea
						id="pillar-source"
						bind:value={blueprint.source}
						oninput={runAudit}
						rows="2"
						placeholder="e.g. Drawn from ambient thermal heat, celestial conjunctions, or tectonic ley lines..."
						class="skeuo-input mt-1 w-full p-2.5 text-xs leading-relaxed"
					></textarea>
				</div>

				<!-- Pillar 2: Medium & Channel -->
				<div>
					<label for="pillar-vector" class="block font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
						2. Medium & Channel (How is power invoked and directed?)
					</label>
					<textarea
						id="pillar-vector"
						bind:value={blueprint.vector}
						oninput={runAudit}
						rows="2"
						placeholder="e.g. Silver needles in anatomical nerves, chalk runic circles, consumed metal vials..."
						class="skeuo-input mt-1 w-full p-2.5 text-xs leading-relaxed"
					></textarea>
				</div>

				<!-- Pillar 3: Physical Cost & Depletion -->
				<div>
					<label for="pillar-cost" class="block font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
						3. Physical Fuel & Cost (What price does the caster pay every single time?)
					</label>
					<textarea
						id="pillar-cost"
						bind:value={blueprint.cost}
						oninput={runAudit}
						rows="2"
						placeholder="e.g. Binder's chills (hypothermia), irreversible memory loss, capillary rupture..."
						class="skeuo-input mt-1 w-full p-2.5 text-xs leading-relaxed"
					></textarea>
				</div>

				<!-- Pillar 4: Iron Limitations & Cannot Laws -->
				<div class="rounded-lg border border-amber-600/50 bg-amber-500/10 p-3.5 space-y-1">
					<div class="flex items-center justify-between">
						<label for="pillar-limitations" class="block font-mono text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
							🛡️ 4. Iron "Cannot" Laws & Strict Limitations (Enforced in Manuscript)
						</label>
						<span class="font-mono text-[9px] font-bold text-amber-700 dark:text-amber-400">
							Uses "cannot / never / only"
						</span>
					</div>
					<textarea
						id="pillar-limitations"
						bind:value={blueprint.limitations}
						oninput={runAudit}
						rows="2"
						placeholder="e.g. Cannot create matter from nothing; cannot harm living iron; cannot resurrect dead flesh..."
						class="skeuo-input w-full p-2.5 text-xs font-mono leading-relaxed"
					></textarea>
					<p class="text-[10px] text-[var(--theme-text-muted)]">
						These negative constraints are parsed directly by our Manuscript Continuity Checker.
					</p>
				</div>

				<!-- Pillar 5: Societal & Economic Fallout -->
				<div>
					<label for="pillar-fallout" class="block font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
						5. Societal, Economic & Military Fallout (How did the world adapt?)
					</label>
					<textarea
						id="pillar-fallout"
						bind:value={blueprint.fallout}
						oninput={runAudit}
						rows="2"
						placeholder="e.g. Salt-miners hold monopolies over kings; armies abandoned plate armor for silk..."
						class="skeuo-input mt-1 w-full p-2.5 text-xs leading-relaxed"
					></textarea>
				</div>
			</div>
		</main>

		<!-- Right: Socratic Stress-Tester & Canon Bridge (3 cols) -->
		<aside class="space-y-4 lg:col-span-3">
			<!-- Loophole Stress-Tester Card -->
			<div class="skeuo-box p-4 bg-[var(--theme-surface)] space-y-3">
				<div class="flex items-center justify-between border-b border-[var(--theme-border)] pb-2">
					<h2 class="font-display text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
						Socratic Stress-Tester
					</h2>
					<span
						class="skeuo-seal px-2 py-0.5 font-mono text-[9px] font-black {auditReport.overallScore ===
						'SOLID'
							? 'bg-emerald-600 text-white'
							: auditReport.overallScore === 'LOOPHOLE_ALERT'
								? 'bg-rose-600 text-white'
								: 'bg-amber-600 text-amber-950'}"
					>
						{auditReport.overallScore.replace('_', ' ')}
					</span>
				</div>

				<div class="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
					{#each auditReport.critiques as crit}
						<div class="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-2.5 space-y-1 text-xs">
							<div class="flex items-center justify-between">
								<span class="font-bold flex items-center gap-1.5">
									<span>{crit.status === 'pass' ? '✓' : crit.status === 'alert' ? '🚨' : '⚠️'}</span>
									<span class="{crit.status === 'pass' ? 'text-emerald-700 dark:text-emerald-300' : crit.status === 'alert' ? 'text-rose-600' : 'text-amber-600'}">
										{crit.title}
									</span>
								</span>
								<span class="font-mono text-[9px] uppercase opacity-70">{crit.category}</span>
							</div>
							<p class="text-[11px] leading-snug text-[var(--theme-text)]">{crit.observation}</p>
							{#if crit.status !== 'pass'}
								<div class="rounded bg-black/15 p-1.5 text-[10px] text-[var(--theme-text-muted)]">
									<span class="font-bold">Fix:</span> {crit.recommendation}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- Direct Canon Commit Station -->
			<div class="skeuo-box p-4 bg-[var(--theme-surface-subtle)] space-y-3">
				<div class="border-b border-[var(--theme-border)] pb-2 text-xs font-bold font-mono uppercase tracking-wider text-[var(--theme-accent)]">
					🛡️ Canon Commit Station
				</div>
				<p class="text-[11px] text-[var(--theme-text-muted)] leading-relaxed">
					Locking writes a permanent <code class="font-bold">[magic]</code> record into the World Bible and appends a verified decision into <code class="font-bold">decisions.md</code>.
				</p>
				<button
					type="button"
					class="skeuo-btn-primary w-full py-2.5 text-xs font-bold"
					onclick={handleCommitToCanon}
				>
					Lock into Bible & Decisions.md
				</button>
			</div>
		</aside>
	</div>
</div>
