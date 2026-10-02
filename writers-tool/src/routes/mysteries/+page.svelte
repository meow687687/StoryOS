<script lang="ts">
	import { onMount } from 'svelte';
	import {
		loadChapters,
		loadMysteries,
		loadSampleStory,
		saveMysteries,
		type Chapter,
		type MysteryNode,
		type MysteryNodeStatus,
		type MysteryNodeType
	} from '$lib/world';

	let nodes: MysteryNode[] = $state([]);
	let chapters = $state<Chapter[]>([]);
	let selectedFilter = $state<string>('all');
	let activeNode = $state<MysteryNode | null>(null);
	let showHelpTips = $state(false);

	// New Node Form State
	let showNewNodeModal = $state(false);
	let newType: MysteryNodeType = $state('clue');
	let newTitle = $state('');
	let newDesc = $state('');
	let newStatus: MysteryNodeStatus = $state('planted');
	let newChapterId = $state('');
	let newRevealOrder = $state<number | undefined>(undefined);
	let newConnectToId = $state('');

	onMount(() => {
		chapters = loadChapters();
		nodes = loadMysteries();
	});

	function handleLoadSample() {
		loadSampleStory();
		chapters = loadChapters();
		nodes = loadMysteries();
	}

	const mysteriesList = $derived(nodes.filter((n) => n.type === 'mystery'));

	const filteredNodes = $derived.by(() => {
		if (selectedFilter === 'all') return nodes;
		const selectedMystery = nodes.find((n) => n.id === selectedFilter);
		if (!selectedMystery) return nodes;
		const relatedIds = new Set([selectedMystery.id, ...selectedMystery.connectedTo]);
		for (const n of nodes) {
			if (n.connectedTo.some((id) => relatedIds.has(id))) {
				relatedIds.add(n.id);
			}
		}
		return nodes.filter((n) => relatedIds.has(n.id));
	});

	function getNodeBadge(type: MysteryNodeType) {
		switch (type) {
			case 'mystery':
				return { label: 'Mystery', icon: '❓', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
			case 'clue':
				return { label: 'Clue', icon: '🔍', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
			case 'red_herring':
				return { label: 'Red Herring', icon: '🐟', bg: 'bg-rose-100 text-rose-900 border-rose-300' };
			case 'reveal':
				return { label: 'Reveal', icon: '⚡', bg: 'bg-purple-100 text-purple-900 border-purple-300' };
			case 'consequence':
				return { label: 'Consequence', icon: '💥', bg: 'bg-orange-100 text-orange-900 border-orange-300' };
		}
	}

	function getStatusBadge(status: MysteryNodeStatus) {
		switch (status) {
			case 'unplanted':
				return { label: 'Unplanted', bg: 'bg-stone-100 text-stone-600 border-stone-300' };
			case 'planted':
				return { label: 'Planted', bg: 'bg-sky-50 text-sky-800 border-sky-300' };
			case 'discovered':
				return { label: 'Discovered', bg: 'bg-amber-50 text-amber-800 border-amber-300' };
			case 'revealed':
				return { label: 'Revealed', bg: 'bg-purple-50 text-purple-800 border-purple-300' };
			case 'resolved':
				return { label: 'Resolved', bg: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
		}
	}

	function cycleStatus(id: string) {
		const order: MysteryNodeStatus[] = [
			'unplanted',
			'planted',
			'discovered',
			'revealed',
			'resolved'
		];
		nodes = nodes.map((n) => {
			if (n.id !== id) return n;
			const nextIdx = (order.indexOf(n.status) + 1) % order.length;
			return { ...n, status: order[nextIdx] };
		});
		saveMysteries(nodes);
	}

	function addNode() {
		if (!newTitle.trim()) return;
		const id = `n_${Date.now().toString(36)}`;
		const newNode: MysteryNode = {
			id,
			type: newType,
			title: newTitle.trim(),
			description: newDesc.trim(),
			status: newStatus,
			chapterId: newChapterId || undefined,
			revealOrder: newRevealOrder,
			connectedTo: [],
			x: 100,
			y: 100
		};

		// If connected to parent node, link parent to child
		if (newConnectToId) {
			nodes = nodes.map((n) => {
				if (n.id === newConnectToId) {
					return { ...n, connectedTo: [...n.connectedTo, id] };
				}
				return n;
			});
		}

		nodes = [...nodes, newNode];
		saveMysteries(nodes);

		newTitle = '';
		newDesc = '';
		newConnectToId = '';
		showNewNodeModal = false;
	}

	function deleteNode(id: string) {
		nodes = nodes
			.filter((n) => n.id !== id)
			.map((n) => ({ ...n, connectedTo: n.connectedTo.filter((cid) => cid !== id) }));
		saveMysteries(nodes);
		if (activeNode?.id === id) activeNode = null;
	}
</script>

<header class="max-w-6xl">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<div class="flex items-center gap-3">
				<h1 class="font-display text-4xl font-extrabold tracking-tight text-[var(--theme-text)]">
					Mystery & Foreshadowing Board
				</h1>
				<button
					type="button"
					class="neo-btn px-2.5 py-0.5 text-[11px] font-mono font-bold"
					onclick={() => (showHelpTips = !showHelpTips)}
				>
					{showHelpTips ? '✕ Close Tips' : '💡 Mystery Board Tips'}
				</button>
			</div>
			<p class="mt-1 font-mono text-xs text-[var(--theme-text-muted)]">
				Detective corkboard connecting Mysteries ➔ Clues ➔ Red Herrings ➔ Reveals ➔ Consequences.
				Tracks what has been planted, what remains shrouded, and guards against accidental spoilers.
			</p>
		</div>

		<div class="flex items-center gap-2">
			<a
				href="/guide"
				class="neo-btn !px-3 !py-1.5 text-xs font-bold"
			>
				📖 Manual
			</a>
			<button
				class="neo-btn-primary !px-4 !py-2 text-xs font-bold"
				onclick={() => (showNewNodeModal = true)}
			>
				+ Add Node to Board
			</button>
		</div>
	</div>

	{#if showHelpTips}
		<div class="mt-4 neo-box-sm bg-[var(--theme-surface-subtle)] p-4 text-xs text-[var(--theme-text-muted)] animate-in fade-in duration-200">
			<div class="flex items-center justify-between font-bold text-[var(--theme-text)]">
				<span class="font-mono text-xs uppercase tracking-wider">Mystery & Foreshadowing Board Quick Tips</span>
				<a href="/guide" class="text-[var(--theme-accent)] underline font-bold hover:opacity-80">Full Documentation →</a>
			</div>
			<div class="mt-2 grid gap-3 sm:grid-cols-3">
				<div>
					<span class="font-bold text-[var(--theme-text)]">The Mystery Pipeline</span>
					<p class="mt-0.5 text-[11px]">Connect core mysteries to evidence clues, misleading red herrings, eventual dramatic reveals, and downstream consequences.</p>
				</div>
				<div>
					<span class="font-bold text-[var(--theme-text)]">Lifecycle Statuses</span>
					<p class="mt-0.5 text-[11px]">Click any node's status pill to cycle: <em>Unplanted ➔ Planted ➔ Discovered ➔ Revealed ➔ Resolved</em> as manuscript events unfold.</p>
				</div>
				<div>
					<span class="font-bold text-[var(--theme-text)]">Accidental Spoilers</span>
					<p class="mt-0.5 text-[11px]">Reveal order tags tie to planned chapters. The Reader Perspective Mode flags anytime a clue reveals its payoff prematurely.</p>
				</div>
			</div>
		</div>
	{/if}
</header>

<!-- Filter & Legend Bar -->
<div class="mt-6 flex flex-wrap items-center justify-between gap-3 border-b-2 border-[var(--theme-border-strong)] pb-3">
	<!-- Filter by Mystery Thread -->
	<div class="flex items-center gap-2 text-xs">
		<span class="font-mono font-bold text-[var(--theme-text-muted)] uppercase">Thread:</span>
		<select
			bind:value={selectedFilter}
			class="neo-input !py-1 text-xs font-mono font-bold"
		>
			<option value="all">All Threads ({nodes.length} nodes)</option>
			{#each mysteriesList as m}
				<option value={m.id}>{m.title}</option>
			{/each}
		</select>
	</div>

	<!-- Legend -->
	<div class="flex flex-wrap items-center gap-2 text-[11px]">
		{#each ['mystery', 'clue', 'red_herring', 'reveal', 'consequence'] as t}
			{@const badge = getNodeBadge(t as MysteryNodeType)}
			<span class="inline-flex items-center gap-1 rounded-xs border-2 border-[var(--theme-border-strong)] px-2 py-0.5 font-mono font-bold text-[10px] {badge.bg} shadow-[1.5px_1.5px_0px_var(--theme-shadow-hard)]">
				<span>{badge.icon}</span>
				<span>{badge.label}</span>
			</span>
		{/each}
	</div>
</div>

{#if nodes.length === 0}
	<!-- Empty State -->
	<div class="mt-8 neo-box-sm !border-dashed p-12 text-center">
		<div class="mx-auto flex h-14 w-14 items-center justify-center rounded-xs border-2 border-[var(--theme-border-strong)] bg-[var(--theme-surface)] text-2xl shadow-[2px_2px_0px_var(--theme-shadow-hard)]">
			📌
		</div>
		<h3 class="font-display mt-4 text-xl font-bold tracking-tight text-[var(--theme-text)]">
			Mystery Corkboard is Empty
		</h3>
		<p class="mx-auto mt-2 max-w-md text-sm text-[var(--theme-text-muted)] font-mono">
			Plot your plot twists, hidden daggers, poisoned cups, and false leads. Connect them visually so your readers never catch an unearned reveal.
		</p>
		<div class="mt-6 flex flex-wrap items-center justify-center gap-3">
			<button
				class="neo-btn-primary !px-4 !py-2 text-xs font-bold"
				onclick={() => {
					newType = 'mystery';
					showNewNodeModal = true;
				}}
			>
				+ Add First Mystery
			</button>
			<button
				class="neo-btn !px-4 !py-2 text-xs font-bold"
				onclick={handleLoadSample}
			>
				✨ Load Sample Story (The Ashen Vow)
			</button>
		</div>
	</div>
{:else}
	<!-- Corkboard Visual Canvas -->
	<div
		class="relative mt-6 min-h-[500px] w-full rounded-2xl border-2 border-[var(--theme-border-strong)] p-6 shadow-[inset_0_4px_12px_rgba(0,0,0,0.25),0_2px_4px_rgba(0,0,0,0.1)]"
		style="background: linear-gradient(135deg, rgba(160, 110, 60, 0.08) 0%, rgba(120, 80, 40, 0.14) 100%), var(--theme-surface-subtle); background-image: radial-gradient(var(--theme-border-strong) 1.5px, transparent 1.5px); background-size: 22px 22px;"
	>
		<div class="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
			{#each filteredNodes as node (node.id)}
				{@const typeBadge = getNodeBadge(node.type)}
				{@const statusBadge = getStatusBadge(node.status)}
				<article
					class="relative flex flex-col justify-between skeuo-paper p-4 transition-all hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.2)]"
				>
					<!-- 3D Pushpin Graphic -->
					<div class="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center pointer-events-none">
						<div class="h-4 w-4 rounded-full bg-gradient-to-tr from-rose-700 via-rose-500 to-rose-300 border border-rose-900 shadow-[0_3px_5px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.7)]"></div>
						<div class="h-1.5 w-1 bg-stone-700 -mt-0.5 rounded-b-xs shadow-[1px_1px_2px_rgba(0,0,0,0.3)]"></div>
					</div>

					<div>
						<div class="flex items-start justify-between gap-2 pt-1">
							<span
								class="inline-flex items-center gap-1 rounded-md border border-[var(--theme-border-strong)] px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider {typeBadge.bg} shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.4)]"
							>
								<span>{typeBadge.icon}</span>
								{typeBadge.label}
							</span>

							<button
								class="neo-btn flex h-6 w-6 items-center justify-center p-0 text-[var(--theme-text-muted)] hover:text-rose-500 font-bold"
								onclick={() => deleteNode(node.id)}
								aria-label="Remove node"
							>
								✕
							</button>
						</div>

						<h3 class="font-display mt-3 text-base font-bold text-[var(--theme-text)] leading-snug">
							{node.title}
						</h3>

						<p class="manuscript mt-1.5 text-xs leading-relaxed text-[var(--theme-text-muted)]">
							{node.description}
						</p>

						{#if node.manuscriptQuote}
							<blockquote class="mt-2 border-l-2 border-[var(--theme-accent)] pl-2 text-[11px] italic text-[var(--theme-text-muted)] font-mono">
								“{node.manuscriptQuote}”
							</blockquote>
						{/if}
					</div>

					<!-- Footer with Status and Connectors -->
					<div class="mt-4 border-t-2 border-[var(--theme-border-strong)] pt-2 text-[11px]">
						<div class="flex items-center justify-between">
							<button
								class="cursor-pointer rounded-xs border-2 border-[var(--theme-border-strong)] px-2 py-0.5 text-[10px] font-mono font-bold transition-transform active:translate-x-[1px] active:translate-y-[1px] {statusBadge.bg} shadow-[1px_1px_0px_var(--theme-shadow-hard)]"
								onclick={() => cycleStatus(node.id)}
								title="Click to cycle status (Unplanted ➔ Planted ➔ Discovered ➔ Revealed ➔ Resolved)"
							>
								{statusBadge.label} ↻
							</button>

							{#if node.revealOrder}
								<span class="font-mono text-[10px] font-bold text-[var(--theme-accent)]">
									[Ch. {node.revealOrder}]
								</span>
							{/if}
						</div>

						{#if node.connectedTo.length > 0}
							<div class="mt-2 text-[10px] text-[var(--theme-text-muted)] font-mono">
								➔ Leads to:
								<span class="font-bold text-[var(--theme-text)]">
									{node.connectedTo
										.map((id) => nodes.find((n) => n.id === id)?.title ?? id)
										.join(', ')}
								</span>
							</div>
						{/if}
					</div>
				</article>
			{/each}
		</div>
	</div>
{/if}

<!-- Add Node Modal -->
{#if showNewNodeModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
		role="dialog"
	>
		<div class="w-full max-w-lg neo-box-lg border-2 border-[var(--theme-border-strong)] bg-[var(--theme-surface)] p-6">
			<h2 class="font-display text-xl font-bold tracking-tight text-[var(--theme-text)]">Add Detective Corkboard Node</h2>
			<div class="mt-4 space-y-3 text-xs">
				<div class="grid gap-3 sm:grid-cols-2">
					<div>
						<label for="node-type" class="block font-mono font-bold text-[var(--theme-text-muted)] uppercase text-[10px]">
							Node Type
						</label>
						<select
							id="node-type"
							bind:value={newType}
							class="neo-input mt-1 w-full text-xs font-mono font-bold"
						>
							<option value="mystery">❓ Mystery</option>
							<option value="clue">🔍 Clue</option>
							<option value="red_herring">🐟 Red Herring</option>
							<option value="reveal">⚡ Reveal</option>
							<option value="consequence">💥 Consequence</option>
						</select>
					</div>

					<div>
						<label for="node-status" class="block font-mono font-bold text-[var(--theme-text-muted)] uppercase text-[10px]">
							Status
						</label>
						<select
							id="node-status"
							bind:value={newStatus}
							class="neo-input mt-1 w-full text-xs font-mono font-bold"
						>
							<option value="unplanted">Unplanted</option>
							<option value="planted">Planted</option>
							<option value="discovered">Discovered</option>
							<option value="revealed">Revealed</option>
							<option value="resolved">Resolved</option>
						</select>
					</div>
				</div>

				<div>
					<label for="node-title" class="block font-mono font-bold text-[var(--theme-text-muted)] uppercase text-[10px]">
						Title / Element Name
					</label>
					<input
						id="node-title"
						bind:value={newTitle}
						placeholder="e.g. The Queen's Poisoner or Vial of Hemlock"
						class="neo-input mt-1 w-full text-xs"
					/>
				</div>

				<div>
					<label for="node-desc" class="block font-mono font-bold text-[var(--theme-text-muted)] uppercase text-[10px]">
						Description
					</label>
					<textarea
						id="node-desc"
						bind:value={newDesc}
						rows={2}
						placeholder="Explain the clue, reveal, or consequence..."
						class="neo-input mt-1 w-full text-xs"
					></textarea>
				</div>

				<div class="grid gap-3 sm:grid-cols-2">
					<div>
						<label for="node-parent" class="block font-mono font-bold text-[var(--theme-text-muted)] uppercase text-[10px]">
							Connect to Existing Node
						</label>
						<select
							id="node-parent"
							bind:value={newConnectToId}
							class="neo-input mt-1 w-full text-xs font-mono"
						>
							<option value="">None (Root Node)</option>
							{#each nodes as n}
								<option value={n.id}>[{n.type}] {n.title}</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="node-order" class="block font-mono font-bold text-[var(--theme-text-muted)] uppercase text-[10px]">
							Planned Reveal Chapter (for Reveals)
						</label>
						<input
							id="node-order"
							type="number"
							bind:value={newRevealOrder}
							placeholder="e.g. 4"
							class="neo-input mt-1 w-full text-xs font-mono"
						/>
					</div>
				</div>
			</div>

			<div class="mt-5 flex justify-end gap-2 border-t-2 border-[var(--theme-border-strong)] pt-4">
				<button
					class="neo-btn !px-3 !py-1.5 text-xs font-bold"
					onclick={() => (showNewNodeModal = false)}
				>
					Cancel
				</button>
				<button
					class="neo-btn-primary !px-4 !py-1.5 text-xs font-bold"
					onclick={addNode}
				>
					Pin to Board
				</button>
			</div>
		</div>
	</div>
{/if}
