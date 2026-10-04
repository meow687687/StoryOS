<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import ThemeSwitcher from '$lib/ThemeSwitcher.svelte';
	import CommandPalette from '$lib/CommandPalette.svelte';
	import ToastManager from '$lib/ToastManager.svelte';
	import { page } from '$app/state';
	import {
		exportProjectBundleJson,
		importProjectBundleJson,
		downloadFile
	} from '$lib/world';
	import {
		ARCHETYPES,
		loadProfile,
		saveProfile,
		type AuthorProfile,
		type WriterArchetype
	} from '$lib/profile';

	let { children } = $props();

	let showBundleModal = $state(false);
	let importJsonText = $state('');
	let bundleStatusMsg = $state<string | null>(null);
	let paletteComponent = $state<CommandPalette | null>(null);

	let mobileMenuOpen = $state(false);

	// Phase 1 onboarding: first run asks name + writer archetype, then configures the app.
	let profile = $state<AuthorProfile | null>(null);
	let showOnboarding = $state(false);
	let onboardingName = $state('');
	let onboardingArchetype = $state<WriterArchetype>('discovery');

	onMount(() => {
		profile = loadProfile();
		if (!profile) showOnboarding = true;
	});

	function handleOnboardingDone() {
		const name = onboardingName.trim();
		if (!name) return;
		profile = { name, archetype: onboardingArchetype, createdAt: new Date().toISOString() };
		saveProfile(profile);
		showOnboarding = false;
	}

	function handleExportBundle() {
		const json = exportProjectBundleJson();
		const dateStr = new Date().toISOString().slice(0, 10);
		downloadFile(`story-os-workspace-${dateStr}.json`, json, 'application/json');
		bundleStatusMsg = 'Bundle downloaded successfully!';
		setTimeout(() => {
			bundleStatusMsg = null;
		}, 3000);
	}

	function handleImportBundle() {
		if (!importJsonText.trim()) return;
		const result = importProjectBundleJson(importJsonText);
		if (result.success) {
			bundleStatusMsg = `Successfully imported ${result.importedCount} story artifacts!`;
			setTimeout(() => {
				window.location.reload();
			}, 1000);
		} else {
			bundleStatusMsg = `Import failed: ${result.errors?.join(', ')}`;
		}
	}

	interface NavSection {
		title: string;
		items: {
			href: string;
			label: string;
			sub: string;
			icon: string;
			pathMatch: (path: string) => boolean;
		}[];
	}

	const navSections: NavSection[] = [
		{
			title: 'The Manuscript Desk',
			items: [
				{
					href: '/chapters',
					label: 'Book Studio',
					sub: 'Paginated Manuscript & Typeset',
					icon: 'edit',
					pathMatch: (p) => p.startsWith('/chapters')
				},
				{
					href: '/partner',
					label: 'Editorial Partner',
					sub: 'Brainstorm, Character & Arc',
					icon: 'chat',
					pathMatch: (p) => p.startsWith('/partner')
				},
				{
					href: '/voice',
					label: 'Voice Lab',
					sub: 'Cadence & Anti-Slop Profile',
					icon: 'mic',
					pathMatch: (p) => p.startsWith('/voice')
				},
				{
					href: '/feedback',
					label: 'Beta Triage',
					sub: 'Reader Notes & Verdicts',
					icon: 'inbox',
					pathMatch: (p) => p.startsWith('/feedback')
				}
			]
		},
		{
			title: 'World & Lore',
			items: [
				{
					href: '/bible',
					label: 'World Bible',
					sub: 'Characters, Factions & Lore',
					icon: 'book',
					pathMatch: (p) => p.startsWith('/bible')
				},
				{
					href: '/magic',
					label: 'Magic Studio',
					sub: 'Vaelrion Combo Lab & Laws',
					icon: 'sparkles',
					pathMatch: (p) => p.startsWith('/magic')
				},
				{
					href: '/timeline',
					label: 'Timeline',
					sub: 'Chronology & Events',
					icon: 'clock',
					pathMatch: (p) => p.startsWith('/timeline')
				},
				{
					href: '/mysteries',
					label: 'Mysteries',
					sub: 'Clues & Conspiracies',
					icon: 'search',
					pathMatch: (p) => p.startsWith('/mysteries')
				},
				{
					href: '/maps',
					label: 'Maps',
					sub: 'Locations & Geography',
					icon: 'map',
					pathMatch: (p) => p.startsWith('/maps')
				}
			]
		},
		{
			title: 'Canon Governance',
			items: [
				{
					href: '/decisions',
					label: 'Decisions Ledger',
					sub: 'Locked Story Rulings',
					icon: 'check',
					pathMatch: (p) => p.startsWith('/decisions')
				}
			]
		}
	];

	const activePageTitle = $derived.by(() => {
		const path = page.url.pathname;
		for (const sec of navSections) {
			for (const it of sec.items) {
				if (it.pathMatch(path)) {
					return `${it.label} · ${it.sub}`;
				}
			}
		}
		if (path === '/') return 'The Master Author’s Desk · Overview';
		return 'Story OS Workspace';
	});
</script>

<svelte:head>
	<title>Story OS — The Operating System for Your Story</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="desk-blotter min-h-screen flex flex-col md:flex-row text-[var(--theme-text)]">
	<!-- Mobile Drawer Backdrop -->
	{#if mobileMenuOpen}
		<div
			class="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
			onclick={() => (mobileMenuOpen = false)}
			aria-hidden="true"
		></div>
	{/if}

	<!-- Quiet rail: three doors, nothing else. -->
	<aside
		class="fixed inset-y-0 left-0 z-50 flex w-[76px] flex-col border-r border-[var(--theme-border)] bg-[var(--theme-header-bg)] md:static {mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}"
	>
		<!-- Seal -->
		<div class="flex h-15 items-center justify-center border-b border-[var(--theme-border)]">
			<a href="/partner" class="flex items-center" title="Story OS · Partner">
				<span class="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--theme-accent)] font-black text-[var(--theme-accent-fg)]">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="text-[var(--theme-accent-fg)]" aria-hidden="true">
						<path
							d="M12 2c1 4 4 5 4 9a4 4 0 0 1-8 0c0-4 3-5 4-9Z"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linejoin="round"
						/>
						<path d="M12 22v-7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
					</svg>
				</span>
			</a>
		</div>

		<!-- Nav -->
		<nav class="flex-1 overflow-y-auto p-2">
			{#each navSections as section}
				{#each section.items as item}
					{@const isActive = item.pathMatch(page.url.pathname)}
					<a
						href={item.href}
						onclick={() => (mobileMenuOpen = false)}
						class="quiet-rail-item {isActive ? 'active' : ''}"
						title={item.label}
					>
						<span class="flex h-4 w-4 items-center justify-center">
							{#if item.icon === 'chat'}
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
							{:else if item.icon === 'book'}
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Zm0 0a2 2 0 0 0 2 2h13"/></svg>
							{:else if item.icon === 'check'}
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
							{/if}
						</span>
						<span class="quiet-rail-label">{item.label}</span>
					</a>
				{/each}
			{/each}
		</nav>

		<!-- Canon dot -->
		<div class="flex justify-center border-t border-[var(--theme-border)] p-3" title="Canon Guard Active">
			<span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
		</div>
	</aside>

	<!-- Main Workspace Canvas & Desk Blotter -->
	<div class="flex-1 min-w-0 flex flex-col min-h-screen">
		<!-- Quiet header strip -->
		<header class="sticky top-0 z-30 h-13 border-b border-[var(--theme-border)] bg-[var(--theme-bg)]">
			<div class="flex h-full items-center justify-between gap-3 px-4 sm:px-6">
				<!-- Left: Mobile Menu Toggle & Page Title -->
				<div class="flex min-w-0 items-center gap-3">
					<button
						type="button"
						class="quiet-ghost flex h-8 w-8 items-center justify-center md:hidden"
						onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
						aria-label="Toggle Navigation Drawer"
					>
						☰
					</button>

					<span class="block truncate font-serif text-sm font-semibold text-[var(--theme-text-muted)]">
						{activePageTitle}
					</span>
				</div>

				<!-- Right: Quick Jump, Bundle & Theme -->
				<div class="flex shrink-0 items-center gap-1">
					<button
						type="button"
						class="quiet-ghost flex items-center gap-1.5 px-2.5 py-1.5 text-xs"
						onclick={() => paletteComponent?.openPalette()}
						title="Open Command & Jump Palette (Cmd+K / Cmd+P)"
					>
						<span>⌕</span>
						<span class="hidden font-mono text-[11px] sm:inline">⌘K</span>
					</button>

					<button
						type="button"
						class="quiet-ghost px-2.5 py-1.5 text-xs"
						onclick={() => (showBundleModal = true)}
						title="Export or Import complete Story OS workspace bundle"
					>
						<span>📦</span>
					</button>

					<ThemeSwitcher />
				</div>
			</div>
		</header>

		<CommandPalette bind:this={paletteComponent} />
		<ToastManager />

		<!-- Main Page Workspace -->
		<main class="flex-1 p-4 sm:p-6 lg:p-8">
			{@render children()}
		</main>

		<!-- Quiet footer -->
		<footer class="border-t border-[var(--theme-border)] px-4 py-3">
			<p class="mx-auto max-w-7xl font-serif text-[11px] text-[var(--theme-text-faint)] italic">
				The author owns the story · The tool protects the story
			</p>
		</footer>
	</div>
</div>

<!-- First-run onboarding: name + writer archetype -->
{#if showOnboarding}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div class="quiet-card w-full max-w-lg space-y-5 p-8">
			<div class="space-y-1">
				<p class="quiet-label">Welcome to your desk</p>
				<p class="font-serif text-sm text-[var(--theme-text-muted)] italic">
					Your partner configures itself around how you write.
				</p>
			</div>

			<div class="space-y-1">
				<label for="onboarding-name" class="quiet-label">
					What should your partner call you?
				</label>
				<input
					id="onboarding-name"
					bind:value={onboardingName}
					type="text"
					placeholder="Your name"
					class="quiet-field font-serif text-base"
					maxlength="60"
				/>
			</div>

			<fieldset class="space-y-1">
				<legend class="quiet-label pb-1">
					What kind of writer are you?
				</legend>
				{#each ARCHETYPES as arch (arch.id)}
					<label
						class="flex cursor-pointer items-start gap-3 border-b border-[var(--theme-border)] py-3 transition-all last:border-b-0 {onboardingArchetype === arch.id
							? 'opacity-100'
							: 'opacity-55 hover:opacity-85'}"
					>
						<input
							type="radio"
							name="archetype"
							value={arch.id}
							bind:group={onboardingArchetype}
							class="mt-1 accent-[var(--theme-accent)]"
						/>
						<span class="min-w-0">
							<span class="block font-serif text-sm font-bold text-[var(--theme-text)]">{arch.label}</span>
							<span class="block font-serif text-xs leading-relaxed text-[var(--theme-text-muted)] italic">{arch.tagline}</span>
						</span>
					</label>
				{/each}
			</fieldset>

			<div class="flex justify-end pt-1">
				<button
					type="button"
					class="quiet-primary px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider"
					onclick={handleOnboardingDone}
					disabled={!onboardingName.trim()}
				>
					Take your seat →
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Agent Bundle Export / Import Modal -->
{#if showBundleModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
		<div class="quiet-card w-full max-w-xl space-y-4 p-6">
			<div class="flex items-center justify-between border-b border-[var(--theme-border)] pb-3">
				<div>
					<h3 class="font-serif text-lg font-bold">Project bundle</h3>
					<p class="text-xs text-[var(--theme-text-muted)]">
						Export or import the complete portable agent workspace (bible, decisions, voice, feedback, chapters, timeline, maps).
					</p>
				</div>
				<button
					type="button"
					class="text-sm font-bold text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
					onclick={() => (showBundleModal = false)}
				>
					×
				</button>
			</div>

			{#if bundleStatusMsg}
				<div class="rounded-md border border-emerald-600 bg-emerald-500/15 p-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-200">
					{bundleStatusMsg}
				</div>
			{/if}

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
				<div class="quiet-card bg-[var(--theme-surface-subtle)] p-4 space-y-2">
					<h4 class="font-serif text-xs font-bold uppercase tracking-wider text-[var(--theme-text)]">Export Workspace</h4>
					<p class="text-[11px] text-[var(--theme-text-muted)] leading-relaxed">
						Download a JSON bundle with full state to transfer between devices or use with CLI agents (Claude Code, Cursor, OpenCode).
					</p>
					<button
						type="button"
						class="quiet-primary w-full py-2 text-xs font-bold"
						onclick={handleExportBundle}
					>
						💾 Download Bundle JSON
					</button>
				</div>

				<div class="quiet-card bg-[var(--theme-surface-subtle)] p-4 space-y-2">
					<h4 class="font-serif text-xs font-bold uppercase tracking-wider text-[var(--theme-text)]">Import Workspace</h4>
					<p class="text-[11px] text-[var(--theme-text-muted)] leading-relaxed">
						Paste a previously exported bundle JSON below to restore or merge your complete story state.
					</p>
					<button
						type="button"
						class="quiet-ghost w-full py-2 text-xs font-bold"
						onclick={handleImportBundle}
						disabled={!importJsonText.trim()}
					>
						📥 Restore From JSON
					</button>
				</div>
			</div>

			<div>
				<label for="bundle-json-paste" class="block font-serif text-[11px] font-bold uppercase text-[var(--theme-text-muted)]">
					Paste Bundle JSON:
				</label>
				<textarea
					id="bundle-json-paste"
					bind:value={importJsonText}
					rows="6"
					placeholder="Paste JSON bundle content here..."
					class="quiet-field mt-1 w-full p-2.5 font-mono text-xs"
				></textarea>
			</div>

			<div class="flex justify-end pt-2">
				<button
					type="button"
					class="quiet-ghost px-4 py-2 text-xs font-bold"
					onclick={() => (showBundleModal = false)}
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}
