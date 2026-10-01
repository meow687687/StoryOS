<script lang="ts">
	import { loadAIConfig, ollamaStatus, organizeWithAI } from '$lib/ai';
	import CanonBadge from '$lib/CanonBadge.svelte';
	import {
		loadBible,
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

	$effect(() => {
		bible = loadBible();
		const cfg = loadAIConfig();
		aiModel = cfg.model;
		if (cfg.provider === 'ollama') {
			ollamaStatus().then((s) => {
				ollamaRunning = s.running;
			});
		}
	});

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
	<h1 class="font-display text-4xl font-semibold tracking-tight text-[#1c1917]">
		Living World Bible
	</h1>
	<p class="mt-1 max-w-[70ch] text-[15px] leading-relaxed text-[#57534e]">
		Organize your characters, magic laws, factions, and mysteries. Only entries marked
		<strong>Canon</strong> trigger hard continuity constraints. Brainstorm freely in
		<strong>Idea</strong> and <strong>Draft</strong>.
	</p>
</header>

<!-- Lore Dump Section -->
<div class="mt-6 max-w-4xl rounded-xl border border-[#e7e0d3] bg-[#faf7f2]/90 p-5 shadow-xs">
	<div class="flex items-center justify-between">
		<label for="dump" class="text-sm font-semibold text-[#1c1917]">
			Paste Lore / Brainstorm Dump
		</label>
		<div class="flex items-center gap-2 text-xs">
			<span class="text-[#78716c]">Import as:</span>
			<select
				bind:value={dumpStatus}
				class="rounded border border-[#e7e0d3] bg-white px-2 py-1 font-medium text-[#292524] text-xs focus:outline-hidden"
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
		rows={6}
		placeholder={sample}
		class="manuscript mt-2 w-full rounded-lg border border-[#e7e0d3] bg-white p-3 text-[15px] text-[#292524] shadow-xs focus:border-[#9a3412] focus:outline-hidden"
	></textarea>

	<div class="mt-3 flex flex-wrap items-center gap-2">
		<button
			class="flex min-h-[40px] cursor-pointer items-center rounded-lg bg-[#9a3412] px-4 text-xs font-medium text-white transition-colors duration-200 hover:bg-[#7c2d12] disabled:cursor-not-allowed disabled:opacity-40"
			onclick={organize}
			disabled={!dump.trim() || aiBusy}
		>
			Organize locally{#if blockCount}
				({blockCount}){/if}
		</button>
		<button
			class="flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg border border-[#9a3412] px-4 text-xs font-medium text-[#9a3412] transition-colors duration-200 hover:bg-[#9a3412]/10 disabled:cursor-not-allowed disabled:opacity-50"
			onclick={organizeAI}
			disabled={!dump.trim() || aiBusy}
			title={ollamaRunning
				? `Librarian prompt via ${aiModel}`
				: 'Ollama offline — falls back to local organize'}
		>
			<span
				class="inline-block h-2 w-2 rounded-full"
				class:bg-green-600={ollamaRunning}
				class:bg-stone-300={!ollamaRunning}
				aria-hidden="true"
			></span>
			{aiBusy ? 'Librarian working…' : 'Organize with AI'}
		</button>
		<button
			class="flex min-h-[40px] cursor-pointer items-center rounded-lg border border-[#e7e0d3] bg-white px-3 text-xs font-medium text-[#57534e] hover:bg-stone-50"
			onclick={() => (dump = sample)}
		>
			Fill sample
		</button>
		<button
			class="flex min-h-[40px] cursor-pointer items-center rounded-lg px-3 text-xs text-[#57534e] hover:bg-stone-200/50 disabled:opacity-40"
			onclick={clear}
			disabled={!bible.length}
		>
			Clear bible
		</button>
	</div>
</div>

<!-- Filters Bar -->
<div class="mt-8 flex flex-wrap items-center justify-between gap-3 border-b border-[#e7e0d3] pb-3">
	<!-- Status Tabs -->
	<div class="flex flex-wrap gap-1.5">
		{#each ['all', 'canon', 'draft', 'idea', 'rejected'] as st}
			<button
				class="cursor-pointer rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors {filterStatus ===
				st
					? 'bg-[#292524] text-white'
					: 'text-[#78716c] hover:bg-black/5 hover:text-[#1c1917]'}"
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
		<label for="filter-kind" class="text-xs font-medium text-[#78716c]">Category:</label>
		<select
			id="filter-kind"
			bind:value={filterKind}
			class="rounded border border-[#e7e0d3] bg-white px-2 py-1 text-xs font-medium text-[#292524] focus:outline-hidden"
		>
			<option value="all">All Categories</option>
			{#each kinds as k}
				<option value={k}>{k}</option>
			{/each}
		</select>
	</div>
</div>

{#if !bible.length}
	<p class="mt-8 max-w-3xl text-sm text-[#78716c]">
		No entries yet. Paste your first lore dump above or click <em>Fill sample</em> to test.
	</p>
{:else if filteredBible.length === 0}
	<p class="mt-8 max-w-3xl text-sm text-[#78716c]">
		No entries match current filters ({filterStatus} · {filterKind}).
	</p>
{:else}
	<div class="mt-6 max-w-4xl space-y-6">
		{#each groups as g (g.kind)}
			<section aria-label="{g.kind} entries">
				<div class="mb-2 flex items-center gap-2">
					<h2
						class="inline-block rounded-full border border-[#e7e0d3] bg-[#faf7f2] px-3 py-1 text-xs font-bold tracking-widest text-[#57534e] uppercase"
					>
						{g.kind} ({g.items.length})
					</h2>
				</div>
				<div class="grid gap-3 sm:grid-cols-2">
					{#each g.items as e (e.id)}
						<article
							class="flex flex-col justify-between rounded-xl border border-[#e7e0d3] bg-white p-4 shadow-xs transition-shadow hover:shadow-sm"
						>
							<div>
								<div class="flex items-start justify-between gap-2">
									<div>
										<h3 class="font-display text-lg font-bold text-[#1c1917]">{e.name}</h3>
										<div class="mt-1 flex items-center gap-1.5">
											<CanonBadge status={e.status ?? 'canon'} size="sm" />
											{#if e.aliases && e.aliases.length > 0}
												<span class="text-[11px] text-stone-500">
													aka: {e.aliases.join(', ')}
												</span>
											{/if}
										</div>
									</div>
									<button
										class="cursor-pointer text-stone-400 hover:text-rose-600 p-1"
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

								<p class="manuscript mt-2 text-xs leading-relaxed text-[#44403c] whitespace-pre-wrap">
									{e.text}
								</p>
							</div>

							<!-- Lifecycle Actions & Aliases Footer -->
							<div class="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-2 text-[11px]">
								<div class="flex items-center gap-1">
									<button
										class="cursor-pointer text-stone-500 hover:text-[#9a3412]"
										onclick={() => addAlias(e.id)}
									>
										+ alias
									</button>
								</div>
								<div class="flex items-center gap-1">
									{#if (e.status ?? 'canon') !== 'canon'}
										<button
											class="cursor-pointer rounded bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800 hover:bg-emerald-100"
											onclick={() => setStatus(e.id, 'canon')}
										>
											Promote to Canon
										</button>
									{:else}
										<button
											class="cursor-pointer rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-800 hover:bg-amber-100"
											onclick={() => setStatus(e.id, 'draft')}
										>
											Demote to Draft
										</button>
									{/if}
									{#if (e.status ?? 'canon') !== 'rejected'}
										<button
											class="cursor-pointer rounded bg-rose-50 px-2 py-0.5 font-medium text-rose-800 hover:bg-rose-100"
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

<p class="mt-8 max-w-4xl text-xs text-[#78716c]">
	Next: <a
		href="/chapters"
		class="font-medium text-[#9a3412] underline decoration-[#9a3412]/30 hover:decoration-[#9a3412]"
	>
		Open Chapter Editor →
	</a>
	Ambient entity recognition and the Socratic Interrogator will challenge your choices and protect your canon.
</p>
