<script lang="ts">
	import { onMount } from 'svelte';
	import CanonBadge from '$lib/CanonBadge.svelte';
	import {
		computeCharacterState,
		detectKnowledgeLeaks,
		loadBible,
		loadChapters,
		loadEvents,
		saveEvents,
		type CanonStatus,
		type CharacterState,
		type DisclosedSecret,
		type StateMutation,
		type StoryEvent,
		type WorldEntry
	} from '$lib/world';

	let bible: WorldEntry[] = $state([]);
	let events: StoryEvent[] = $state([]);
	let chapters = $state<import('$lib/world').Chapter[]>([]);

	// Time-Travel Inspector State
	let selectedCharacterId = $state<string>('');
	let selectedEventOrder = $state<number>(1);

	// New Event Form
	let newSceneTitle = $state('');
	let newInStoryTime = $state('');
	let newLocation = $state('');
	let newParticipantId = $state('');
	let newSecretText = $state('');
	let newMutationDesc = $state('');
	let newMutationType: StateMutation['type'] = $state('injury');

	const DEMO_EVENTS_SAMPLE: StoryEvent[] = [
		{
			id: 'ev1',
			sceneTitle: 'Chapter 1 — The Ashen Vow',
			order: 1,
			inStoryTime: 'Day 1, Morning',
			locationName: 'Emberhold Tavern',
			participantIds: ['Kael'],
			disclosures: [
				{
					id: 'sec1',
					fact: 'Kael carries the forbidden black stone of the Fire Pact',
					disclosedAtOrder: 1,
					disclosedToCharacterIds: ['Kael'],
					isPublicToReader: true
				}
			],
			mutations: [
				{
					id: 'm1',
					characterId: 'Kael',
					type: 'injury',
					description: 'Blood coughing from speaking untruths'
				},
				{
					id: 'm2',
					characterId: 'Kael',
					type: 'item_acquired',
					description: 'Ashen stone of the pact'
				}
			],
			status: 'canon'
		},
		{
			id: 'ev2',
			sceneTitle: 'Chapter 2 — Council Ambush',
			order: 2,
			inStoryTime: 'Day 2, Midnight',
			locationName: 'High Citadel Gate',
			participantIds: ['Kael', 'Mira'],
			disclosures: [
				{
					id: 'sec2',
					fact: 'The Cinder Council plans to extinguish the southern flame barriers',
					disclosedAtOrder: 2,
					disclosedToCharacterIds: ['Kael', 'Mira'],
					isPublicToReader: true
				}
			],
			mutations: [
				{
					id: 'm3',
					characterId: 'Kael',
					type: 'relationship',
					targetCharacterId: 'Mira',
					polarity: 'suspicious',
					trustDelta: -15,
					description: 'Distrusts Mira after discovering her council ties'
				}
			],
			status: 'canon'
		}
	];

	onMount(() => {
		bible = loadBible();
		chapters = loadChapters();
		events = loadEvents();

		if (!events.length) {
			events = DEMO_EVENTS_SAMPLE;
			saveEvents(events);
		}

		const chars = bible.filter((e) => e.kind === 'character');
		if (!selectedCharacterId && (chars.length || events[0]?.participantIds.length)) {
			selectedCharacterId = chars[0]?.name ?? events[0]?.participantIds[0] ?? 'Kael';
		}
		if (events.length) {
			selectedEventOrder = Math.max(...events.map((e) => e.order));
		}
	});

	const characters = $derived.by(() => {
		const fromBible = bible.filter((e) => e.kind === 'character').map((c) => c.name);
		const fromEvents = events.flatMap((e) => e.participantIds);
		return Array.from(new Set([...fromBible, ...fromEvents])).filter(Boolean);
	});

	const computedState = $derived.by<CharacterState | null>(() => {
		if (!selectedCharacterId) return null;
		return computeCharacterState(selectedCharacterId, events, selectedEventOrder);
	});

	// Global Knowledge Leak Diagnostic across chapters
	const allLeaks = $derived.by(() => {
		const leaks: { chapterTitle: string; leaks: import('$lib/world').KnowledgeLeakWarning[] }[] =
			[];
		const defaultChar = characters[0] ?? 'Kael';
		for (const ch of chapters) {
			const activeEvent = events.find((e) => e.chapterId === ch.id || e.sceneTitle === ch.title);
			const order = activeEvent ? activeEvent.order : 1;
			const pov = ch.pov || defaultChar;
			const chapterLeaks = detectKnowledgeLeaks(events, order, pov, ch.text, bible);
			if (chapterLeaks.length > 0) {
				leaks.push({ chapterTitle: ch.title, leaks: chapterLeaks });
			}
		}
		return leaks;
	});

	function addEvent() {
		if (!newSceneTitle.trim()) return;
		const nextOrder = events.length ? Math.max(...events.map((e) => e.order)) + 1 : 1;
		const eventId = `ev${Date.now().toString(36)}`;

		const disclosures: DisclosedSecret[] = [];
		if (newSecretText.trim()) {
			disclosures.push({
				id: `sec${Date.now().toString(36)}`,
				fact: newSecretText.trim(),
				disclosedAtOrder: nextOrder,
				disclosedToCharacterIds: newParticipantId ? [newParticipantId] : [],
				isPublicToReader: true
			});
		}

		const mutations: StateMutation[] = [];
		if (newMutationDesc.trim() && newParticipantId) {
			mutations.push({
				id: `mut${Date.now().toString(36)}`,
				characterId: newParticipantId,
				type: newMutationType,
				description: newMutationDesc.trim()
			});
		}

		const newEv: StoryEvent = {
			id: eventId,
			sceneTitle: newSceneTitle.trim(),
			order: nextOrder,
			inStoryTime: newInStoryTime.trim() || `Day ${nextOrder}`,
			locationName: newLocation.trim() || 'Unknown location',
			participantIds: newParticipantId ? [newParticipantId] : [],
			disclosures,
			mutations,
			status: 'canon'
		};

		events = [...events, newEv].sort((a, b) => a.order - b.order);
		saveEvents(events);

		newSceneTitle = '';
		newInStoryTime = '';
		newLocation = '';
		newSecretText = '';
		newMutationDesc = '';
	}

	function removeEvent(id: string) {
		events = events.filter((e) => e.id !== id);
		saveEvents(events);
	}

	function toggleEventStatus(id: string) {
		events = events.map((e) => {
			if (e.id !== id) return e;
			const nextStatus: CanonStatus = e.status === 'canon' ? 'draft' : 'canon';
			return { ...e, status: nextStatus };
		});
		saveEvents(events);
	}
</script>

<header class="max-w-6xl">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="font-display text-4xl font-semibold tracking-tight text-[#1c1917]">
				Timeline & Continuity Engine
			</h1>
			<p class="mt-1 text-sm text-[#57534e]">
				Track chronological sequences, character state evolution, and prevent accidental knowledge
				leaks across chapters.
			</p>
		</div>
	</div>
</header>

<!-- Global Knowledge Leak Alert Banner -->
{#if allLeaks.length > 0}
	<div
		class="mt-6 max-w-6xl rounded-xl border border-rose-300 bg-rose-50/90 p-4 shadow-xs"
		role="alert"
	>
		<div class="flex items-center gap-2 font-bold text-rose-900">
			<span>⚠️</span>
			<span>Continuity Alert: {allLeaks.flatMap((l) => l.leaks).length} Knowledge Leak(s) Detected</span>
		</div>
		<div class="mt-2 space-y-2">
			{#each allLeaks as item}
				<div class="rounded-lg bg-white/80 p-3 text-xs border border-rose-200">
					<div class="font-bold text-stone-900">{item.chapterTitle}</div>
					{#each item.leaks as leak}
						<div class="mt-1 text-rose-800">
							• {leak.reason}
						</div>
					{/each}
				</div>
			{/each}
		</div>
	</div>
{/if}

<!-- Character State Time-Travel Inspector -->
<section
	class="mt-6 max-w-6xl rounded-xl border border-[#e7e0d3] bg-[#faf7f2]/90 p-5 shadow-xs"
	aria-label="Character State Inspector"
>
	<div class="flex flex-wrap items-center justify-between gap-3 border-b border-[#e7e0d3] pb-3">
		<div class="flex items-center gap-2">
			<span class="text-lg">⏳</span>
			<h2 class="font-display text-base font-bold text-[#1c1917]">
				Character State Time-Travel Inspector
			</h2>
		</div>

		<div class="flex flex-wrap items-center gap-3">
			<label class="flex items-center gap-1.5 text-xs font-semibold text-stone-600">
				Character:
				<select
					bind:value={selectedCharacterId}
					class="rounded border border-[#e7e0d3] bg-white px-2 py-1 text-xs font-medium text-[#292524] focus:outline-hidden"
				>
					{#each characters as ch}
						<option value={ch}>{ch}</option>
					{/each}
				</select>
			</label>

			<label class="flex items-center gap-1.5 text-xs font-semibold text-stone-600">
				At Story Event:
				<select
					bind:value={selectedEventOrder}
					class="rounded border border-[#e7e0d3] bg-white px-2 py-1 text-xs font-medium text-[#292524] focus:outline-hidden"
				>
					{#each events as ev}
						<option value={ev.order}>Event {ev.order}: {ev.sceneTitle} ({ev.inStoryTime})</option>
					{/each}
				</select>
			</label>
		</div>
	</div>

	{#if computedState}
		<div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<!-- Known Secrets -->
			<div class="rounded-lg border border-[#e7e0d3] bg-white p-3 shadow-xs">
				<h3 class="text-xs font-bold uppercase tracking-wider text-[#78716c]">
					Known Secrets ({computedState.knownSecrets.length})
				</h3>
				{#if !computedState.knownSecrets.length}
					<p class="mt-2 text-xs text-stone-400 italic">No secrets disclosed yet.</p>
				{:else}
					<ul class="mt-2 space-y-1.5 text-xs text-[#292524]">
						{#each computedState.knownSecrets as s}
							<li class="rounded bg-stone-50 p-1.5 border border-stone-200/60 leading-relaxed">
								🔒 {s.fact}
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<!-- Active Injuries -->
			<div class="rounded-lg border border-[#e7e0d3] bg-white p-3 shadow-xs">
				<h3 class="text-xs font-bold uppercase tracking-wider text-[#78716c]">
					Active Injuries ({computedState.activeInjuries.length})
				</h3>
				{#if !computedState.activeInjuries.length}
					<p class="mt-2 text-xs text-stone-400 italic">Unharmed / healthy.</p>
				{:else}
					<ul class="mt-2 space-y-1.5 text-xs text-rose-900">
						{#each computedState.activeInjuries as inj}
							<li class="rounded bg-rose-50 p-1.5 border border-rose-200">
								🩹 {inj}
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<!-- Held Items & Relics -->
			<div class="rounded-lg border border-[#e7e0d3] bg-white p-3 shadow-xs">
				<h3 class="text-xs font-bold uppercase tracking-wider text-[#78716c]">
					Inventory & Relics ({computedState.itemsHeld.length})
				</h3>
				{#if !computedState.itemsHeld.length}
					<p class="mt-2 text-xs text-stone-400 italic">No specific items tracked.</p>
				{:else}
					<ul class="mt-2 space-y-1.5 text-xs text-[#292524]">
						{#each computedState.itemsHeld as it}
							<li class="rounded bg-amber-50/50 p-1.5 border border-amber-200">
								🗡️ {it}
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<!-- Relationships & Trust -->
			<div class="rounded-lg border border-[#e7e0d3] bg-white p-3 shadow-xs">
				<h3 class="text-xs font-bold uppercase tracking-wider text-[#78716c]">
					Relationships ({Object.keys(computedState.relationships).length})
				</h3>
				{#if !Object.keys(computedState.relationships).length}
					<p class="mt-2 text-xs text-stone-400 italic">Neutral to all characters.</p>
				{:else}
					<ul class="mt-2 space-y-2 text-xs">
						{#each Object.entries(computedState.relationships) as [target, rel]}
							<li class="rounded bg-stone-50 p-2 border border-stone-200">
								<div class="flex items-center justify-between font-semibold">
									<span>{target}</span>
									<span class="capitalize text-[11px] text-[#9a3412]">{rel.polarity}</span>
								</div>
								<div class="mt-1 flex items-center gap-2">
									<div class="h-1.5 w-full rounded-full bg-stone-200 overflow-hidden">
										<div
											class="h-full bg-[#9a3412]"
											style="width: {rel.trust}%"
										></div>
									</div>
									<span class="text-[10px] text-stone-500 font-mono">{rel.trust}%</span>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	{/if}
</section>

<!-- Chronological Story Event Ledger -->
<section class="mt-8 max-w-6xl" aria-label="Event Ledger">
	<div class="flex items-center justify-between border-b border-[#e7e0d3] pb-2">
		<h2 class="font-display text-xl font-bold text-[#1c1917]">
			Chronological Event Ledger ({events.length})
		</h2>
	</div>

	<!-- Add Event Quick Form -->
	<div class="mt-4 rounded-xl border border-[#e7e0d3] bg-white p-4 shadow-xs">
		<h3 class="text-xs font-bold uppercase tracking-wider text-[#78716c]">
			Log New Narrative Event
		</h3>
		<div class="mt-2 grid gap-3 sm:grid-cols-3">
			<input
				bind:value={newSceneTitle}
				placeholder="Scene title (e.g. Chapter 3 — The Siege)"
				class="rounded border border-[#e7e0d3] px-2.5 py-1.5 text-xs text-[#292524] focus:outline-hidden"
			/>
			<input
				bind:value={newInStoryTime}
				placeholder="In-story time (e.g. Day 3, Dawn)"
				class="rounded border border-[#e7e0d3] px-2.5 py-1.5 text-xs text-[#292524] focus:outline-hidden"
			/>
			<input
				bind:value={newLocation}
				placeholder="Location (e.g. Ashen Fortress)"
				class="rounded border border-[#e7e0d3] px-2.5 py-1.5 text-xs text-[#292524] focus:outline-hidden"
			/>
			<input
				bind:value={newParticipantId}
				placeholder="Lead Character / Participant (e.g. Kael)"
				list="characters-list"
				class="rounded border border-[#e7e0d3] px-2.5 py-1.5 text-xs text-[#292524] focus:outline-hidden"
			/>
			<input
				bind:value={newSecretText}
				placeholder="Secret Disclosed (e.g. The King is alive)"
				class="rounded border border-[#e7e0d3] px-2.5 py-1.5 text-xs text-[#292524] focus:outline-hidden sm:col-span-2"
			/>
			<div class="flex gap-2 sm:col-span-3">
				<select
					bind:value={newMutationType}
					class="rounded border border-[#e7e0d3] bg-white px-2 py-1.5 text-xs"
				>
					<option value="injury">Injury</option>
					<option value="item_acquired">Acquired Item</option>
					<option value="relationship">Relationship Shift</option>
				</select>
				<input
					bind:value={newMutationDesc}
					placeholder="State Mutation description (e.g. Broken left shoulder)"
					class="flex-1 rounded border border-[#e7e0d3] px-2.5 py-1.5 text-xs text-[#292524] focus:outline-hidden"
				/>
				<button
					class="cursor-pointer rounded-lg bg-[#9a3412] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#7c2d12] disabled:opacity-40"
					onclick={addEvent}
					disabled={!newSceneTitle.trim()}
				>
					Commit Event
				</button>
			</div>
			<datalist id="characters-list">
				{#each characters as ch}
					<option value={ch}></option>
				{/each}
			</datalist>
		</div>
	</div>

	<!-- Chronological Event Cards -->
	<div class="mt-6 space-y-4">
		{#each events as ev (ev.id)}
			<article
				class="rounded-xl border border-[#e7e0d3] bg-white p-5 shadow-xs transition-shadow hover:shadow-sm"
			>
				<div class="flex items-start justify-between gap-3">
					<div>
						<div class="flex items-center gap-2">
							<span class="font-mono text-xs font-bold text-[#9a3412]">Event #{ev.order}</span>
							<span class="text-xs text-stone-400">·</span>
							<span class="rounded bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">
								{ev.inStoryTime}
							</span>
							<span class="text-xs text-stone-400">·</span>
							<span class="text-xs text-stone-600">📍 {ev.locationName || 'Unknown place'}</span>
							<span class="text-xs text-stone-400">·</span>
							<button
								class="cursor-pointer"
								onclick={() => toggleEventStatus(ev.id)}
								title="Click to toggle status"
							>
								<CanonBadge status={ev.status} size="sm" />
							</button>
						</div>
						<h3 class="font-display mt-2 text-xl font-bold text-[#1c1917]">{ev.sceneTitle}</h3>
					</div>

					<button
						class="cursor-pointer text-stone-400 hover:text-rose-600 text-sm p-1"
						onclick={() => removeEvent(ev.id)}
						aria-label="Remove event"
					>
						×
					</button>
				</div>

				<div class="mt-3 grid gap-3 text-xs sm:grid-cols-3 border-t border-stone-100 pt-3">
					<!-- Participants -->
					<div>
						<span class="font-semibold text-stone-500 uppercase tracking-wider text-[10px]">
							Participants:
						</span>
						<div class="mt-1 flex flex-wrap gap-1">
							{#each ev.participantIds as p}
								<span class="rounded bg-stone-100 px-2 py-0.5 text-stone-800 font-medium">
									{p}
								</span>
							{/each}
						</div>
					</div>

					<!-- Secrets Disclosed -->
					<div>
						<span class="font-semibold text-stone-500 uppercase tracking-wider text-[10px]">
							Secrets Disclosed:
						</span>
						{#if !ev.disclosures?.length}
							<div class="mt-1 text-stone-400 italic">None in this scene</div>
						{:else}
							<ul class="mt-1 space-y-1">
								{#each ev.disclosures as d}
									<li class="text-[#292524]">
										🔒 <strong>{d.fact}</strong>
										<span class="text-[10px] text-stone-500">
											(told to: {d.disclosedToCharacterIds.join(', ')})
										</span>
									</li>
								{/each}
							</ul>
						{/if}
					</div>

					<!-- State Mutations -->
					<div>
						<span class="font-semibold text-stone-500 uppercase tracking-wider text-[10px]">
							State Mutations:
						</span>
						{#if !ev.mutations?.length}
							<div class="mt-1 text-stone-400 italic">None in this scene</div>
						{:else}
							<ul class="mt-1 space-y-1">
								{#each ev.mutations as m}
									<li class="text-[#292524]">
										<span class="font-medium text-[#9a3412] capitalize">[{m.type}]</span>
										{m.characterId}: {m.description}
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</div>
			</article>
		{/each}
	</div>
</section>
