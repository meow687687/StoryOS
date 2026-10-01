<script lang="ts">
	import {
		loadChapters,
		loadMysteries,
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

	// New Node Form State
	let showNewNodeModal = $state(false);
	let newType: MysteryNodeType = $state('clue');
	let newTitle = $state('');
	let newDesc = $state('');
	let newStatus: MysteryNodeStatus = $state('planted');
	let newChapterId = $state('');
	let newRevealOrder = $state<number | undefined>(undefined);
	let newConnectToId = $state('');

	const DEMO_MYSTERY_NODES: MysteryNode[] = [
		{
			id: 'n_myst1',
			type: 'mystery',
			title: 'Who murdered King Alden?',
			description: 'Found dead in the solar with his throat black as soot.',
			status: 'planted',
			connectedTo: ['n_clue1', 'n_herring1', 'n_rev1'],
			x: 50,
			y: 120
		},
		{
			id: 'n_clue1',
			type: 'clue',
			title: 'Vial of Weeping Hemlock',
			description: 'Discarded in the garden under the royal conservatory window.',
			status: 'planted',
			chapterId: 'c1',
			manuscriptQuote: 'He kicked an empty glass phial half-buried under wet mulch.',
			connectedTo: ['n_rev1'],
			x: 320,
			y: 60
		},
		{
			id: 'n_herring1',
			type: 'red_herring',
			title: 'The Outcast Herbalist',
			description: 'Boran was seen gathering roots by night and paid in gold.',
			status: 'planted',
			chapterId: 'c1',
			manuscriptQuote: 'Old Boran had gold coins stamped with the Cinder seal.',
			connectedTo: [],
			x: 320,
			y: 200
		},
		{
			id: 'n_rev1',
			type: 'reveal',
			title: 'Archmage Solis poisoned the King',
			description: 'Solis orchestrated the regicide to blame the Northern rebels.',
			status: 'unplanted',
			revealOrder: 4,
			connectedTo: ['n_conseq1'],
			x: 600,
			y: 100
		},
		{
			id: 'n_conseq1',
			type: 'consequence',
			title: 'Civil war erupts in Emberhold',
			description: 'The military divides between Solis loyalists and the Crown prince.',
			status: 'unplanted',
			revealOrder: 5,
			connectedTo: [],
			x: 880,
			y: 100
		}
	];

	$effect(() => {
		chapters = loadChapters();
		nodes = loadMysteries();
		if (!nodes.length) {
			nodes = DEMO_MYSTERY_NODES;
			saveMysteries(nodes);
		}
	});

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
			<h1 class="font-display text-4xl font-semibold tracking-tight text-[#1c1917]">
				Mystery & Foreshadowing Board
			</h1>
			<p class="mt-1 text-sm text-[#57534e]">
				Detective corkboard connecting Mysteries ➔ Clues ➔ Red Herrings ➔ Reveals ➔ Consequences.
				Tracks what has been planted, what remains shrouded, and guards against accidental
				spoilers.
			</p>
		</div>

		<div class="flex items-center gap-2">
			<button
				class="cursor-pointer rounded-lg bg-[#9a3412] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7c2d12]"
				onclick={() => (showNewNodeModal = true)}
			>
				+ Add Node to Board
			</button>
		</div>
	</div>
</header>

<!-- Filter & Legend Bar -->
<div class="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#e7e0d3] pb-3">
	<!-- Filter by Mystery Thread -->
	<div class="flex items-center gap-2 text-xs">
		<span class="font-semibold text-stone-600">Thread:</span>
		<select
			bind:value={selectedFilter}
			class="rounded border border-[#e7e0d3] bg-white px-2 py-1 text-xs font-medium text-stone-800 focus:outline-hidden"
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
			<span class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 {badge.bg}">
				<span>{badge.icon}</span>
				<span class="font-semibold">{badge.label}</span>
			</span>
		{/each}
	</div>
</div>

<!-- Corkboard Visual Canvas -->
<div
	class="relative mt-6 min-h-[500px] w-full rounded-2xl border-4 border-[#d6c7b2] bg-[#eadecb] p-6 shadow-inner"
	style="background-image: radial-gradient(#cbbba2 1px, transparent 1px); background-size: 20px 20px;"
>
	<div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
		{#each filteredNodes as node (node.id)}
			{@const typeBadge = getNodeBadge(node.type)}
			{@const statusBadge = getStatusBadge(node.status)}
			<article
				class="relative flex flex-col justify-between rounded-xl border border-stone-300/80 bg-white p-4 shadow-md transition-transform hover:-translate-y-1 hover:shadow-lg"
			>
				<!-- Pushpin Graphic -->
				<div class="absolute -top-2.5 left-1/2 -translate-x-1/2">
					<div class="h-4 w-4 rounded-full border border-red-800 bg-red-600 shadow-sm"></div>
				</div>

				<div>
					<div class="flex items-start justify-between gap-2 pt-1">
						<span
							class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider {typeBadge.bg}"
						>
							<span>{typeBadge.icon}</span>
							{typeBadge.label}
						</span>

						<button
							class="cursor-pointer text-stone-400 hover:text-rose-600 p-0.5 text-xs"
							onclick={() => deleteNode(node.id)}
							aria-label="Remove node"
						>
							×
						</button>
					</div>

					<h3 class="font-display mt-2 text-base font-bold text-[#1c1917] leading-snug">
						{node.title}
					</h3>

					<p class="manuscript mt-1.5 text-xs leading-relaxed text-[#44403c]">
						{node.description}
					</p>

					{#if node.manuscriptQuote}
						<blockquote class="mt-2 border-l-2 border-[#9a3412] pl-2 text-[11px] italic text-stone-600">
							“{node.manuscriptQuote}”
						</blockquote>
					{/if}
				</div>

				<!-- Footer with Status and Connectors -->
				<div class="mt-4 border-t border-stone-100 pt-2 text-[11px]">
					<div class="flex items-center justify-between">
						<button
							class="cursor-pointer rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors {statusBadge.bg}"
							onclick={() => cycleStatus(node.id)}
							title="Click to cycle status (Unplanted ➔ Planted ➔ Discovered ➔ Revealed ➔ Resolved)"
						>
							{statusBadge.label} ↻
						</button>

						{#if node.revealOrder}
							<span class="font-mono text-[10px] text-purple-700 font-semibold">
								Ch. {node.revealOrder}
							</span>
						{/if}
					</div>

					{#if node.connectedTo.length > 0}
						<div class="mt-2 text-[10px] text-stone-500">
							➔ Leads to:
							<span class="font-medium text-stone-800">
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

<!-- Add Node Modal -->
{#if showNewNodeModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
		role="dialog"
	>
		<div class="w-full max-w-lg rounded-xl border border-[#e7e0d3] bg-[#faf7f2] p-6 shadow-xl">
			<h2 class="font-display text-xl font-bold text-[#1c1917]">Add Detective Corkboard Node</h2>
			<div class="mt-4 space-y-3 text-xs">
				<div class="grid gap-3 sm:grid-cols-2">
					<div>
						<label for="node-type" class="block font-semibold text-stone-600 uppercase text-[10px]">
							Node Type
						</label>
						<select
							id="node-type"
							bind:value={newType}
							class="mt-1 w-full rounded border border-[#e7e0d3] bg-white p-2"
						>
							<option value="mystery">❓ Mystery</option>
							<option value="clue">🔍 Clue</option>
							<option value="red_herring">🐟 Red Herring</option>
							<option value="reveal">⚡ Reveal</option>
							<option value="consequence">💥 Consequence</option>
						</select>
					</div>

					<div>
						<label for="node-status" class="block font-semibold text-stone-600 uppercase text-[10px]">
							Status
						</label>
						<select
							id="node-status"
							bind:value={newStatus}
							class="mt-1 w-full rounded border border-[#e7e0d3] bg-white p-2"
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
					<label for="node-title" class="block font-semibold text-stone-600 uppercase text-[10px]">
						Title / Element Name
					</label>
					<input
						id="node-title"
						bind:value={newTitle}
						placeholder="e.g. The Queen's Poisoner or Vial of Hemlock"
						class="mt-1 w-full rounded border border-[#e7e0d3] bg-white p-2"
					/>
				</div>

				<div>
					<label for="node-desc" class="block font-semibold text-stone-600 uppercase text-[10px]">
						Description
					</label>
					<textarea
						id="node-desc"
						bind:value={newDesc}
						rows={2}
						placeholder="Explain the clue, reveal, or consequence..."
						class="mt-1 w-full rounded border border-[#e7e0d3] bg-white p-2"
					></textarea>
				</div>

				<div class="grid gap-3 sm:grid-cols-2">
					<div>
						<label for="node-parent" class="block font-semibold text-stone-600 uppercase text-[10px]">
							Connect to Existing Node
						</label>
						<select
							id="node-parent"
							bind:value={newConnectToId}
							class="mt-1 w-full rounded border border-[#e7e0d3] bg-white p-2"
						>
							<option value="">None (Root Node)</option>
							{#each nodes as n}
								<option value={n.id}>[{n.type}] {n.title}</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="node-order" class="block font-semibold text-stone-600 uppercase text-[10px]">
							Planned Reveal Chapter (for Reveals)
						</label>
						<input
							id="node-order"
							type="number"
							bind:value={newRevealOrder}
							placeholder="e.g. 4"
							class="mt-1 w-full rounded border border-[#e7e0d3] bg-white p-2"
						/>
					</div>
				</div>
			</div>

			<div class="mt-5 flex justify-end gap-2">
				<button
					class="cursor-pointer rounded-lg border border-[#e7e0d3] px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
					onclick={() => (showNewNodeModal = false)}
				>
					Cancel
				</button>
				<button
					class="cursor-pointer rounded-lg bg-[#9a3412] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#7c2d12]"
					onclick={addNode}
				>
					Pin to Board
				</button>
			</div>
		</div>
	</div>
{/if}
