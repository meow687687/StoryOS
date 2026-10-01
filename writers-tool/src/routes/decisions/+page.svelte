<script lang="ts">
	import { onMount } from 'svelte';
	import {
		loadDecisions,
		parseDecisionsMarkdown,
		saveDecisions,
		serializeDecisionsMarkdown,
		type Decision
	} from '$lib/world';

	let decisions: Decision[] = $state([]);
	let filter: 'all' | 'locked' | 'draft' | 'superseded' = $state('all');
	let importText = $state('');
	let showImportModal = $state(false);

	// New decision form
	let newTopic = $state('');
	let newDecision = $state('');
	let newAuthorWords = $state('');
	let newAffects = $state('');

	const DEMO_DECISIONS_SAMPLE = `# Decisions: UNTITLED (demo novel)

## D0 — 2026-09-30 — Route
- Decision: Dump exists; route dump-organizer → interrogator round 1.
- Author's words: "Yes, build it"
- Source: session
- Affects: project route
- Status: locked

## D1 — 2026-09-30 — Mira's relation
- Decision: Mira is Kael's sister.
- Author's words: "Sister, confirmed"
- Source: editorial round 1
- Affects: bible:characters:Mira
- Status: locked

## D2 — 2026-09-30 — City name
- Decision: The city is Behra.
- Author's words: "Behra"
- Source: editorial round 1
- Affects: bible:geography
- Status: locked

## D3 — 2026-09-30 — Cargo identity
- Decision: Kael smuggles a girl.
- Author's words: "A girl"
- Source: editorial round 1
- Affects: bible:characters, outline:act1:beat1
- Status: locked

## D4 — 2026-09-30 — Betrayal causation
- Decision: The merchant's betrayal causes the guard chase.
- Author's words: "Betrayal causes chase"
- Source: editorial round 1
- Affects: outline:act2
- Status: locked

## D5 — 2026-09-30 — Magic price scale
- Decision: Magic costs small memory fragments per use; mass-burn is possible.
- Author's words: "Small fragments per use"
- Source: editorial round 1 + round 2
- Affects: bible:world-rules, outline:ch5
- Status: locked
`;

	onMount(() => {
		decisions = loadDecisions();
		if (!decisions.length) {
			decisions = parseDecisionsMarkdown(DEMO_DECISIONS_SAMPLE);
			saveDecisions(decisions);
		}
	});

	const filteredDecisions = $derived.by(() => {
		if (filter === 'all') return decisions;
		return decisions.filter((d) => d.status === filter);
	});

	function addDecision() {
		if (!newTopic.trim() || !newDecision.trim()) return;
		const nextId = `D${decisions.length + 1}`;
		const entry: Decision = {
			id: nextId,
			date: new Date().toISOString().slice(0, 10),
			topic: newTopic.trim(),
			decision: newDecision.trim(),
			authorWords: newAuthorWords.trim() || `"${newDecision.trim()}"`,
			source: 'author manual input',
			affects: newAffects.trim() || 'story:canon',
			status: 'locked'
		};
		decisions = [entry, ...decisions];
		saveDecisions(decisions);
		newTopic = '';
		newDecision = '';
		newAuthorWords = '';
		newAffects = '';
	}

	function toggleStatus(id: string) {
		decisions = decisions.map((d) => {
			if (d.id !== id) return d;
			const nextStatus =
				d.status === 'locked' ? 'draft' : d.status === 'draft' ? 'superseded' : 'locked';
			return { ...d, status: nextStatus };
		});
		saveDecisions(decisions);
	}

	function removeDecision(id: string) {
		decisions = decisions.filter((d) => d.id !== id);
		saveDecisions(decisions);
	}

	function doImport() {
		if (!importText.trim()) return;
		const parsed = parseDecisionsMarkdown(importText);
		if (parsed.length) {
			decisions = [...parsed, ...decisions];
			saveDecisions(decisions);
			importText = '';
			showImportModal = false;
		}
	}

	function copyMarkdown() {
		const md = serializeDecisionsMarkdown(decisions);
		navigator.clipboard.writeText(md);
		alert('Copied decisions.md to clipboard!');
	}
</script>

<header class="max-w-4xl">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="font-display text-4xl font-semibold tracking-tight text-[#1c1917]">
				Decisions Ledger
			</h1>
			<p class="mt-1 text-sm text-[#57534e]">
				The inviolable record of author choices. Every story fact traces to your verbatim words.
			</p>
		</div>
		<div class="flex items-center gap-2">
			<button
				class="cursor-pointer rounded-lg border border-[#e7e0d3] bg-white px-3 py-1.5 text-xs font-medium text-[#292524] hover:bg-stone-50"
				onclick={() => (showImportModal = true)}
			>
				Import Markdown
			</button>
			<button
				class="cursor-pointer rounded-lg bg-[#292524] px-3 py-1.5 text-xs font-medium text-white hover:bg-black"
				onclick={copyMarkdown}
			>
				Export decisions.md
			</button>
		</div>
	</div>
</header>

<!-- New Decision Form -->
<section
	class="mt-6 max-w-4xl rounded-xl border border-[#e7e0d3] bg-[#faf7f2]/90 p-5 shadow-xs"
	aria-label="Record Decision"
>
	<h2 class="font-display text-base font-bold text-[#1c1917]">Record Author Decision</h2>
	<div class="mt-3 grid gap-3 sm:grid-cols-2">
		<div>
			<label for="dec-topic" class="block text-xs font-semibold text-[#78716c] uppercase">
				Topic / Question
			</label>
			<input
				id="dec-topic"
				bind:value={newTopic}
				placeholder="e.g. Magic cost scale"
				class="mt-1 w-full rounded-md border border-[#e7e0d3] bg-white px-3 py-2 text-sm text-[#292524] focus:outline-hidden focus:border-[#9a3412]"
			/>
		</div>
		<div>
			<label for="dec-affects" class="block text-xs font-semibold text-[#78716c] uppercase">
				Affects (Bible or Scene)
			</label>
			<input
				id="dec-affects"
				bind:value={newAffects}
				placeholder="e.g. bible:magic:fire-pact, ch03"
				class="mt-1 w-full rounded-md border border-[#e7e0d3] bg-white px-3 py-2 text-sm text-[#292524] focus:outline-hidden focus:border-[#9a3412]"
			/>
		</div>
		<div class="sm:col-span-2">
			<label for="dec-text" class="block text-xs font-semibold text-[#78716c] uppercase">
				Formal Canon Decision
			</label>
			<input
				id="dec-text"
				bind:value={newDecision}
				placeholder="e.g. Magic costs memory fragments per use; mass-burn destroys personality."
				class="mt-1 w-full rounded-md border border-[#e7e0d3] bg-white px-3 py-2 text-sm text-[#292524] focus:outline-hidden focus:border-[#9a3412]"
			/>
		</div>
		<div class="sm:col-span-2">
			<label for="dec-author" class="block text-xs font-semibold text-[#78716c] uppercase">
				Author's Verbatim Words (Provenance)
			</label>
			<input
				id="dec-author"
				bind:value={newAuthorWords}
				placeholder='e.g. "Memory fragments, never blood"'
				class="mt-1 w-full rounded-md border border-[#e7e0d3] bg-white px-3 py-2 text-sm text-[#292524] focus:outline-hidden focus:border-[#9a3412]"
			/>
		</div>
	</div>
	<button
		class="mt-4 flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#9a3412] px-4 py-2 text-xs font-medium text-white hover:bg-[#7c2d12] disabled:opacity-40"
		onclick={addDecision}
		disabled={!newTopic.trim() || !newDecision.trim()}
	>
		Lock Decision as Canon
	</button>
</section>

<!-- Filter Tabs -->
<div class="mt-8 flex max-w-4xl items-center justify-between border-b border-[#e7e0d3] pb-2">
	<div class="flex gap-2">
		{#each ['all', 'locked', 'draft', 'superseded'] as st}
			<button
				class="cursor-pointer rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors {filter ===
				st
					? 'bg-[#292524] text-white'
					: 'text-[#78716c] hover:bg-black/5 hover:text-[#1c1917]'}"
				onclick={() => (filter = st as typeof filter)}
			>
				{st}
				{#if st === 'all'}
					({decisions.length})
				{:else}
					({decisions.filter((d) => d.status === st).length})
				{/if}
			</button>
		{/each}
	</div>
</div>

<!-- Decisions List -->
<div class="mt-4 max-w-4xl space-y-3">
	{#each filteredDecisions as item (item.id)}
		<article
			class="rounded-xl border border-[#e7e0d3] bg-white/80 p-5 shadow-xs transition-shadow hover:shadow-sm"
		>
			<div class="flex items-start justify-between gap-3">
				<div>
					<div class="flex items-center gap-2">
						<span class="font-mono text-xs font-bold text-[#9a3412]">{item.id}</span>
						<span class="text-xs text-stone-400">·</span>
						<span class="text-xs text-stone-500">{item.date}</span>
						<span class="text-xs text-stone-400">·</span>
						<button
							class="cursor-pointer rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider {item.status ===
							'locked'
								? 'border-emerald-300 bg-emerald-50 text-emerald-800'
								: item.status === 'draft'
									? 'border-amber-300 bg-amber-50 text-amber-800'
									: 'border-stone-300 bg-stone-100 text-stone-600'}"
							onclick={() => toggleStatus(item.id)}
							title="Click to toggle status (locked ➔ draft ➔ superseded)"
						>
							{item.status}
						</button>
					</div>
					<h3 class="font-display mt-1 text-lg font-bold text-[#1c1917]">{item.topic}</h3>
				</div>
				<button
					class="cursor-pointer text-stone-400 hover:text-rose-600 text-sm p-1"
					onclick={() => removeDecision(item.id)}
					aria-label="Remove decision"
				>
					×
				</button>
			</div>

			<p class="manuscript mt-2 text-sm leading-relaxed text-[#292524]">
				{item.decision}
			</p>

			<div class="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#78716c] border-t border-stone-100 pt-2">
				{#if item.authorWords}
					<div>
						<span class="font-semibold text-stone-600">Verbatim:</span>
						<span class="italic">“{item.authorWords}”</span>
					</div>
				{/if}
				{#if item.affects}
					<div>
						<span class="font-semibold text-stone-600">Affects:</span>
						<code class="rounded bg-stone-100 px-1 py-0.5 font-mono text-[11px] text-stone-700">
							{item.affects}
						</code>
					</div>
				{/if}
			</div>
		</article>
	{/each}
</div>

{#if showImportModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
		role="dialog"
	>
		<div class="w-full max-w-lg rounded-xl border border-[#e7e0d3] bg-[#faf7f2] p-6 shadow-xl">
			<h2 class="font-display text-xl font-bold text-[#1c1917]">Import decisions.md</h2>
			<p class="mt-1 text-xs text-stone-500">
				Paste the contents of your <code>decisions.md</code> file below.
			</p>
			<textarea
				bind:value={importText}
				rows={10}
				placeholder={DEMO_DECISIONS_SAMPLE}
				class="manuscript mt-3 w-full rounded-md border border-[#e7e0d3] bg-white p-3 font-mono text-xs focus:outline-hidden"
			></textarea>
			<div class="mt-4 flex justify-end gap-2">
				<button
					class="cursor-pointer rounded-lg border border-[#e7e0d3] px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
					onclick={() => (showImportModal = false)}
				>
					Cancel
				</button>
				<button
					class="cursor-pointer rounded-lg bg-[#9a3412] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#7c2d12]"
					onclick={doImport}
				>
					Import Decisions
				</button>
			</div>
		</div>
	</div>
{/if}
