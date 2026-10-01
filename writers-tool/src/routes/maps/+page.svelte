<script lang="ts">
	import { onMount } from 'svelte';
	import {
		loadBible,
		loadChapters,
		loadJourneys,
		loadMapPins,
		loadSampleStory,
		loadStoryBeats,
		saveJourneys,
		saveMapPins,
		saveStoryBeats,
		verifyTravelFeasibility,
		type Chapter,
		type JourneyWaypoint,
		type MapPin,
		type PinType,
		type StoryBeat,
		type WorldEntry
	} from '$lib/world';

	let activeTab: 'world' | 'story' = $state('world');
	let showHelpTips = $state(false);

	// World Map State
	let bible: WorldEntry[] = $state([]);
	let chapters: Chapter[] = $state([]);
	let pins: MapPin[] = $state([]);
	let journeys: JourneyWaypoint[] = $state([]);
	let selectedPin = $state<MapPin | null>(null);
	let selectedCharacterRoute = $state<string>('all');

	// Add Pin Form
	let showAddPinModal = $state(false);
	let newPinName = $state('');
	let newPinType: PinType = $state('city');
	let newPinX = $state(50);
	let newPinY = $state(50);
	let newPinDesc = $state('');

	// Add Waypoint Form
	let showAddWaypointModal = $state(false);
	let newWpChar = $state('');
	let newWpPinId = $state('');
	let newWpDay = $state(1);

	// Story Map State
	let beats: StoryBeat[] = $state([]);
	let showAddBeatModal = $state(false);
	let newBeatAct = $state('Act I');
	let newBeatName = $state('');
	let newBeatTension = $state(0);
	let newBeatShift = $state('Neutral ➔ Suspicion');
	let newBeatSummary = $state('');

	onMount(() => {
		bible = loadBible();
		chapters = loadChapters();
		pins = loadMapPins();
		journeys = loadJourneys();
		beats = loadStoryBeats();
	});

	function handleLoadSample() {
		loadSampleStory();
		bible = loadBible();
		chapters = loadChapters();
		pins = loadMapPins();
		journeys = loadJourneys();
		beats = loadStoryBeats();
	}

	// Travel Feasibility Warnings
	const travelWarnings = $derived(verifyTravelFeasibility(pins, journeys));

	const charactersWithJourneys = $derived.by(() => {
		return Array.from(new Set(journeys.map((j) => j.characterId)));
	});

	// Active Waypoints Filtered by Character
	const activeWaypoints = $derived.by(() => {
		const list =
			selectedCharacterRoute === 'all'
				? journeys
				: journeys.filter((j) => j.characterId === selectedCharacterRoute);
		return [...list].sort((a, b) => a.order - b.order);
	});

	// Generate SVG Polyline points for character routes
	const routePoints = $derived.by(() => {
		return activeWaypoints
			.map((wp) => {
				const pin = pins.find((p) => p.id === wp.pinId);
				return pin ? `${pin.x * 8},${pin.y * 5}` : null;
			})
			.filter(Boolean)
			.join(' ');
	});

	function getPinTypeIcon(type: PinType) {
		switch (type) {
			case 'city':
				return '🏛️';
			case 'citadel':
				return '🏰';
			case 'fortress':
				return '🛡️';
			case 'landmark':
				return '🗿';
			case 'wilds':
				return '🌲';
			case 'water':
				return '🌊';
		}
	}

	function handleMapClick(e: MouseEvent) {
		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const clickX = Math.round(((e.clientX - rect.left) / rect.width) * 100);
		const clickY = Math.round(((e.clientY - rect.top) / rect.height) * 100);
		newPinX = Math.max(2, Math.min(98, clickX));
		newPinY = Math.max(2, Math.min(98, clickY));
		showAddPinModal = true;
	}

	function addPin() {
		if (!newPinName.trim()) return;
		const p: MapPin = {
			id: `p_${Date.now().toString(36)}`,
			name: newPinName.trim(),
			type: newPinType,
			x: newPinX,
			y: newPinY,
			description: newPinDesc.trim()
		};
		pins = [...pins, p];
		saveMapPins(pins);
		newPinName = '';
		newPinDesc = '';
		showAddPinModal = false;
	}

	function deletePin(id: string) {
		pins = pins.filter((p) => p.id !== id);
		journeys = journeys.filter((j) => j.pinId !== id);
		saveMapPins(pins);
		saveJourneys(journeys);
		if (selectedPin?.id === id) selectedPin = null;
	}

	function addWaypoint() {
		if (!newWpChar.trim() || !newWpPinId) return;
		const nextOrder = journeys.length ? Math.max(...journeys.map((j) => j.order)) + 1 : 1;
		const wp: JourneyWaypoint = {
			id: `j_${Date.now().toString(36)}`,
			characterId: newWpChar.trim(),
			pinId: newWpPinId,
			dayIndex: newWpDay,
			order: nextOrder,
			chapterTitle: `Event #${nextOrder}`
		};
		journeys = [...journeys, wp];
		saveJourneys(journeys);
		showAddWaypointModal = false;
	}

	function addStoryBeat() {
		if (!newBeatName.trim()) return;
		const nextOrder = beats.length ? Math.max(...beats.map((b) => b.order)) + 1 : 1;
		const b: StoryBeat = {
			id: `b_${Date.now().toString(36)}`,
			act: newBeatAct,
			beatName: newBeatName.trim(),
			tension: newBeatTension,
			valueShift: newBeatShift.trim(),
			summary: newBeatSummary.trim(),
			order: nextOrder
		};
		beats = [...beats, b];
		saveStoryBeats(beats);
		newBeatName = '';
		newBeatSummary = '';
		showAddBeatModal = false;
	}

	function deleteBeat(id: string) {
		beats = beats.filter((b) => b.id !== id);
		saveStoryBeats(beats);
	}
</script>

<header class="max-w-6xl">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<div class="flex items-center gap-3">
				<h1 class="font-display text-4xl font-semibold tracking-tight text-[var(--theme-text)]">
					Maps & Structural Story Canvas
				</h1>
				<button
					type="button"
					class="cursor-pointer rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--theme-text-muted)] hover:text-[var(--theme-accent)] transition-colors"
					onclick={() => (showHelpTips = !showHelpTips)}
				>
					{showHelpTips ? '✕ Close Tips' : '💡 Maps Tips'}
				</button>
			</div>
			<p class="mt-1 text-sm text-[var(--theme-text-muted)]">
				Visual geography, character travel-time verification, and dramatic narrative beat tension curves.
			</p>
		</div>

		<!-- View Switcher Tabs & Guide Link -->
		<div class="flex items-center gap-2">
			<a
				href="/guide"
				class="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--theme-text)] shadow-xs hover:border-[var(--theme-border-strong)]"
			>
				📖 Manual
			</a>
			<div class="flex rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-1 shadow-xs">
				<button
					class="cursor-pointer rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors {activeTab ===
					'world'
						? 'bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-xs'
						: 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'}"
					onclick={() => (activeTab = 'world')}
				>
					🗺️ Visual World Map
				</button>
				<button
					class="cursor-pointer rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors {activeTab ===
					'story'
						? 'bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-xs'
						: 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]'}"
					onclick={() => (activeTab = 'story')}
				>
					📈 Story Map & Tension Curve
				</button>
			</div>
		</div>
	</div>

	{#if showHelpTips}
		<div class="mt-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-4 text-xs text-[var(--theme-text-muted)] shadow-xs animate-in fade-in duration-200">
			<div class="flex items-center justify-between font-bold text-[var(--theme-text)]">
				<span>Maps & Structural Story Canvas Tips</span>
				<a href="/guide" class="text-[var(--theme-accent)] underline hover:opacity-80">Full Documentation →</a>
			</div>
			<div class="mt-2 grid gap-3 sm:grid-cols-3">
				<div>
					<span class="font-semibold text-[var(--theme-text)]">Click-to-Drop Geography</span>
					<p class="mt-0.5 text-[11px]">Click anywhere on the World Map parchment canvas to drop cities, citadels, wilds, or water ports with exact coordinates.</p>
				</div>
				<div>
					<span class="font-semibold text-[var(--theme-text)]">Travel Feasibility Radar</span>
					<p class="mt-0.5 text-[11px]">Logging character waypoints tracks journeys across in-story days. If a hero moves faster than medieval horses allow, a red speed warning triggers.</p>
				</div>
				<div>
					<span class="font-semibold text-[var(--theme-text)]">Tension Curves (-5 to +5)</span>
					<p class="mt-0.5 text-[11px]">In Story Map mode, map your beats across Acts I, II, and III. The live spline chart visualizes emotional voltage and prevents mid-book sag.</p>
				</div>
			</div>
		</div>
	{/if}
</header>

{#if activeTab === 'world'}
	<!-- Travel Warnings Banner -->
	{#if travelWarnings.length > 0}
		<div
			class="mt-6 max-w-6xl rounded-xl border border-rose-400 bg-rose-500/10 p-4 shadow-xs"
			role="alert"
		>
			<div class="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400">
				<span>⚠️</span>
				<span>Travel Speed Contradiction Detected!</span>
			</div>
			<div class="mt-2 space-y-1">
				{#each travelWarnings as tw}
					<div class="text-xs text-rose-700 dark:text-rose-300">
						• {tw.reason}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Map Toolbar -->
	<div class="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--theme-border)] pb-3">
		<div class="flex items-center gap-3 text-xs">
			<span class="font-semibold text-[var(--theme-text-muted)]">Character Journey Path:</span>
			<select
				bind:value={selectedCharacterRoute}
				class="rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] px-2.5 py-1 text-xs font-medium text-[var(--theme-text)] focus:outline-hidden"
			>
				<option value="all">All Journeys</option>
				{#each charactersWithJourneys as ch}
					<option value={ch}>{ch}'s Route</option>
				{/each}
			</select>
			<span class="text-[var(--theme-text-muted)]">·</span>
			<span class="text-[var(--theme-text-muted)]">Click anywhere on the map to drop a new location pin.</span>
		</div>

		<div class="flex items-center gap-2">
			<button
				class="cursor-pointer rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-1.5 text-xs font-medium text-[var(--theme-text)] hover:border-[var(--theme-border-strong)]"
				onclick={() => (showAddWaypointModal = true)}
			>
				+ Log Character Waypoint
			</button>
			<button
				class="cursor-pointer rounded-lg bg-[var(--theme-accent)] px-3 py-1.5 text-xs font-medium text-[var(--theme-accent-fg)] hover:opacity-90 shadow-xs"
				onclick={() => {
					newPinX = 50;
					newPinY = 50;
					showAddPinModal = true;
				}}
			>
				+ Add Pin
			</button>
		</div>
	</div>

	{#if pins.length === 0}
		<!-- Empty World Map State -->
		<div class="mt-8 rounded-2xl border-2 border-dashed border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-12 text-center">
			<div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--theme-surface)] text-2xl shadow-xs">
				🗺️
			</div>
			<h3 class="font-display mt-4 text-xl font-bold text-[var(--theme-text)]">
				World Map Canvas is Empty
			</h3>
			<p class="mx-auto mt-2 max-w-md text-sm text-[var(--theme-text-muted)]">
				Establish your realms, mountain citadels, river ports, and barrens. Log character travel journeys to catch unrealistic teleportation across chapters.
			</p>
			<div class="mt-6 flex flex-wrap items-center justify-center gap-3">
				<button
					class="cursor-pointer rounded-lg bg-[var(--theme-accent)] px-4 py-2 text-xs font-semibold text-[var(--theme-accent-fg)] hover:opacity-90 shadow-xs"
					onclick={() => {
						newPinX = 50;
						newPinY = 50;
						showAddPinModal = true;
					}}
				>
					+ Drop First Location Pin
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
		<!-- Interactive Map Canvas -->
		<div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
			<!-- The Visual Map Surface -->
			<div
				class="relative aspect-8/5 w-full cursor-crosshair overflow-hidden rounded-2xl border-4 border-[var(--theme-border-strong)] bg-[var(--theme-surface-subtle)] shadow-md select-none"
				style="background-image: radial-gradient(var(--theme-border) 1.5px, transparent 1.5px); background-size: 24px 24px;"
				onclick={handleMapClick}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
					}
				}}
				tabindex="0"
				role="button"
				aria-label="Interactive World Map Canvas. Click to drop a pin."
			>
				<!-- Compass Rose -->
				<div class="pointer-events-none absolute top-4 right-4 text-[var(--theme-text-muted)]/60 font-serif text-xs">
					<div class="text-center font-bold">N</div>
					<div class="flex items-center gap-2"><span>W</span> <span>+</span> <span>E</span></div>
					<div class="text-center font-bold">S</div>
				</div>

				<!-- SVG Route Connectors Overlay -->
				<svg class="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 800 500">
					{#if routePoints}
						<polyline
							points={routePoints}
							fill="none"
							stroke="var(--theme-accent)"
							stroke-width="3"
							stroke-dasharray="6 4"
							class="opacity-75"
						/>
					{/if}
				</svg>

				<!-- Render Map Pins -->
				{#each pins as pin (pin.id)}
					<div
						class="absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125"
						style="left: {pin.x}%; top: {pin.y}%;"
					>
						<button
							type="button"
							class="flex flex-col items-center cursor-pointer group"
							onclick={(e) => {
								e.stopPropagation();
								selectedPin = pin;
							}}
							title="{pin.name} ({pin.type})"
						>
							<span
								class="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--theme-border-strong)] bg-[var(--theme-surface)] text-sm shadow-md transition-shadow group-hover:shadow-lg"
							>
								{getPinTypeIcon(pin.type)}
							</span>
							<span
								class="mt-1 rounded bg-[var(--theme-surface)]/90 border border-[var(--theme-border)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--theme-text)] shadow-xs backdrop-blur-xs whitespace-nowrap"
							>
								{pin.name}
							</span>
						</button>
					</div>
				{/each}
			</div>

			<!-- Location Inspector Sidebar -->
			<aside class="space-y-4">
				<section class="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-xs">
					<h3 class="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
						Location Dossier
					</h3>
					{#if !selectedPin}
						<p class="mt-2 text-xs text-[var(--theme-text-muted)] italic">
							Click on any location pin on the map to inspect lore, terrain, and recorded visits.
						</p>
					{:else}
						<div class="mt-3">
							<div class="flex items-start justify-between gap-2">
								<div>
									<span
										class="rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--theme-text-muted)] capitalize"
									>
										{selectedPin.type}
									</span>
									<h4 class="font-display mt-1 text-lg font-bold text-[var(--theme-text)]">
										{selectedPin.name}
									</h4>
								</div>
								<button
									class="cursor-pointer text-xs text-[var(--theme-text-muted)] hover:text-rose-500"
									onclick={() => deletePin(selectedPin!.id)}
								>
									Delete
								</button>
							</div>

							<p class="manuscript mt-2 text-xs leading-relaxed text-[var(--theme-text-muted)]">
								{selectedPin.description || 'No detailed lore recorded yet for this location.'}
							</p>

							<div class="mt-3 border-t border-[var(--theme-border)] pt-2 text-[11px] text-[var(--theme-text-muted)] font-mono">
								Coordinates: {selectedPin.x}%, {selectedPin.y}%
							</div>

							<!-- Recorded Character Visits -->
							<div class="mt-4 border-t border-[var(--theme-border)] pt-3">
								<span class="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">
									Recorded Visits ({journeys.filter((j) => j.pinId === selectedPin!.id).length}):
								</span>
								<ul class="mt-1 space-y-1 text-xs">
									{#each journeys.filter((j) => j.pinId === selectedPin!.id) as j}
										<li class="flex items-center justify-between text-[var(--theme-text)]">
											<span class="font-medium">{j.characterId}</span>
											<span class="text-[10px] text-[var(--theme-text-muted)]">Day {j.dayIndex} ({j.chapterTitle ?? 'Story'})</span>
										</li>
									{/each}
								</ul>
							</div>
						</div>
					{/if}
				</section>

				<!-- Waypoint Journey Log -->
				<section class="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-4 shadow-xs">
					<h3 class="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
						Waypoint Timeline ({activeWaypoints.length})
					</h3>
					<div class="mt-2 space-y-1.5 max-h-56 overflow-y-auto pr-1">
						{#each activeWaypoints as wp}
							{@const p = pins.find((pin) => pin.id === wp.pinId)}
							<div class="rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] p-2 text-xs">
								<div class="flex items-center justify-between font-semibold text-[var(--theme-text)]">
									<span>{wp.characterId}</span>
									<span class="text-[10px] text-[var(--theme-text-muted)]">Day {wp.dayIndex}</span>
								</div>
								<div class="mt-0.5 text-[var(--theme-text-muted)]">
									➔ {p?.name ?? 'Unknown pin'} ({wp.chapterTitle ?? 'Story'})
								</div>
							</div>
						{/each}
					</div>
				</section>
			</aside>
		</div>
	{/if}
{:else}
	<!-- STORY MAP & DRAMATIC TENSION CURVE VIEW -->
	<div class="mt-6 space-y-6">
		<div class="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--theme-border)] pb-3">
			<div>
				<h2 class="font-display text-xl font-bold text-[var(--theme-text)]">
					Dramatic Pacing & Tension Curve
				</h2>
				<p class="text-xs text-[var(--theme-text-muted)]">
					Visualizes emotional voltage from catastrophe (-5) to triumph (+5) across sequential story beats.
				</p>
			</div>

			<button
				class="cursor-pointer rounded-lg bg-[var(--theme-accent)] px-4 py-2 text-xs font-semibold text-[var(--theme-accent-fg)] hover:opacity-90 shadow-xs"
				onclick={() => (showAddBeatModal = true)}
			>
				+ Log Story Beat
			</button>
		</div>

		{#if beats.length === 0}
			<!-- Empty Story Map State -->
			<div class="rounded-2xl border-2 border-dashed border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-12 text-center">
				<div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--theme-surface)] text-2xl shadow-xs">
					📈
				</div>
				<h3 class="font-display mt-4 text-xl font-bold text-[var(--theme-text)]">
					Story Pacing Map is Empty
				</h3>
				<p class="mx-auto mt-2 max-w-md text-sm text-[var(--theme-text-muted)]">
					Chart the dramatic voltage of your plot. Track where hope rises and catastrophe strikes across Acts I, II, and III.
				</p>
				<div class="mt-6 flex flex-wrap items-center justify-center gap-3">
					<button
						class="cursor-pointer rounded-lg bg-[var(--theme-accent)] px-4 py-2 text-xs font-semibold text-[var(--theme-accent-fg)] hover:opacity-90 shadow-xs"
						onclick={() => (showAddBeatModal = true)}
					>
						+ Log First Story Beat
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
			<!-- Dramatic Tension Visual Graph -->
			<div class="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm">
				<div class="flex items-center justify-between text-xs font-bold text-[var(--theme-text-muted)] border-b border-[var(--theme-border)] pb-2">
					<span>HIGH TENSION (+5 Climax / Triumph)</span>
					<span>LOW TENSION (-5 Dark Night of Soul)</span>
				</div>

				<!-- Tension Curve SVG Visualization -->
				<div class="relative mt-4 h-64 w-full">
					<svg class="h-full w-full overflow-visible" viewBox="0 0 800 240">
						<!-- Center Baseline (0 Neutral) -->
						<line
							x1="0"
							y1="120"
							x2="800"
							y2="120"
							stroke="var(--theme-border)"
							stroke-width="1.5"
							stroke-dasharray="4 4"
						/>

						{#if beats.length > 1}
							{@const step = 800 / (beats.length - 1)}
							{@const pathData = beats
								.map((b, i) => `${i * step},${120 - b.tension * 20}`)
								.join(' L ')}
							<path
								d="M {pathData}"
								fill="none"
								stroke="var(--theme-accent)"
								stroke-width="3"
								class="transition-all"
							/>
						{/if}

						<!-- Beat Points -->
						{#each beats as b, idx (b.id)}
							{@const step = beats.length > 1 ? 800 / (beats.length - 1) : 400}
							{@const cx = beats.length > 1 ? idx * step : 400}
							{@const cy = 120 - b.tension * 20}
							<g class="cursor-pointer group">
								<circle
									{cx}
									{cy}
									r="6"
									fill="var(--theme-accent)"
									stroke="var(--theme-surface)"
									stroke-width="2"
									class="transition-transform group-hover:scale-150"
								/>
								<text
									x={cx}
									y={cy - 12}
									text-anchor="middle"
									font-size="10"
									font-weight="bold"
									fill="var(--theme-text)"
								>
									{b.beatName}
								</text>
							</g>
						{/each}
					</svg>
				</div>

				<div class="mt-4 flex justify-between text-[11px] text-[var(--theme-text-muted)] font-mono">
					<span>Beginning (Act I)</span>
					<span>Midpoint Climax</span>
					<span>Resolution (Act III)</span>
				</div>
			</div>

			<!-- Story Beats Cards Grid -->
			<div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
				{#each beats as beat (beat.id)}
					<article
						class="flex flex-col justify-between rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-xs"
					>
						<div>
							<div class="flex items-start justify-between gap-2">
								<span
									class="rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] px-2 py-0.5 text-[10px] font-bold text-[var(--theme-text-muted)] uppercase"
								>
									{beat.act}
								</span>
								<button
									class="cursor-pointer text-[var(--theme-text-muted)] hover:text-rose-500 text-xs"
									onclick={() => deleteBeat(beat.id)}
								>
									×
								</button>
							</div>

							<h3 class="font-display mt-2 text-base font-bold text-[var(--theme-text)]">
								{beat.beatName}
							</h3>
							{#if beat.chapterTitle}
								<div class="text-[11px] font-medium text-[var(--theme-text-muted)]">{beat.chapterTitle}</div>
							{/if}

							<p class="manuscript mt-2 text-xs leading-relaxed text-[var(--theme-text-muted)]">
								{beat.summary}
							</p>
						</div>

						<div class="mt-4 border-t border-[var(--theme-border)] pt-2 text-[11px]">
							<div class="flex items-center justify-between">
								<span class="font-semibold text-[var(--theme-text-muted)]">Value Shift:</span>
								<span class="font-mono text-[var(--theme-accent)]">{beat.valueShift}</span>
							</div>
							<div class="mt-1 flex items-center justify-between">
								<span class="font-semibold text-[var(--theme-text-muted)]">Tension Charge:</span>
								<span
									class="font-bold {beat.tension > 0
										? 'text-emerald-600 dark:text-emerald-400'
										: beat.tension < 0
											? 'text-rose-600 dark:text-rose-400'
											: 'text-[var(--theme-text-muted)]'}"
								>
									{beat.tension > 0 ? `+${beat.tension}` : beat.tension}
								</span>
							</div>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<!-- Add Pin Modal -->
{#if showAddPinModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
		role="dialog"
	>
		<div class="w-full max-w-md rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-xl">
			<h2 class="font-display text-xl font-bold text-[var(--theme-text)]">Add Location Pin</h2>
			<div class="mt-4 space-y-3 text-xs">
				<div>
					<label for="pin-name" class="block font-semibold text-[var(--theme-text-muted)] uppercase text-[10px]">
						Location Name
					</label>
					<input
						id="pin-name"
						bind:value={newPinName}
						placeholder="e.g. Iron Gate Fortress"
						class="mt-1 w-full rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] p-2 text-[var(--theme-text)] focus:outline-hidden focus:border-[var(--theme-accent)]"
					/>
				</div>

				<div class="grid grid-cols-2 gap-2">
					<div>
						<label for="pin-type" class="block font-semibold text-[var(--theme-text-muted)] uppercase text-[10px]">
							Type
						</label>
						<select
							id="pin-type"
							bind:value={newPinType}
							class="mt-1 w-full rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] p-2 text-[var(--theme-text)] focus:outline-hidden"
						>
							<option value="city">🏛️ City</option>
							<option value="citadel">🏰 Citadel</option>
							<option value="fortress">🛡️ Fortress</option>
							<option value="landmark">🗿 Landmark</option>
							<option value="wilds">🌲 Wilds</option>
							<option value="water">🌊 Water</option>
						</select>
					</div>

					<div>
						<span class="block font-semibold text-[var(--theme-text-muted)] uppercase text-[10px]">
							Coordinates
						</span>
						<div class="mt-1 flex items-center gap-1 font-mono text-[var(--theme-text)] p-2 border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] rounded">
							X: {newPinX}%, Y: {newPinY}%
						</div>
					</div>
				</div>

				<div>
					<label for="pin-desc" class="block font-semibold text-[var(--theme-text-muted)] uppercase text-[10px]">
						Lore / Description
					</label>
					<textarea
						id="pin-desc"
						bind:value={newPinDesc}
						rows={2}
						placeholder="Atmospheric details, garrison size, historical notes..."
						class="mt-1 w-full rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] p-2 text-[var(--theme-text)] focus:outline-hidden focus:border-[var(--theme-accent)]"
					></textarea>
				</div>
			</div>

			<div class="mt-5 flex justify-end gap-2">
				<button
					class="cursor-pointer rounded-lg border border-[var(--theme-border)] px-3 py-1.5 text-xs font-medium text-[var(--theme-text)] hover:bg-[var(--theme-surface-subtle)]"
					onclick={() => (showAddPinModal = false)}
				>
					Cancel
				</button>
				<button
					class="cursor-pointer rounded-lg bg-[var(--theme-accent)] px-4 py-1.5 text-xs font-semibold text-[var(--theme-accent-fg)] hover:opacity-90"
					onclick={addPin}
				>
					Save Pin
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Add Waypoint Modal -->
{#if showAddWaypointModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
		role="dialog"
	>
		<div class="w-full max-w-md rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-xl">
			<h2 class="font-display text-xl font-bold text-[var(--theme-text)]">Log Character Waypoint</h2>
			<div class="mt-4 space-y-3 text-xs">
				<div>
					<label for="wp-char" class="block font-semibold text-[var(--theme-text-muted)] uppercase text-[10px]">
						Character Name
					</label>
					<input
						id="wp-char"
						bind:value={newWpChar}
						placeholder="e.g. Kael"
						class="mt-1 w-full rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] p-2 text-[var(--theme-text)] focus:outline-hidden focus:border-[var(--theme-accent)]"
					/>
				</div>

				<div>
					<label for="wp-pin" class="block font-semibold text-[var(--theme-text-muted)] uppercase text-[10px]">
						Location Pin
					</label>
					<select
						id="wp-pin"
						bind:value={newWpPinId}
						class="mt-1 w-full rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] p-2 text-[var(--theme-text)] focus:outline-hidden"
					>
						<option value="">Select location pin...</option>
						{#each pins as p}
							<option value={p.id}>{p.name} ({p.type})</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="wp-day" class="block font-semibold text-[var(--theme-text-muted)] uppercase text-[10px]">
						In-Story Day Number
					</label>
					<input
						id="wp-day"
						type="number"
						bind:value={newWpDay}
						class="mt-1 w-full rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] p-2 text-[var(--theme-text)] focus:outline-hidden focus:border-[var(--theme-accent)]"
					/>
				</div>
			</div>

			<div class="mt-5 flex justify-end gap-2">
				<button
					class="cursor-pointer rounded-lg border border-[var(--theme-border)] px-3 py-1.5 text-xs font-medium text-[var(--theme-text)] hover:bg-[var(--theme-surface-subtle)]"
					onclick={() => (showAddWaypointModal = false)}
				>
					Cancel
				</button>
				<button
					class="cursor-pointer rounded-lg bg-[var(--theme-accent)] px-4 py-1.5 text-xs font-semibold text-[var(--theme-accent-fg)] hover:opacity-90"
					onclick={addWaypoint}
				>
					Log Waypoint
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Add Story Beat Modal -->
{#if showAddBeatModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
		role="dialog"
	>
		<div class="w-full max-w-md rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-xl">
			<h2 class="font-display text-xl font-bold text-[var(--theme-text)]">Log Story Beat</h2>
			<div class="mt-4 space-y-3 text-xs">
				<div class="grid grid-cols-2 gap-2">
					<div>
						<label for="beat-act" class="block font-semibold text-[var(--theme-text-muted)] uppercase text-[10px]">
							Act
						</label>
						<select
							id="beat-act"
							bind:value={newBeatAct}
							class="mt-1 w-full rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] p-2 text-[var(--theme-text)] focus:outline-hidden"
						>
							<option value="Act I">Act I</option>
							<option value="Act II-A">Act II-A</option>
							<option value="Act II-B">Act II-B</option>
							<option value="Act III">Act III</option>
						</select>
					</div>

					<div>
						<label for="beat-tension" class="block font-semibold text-[var(--theme-text-muted)] uppercase text-[10px]">
							Tension Voltage (-5 to +5)
						</label>
						<input
							id="beat-tension"
							type="number"
							min="-5"
							max="5"
							bind:value={newBeatTension}
							class="mt-1 w-full rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] p-2 text-[var(--theme-text)] font-mono focus:outline-hidden focus:border-[var(--theme-accent)]"
						/>
					</div>
				</div>

				<div>
					<label for="beat-name" class="block font-semibold text-[var(--theme-text-muted)] uppercase text-[10px]">
						Beat Name
					</label>
					<input
						id="beat-name"
						bind:value={newBeatName}
						placeholder="e.g. Midpoint Climax or The Dark Night"
						class="mt-1 w-full rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] p-2 text-[var(--theme-text)] focus:outline-hidden focus:border-[var(--theme-accent)]"
					/>
				</div>

				<div>
					<label for="beat-shift" class="block font-semibold text-[var(--theme-text-muted)] uppercase text-[10px]">
						Dramatic Value Shift
					</label>
					<input
						id="beat-shift"
						bind:value={newBeatShift}
						placeholder="e.g. Hope ➔ Catastrophe"
						class="mt-1 w-full rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] p-2 text-[var(--theme-text)] focus:outline-hidden focus:border-[var(--theme-accent)]"
					/>
				</div>

				<div>
					<label for="beat-summary" class="block font-semibold text-[var(--theme-text-muted)] uppercase text-[10px]">
						Beat Summary
					</label>
					<textarea
						id="beat-summary"
						bind:value={newBeatSummary}
						rows={2}
						placeholder="What happens in this dramatic turning point?"
						class="mt-1 w-full rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] p-2 text-[var(--theme-text)] focus:outline-hidden focus:border-[var(--theme-accent)]"
					></textarea>
				</div>
			</div>

			<div class="mt-5 flex justify-end gap-2">
				<button
					class="cursor-pointer rounded-lg border border-[var(--theme-border)] px-3 py-1.5 text-xs font-medium text-[var(--theme-text)] hover:bg-[var(--theme-surface-subtle)]"
					onclick={() => (showAddBeatModal = false)}
				>
					Cancel
				</button>
				<button
					class="cursor-pointer rounded-lg bg-[var(--theme-accent)] px-4 py-1.5 text-xs font-semibold text-[var(--theme-accent-fg)] hover:opacity-90"
					onclick={addStoryBeat}
				>
					Record Beat
				</button>
			</div>
		</div>
	</div>
{/if}
