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
	import { toasts } from '$lib/toasts';

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
		toasts.success(`Locked decision: "${entry.topic}"`, '🛡️');
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
				<h1 class="font-display text-4xl font-extrabold tracking-tight text-[var(--theme-text)]">
					Decisions Ledger
				</h1>
				<button
					type="button"
					class="quiet-ghost px-2.5 py-0.5 text-[11px] font-mono font-bold"
					onclick={() => (showHelpTips = !showHelpTips)}
				>
					{showHelpTips ? '✕ Close Tips' : '💡 Decisions Tips'}
				</button>
			</div>
			<p class="mt-1 font-mono text-xs text-[var(--theme-text-muted)]">
				The inviolable record of author choices. Every story fact traces to your verbatim words.
			</p>
		</div>
		<div class="flex items-center gap-2">
			<a
				href="/guide"
				class="quiet-ghost !px-3 !py-1.5 text-xs font-bold"
			>
				📖 Manual
			</a>
			<button
				class="quiet-ghost !px-3 !py-1.5 text-xs font-bold"
				onclick={() => (showImportModal = true)}
			>
				Import Markdown
			</button>
			<button
				class="quiet-primary !px-3 !py-1.5 text-xs font-bold"
				onclick={copyMarkdown}
			>
				Export decisions.md
			</button>
		</div>
	</div>

	{#if showHelpTips}
		<div class="mt-4 quiet-card bg-[var(--theme-surface-subtle)] p-4 text-xs text-[var(--theme-text-muted)] animate-in fade-in duration-200">
			<div class="flex items-center justify-between font-bold text-[var(--theme-text)]">
				<span class="font-mono text-xs uppercase tracking-wider">Decisions Ledger Tips & Provenance</span>
				<a href="/guide" class="text-[var(--theme-accent)] underline font-bold hover:opacity-80">Full Documentation →</a>
			</div>
			<div class="mt-2 grid gap-3 sm:grid-cols-3">
				<div>
					<span class="font-bold text-[var(--theme-text)]">Verbatim Provenance</span>
					<p class="mt-0.5 text-[11px]">Record your exact quotes when deciding story twists. The AI and editor will never contradict an author's verbatim locked choice.</p>
				</div>
				<div>
					<span class="font-bold text-[var(--theme-text)]">Lifecycle States</span>
					<p class="mt-0.5 text-[11px]">Click any status pill to toggle: <em>Locked ➔ Draft ➔ Superseded</em>. Superseded choices preserve historical evolution without cluttering active canon.</p>
				</div>
				<div>
					<span class="font-bold text-[var(--theme-text)]">Export & Versioning</span>
					<p class="mt-0.5 text-[11px]">Click <em>Export decisions.md</em> to copy your entire decision log as clean markdown suitable for git commits or sharing with beta readers.</p>
				</div>
			</div>
		</div>
	{/if}
</header>

<!-- New Decision Form -->
<section
	class="mt-6 max-w-4xl quiet-card p-5"
	aria-label="Record Decision"
>
	<h2 class="font-display text-base font-bold tracking-tight text-[var(--theme-text)]">Record Author Decision</h2>
	<div class="mt-3 grid gap-3 sm:grid-cols-2">
		<div>
			<label for="dec-topic" class="block font-mono text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
				Topic / Question
			</label>
			<input
				id="dec-topic"
				bind:value={newTopic}
				placeholder="e.g. Magic cost scale"
				class="quiet-field mt-1 w-full text-xs"
			/>
		</div>
		<div>
			<label for="dec-affects" class="block font-mono text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
				Affects (Bible or Scene)
			</label>
			<input
				id="dec-affects"
				bind:value={newAffects}
				placeholder="e.g. bible:magic:fire-pact, ch03"
				class="quiet-field mt-1 w-full text-xs font-mono"
			/>
		</div>
		<div class="sm:col-span-2">
			<label for="dec-text" class="block font-mono text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
				Formal Canon Decision
			</label>
			<input
				id="dec-text"
				bind:value={newDecision}
				placeholder="e.g. Magic costs memory fragments per use; mass-burn destroys personality."
				class="quiet-field mt-1 w-full text-xs"
			/>
		</div>
		<div class="sm:col-span-2">
			<label for="dec-author" class="block font-mono text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
				Author's Verbatim Words (Provenance)
			</label>
			<input
				id="dec-author"
				bind:value={newAuthorWords}
				placeholder='e.g. "Memory fragments, never blood"'
				class="quiet-field mt-1 w-full text-xs font-serif"
			/>
		</div>
	</div>
	<button
		class="quiet-primary mt-4 flex items-center gap-1.5 px-4 py-2 text-xs font-bold disabled:opacity-40"
		onclick={addDecision}
		disabled={!newTopic.trim() || !newDecision.trim()}
	>
		Lock Decision as Canon
	</button>
</section>

<!-- Filter Tabs -->
<div class="mt-8 flex max-w-4xl items-center justify-between border-b-2 border-[var(--theme-border-strong)] pb-3">
	<div class="flex flex-wrap gap-2">
		{#each ['all', 'locked', 'draft', 'superseded'] as st}
			<button
				class="{filter === st
					? 'quiet-primary !px-3 !py-1 text-xs font-bold uppercase font-mono'
					: 'quiet-ghost !px-3 !py-1 text-xs font-bold uppercase font-mono text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'}"
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
	<div class="mt-8 max-w-4xl quiet-card !border-dashed p-12 text-center">
		<div class="mx-auto flex h-14 w-14 items-center justify-center rounded-xs border-2 border-[var(--theme-border-strong)] bg-[var(--theme-surface)] text-2xl shadow-[2px_2px_0px_var(--theme-shadow-hard)]">
			⚖️
		</div>
		<h3 class="font-display mt-4 text-xl font-bold tracking-tight text-[var(--theme-text)]">
			Decisions Ledger is Empty
		</h3>
		<p class="mx-auto mt-2 max-w-md text-sm text-[var(--theme-text-muted)] font-mono">
			Record immutable story choices with your own verbatim words. When you decide a character's true motivation or magic rules, seal it here.
		</p>
		<div class="mt-6 flex flex-wrap items-center justify-center gap-3">
			<button
				class="quiet-primary !px-4 !py-2 text-xs font-bold"
				onclick={() => {
					newTopic = 'Magic Price Scale';
					newDecision = 'Magic costs small memory fragments per cast.';
					newAuthorWords = 'Small fragments per use, never physical blood';
				}}
			>
				📝 Fill Example Decision
			</button>
			<button
				class="quiet-ghost !px-4 !py-2 text-xs font-bold"
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
				class="quiet-card p-5 transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
			>
				<div class="flex items-start justify-between gap-3">
					<div>
						<div class="flex items-center gap-2">
							<span class="quiet-label font-mono text-xs font-bold text-[var(--theme-accent)]">{item.id}</span>
							<span class="font-mono text-xs text-[var(--theme-text-muted)]">{item.date}</span>
							<button
								class="cursor-pointer"
								onclick={() => toggleStatus(item.id)}
								title="Click to toggle status (locked ➔ draft ➔ superseded)"
							>
								<span class="quiet-label font-mono text-[10px] font-bold uppercase {item.status === 'locked' ? '!bg-emerald-500/10 !text-emerald-700 dark:!text-emerald-300 !border-emerald-500' : item.status === 'draft' ? '!bg-amber-500/10 !text-amber-700 dark:!text-amber-300 !border-amber-500' : ''}">
									{item.status}
								</span>
							</button>
						</div>
						<h3 class="font-display mt-2 text-lg font-bold tracking-tight text-[var(--theme-text)]">{item.topic}</h3>
					</div>
					<button
						class="quiet-ghost flex h-6 w-6 items-center justify-center p-0 text-[var(--theme-text-muted)] hover:text-rose-500 font-bold"
						onclick={() => removeDecision(item.id)}
						aria-label="Remove decision"
					>
						✕
					</button>
				</div>

				<p class="manuscript mt-2 text-sm leading-relaxed text-[var(--theme-text)]">
					{item.decision}
				</p>

				<div class="mt-3 flex flex-wrap items-center gap-4 text-xs text-[var(--theme-text-muted)] border-t-2 border-[var(--theme-border-strong)] pt-3 font-mono">
					{#if item.authorWords}
						<div>
							<span class="font-bold text-[var(--theme-text)]">Verbatim:</span>
							<span class="italic font-serif">“{item.authorWords}”</span>
						</div>
					{/if}
					{#if item.affects}
						<div>
							<span class="font-bold text-[var(--theme-text)]">Affects:</span>
							<code class="rounded-xs bg-[var(--theme-surface-subtle)] border border-[var(--theme-border-strong)] px-1.5 py-0.5 text-[11px] text-[var(--theme-text)]">
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
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
		role="dialog"
	>
		<div class="w-full max-w-lg quiet-card border-2 border-[var(--theme-border-strong)] bg-[var(--theme-surface)] p-6">
			<h2 class="font-display text-xl font-bold tracking-tight text-[var(--theme-text)]">Import decisions.md</h2>
			<p class="mt-1 font-mono text-xs text-[var(--theme-text-muted)]">
				Paste the contents of your <code>decisions.md</code> file below.
			</p>
			<textarea
				bind:value={importText}
				rows={10}
				placeholder={DEMO_DECISIONS_SAMPLE}
				class="quiet-field mt-3 w-full p-3 font-mono text-xs text-[var(--theme-text)]"
			></textarea>
			<div class="mt-4 flex justify-end gap-2 border-t-2 border-[var(--theme-border-strong)] pt-4">
				<button
					class="quiet-ghost !px-3 !py-1.5 text-xs font-bold"
					onclick={() => (showImportModal = false)}
				>
					Cancel
				</button>
				<button
					class="quiet-primary !px-4 !py-1.5 text-xs font-bold"
					onclick={doImport}
				>
					Import Decisions
				</button>
			</div>
		</div>
	</div>
{/if}
