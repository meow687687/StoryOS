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

	let showHelpTips = $state(false);

	onMount(() => {
		bible = loadBible();
		chapters = loadChapters();
		events = loadEvents();

		const chars = bible.filter((e) => e.kind === 'character');
		if (!selectedCharacterId && (chars.length || events[0]?.participantIds.length)) {
			selectedCharacterId = chars[0]?.name ?? events[0]?.participantIds[0] ?? '';
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
			<div class="flex items-center gap-3">
				<h1 class="font-display text-4xl font-semibold tracking-tight text-[var(--theme-text)]">
					Timeline & Continuity Engine
				</h1>
				<button
					type="button"
					class="cursor-pointer rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--theme-text-muted)] hover:text-[var(--theme-accent)] transition-colors"
					onclick={() => (showHelpTips = !showHelpTips)}
				>
					{showHelpTips ? '✕ Close Guide' : '💡 Timeline Tips'}
				</button>
			</div>
			<p class="mt-1 text-sm text-[var(--theme-text-muted)]">
				Track chronological sequences, character state evolution, and prevent accidental knowledge
				leaks across chapters.
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
				<span>Timeline & Continuity Engine Guide</span>
				<a href="/guide" class="text-[var(--theme-accent)] underline hover:opacity-80">Full Documentation →</a>
			</div>
			<div class="mt-2 grid gap-3 sm:grid-cols-3">
				<div>
					<span class="font-semibold text-[var(--theme-text)]">Time-Travel Scrubber</span>
					<p class="mt-0.5 text-[11px]">Select any character and scrub the event dropdown to inspect their exact injuries, held items, and secrets known at that narrative moment.</p>
				</div>
				<div>
					<span class="font-semibold text-[var(--theme-text)]">Knowledge Leak Radar</span>
					<p class="mt-0.5 text-[11px]">Automatically flags when a POV character mentions secrets they were never told, or references future events before they happened.</p>
				</div>
				<div>
					<span class="font-semibold text-[var(--theme-text)]">State Mutations</span>
					<p class="mt-0.5 text-[11px]">Log injuries gained, relics acquired, and relationship trust changes that dynamically recalculate downstream states.</p>
				</div>
			</div>
		</div>
	{/if}
</header>

<!-- Global Knowledge Leak Alert Banner -->
{#if allLeaks.length > 0}
	<div
		class="mt-6 max-w-6xl rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 shadow-xs"
		role="alert"
	>
		<div class="flex items-center gap-2 font-bold text-rose-500">
			<span>⚠️</span>
			<span>Continuity Alert: {allLeaks.flatMap((l) => l.leaks).length} Knowledge Leak(s) Detected</span>
		</div>
		<div class="mt-2 space-y-2">
			{#each allLeaks as item}
				<div class="rounded-lg bg-[var(--theme-surface)] p-3 text-xs border border-rose-500/20 text-[var(--theme-text)]">
					<div class="font-bold text-[var(--theme-text)]">{item.chapterTitle}</div>
					{#each item.leaks as leak}
						<div class="mt-1 text-rose-500">
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
	class="mt-6 max-w-6xl rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 shadow-xs"
	aria-label="Character State Inspector"
>
	<div class="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--theme-border)] pb-3">
		<div class="flex items-center gap-2">
			<span class="text-lg">⏳</span>
			<h2 class="font-display text-base font-bold text-[var(--theme-text)]">
				Character State Time-Travel Inspector
			</h2>
		</div>

		<div class="flex flex-wrap items-center gap-3">
			<label class="flex items-center gap-1.5 text-xs font-semibold text-[var(--theme-text-muted)]">
				Character:
				<select
					bind:value={selectedCharacterId}
					class="rounded border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] px-2 py-1 text-xs font-medium text-[var(--theme-text)] focus:outline-hidden"
				>
					{#if !characters.length}
						<option value="">No characters yet</option>
					{/if}
					{#each characters as ch}
						<option value={ch}>{ch}</option>
					{/each}
				</select>
			</label>

			<label class="flex items-center gap-1.5 text-xs font-semibold text-[var(--theme-text-muted)]">
				At Story Event:
				<select
					bind:value={selectedEventOrder}
					class="rounded border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] px-2 py-1 text-xs font-medium text-[var(--theme-text)] focus:outline-hidden"
				>
					{#if !events.length}
						<option value={1}>Event 1 (Genesis)</option>
					{/if}
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
			<div class="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-xs">
				<h3 class="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
					Known Secrets ({computedState.knownSecrets.length})
				</h3>
				{#if !computedState.knownSecrets.length}
					<p class="mt-2 text-xs text-[var(--theme-text-faint)] italic">No secrets disclosed yet.</p>
				{:else}
					<ul class="mt-2 space-y-1.5 text-xs text-[var(--theme-text)]">
						{#each computedState.knownSecrets as s}
							<li class="rounded bg-[var(--theme-surface-subtle)] p-1.5 border border-[var(--theme-border)] leading-relaxed">
								🔒 {s.fact}
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<!-- Active Injuries -->
			<div class="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-xs">
				<h3 class="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
					Active Injuries ({computedState.activeInjuries.length})
				</h3>
				{#if !computedState.activeInjuries.length}
					<p class="mt-2 text-xs text-[var(--theme-text-faint)] italic">Unharmed / healthy.</p>
				{:else}
					<ul class="mt-2 space-y-1.5 text-xs text-rose-500">
						{#each computedState.activeInjuries as inj}
							<li class="rounded bg-rose-500/10 p-1.5 border border-rose-500/20">
								🩹 {inj}
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<!-- Held Items & Relics -->
			<div class="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-xs">
				<h3 class="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
					Inventory & Relics ({computedState.itemsHeld.length})
				</h3>
				{#if !computedState.itemsHeld.length}
					<p class="mt-2 text-xs text-[var(--theme-text-faint)] italic">No specific items tracked.</p>
				{:else}
					<ul class="mt-2 space-y-1.5 text-xs text-[var(--theme-text)]">
						{#each computedState.itemsHeld as it}
							<li class="rounded bg-[var(--theme-surface-subtle)] p-1.5 border border-[var(--theme-border)]">
								🗡️ {it}
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<!-- Relationships & Trust -->
			<div class="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-xs">
				<h3 class="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
					Relationships ({Object.keys(computedState.relationships).length})
				</h3>
				{#if !Object.keys(computedState.relationships).length}
					<p class="mt-2 text-xs text-[var(--theme-text-faint)] italic">Neutral to all characters.</p>
				{:else}
					<ul class="mt-2 space-y-2 text-xs">
						{#each Object.entries(computedState.relationships) as [target, rel]}
							<li class="rounded bg-[var(--theme-surface-subtle)] p-2 border border-[var(--theme-border)]">
								<div class="flex items-center justify-between font-semibold">
									<span>{target}</span>
									<span class="capitalize text-[11px] text-[var(--theme-accent)]">{rel.polarity}</span>
								</div>
								<div class="mt-1 flex items-center gap-2">
									<div class="h-1.5 w-full rounded-full bg-[var(--theme-border)] overflow-hidden">
										<div
											class="h-full bg-[var(--theme-accent)]"
											style="width: {rel.trust}%"
										></div>
									</div>
									<span class="text-[10px] text-[var(--theme-text-faint)] font-mono">{rel.trust}%</span>
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
	<div class="flex items-center justify-between border-b border-[var(--theme-border)] pb-2">
		<h2 class="font-display text-xl font-bold text-[var(--theme-text)]">
			Chronological Event Ledger ({events.length})
		</h2>
	</div>

	{#if events.length === 0}
		<div class="my-6 rounded-2xl border border-dashed border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-8 text-center max-w-2xl mx-auto space-y-3">
			<div class="text-3xl">⏳</div>
			<h3 class="font-display text-lg font-bold text-[var(--theme-text)]">Your Timeline is Empty</h3>
			<p class="text-xs text-[var(--theme-text-muted)] leading-relaxed">
				Log sequential story scenes below to track character states, physical injuries, acquired inventory items, and dynamic relationship shifts across narrative time.
			</p>
			<div class="flex items-center justify-center gap-2.5 pt-1">
				<a
					href="/guide"
					class="cursor-pointer rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--theme-text)] shadow-xs hover:border-[var(--theme-border-strong)]"
				>
					✨ Load Sample Story
				</a>
			</div>
		</div>
	{/if}

	<!-- Add Event Quick Form -->
	<div class="mt-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-xs">
		<h3 class="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
			Log New Narrative Event
		</h3>
		<div class="mt-2 grid gap-3 sm:grid-cols-3">
			<input
				bind:value={newSceneTitle}
				placeholder="Scene title (e.g. The Siege)"
				class="rounded border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] px-2.5 py-1.5 text-xs text-[var(--theme-text)] placeholder:text-[var(--theme-text-faint)] focus:outline-hidden"
			/>
			<input
				bind:value={newInStoryTime}
				placeholder="In-story time (e.g. Day 3, Dawn)"
				class="rounded border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] px-2.5 py-1.5 text-xs text-[var(--theme-text)] placeholder:text-[var(--theme-text-faint)] focus:outline-hidden"
			/>
			<input
				bind:value={newLocation}
				placeholder="Location (e.g. Ashen Fortress)"
				class="rounded border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] px-2.5 py-1.5 text-xs text-[var(--theme-text)] placeholder:text-[var(--theme-text-faint)] focus:outline-hidden"
			/>
			<input
				bind:value={newParticipantId}
				placeholder="Lead Character / Participant (e.g. Lucan)"
				list="characters-list"
				class="rounded border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] px-2.5 py-1.5 text-xs text-[var(--theme-text)] placeholder:text-[var(--theme-text-faint)] focus:outline-hidden"
			/>
			<input
				bind:value={newSecretText}
				placeholder="Secret Disclosed (e.g. The King is alive)"
				class="rounded border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] px-2.5 py-1.5 text-xs text-[var(--theme-text)] placeholder:text-[var(--theme-text-faint)] focus:outline-hidden sm:col-span-2"
			/>
			<div class="flex gap-2 sm:col-span-3">
				<select
					bind:value={newMutationType}
					class="rounded border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] px-2 py-1.5 text-xs text-[var(--theme-text)]"
				>
					<option value="injury">Injury</option>
					<option value="item_acquired">Acquired Item</option>
					<option value="relationship">Relationship Shift</option>
				</select>
				<input
					bind:value={newMutationDesc}
					placeholder="State Mutation description (e.g. Broken left shoulder)"
					class="flex-1 rounded border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] px-2.5 py-1.5 text-xs text-[var(--theme-text)] placeholder:text-[var(--theme-text-faint)] focus:outline-hidden"
				/>
				<button
					class="cursor-pointer rounded-lg bg-[var(--theme-accent)] px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 disabled:opacity-40"
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
				class="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 shadow-xs transition-shadow hover:shadow-sm"
			>
				<div class="flex items-start justify-between gap-3">
					<div>
						<div class="flex items-center gap-2">
							<span class="font-mono text-xs font-bold text-[var(--theme-accent)]">Event #{ev.order}</span>
							<span class="text-xs text-[var(--theme-text-faint)]">·</span>
							<span class="rounded bg-[var(--theme-surface-subtle)] px-2 py-0.5 text-xs font-medium text-[var(--theme-text)]">
								{ev.inStoryTime}
							</span>
							<span class="text-xs text-[var(--theme-text-faint)]">·</span>
							<span class="text-xs text-[var(--theme-text-muted)]">📍 {ev.locationName || 'Unknown place'}</span>
							<span class="text-xs text-[var(--theme-text-faint)]">·</span>
							<button
								class="cursor-pointer"
								onclick={() => toggleEventStatus(ev.id)}
								title="Click to toggle status"
							>
								<CanonBadge status={ev.status} size="sm" />
							</button>
						</div>
						<h3 class="font-display mt-2 text-xl font-bold text-[var(--theme-text)]">{ev.sceneTitle}</h3>
					</div>

					<button
						class="cursor-pointer text-[var(--theme-text-faint)] hover:text-rose-500 text-sm p-1"
						onclick={() => removeEvent(ev.id)}
						aria-label="Remove event"
					>
						×
					</button>
				</div>

				<div class="mt-3 grid gap-3 text-xs sm:grid-cols-3 border-t border-[var(--theme-border)] pt-3">
					<!-- Participants -->
					<div>
						<span class="font-semibold text-[var(--theme-text-muted)] uppercase tracking-wider text-[10px]">
							Participants:
						</span>
						<div class="mt-1 flex flex-wrap gap-1">
							{#each ev.participantIds as p}
								<span class="rounded bg-[var(--theme-surface-subtle)] px-2 py-0.5 text-[var(--theme-text)] font-medium">
									{p}
								</span>
							{/each}
						</div>
					</div>

					<!-- Secrets Disclosed -->
					<div>
						<span class="font-semibold text-[var(--theme-text-muted)] uppercase tracking-wider text-[10px]">
							Secrets Disclosed:
						</span>
						{#if !ev.disclosures?.length}
							<div class="mt-1 text-[var(--theme-text-faint)] italic">None in this scene</div>
						{:else}
							<ul class="mt-1 space-y-1">
								{#each ev.disclosures as d}
									<li class="text-[var(--theme-text)]">
										🔒 <strong>{d.fact}</strong>
										<span class="text-[10px] text-[var(--theme-text-faint)]">
											(told to: {d.disclosedToCharacterIds.join(', ')})
										</span>
									</li>
								{/each}
							</ul>
						{/if}
					</div>

					<!-- State Mutations -->
					<div>
						<span class="font-semibold text-[var(--theme-text-muted)] uppercase tracking-wider text-[10px]">
							State Mutations:
						</span>
						{#if !ev.mutations?.length}
							<div class="mt-1 text-[var(--theme-text-faint)] italic">None in this scene</div>
						{:else}
							<ul class="mt-1 space-y-1">
								{#each ev.mutations as m}
									<li class="text-[var(--theme-text)]">
										<span class="font-medium text-[var(--theme-accent)] capitalize">[{m.type}]</span>
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
