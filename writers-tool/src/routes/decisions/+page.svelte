<script lang="ts">
	import { onMount } from 'svelte';
	import {
		loadDecisions,
		loadSampleStory,
		parseDecisionsMarkdown,
		saveDecisions,
		serializeDecisionsMarkdown,
		type Decision
	} from '$lib/world';

	let decisions: Decision[] = $state([]);
	let filter: 'all' | 'locked' | 'draft' | 'superseded' = $state('all');
	let importText = $state('');
	let showImportModal = $state(false);
	let showHelpTips = $state(false);

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
`;

	onMount(() => {
		decisions = loadDecisions();
	});

	function handleLoadSample() {
		loadSampleStory();
		decisions = loadDecisions();
	}

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
			<div class="flex items-center gap-3">
				<h1 class="font-display text-4xl font-semibold tracking-tight text-[var(--theme-text)]">
					Decisions Ledger
				</h1>
				<button
					type="button"
					class="cursor-pointer rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--theme-text-muted)] hover:text-[var(--theme-accent)] transition-colors"
					onclick={() => (showHelpTips = !showHelpTips)}
				>
					{showHelpTips ? '✕ Close Tips' : '💡 Decisions Tips'}
				</button>
			</div>
			<p class="mt-1 text-sm text-[var(--theme-text-muted)]">
				The inviolable record of author choices. Every story fact traces to your verbatim words.
			</p>
		</div>
		<div class="flex items-center gap-2">
			<a
				href="/guide"
				class="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--theme-text)] shadow-xs hover:border-[var(--theme-border-strong)]"
			>
				📖 Manual
			</a>
			<button
				class="cursor-pointer rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-1.5 text-xs font-medium text-[var(--theme-text)] hover:border-[var(--theme-border-strong)]"
				onclick={() => (showImportModal = true)}
			>
				Import Markdown
			</button>
			<button
				class="cursor-pointer rounded-lg bg-[var(--theme-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--theme-accent-fg)] hover:opacity-90 shadow-xs"
				onclick={copyMarkdown}
			>
				Export decisions.md
			</button>
		</div>
	</div>

	{#if showHelpTips}
		<div class="mt-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-4 text-xs text-[var(--theme-text-muted)] shadow-xs animate-in fade-in duration-200">
			<div class="flex items-center justify-between font-bold text-[var(--theme-text)]">
				<span>Decisions Ledger Tips & Provenance</span>
				<a href="/guide" class="text-[var(--theme-accent)] underline hover:opacity-80">Full Documentation →</a>
			</div>
			<div class="mt-2 grid gap-3 sm:grid-cols-3">
				<div>
					<span class="font-semibold text-[var(--theme-text)]">Verbatim Provenance</span>
					<p class="mt-0.5 text-[11px]">Record your exact quotes when deciding story twists. The AI and editor will never contradict an author's verbatim locked choice.</p>
				</div>
				<div>
					<span class="font-semibold text-[var(--theme-text)]">Lifecycle States</span>
					<p class="mt-0.5 text-[11px]">Click any status pill to toggle: <em>Locked ➔ Draft ➔ Superseded</em>. Superseded choices preserve historical evolution without cluttering active canon.</p>
				</div>
				<div>
					<span class="font-semibold text-[var(--theme-text)]">Export & Versioning</span>
					<p class="mt-0.5 text-[11px]">Click <em>Export decisions.md</em> to copy your entire decision log as clean markdown suitable for git commits or sharing with beta readers.</p>
				</div>
			</div>
		</div>
	{/if}
</header>

<!-- New Decision Form -->
<section
	class="mt-6 max-w-4xl rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-5 shadow-xs"
	aria-label="Record Decision"
>
	<h2 class="font-display text-base font-bold text-[var(--theme-text)]">Record Author Decision</h2>
	<div class="mt-3 grid gap-3 sm:grid-cols-2">
		<div>
			<label for="dec-topic" class="block text-xs font-semibold text-[var(--theme-text-muted)] uppercase">
				Topic / Question
			</label>
			<input
				id="dec-topic"
				bind:value={newTopic}
				placeholder="e.g. Magic cost scale"
				class="mt-1 w-full rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2 text-sm text-[var(--theme-text)] focus:outline-hidden focus:border-[var(--theme-accent)]"
			/>
		</div>
		<div>
			<label for="dec-affects" class="block text-xs font-semibold text-[var(--theme-text-muted)] uppercase">
				Affects (Bible or Scene)
			</label>
			<input
				id="dec-affects"
				bind:value={newAffects}
				placeholder="e.g. bible:magic:fire-pact, ch03"
				class="mt-1 w-full rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2 text-sm text-[var(--theme-text)] focus:outline-hidden focus:border-[var(--theme-accent)]"
			/>
		</div>
		<div class="sm:col-span-2">
			<label for="dec-text" class="block text-xs font-semibold text-[var(--theme-text-muted)] uppercase">
				Formal Canon Decision
			</label>
			<input
				id="dec-text"
				bind:value={newDecision}
				placeholder="e.g. Magic costs memory fragments per use; mass-burn destroys personality."
				class="mt-1 w-full rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2 text-sm text-[var(--theme-text)] focus:outline-hidden focus:border-[var(--theme-accent)]"
			/>
		</div>
		<div class="sm:col-span-2">
			<label for="dec-author" class="block text-xs font-semibold text-[var(--theme-text-muted)] uppercase">
				Author's Verbatim Words (Provenance)
			</label>
			<input
				id="dec-author"
				bind:value={newAuthorWords}
				placeholder='e.g. "Memory fragments, never blood"'
				class="mt-1 w-full rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2 text-sm text-[var(--theme-text)] focus:outline-hidden focus:border-[var(--theme-accent)]"
			/>
		</div>
	</div>
	<button
		class="mt-4 flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--theme-accent)] px-4 py-2 text-xs font-semibold text-[var(--theme-accent-fg)] hover:opacity-90 disabled:opacity-40 shadow-xs"
		onclick={addDecision}
		disabled={!newTopic.trim() || !newDecision.trim()}
	>
		Lock Decision as Canon
	</button>
</section>

<!-- Filter Tabs -->
<div class="mt-8 flex max-w-4xl items-center justify-between border-b border-[var(--theme-border)] pb-2">
	<div class="flex gap-2">
		{#each ['all', 'locked', 'draft', 'superseded'] as st}
			<button
				class="cursor-pointer rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors {filter ===
				st
					? 'bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] font-semibold shadow-xs'
					: 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'}"
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

{#if decisions.length === 0}
	<!-- Empty State -->
	<div class="mt-8 max-w-4xl rounded-2xl border-2 border-dashed border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-12 text-center">
		<div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--theme-surface)] text-2xl shadow-xs">
			⚖️
		</div>
		<h3 class="font-display mt-4 text-xl font-bold text-[var(--theme-text)]">
			Decisions Ledger is Empty
		</h3>
		<p class="mx-auto mt-2 max-w-md text-sm text-[var(--theme-text-muted)]">
			Record immutable story choices with your own verbatim words. When you decide a character's true motivation or magic rules, seal it here.
		</p>
		<div class="mt-6 flex flex-wrap items-center justify-center gap-3">
			<button
				class="cursor-pointer rounded-lg bg-[var(--theme-accent)] px-4 py-2 text-xs font-semibold text-[var(--theme-accent-fg)] hover:opacity-90 shadow-xs"
				onclick={() => {
					newTopic = 'Magic Price Scale';
					newDecision = 'Magic costs small memory fragments per cast.';
					newAuthorWords = 'Small fragments per use, never physical blood';
				}}
			>
				📝 Fill Example Decision
			</button>
			<button
				class="cursor-pointer rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-2 text-xs font-semibold text-[var(--theme-text)] hover:border-[var(--theme-border-strong)] shadow-xs"
				onclick={handleLoadSample}
			>
				✨ Load Sample Story (The Ashen Vow)
			</button>
		</div>
	</div>
{:else}
	<!-- Decisions List -->
	<div class="mt-4 max-w-4xl space-y-3">
		{#each filteredDecisions as item (item.id)}
			<article
				class="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 shadow-xs transition-shadow hover:shadow-sm"
			>
				<div class="flex items-start justify-between gap-3">
					<div>
						<div class="flex items-center gap-2">
							<span class="font-mono text-xs font-bold text-[var(--theme-accent)]">{item.id}</span>
							<span class="text-xs text-[var(--theme-text-muted)]">·</span>
							<span class="text-xs text-[var(--theme-text-muted)]">{item.date}</span>
							<span class="text-xs text-[var(--theme-text-muted)]">·</span>
							<button
								class="cursor-pointer rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider {item.status ===
								'locked'
									? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
									: item.status === 'draft'
										? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
										: 'border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] text-[var(--theme-text-muted)]'}"
								onclick={() => toggleStatus(item.id)}
								title="Click to toggle status (locked ➔ draft ➔ superseded)"
							>
								{item.status}
							</button>
						</div>
						<h3 class="font-display mt-1 text-lg font-bold text-[var(--theme-text)]">{item.topic}</h3>
					</div>
					<button
						class="cursor-pointer text-[var(--theme-text-muted)] hover:text-rose-500 text-sm p-1"
						onclick={() => removeDecision(item.id)}
						aria-label="Remove decision"
					>
						×
					</button>
				</div>

				<p class="manuscript mt-2 text-sm leading-relaxed text-[var(--theme-text)]">
					{item.decision}
				</p>

				<div class="mt-3 flex flex-wrap items-center gap-4 text-xs text-[var(--theme-text-muted)] border-t border-[var(--theme-border)] pt-2">
					{#if item.authorWords}
						<div>
							<span class="font-semibold text-[var(--theme-text)]">Verbatim:</span>
							<span class="italic">“{item.authorWords}”</span>
						</div>
					{/if}
					{#if item.affects}
						<div>
							<span class="font-semibold text-[var(--theme-text)]">Affects:</span>
							<code class="rounded bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--theme-text)]">
								{item.affects}
							</code>
						</div>
					{/if}
				</div>
			</article>
		{/each}
	</div>
{/if}

{#if showImportModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
		role="dialog"
	>
		<div class="w-full max-w-lg rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-xl">
			<h2 class="font-display text-xl font-bold text-[var(--theme-text)]">Import decisions.md</h2>
			<p class="mt-1 text-xs text-[var(--theme-text-muted)]">
				Paste the contents of your <code>decisions.md</code> file below.
			</p>
			<textarea
				bind:value={importText}
				rows={10}
				placeholder={DEMO_DECISIONS_SAMPLE}
				class="manuscript mt-3 w-full rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 font-mono text-xs text-[var(--theme-text)] focus:outline-hidden focus:border-[var(--theme-accent)]"
			></textarea>
			<div class="mt-4 flex justify-end gap-2">
				<button
					class="cursor-pointer rounded-lg border border-[var(--theme-border)] px-3 py-1.5 text-xs font-medium text-[var(--theme-text)] hover:bg-[var(--theme-surface-subtle)]"
					onclick={() => (showImportModal = false)}
				>
					Cancel
				</button>
				<button
					class="cursor-pointer rounded-lg bg-[var(--theme-accent)] px-4 py-1.5 text-xs font-semibold text-[var(--theme-accent-fg)] hover:opacity-90"
					onclick={doImport}
				>
					Import Decisions
				</button>
			</div>
		</div>
	</div>
{/if}
