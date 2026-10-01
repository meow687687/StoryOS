<script lang="ts">
	import { clearAllStoryData, loadSampleStory } from '$lib/world';

	let actionMessage = $state('');

	function handleLoadSample() {
		if (
			confirm(
				'Load the interactive sample story ("The Ashen Vow")? This will populate the editor, bible, timeline, mysteries, and maps with interconnected sample lore.'
			)
		) {
			loadSampleStory();
			actionMessage = 'Sample story loaded! You can now explore the Editor, Timeline, and Maps.';
			setTimeout(() => {
				window.location.href = '/chapters';
			}, 600);
		}
	}

	function handleClearAll() {
		if (
			confirm(
				'Start a completely clean slate? This will remove all chapters, characters, timeline events, mysteries, and maps from your local browser storage.'
			)
		) {
			clearAllStoryData();
			actionMessage = 'Clean slate ready! All sample stories and placeholder lore cleared.';
			setTimeout(() => {
				window.location.href = '/chapters';
			}, 600);
		}
	}
</script>

<div class="mx-auto max-w-4xl space-y-12 pb-16">
	<!-- Hero / Header -->
	<header class="border-b border-[var(--theme-border)] pb-8 pt-4">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div>
				<div class="inline-flex items-center gap-2 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-1 text-xs font-semibold text-[var(--theme-accent)]">
					<span>📖</span> Story OS Manual
				</div>
				<h1 class="mt-3 font-display text-4xl sm:text-5xl font-bold tracking-tight text-[var(--theme-text)]">
					The Author's Field Guide
				</h1>
				<p class="mt-2 text-base text-[var(--theme-text-muted)]">
					"The author owns the story. The tool protects the story."
				</p>
			</div>

			<!-- Quick Management Actions -->
			<div class="flex flex-wrap items-center gap-2.5">
				<button
					type="button"
					onclick={handleLoadSample}
					class="cursor-pointer rounded-lg border border-[var(--theme-accent)] bg-[var(--theme-accent-subtle)] px-3.5 py-2 text-xs font-semibold text-[var(--theme-accent)] shadow-xs transition-colors hover:bg-[var(--theme-accent)] hover:text-white"
					title="Populate the tool with the complete sample story (The Ashen Vow)"
				>
					✨ Load Sample Story
				</button>
				<button
					type="button"
					onclick={handleClearAll}
					class="cursor-pointer rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--theme-text-muted)] shadow-xs transition-colors hover:border-red-500 hover:text-red-500"
					title="Wipe all lore and start completely fresh"
				>
					🧹 Start Clean Slate
				</button>
			</div>
		</div>

		{#if actionMessage}
			<div class="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
				{actionMessage}
			</div>
		{/if}
	</header>

	<!-- Quick Navigation Matrix -->
	<section class="grid grid-cols-2 gap-3 sm:grid-cols-3">
		<a
			href="/chapters"
			class="group rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-xs transition-all hover:border-[var(--theme-accent)] hover:shadow-md"
		>
			<span class="text-xl">✍️</span>
			<h3 class="mt-2 text-sm font-bold text-[var(--theme-text)] group-hover:text-[var(--theme-accent)]">
				1. Editor & HUD
			</h3>
			<p class="mt-1 text-xs text-[var(--theme-text-muted)]">
				Distraction-free canvas, entity chips, `@` autocomplete, and POV tracker.
			</p>
		</a>

		<a
			href="/timeline"
			class="group rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-xs transition-all hover:border-[var(--theme-accent)] hover:shadow-md"
		>
			<span class="text-xl">⏳</span>
			<h3 class="mt-2 text-sm font-bold text-[var(--theme-text)] group-hover:text-[var(--theme-accent)]">
				2. Timeline Engine
			</h3>
			<p class="mt-1 text-xs text-[var(--theme-text-muted)]">
				Temporal state scrubber, secrets tracking, and Knowledge Leak Radar.
			</p>
		</a>

		<a
			href="/mysteries"
			class="group rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-xs transition-all hover:border-[var(--theme-accent)] hover:shadow-md"
		>
			<span class="text-xl">📌</span>
			<h3 class="mt-2 text-sm font-bold text-[var(--theme-text)] group-hover:text-[var(--theme-accent)]">
				3. Mystery Corkboard
			</h3>
			<p class="mt-1 text-xs text-[var(--theme-text-muted)]">
				Detective canvas connecting mysteries, clues, red herrings, and reveals.
			</p>
		</a>

		<a
			href="/maps"
			class="group rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-xs transition-all hover:border-[var(--theme-accent)] hover:shadow-md"
		>
			<span class="text-xl">🗺️</span>
			<h3 class="mt-2 text-sm font-bold text-[var(--theme-text)] group-hover:text-[var(--theme-accent)]">
				4. World & Story Map
			</h3>
			<p class="mt-1 text-xs text-[var(--theme-text-muted)]">
				Spatial pins, travel feasibility verification, and dramatic tension curve.
			</p>
		</a>

		<a
			href="/bible"
			class="group rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-xs transition-all hover:border-[var(--theme-accent)] hover:shadow-md"
		>
			<span class="text-xl">📜</span>
			<h3 class="mt-2 text-sm font-bold text-[var(--theme-text)] group-hover:text-[var(--theme-accent)]">
				5. Living World Bible
			</h3>
			<p class="mt-1 text-xs text-[var(--theme-text-muted)]">
				4-tier Canon Lifecycle (`Idea` ➔ `Draft` ➔ `Canon` ➔ `Rejected`).
			</p>
		</a>

		<a
			href="/decisions"
			class="group rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-xs transition-all hover:border-[var(--theme-accent)] hover:shadow-md"
		>
			<span class="text-xl">⚖️</span>
			<h3 class="mt-2 text-sm font-bold text-[var(--theme-text)] group-hover:text-[var(--theme-accent)]">
				6. Decisions Ledger
			</h3>
			<p class="mt-1 text-xs text-[var(--theme-text-muted)]">
				Immutable log of author rulings with `decisions.md` export.
			</p>
		</a>
	</section>

	<!-- Guide Sections -->
	<div class="space-y-10 text-[var(--theme-text)] leading-relaxed">
		<!-- Section 1 -->
		<article class="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 sm:p-8 shadow-xs space-y-4">
			<div class="flex items-center gap-3">
				<span class="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--theme-accent-subtle)] font-bold text-[var(--theme-accent)]">1</span>
				<h2 class="font-display text-2xl font-bold">The Socratic AI Philosophy</h2>
			</div>
			<p class="text-sm text-[var(--theme-text-muted)]">
				Most writing tools treat AI as an auto-complete ghostwriter that generates words for you. <strong>Story OS is built on the opposite philosophy:</strong> The author writes every word of the prose. The AI acts exclusively as an unforgiving, insightful developmental editor and interrogator.
			</p>
			<div class="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-4 text-xs space-y-2">
				<div class="font-bold text-[var(--theme-accent)]">How to use Socratic Interrogation:</div>
				<ul class="list-disc pl-5 space-y-1 text-[var(--theme-text-muted)]">
					<li>Open any chapter in the <strong>Editor</strong>.</li>
					<li>Click <kbd class="rounded bg-black/10 px-1 py-0.5 font-mono">🎯 Socratic Interrogation</kbd> in the header.</li>
					<li>The AI scrutinizes character motivations, questions emotional pacing, flags convenient coincidences, and suggests structural alternatives without ever ghostwriting or altering your text.</li>
					<li>When you resolve a question, click <strong>"Lock as Canon Decision"</strong> to record your ruling into the Decisions Ledger.</li>
				</ul>
			</div>
		</article>

		<!-- Section 2 -->
		<article class="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 sm:p-8 shadow-xs space-y-4">
			<div class="flex items-center gap-3">
				<span class="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--theme-accent-subtle)] font-bold text-[var(--theme-accent)]">2</span>
				<h2 class="font-display text-2xl font-bold">The 4-Tier Canon Lifecycle</h2>
			</div>
			<p class="text-sm text-[var(--theme-text-muted)]">
				In ordinary note-taking apps, a random brainstorming thought can accidentally be treated as law. In Story OS, every world entry exists in one of four distinct states:
			</p>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
				<div class="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-3">
					<div class="font-bold text-amber-600 dark:text-amber-400">💡 Idea</div>
					<p class="mt-1 text-[var(--theme-text-muted)]">Unverified speculation or scratchpad notes. Completely isolated from continuity checks.</p>
				</div>
				<div class="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-3">
					<div class="font-bold text-blue-600 dark:text-blue-400">📝 Draft</div>
					<p class="mt-1 text-[var(--theme-text-muted)]">Proposed lore under author review. Visible in dossiers but does not enforce hard rule contradictions.</p>
				</div>
				<div class="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-3">
					<div class="font-bold text-emerald-600 dark:text-emerald-400">👑 Canon</div>
					<p class="mt-1 text-[var(--theme-text-muted)]">Official story truth. Hard magic rules ("cannot X", "only Y") and character facts are enforced across all chapters.</p>
				</div>
				<div class="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-3">
					<div class="font-bold text-stone-500">❌ Rejected</div>
					<p class="mt-1 text-[var(--theme-text-muted)]">Discarded avenues preserved for reference so you remember why you ruled them out.</p>
				</div>
			</div>
		</article>

		<!-- Section 3 -->
		<article class="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 sm:p-8 shadow-xs space-y-4">
			<div class="flex items-center gap-3">
				<span class="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--theme-accent-subtle)] font-bold text-[var(--theme-accent)]">3</span>
				<h2 class="font-display text-2xl font-bold">Timeline Engine & Knowledge Leak Radar</h2>
			</div>
			<p class="text-sm text-[var(--theme-text-muted)]">
				Characters do not know everything the author knows. Story OS calculates a character's state at any point $T$ along the timeline:
			</p>
			<ul class="list-disc pl-5 text-sm text-[var(--theme-text-muted)] space-y-1">
				<li><strong>Point-in-Time State:</strong> Track known secrets, active physical injuries, held inventory items, and dynamic relationship trust levels (0–100).</li>
				<li><strong>Time-Travel Scrubber:</strong> Drag the timeline slider on the Timeline page to inspect character memories before or after any major event.</li>
				<li><strong>Knowledge Leak Radar:</strong> If a POV character speaks about, reacts to, or acts upon a secret before it was disclosed to them—or before the event occurred—Story OS flags an immediate warning in the Continuity Radar.</li>
			</ul>
		</article>

		<!-- Section 4 -->
		<article class="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 sm:p-8 shadow-xs space-y-4">
			<div class="flex items-center gap-3">
				<span class="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--theme-accent-subtle)] font-bold text-[var(--theme-accent)]">4</span>
				<h2 class="font-display text-2xl font-bold">Mystery Board & Reader Perspective Mode</h2>
			</div>
			<p class="text-sm text-[var(--theme-text-muted)]">
				Keep your narrative puzzles airtight using the Detective Corkboard:
			</p>
			<div class="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-4 text-xs font-mono text-[var(--theme-text-muted)]">
				Mystery ──► Clues & Red Herrings ──► Reveal (Scheduled Chapter) ──► Consequences
			</div>
			<p class="text-sm text-[var(--theme-text-muted)]">
				<strong>Reader Perspective Mode:</strong> In the Editor, click <kbd class="rounded bg-black/10 px-1 py-0.5 font-mono">👁️ Reader Mode</kbd>. This masks unrevealed secrets and analyzes your prose to alert you if a future reveal has accidentally leaked into the current chapter.
			</p>
		</article>

		<!-- Section 5 -->
		<article class="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 sm:p-8 shadow-xs space-y-4">
			<div class="flex items-center gap-3">
				<span class="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--theme-accent-subtle)] font-bold text-[var(--theme-accent)]">5</span>
				<h2 class="font-display text-2xl font-bold">Visual World Map & Travel Verification</h2>
			</div>
			<p class="text-sm text-[var(--theme-text-muted)]">
				On the <strong>Maps</strong> page, click anywhere on the canvas to drop spatial pins for cities, citadels, ruins, and waypoints. Connect waypoints to character journey paths:
			</p>
			<ul class="list-disc pl-5 text-sm text-[var(--theme-text-muted)] space-y-1">
				<li><strong>Travel Feasibility:</strong> Select travel mode (Foot: 25 km/day, Horseback: 55 km/day, Carriage: 40 km/day, Gryphon: 250 km/day). Story OS computes geographic distances and flags impossible teleportation when characters travel too fast between chapters.</li>
				<li><strong>Dramatic Tension Curve:</strong> Switch to the Story Map tab to visualize the emotional stakes and value shifts across your narrative milestones.</li>
			</ul>
		</article>

		<!-- Section 6 -->
		<article class="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 sm:p-8 shadow-xs space-y-4">
			<div class="flex items-center gap-3">
				<span class="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--theme-accent-subtle)] font-bold text-[var(--theme-accent)]">6</span>
				<h2 class="font-display text-2xl font-bold">Theme Presets & Palette Switching</h2>
			</div>
			<p class="text-sm text-[var(--theme-text-muted)]">
				Use the Theme Switcher in the top-right header to toggle between 8 handcrafted visual styles designed for long writing sessions:
			</p>
			<div class="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
				<div class="rounded-lg border border-[var(--theme-border)] p-2.5 bg-[#faf7f2] text-stone-900">
					<div class="font-bold">Classic Parchment</div>
					<div class="text-[10px] opacity-70">Light · Editorial paper</div>
				</div>
				<div class="rounded-lg border border-[var(--theme-border)] p-2.5 bg-[#1f1f28] text-[#dcd7ba]">
					<div class="font-bold">Kanagawa Wave</div>
					<div class="text-[10px] opacity-70">Dark · Sumi-e & Red</div>
				</div>
				<div class="rounded-lg border border-[var(--theme-border)] p-2.5 bg-[#181616] text-[#c5c9c5]">
					<div class="font-bold">Kanagawa Dragon</div>
					<div class="text-[10px] opacity-70">Dark · Midnight ink</div>
				</div>
				<div class="rounded-lg border border-[var(--theme-border)] p-2.5 bg-[#2d353b] text-[#d3c6aa]">
					<div class="font-bold">Everforest Dark</div>
					<div class="text-[10px] opacity-70">Dark · Forest moss</div>
				</div>
				<div class="rounded-lg border border-[var(--theme-border)] p-2.5 bg-[#fdf6e3] text-[#5c6a72]">
					<div class="font-bold">Everforest Light</div>
					<div class="text-[10px] opacity-70">Light · Matcha & sand</div>
				</div>
				<div class="rounded-lg border border-[var(--theme-border)] p-2.5 bg-[#1e1e2e] text-[#cdd6f4]">
					<div class="font-bold">Catppuccin Mocha</div>
					<div class="text-[10px] opacity-70">Dark · Lavender pastel</div>
				</div>
				<div class="rounded-lg border border-[var(--theme-border)] p-2.5 bg-[#eff1f5] text-[#4c4f69]">
					<div class="font-bold">Catppuccin Latte</div>
					<div class="text-[10px] opacity-70">Light · Clean paper</div>
				</div>
				<div class="rounded-lg border border-[var(--theme-border)] p-2.5 bg-[#282828] text-[#ebdbb2]">
					<div class="font-bold">Gruvbox Dark</div>
					<div class="text-[10px] opacity-70">Dark · Amber groove</div>
				</div>
			</div>
		</article>
	</div>
</div>
