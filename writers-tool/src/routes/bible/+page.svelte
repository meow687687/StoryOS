<script lang="ts">
	import { onMount } from 'svelte';
	import { loadAIConfig, ollamaStatus, organizeWithAI } from '$lib/ai';
	import CanonBadge from '$lib/CanonBadge.svelte';
	import {
		loadBible,
		loadSampleStory,
		parseDump,
		saveBible,
		type CanonStatus,
		type EntryKind,
		type WorldEntry
	} from '$lib/world';

	let dump = $state('');
	let dumpStatus: CanonStatus = $state('canon');
	let bible: WorldEntry[] = $state([]);
	let filterKind: 'all' | EntryKind = $state('all');
	let filterStatus: 'all' | CanonStatus = $state('all');
	let aiBusy = $state(false);
	let ollamaRunning = $state(false);
	let aiModel = $state('');
	let showHelpTips = $state(false);

	onMount(() => {
		bible = loadBible();
		const cfg = loadAIConfig();
		aiModel = cfg.model;
		if (cfg.provider === 'ollama') {
			ollamaStatus().then((s) => {
				ollamaRunning = s.running;
			});
		}
	});

	function handleLoadSample() {
		loadSampleStory();
		bible = loadBible();
	}

	const kinds: EntryKind[] = [
		'character',
		'magic',
		'place',
		'timeline',
		'faction',
		'mystery',
		'lore',
		'note'
	];

	const filteredBible = $derived.by(() => {
		return bible.filter((e) => {
			const status = e.status ?? 'canon';
			const matchKind = filterKind === 'all' || e.kind === filterKind;
			const matchStatus = filterStatus === 'all' || status === filterStatus;
			return matchKind && matchStatus;
		});
	});

	const groups = $derived.by(() => {
		return kinds
			.map((kind) => ({ kind, items: filteredBible.filter((e) => e.kind === kind) }))
			.filter((g) => g.items.length > 0);
	});

	const blockCount = $derived(dump.split(/\n\s*\n/).filter((b) => b.trim()).length);

	function organize() {
		const fresh = parseDump(dump, dumpStatus);
		if (!fresh.length) return;
		bible = [...fresh, ...bible];
		saveBible(bible);
		dump = '';
	}

	async function organizeAI() {
		if (!dump.trim() || aiBusy) return;
		aiBusy = true;
		try {
			const fresh = await organizeWithAI(loadAIConfig(), dump);
			if (fresh.length) {
				const tagged = fresh.map((e) => ({ ...e, status: dumpStatus }));
				bible = [...tagged, ...bible];
				saveBible(bible);
				dump = '';
			}
		} finally {
			aiBusy = false;
			ollamaRunning = (await ollamaStatus()).running;
		}
	}

	function setStatus(id: string, nextStatus: CanonStatus) {
		bible = bible.map((e) => (e.id === id ? { ...e, status: nextStatus } : e));
		saveBible(bible);
	}

	function addAlias(id: string) {
		const alias = prompt('Enter alias or alternate name (e.g. "The Exiled Prince"):');
		if (!alias?.trim()) return;
		bible = bible.map((e) => {
			if (e.id !== id) return e;
			const aliases = Array.from(new Set([...(e.aliases ?? []), alias.trim()]));
			return { ...e, aliases };
		});
		saveBible(bible);
	}

	function remove(id: string) {
		bible = bible.filter((e) => e.id !== id);
		saveBible(bible);
	}

	function clear() {
		if (!confirm('Delete the whole Bible?')) return;
		bible = [];
		saveBible(bible);
	}

	const sample = `Kael
A 19-year-old prince in exile. Cannot lie without coughing blood.

Fire Pact
Fire magic cannot summon water. Only bonded mages may call flame, and never at night.

Emberhold
A mountain city above the Ashen Forest. Ruled by the Cinder Council.

The Cinder Council
The governing faction of high mages maintaining the Ashen Borders.`;
</script>

<header class="max-w-4xl">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<div class="flex items-center gap-3">
				<h1 class="font-display text-4xl font-semibold tracking-tight text-[var(--theme-text)]">
					Living World Bible
				</h1>
				<button
					type="button"
					class="cursor-pointer rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--theme-text-muted)] hover:text-[var(--theme-accent)] transition-colors"
					onclick={() => (showHelpTips = !showHelpTips)}
				>
					{showHelpTips ? '✕ Close Tips' : '💡 World Bible Tips'}
				</button>
			</div>
			<p class="mt-1 max-w-[70ch] text-[15px] leading-relaxed text-[var(--theme-text-muted)]">
				Organize your characters, magic laws, factions, and lore. Only entries marked
				<strong class="text-[var(--theme-text)]">Canon</strong> trigger hard continuity constraints. Brainstorm freely in
				<strong class="text-[var(--theme-text)]">Idea</strong> and <strong class="text-[var(--theme-text)]">Draft</strong>.
			</p>
		</div>

		<div class="flex items-center gap-2">
			<a
				href="/guide"
				class="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--theme-text)] shadow-xs hover:border-[var(--theme-border-strong)]"
			>
				📖 Manual
			</a>
		</div>
	</div>

	{#if showHelpTips}
		<div class="mt-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-4 text-xs text-[var(--theme-text-muted)] shadow-xs animate-in fade-in duration-200">
			<div class="flex items-center justify-between font-bold text-[var(--theme-text)]">
				<span>World Bible & Canon Tips</span>
				<a href="/guide" class="text-[var(--theme-accent)] underline hover:opacity-80">Full Documentation →</a>
			</div>
			<div class="mt-2 grid gap-3 sm:grid-cols-3">
				<div>
					<span class="font-semibold text-[var(--theme-text)]">The 4-State Canon Lifecycle</span>
					<p class="mt-0.5 text-[11px]">Only <em>Canon</em> enforces hard contradictions during writing. <em>Draft</em> and <em>Idea</em> give you creative freedom without false-positive alarms.</p>
				</div>
				<div>
					<span class="font-semibold text-[var(--theme-text)]">Unstructured Brainstorm Dumps</span>
					<p class="mt-0.5 text-[11px]">Paste raw notes separated by blank lines. The local parser or AI librarian extracts name, category, and lore automatically.</p>
				</div>
				<div>
					<span class="font-semibold text-[var(--theme-text)]">Entity Dossier & Aliases</span>
					<p class="mt-0.5 text-[11px]">Click <em>+ alias</em> on any character or place to register monikers like "The Exiled Prince" for recognition in the manuscript editor.</p>
				</div>
			</div>
		</div>
	{/if}
</header>

<!-- Lore Dump Section -->
<div class="mt-6 max-w-4xl rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-5 shadow-xs">
	<div class="flex items-center justify-between">
		<label for="dump" class="text-sm font-semibold text-[var(--theme-text)]">
			Paste Lore / Brainstorm Dump
		</label>
		<div class="flex items-center gap-2 text-xs">
			<span class="text-[var(--theme-text-muted)]">Import as:</span>
			<select
				bind:value={dumpStatus}
				class="rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] px-2 py-1 font-medium text-[var(--theme-text)] text-xs focus:outline-hidden"
			>
				<option value="canon">Canon 🛡️ (Active Law)</option>
				<option value="draft">Draft 📝 (Work-in-progress)</option>
				<option value="idea">Idea 💡 (Raw Brainstorm)</option>
			</select>
		</div>
	</div>

	<textarea
		id="dump"
		bind:value={dump}
		rows={5}
		placeholder={sample}
		class="manuscript mt-2 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 text-[15px] text-[var(--theme-text)] shadow-xs focus:border-[var(--theme-accent)] focus:outline-hidden"
	></textarea>

	<div class="mt-3 flex flex-wrap items-center gap-2">
		<button
			class="flex min-h-[38px] cursor-pointer items-center rounded-lg bg-[var(--theme-accent)] px-4 text-xs font-semibold text-[var(--theme-accent-fg)] transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
			onclick={organize}
			disabled={!dump.trim() || aiBusy}
		>
			Organize locally{#if blockCount}
				({blockCount}){/if}
		</button>
		<button
			class="flex min-h-[38px] cursor-pointer items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 text-xs font-medium text-[var(--theme-text)] transition-colors duration-200 hover:border-[var(--theme-border-strong)] disabled:cursor-not-allowed disabled:opacity-50"
			onclick={organizeAI}
			disabled={!dump.trim() || aiBusy}
			title={ollamaRunning
				? `Librarian prompt via ${aiModel}`
				: 'Ollama offline — falls back to local organize'}
		>
			<span
				class="inline-block h-2 w-2 rounded-full"
				class:bg-emerald-500={ollamaRunning}
				class:bg-stone-400={!ollamaRunning}
				aria-hidden="true"
			></span>
			{aiBusy ? 'Librarian working…' : 'Organize with AI'}
		</button>
		<button
			class="flex min-h-[38px] cursor-pointer items-center rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 text-xs font-medium text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
			onclick={() => (dump = sample)}
		>
			Fill sample
		</button>
		<button
			class="flex min-h-[38px] cursor-pointer items-center rounded-lg px-3 text-xs text-[var(--theme-text-muted)] hover:text-rose-500 disabled:opacity-40"
			onclick={clear}
			disabled={!bible.length}
		>
			Clear bible
		</button>
	</div>
</div>

<!-- Filters Bar -->
<div class="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--theme-border)] pb-3">
	<!-- Status Tabs -->
	<div class="flex flex-wrap gap-1.5">
		{#each ['all', 'canon', 'draft', 'idea', 'rejected'] as st}
			<button
				class="cursor-pointer rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors {filterStatus ===
				st
					? 'bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] font-semibold shadow-xs'
					: 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'}"
				onclick={() => (filterStatus = st as typeof filterStatus)}
			>
				{st}
				{#if st === 'all'}
					({bible.length})
				{:else}
					({bible.filter((e) => (e.status ?? 'canon') === st).length})
				{/if}
			</button>
		{/each}
	</div>

	<!-- Kind Selector -->
	<div class="flex items-center gap-2">
		<label for="filter-kind" class="text-xs font-medium text-[var(--theme-text-muted)]">Category:</label>
		<select
			id="filter-kind"
			bind:value={filterKind}
			class="rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] px-2.5 py-1 text-xs font-medium text-[var(--theme-text)] focus:outline-hidden"
		>
			<option value="all">All Categories</option>
			{#each kinds as k}
				<option value={k}>{k}</option>
			{/each}
		</select>
	</div>
</div>

{#if !bible.length}
	<div class="mt-8 rounded-2xl border-2 border-dashed border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-12 text-center">
		<div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--theme-surface)] text-2xl shadow-xs">
			📖
		</div>
		<h3 class="font-display mt-4 text-xl font-bold text-[var(--theme-text)]">
			World Bible is Empty
		</h3>
		<p class="mx-auto mt-2 max-w-md text-sm text-[var(--theme-text-muted)]">
			Paste your lore dump above or explore our reference sample story with characters, magic laws, factions, and mysteries.
		</p>
		<div class="mt-6 flex flex-wrap items-center justify-center gap-3">
			<button
				class="cursor-pointer rounded-lg bg-[var(--theme-accent)] px-4 py-2 text-xs font-semibold text-[var(--theme-accent-fg)] hover:opacity-90 shadow-xs"
				onclick={() => (dump = sample)}
			>
				📝 Fill Sample Dump
			</button>
			<button
				class="cursor-pointer rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-2 text-xs font-semibold text-[var(--theme-text)] hover:border-[var(--theme-border-strong)] shadow-xs"
				onclick={handleLoadSample}
			>
				✨ Load Sample Story (The Ashen Vow)
			</button>
		</div>
	</div>
{:else if filteredBible.length === 0}
	<p class="mt-8 max-w-3xl text-sm text-[var(--theme-text-muted)]">
		No entries match current filters ({filterStatus} · {filterKind}).
	</p>
{:else}
	<div class="mt-6 max-w-4xl space-y-6">
		{#each groups as g (g.kind)}
			<section aria-label="{g.kind} entries">
				<div class="mb-2 flex items-center gap-2">
					<h2
						class="inline-block rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] px-3 py-1 text-xs font-bold tracking-widest text-[var(--theme-text-muted)] uppercase"
					>
						{g.kind} ({g.items.length})
					</h2>
				</div>
				<div class="grid gap-3 sm:grid-cols-2">
					{#each g.items as e (e.id)}
						<article
							class="flex flex-col justify-between rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-xs transition-shadow hover:shadow-sm"
						>
							<div>
								<div class="flex items-start justify-between gap-2">
									<div>
										<h3 class="font-display text-lg font-bold text-[var(--theme-text)]">{e.name}</h3>
										<div class="mt-1 flex items-center gap-1.5">
											<CanonBadge status={e.status ?? 'canon'} size="sm" />
											{#if e.aliases && e.aliases.length > 0}
												<span class="text-[11px] text-[var(--theme-text-muted)]">
													aka: {e.aliases.join(', ')}
												</span>
											{/if}
										</div>
									</div>
									<button
										class="cursor-pointer text-[var(--theme-text-muted)] hover:text-rose-500 p-1"
										onclick={() => remove(e.id)}
										aria-label="Remove {e.name}"
									>
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none">
											<path
												d="M6 6l12 12M18 6L6 18"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
											/>
										</svg>
									</button>
								</div>

								<p class="manuscript mt-2 text-xs leading-relaxed text-[var(--theme-text-muted)] whitespace-pre-wrap">
									{e.text}
								</p>
							</div>

							<!-- Lifecycle Actions & Aliases Footer -->
							<div class="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--theme-border)] pt-2 text-[11px]">
								<div class="flex items-center gap-1">
									<button
										class="cursor-pointer text-[var(--theme-text-muted)] hover:text-[var(--theme-accent)]"
										onclick={() => addAlias(e.id)}
									>
										+ alias
									</button>
								</div>
								<div class="flex items-center gap-1">
									{#if (e.status ?? 'canon') !== 'canon'}
										<button
											class="cursor-pointer rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
											onclick={() => setStatus(e.id, 'canon')}
										>
											Promote to Canon
										</button>
									{:else}
										<button
											class="cursor-pointer rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
											onclick={() => setStatus(e.id, 'draft')}
										>
											Demote to Draft
										</button>
									{/if}
									{#if (e.status ?? 'canon') !== 'rejected'}
										<button
											class="cursor-pointer rounded border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"
											onclick={() => setStatus(e.id, 'rejected')}
										>
											Reject
										</button>
									{/if}
								</div>
							</div>
						</article>
					{/each}
				</div>
			</section>
		{/each}
	</div>
{/if}

<p class="mt-8 max-w-4xl text-xs text-[var(--theme-text-muted)]">
	Next: <a
		href="/chapters"
		class="font-medium text-[var(--theme-accent)] underline hover:opacity-80"
	>
		Open Chapter Editor →
	</a>
	Ambient entity recognition and the Socratic Interrogator will challenge your choices and protect your canon.
</p>
