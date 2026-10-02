<script lang="ts">
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

	let { children } = $props();

	let showBundleModal = $state(false);
	let importJsonText = $state('');
	let bundleStatusMsg = $state<string | null>(null);
	let paletteComponent = $state<CommandPalette | null>(null);

	let sidebarCollapsed = $state(false);
	let mobileMenuOpen = $state(false);

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
					label: 'Manuscript',
					sub: 'Scenes & Anti-Slop',
					icon: 'pen',
					pathMatch: (p) => p.startsWith('/chapters')
				},
				{
					href: '/voice',
					label: 'Voice Lab',
					sub: 'Cadence & Tone Calibration',
					icon: 'mic',
					pathMatch: (p) => p.startsWith('/voice')
				},
				{
					href: '/feedback',
					label: 'Beta Triage',
					sub: 'Reader Notes & Verdicts',
					icon: 'chat',
					pathMatch: (p) => p.startsWith('/feedback')
				}
			]
		},
		{
			title: 'World & Lore',
			items: [
				{
					href: '/timeline',
					label: 'Timeline',
					sub: 'Chronology & Disclosures',
					icon: 'clock',
					pathMatch: (p) => p.startsWith('/timeline')
				},
				{
					href: '/mysteries',
					label: 'Mysteries',
					sub: 'Corkboard Clues & Arcs',
					icon: 'help',
					pathMatch: (p) => p.startsWith('/mysteries')
				},
				{
					href: '/maps',
					label: 'Maps',
					sub: 'Cartography & Travel Routes',
					icon: 'map',
					pathMatch: (p) => p.startsWith('/maps')
				},
				{
					href: '/magic',
					label: 'Magic Studio',
					sub: 'Hard Rules & Loopholes',
					icon: 'sparkles',
					pathMatch: (p) => p.startsWith('/magic')
				},
				{
					href: '/bible',
					label: 'World Bible',
					sub: 'Characters, Factions & Lore',
					icon: 'book',
					pathMatch: (p) => p.startsWith('/bible')
				}
			]
		},
		{
			title: 'Canon & Governance',
			items: [
				{
					href: '/decisions',
					label: 'Decisions',
					sub: 'Locked Decisions Ledger',
					icon: 'check',
					pathMatch: (p) => p.startsWith('/decisions')
				},
				{
					href: '/guide',
					label: 'System Guide',
					sub: 'Novel Skills & Architecture',
					icon: 'info',
					pathMatch: (p) => p.startsWith('/guide')
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

	<!-- Skeuomorphic Physical Left Bookbinder Sidebar -->
	<aside
		class="fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[var(--theme-border-strong)] bg-[var(--theme-header-bg)] shadow-[4px_0_16px_rgba(0,0,0,0.16)] transition-all duration-200 md:static {sidebarCollapsed
			? 'w-18'
			: 'w-64'} {mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}"
	>
		<!-- Binder Spine / Brand Header -->
		<div class="flex h-15 items-center justify-between border-b border-[var(--theme-border)] px-4">
			<a href="/" class="flex items-center gap-2.5 overflow-hidden group">
				<span class="skeuo-seal h-7 w-7 bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 text-stone-950 font-black shadow-[0_1px_3px_rgba(0,0,0,0.3)] shrink-0">
					<svg width="15" height="15" viewBox="0 0 24 24" fill="none" class="text-stone-950" aria-hidden="true">
						<path
							d="M12 2c1 4 4 5 4 9a4 4 0 0 1-8 0c0-4 3-5 4-9Z"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linejoin="round"
						/>
						<path d="M12 22v-7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
					</svg>
				</span>
				{#if !sidebarCollapsed}
					<div class="flex flex-col min-w-0">
						<span class="letterpress-title text-base font-extrabold tracking-tight truncate leading-tight">
							Story OS
						</span>
						<span class="text-[10px] font-sans font-semibold text-[var(--theme-accent)]">
							The Author's Bureau
						</span>
					</div>
				{/if}
			</a>

			<button
				type="button"
				class="hidden md:flex h-6 w-6 items-center justify-center rounded border border-[var(--theme-border)] text-xs text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface-subtle)]"
				onclick={() => (sidebarCollapsed = !sidebarCollapsed)}
				title={sidebarCollapsed ? 'Expand Binder Sidebar' : 'Collapse Binder Sidebar'}
			>
				{sidebarCollapsed ? '→' : '←'}
			</button>
		</div>

		<!-- Nav Items / Bookbinder Tabs -->
		<nav class="flex-1 overflow-y-auto p-3 space-y-4">
			{#each navSections as section}
				<div class="space-y-1">
					{#if !sidebarCollapsed}
						<div class="px-2 pt-2 pb-1 font-serif text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)] opacity-80">
							{section.title}
						</div>
					{/if}

					{#each section.items as item}
						{@const isActive = item.pathMatch(page.url.pathname)}
						<a
							href={item.href}
							onclick={() => (mobileMenuOpen = false)}
							class="skeuo-binder-tab {isActive ? 'active' : ''} {sidebarCollapsed ? 'justify-center px-2 py-2.5' : ''}"
							title={sidebarCollapsed ? `${item.label} (${item.sub})` : undefined}
						>
							<span class="h-4 w-4 shrink-0 flex items-center justify-center text-sm">
								{#if item.icon === 'pen'}
									<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 4 4 4L8 20l-5 1 1-5L16 4Z"/></svg>
								{:else if item.icon === 'mic'}
									<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
								{:else if item.icon === 'chat'}
									<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
								{:else if item.icon === 'clock'}
									<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
								{:else if item.icon === 'help'}
									<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3m.08 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
								{:else if item.icon === 'map'}
									<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
								{:else if item.icon === 'sparkles'}
									<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/></svg>
								{:else if item.icon === 'book'}
									<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Zm0 0a2 2 0 0 0 2 2h13"/></svg>
								{:else if item.icon === 'check'}
									<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
								{:else if item.icon === 'info'}
									<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
								{/if}
							</span>

							{#if !sidebarCollapsed}
								<div class="min-w-0 flex-1 truncate">
									<div class="truncate leading-tight font-sans font-semibold">{item.label}</div>
									<div class="truncate text-[10px] text-[var(--theme-text-muted)] font-normal">{item.sub}</div>
								</div>
							{/if}
						</a>
					{/each}
				</div>
			{/each}
		</nav>

		<!-- Bottom Desk Footer Footprint -->
		<div class="border-t border-[var(--theme-border)] p-3 space-y-2">
			{#if !sidebarCollapsed}
				<div class="flex items-center gap-2 rounded-md bg-[var(--theme-surface)] px-2.5 py-1.5 border border-[var(--theme-border)] shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)]">
					<span class="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
					<span class="font-serif text-[11px] font-semibold text-[var(--theme-text-muted)] truncate">
						Canon Guard Active
					</span>
				</div>
			{:else}
				<div class="flex justify-center" title="Canon Guard Active">
					<span class="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
				</div>
			{/if}
		</div>
	</aside>

	<!-- Main Workspace Canvas & Desk Blotter -->
	<div class="flex-1 min-w-0 flex flex-col min-h-screen">
		<!-- Subtle Top Desk Header Strip -->
		<header class="sticky top-0 z-30 h-15 border-b border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
			<div class="h-full flex items-center justify-between gap-3 px-4 sm:px-6">
				<!-- Left: Mobile Menu Toggle & Letterpress Breadcrumb -->
				<div class="flex items-center gap-3 min-w-0">
					<button
						type="button"
						class="flex md:hidden h-8 w-8 items-center justify-center rounded-lg border border-[var(--theme-border)] text-sm text-[var(--theme-text)] hover:bg-[var(--theme-surface-subtle)]"
						onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
						aria-label="Toggle Navigation Drawer"
					>
						☰
					</button>

					<div class="min-w-0">
						<span class="letterpress-title text-sm sm:text-base font-serif font-bold text-[var(--theme-text)] truncate block">
							{activePageTitle}
						</span>
					</div>
				</div>

				<!-- Right: Quick Jump, Agent Bundle & Theme Switcher -->
				<div class="flex items-center gap-2 shrink-0">
					<button
						type="button"
						class="skeuo-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans font-semibold text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
						onclick={() => paletteComponent?.openPalette()}
						title="Open Command & Jump Palette (Cmd+K / Cmd+P)"
					>
						<span>🔍</span>
						<span class="hidden sm:inline font-mono text-[11px]">⌘K</span>
					</button>

					<button
						type="button"
						class="skeuo-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans font-semibold"
						onclick={() => (showBundleModal = true)}
						title="Export or Import complete Story OS workspace bundle"
					>
						<span>📦</span>
						<span class="hidden sm:inline">Bundle</span>
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

		<!-- Tactile Footer -->
		<footer class="border-t border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] px-4 py-4 text-xs">
			<div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-[var(--theme-text-muted)]">
				<div class="flex items-center gap-2 font-serif">
					<span class="font-bold text-[var(--theme-text)]">Story OS</span>
					<span>·</span>
					<span>Relational, local-first author operating system</span>
				</div>
				<div class="font-serif italic text-[11px] text-[var(--theme-accent)]">
					"The author owns the story · The tool protects the story"
				</div>
			</div>
		</footer>
	</div>
</div>

<!-- Agent Bundle Export / Import Modal -->
{#if showBundleModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
		<div class="skeuo-box-lg w-full max-w-xl space-y-4 bg-[var(--theme-surface)] p-6 shadow-[0_16px_48px_rgba(0,0,0,0.4)]">
			<div class="flex items-center justify-between border-b border-[var(--theme-border)] pb-3">
				<div>
					<h3 class="letterpress-title text-lg font-bold">📦 Story OS Project Bundle</h3>
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
				<div class="skeuo-box bg-[var(--theme-surface-subtle)] p-4 space-y-2">
					<h4 class="font-serif text-xs font-bold uppercase tracking-wider text-[var(--theme-text)]">Export Workspace</h4>
					<p class="text-[11px] text-[var(--theme-text-muted)] leading-relaxed">
						Download a JSON bundle with full state to transfer between devices or use with CLI agents (Claude Code, Cursor, OpenCode).
					</p>
					<button
						type="button"
						class="skeuo-btn-primary w-full py-2 text-xs font-bold"
						onclick={handleExportBundle}
					>
						💾 Download Bundle JSON
					</button>
				</div>

				<div class="skeuo-box bg-[var(--theme-surface-subtle)] p-4 space-y-2">
					<h4 class="font-serif text-xs font-bold uppercase tracking-wider text-[var(--theme-text)]">Import Workspace</h4>
					<p class="text-[11px] text-[var(--theme-text-muted)] leading-relaxed">
						Paste a previously exported bundle JSON below to restore or merge your complete story state.
					</p>
					<button
						type="button"
						class="skeuo-btn w-full py-2 text-xs font-bold"
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
					class="skeuo-groove mt-1 w-full p-2.5 font-mono text-xs"
				></textarea>
			</div>

			<div class="flex justify-end pt-2">
				<button
					type="button"
					class="skeuo-btn px-4 py-2 text-xs font-bold"
					onclick={() => (showBundleModal = false)}
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}
