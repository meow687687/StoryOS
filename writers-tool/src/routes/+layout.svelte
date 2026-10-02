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

	const navItems = [
		{
			href: '/chapters',
			label: 'Editor',
			icon: 'pen',
			pathMatch: (path: string) => path.startsWith('/chapters')
		},
		{
			href: '/voice',
			label: 'Voice Lab',
			icon: 'mic',
			pathMatch: (path: string) => path.startsWith('/voice')
		},
		{
			href: '/feedback',
			label: 'Beta Triage',
			icon: 'chat',
			pathMatch: (path: string) => path.startsWith('/feedback')
		},
		{
			href: '/timeline',
			label: 'Timeline',
			icon: 'clock',
			pathMatch: (path: string) => path.startsWith('/timeline')
		},
		{
			href: '/mysteries',
			label: 'Mysteries',
			icon: 'help',
			pathMatch: (path: string) => path.startsWith('/mysteries')
		},
		{
			href: '/maps',
			label: 'Maps',
			icon: 'map',
			pathMatch: (path: string) => path.startsWith('/maps')
		},
		{
			href: '/bible',
			label: 'Bible',
			icon: 'book',
			pathMatch: (path: string) => path.startsWith('/bible')
		},
		{
			href: '/decisions',
			label: 'Decisions',
			icon: 'check',
			pathMatch: (path: string) => path.startsWith('/decisions')
		},
		{
			href: '/guide',
			label: 'Guide',
			icon: 'info',
			pathMatch: (path: string) => path.startsWith('/guide')
		}
	];
</script>

<svelte:head>
	<title>Story OS — The Operating System for Your Story</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Skeuomorphic Top Command Header / Desk Blotter -->
<header class="sticky top-0 z-50 border-b border-[var(--theme-border-strong)] bg-[var(--theme-header-bg)] shadow-[0_4px_16px_rgba(0,0,0,0.18)]">
	<div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5">
		<!-- Brand Logo Stamp (Tactile Medallion) -->
		<a
			href="/"
			class="skeuo-btn flex items-center gap-2 rounded-lg px-3 py-1.5 text-base font-extrabold tracking-tight text-[var(--theme-text)]"
		>
			<span class="skeuo-seal h-6 w-6 bg-gradient-to-tr from-amber-600 to-amber-400 text-amber-950 font-black shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.6)]">
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" class="text-amber-950" aria-hidden="true">
					<path
						d="M12 2c1 4 4 5 4 9a4 4 0 0 1-8 0c0-4 3-5 4-9Z"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linejoin="round"
					/>
					<path d="M12 22v-7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
				</svg>
			</span>
			<span class="font-display font-black tracking-tight">Story OS</span>
			<span class="rounded border border-[var(--theme-border-strong)] bg-[var(--theme-surface-subtle)] px-1.5 py-0.2 font-mono text-[10px] font-bold text-[var(--theme-accent)] shadow-[inset_0_1px_1px_rgba(0,0,0,0.2)]">
				v1.0
			</span>
		</a>

		<!-- Segmented Tactile Navigation Rail -->
		<nav aria-label="Primary" class="flex flex-wrap items-center gap-1 rounded-xl border border-[var(--theme-border-strong)] bg-[var(--theme-surface-subtle)] p-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_1px_0_var(--theme-bevel-top)]">
			{#each navItems as item}
				{@const isActive = item.pathMatch(page.url.pathname)}
				<a
					href={item.href}
					class="flex min-h-[34px] items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all {isActive
						? 'skeuo-btn-primary border border-black/20 text-[var(--theme-accent-fg)] shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.35)]'
						: 'border border-transparent text-[var(--theme-text)] hover:border-[var(--theme-border-strong)] hover:bg-[var(--theme-surface)] hover:shadow-[0_1px_2px_rgba(0,0,0,0.1)]'}"
				>
					{#if item.icon === 'pen'}
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 4 4 4L8 20l-5 1 1-5L16 4Z"/></svg>
					{:else if item.icon === 'mic'}
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
					{:else if item.icon === 'chat'}
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
					{:else if item.icon === 'clock'}
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
					{:else if item.icon === 'help'}
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3m.08 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
					{:else if item.icon === 'map'}
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
					{:else if item.icon === 'book'}
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Zm0 0a2 2 0 0 0 2 2h13"/></svg>
					{:else if item.icon === 'check'}
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
					{:else if item.icon === 'info'}
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
					{/if}
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>

		<!-- Right Tooling: Search, Agent Bundle & Theme Switcher -->
		<div class="flex items-center gap-2">
			<button
				type="button"
				class="skeuo-btn flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
				onclick={() => paletteComponent?.openPalette()}
				title="Open Command & Jump Palette (Cmd+K / Cmd+P)"
			>
				<span>🔍</span>
				<span class="hidden sm:inline font-mono text-[11px]">⌘K</span>
			</button>

			<button
				type="button"
				class="skeuo-btn flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
				onclick={() => (showBundleModal = true)}
				title="Export or Import complete Story OS workspace bundle"
			>
				<span>📦</span>
				<span class="hidden sm:inline">Agent Bundle</span>
			</button>
			<ThemeSwitcher />
		</div>
	</div>
</header>

<CommandPalette bind:this={paletteComponent} />
<ToastManager />

<!-- Agent Bundle Export / Import Modal -->
{#if showBundleModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
		<div class="skeuo-box-lg w-full max-w-xl space-y-4 bg-[var(--theme-surface)] p-6 shadow-[0_16px_48px_rgba(0,0,0,0.4)]">
			<div class="flex items-center justify-between border-b border-[var(--theme-border)] pb-3">
				<div>
					<h3 class="font-display text-lg font-bold">📦 Story OS Project Bundle</h3>
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
					<h4 class="font-mono text-xs font-bold uppercase">Export Workspace</h4>
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
					<h4 class="font-mono text-xs font-bold uppercase">Import Workspace</h4>
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
				<label for="bundle-json-paste" class="block font-mono text-[11px] font-bold uppercase text-[var(--theme-text-muted)]">
					Paste Bundle JSON:
				</label>
				<textarea
					id="bundle-json-paste"
					bind:value={importJsonText}
					rows="6"
					placeholder="Paste JSON bundle content here..."
					class="skeuo-input mt-1 w-full p-2.5 font-mono text-xs"
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

<main class="mx-auto max-w-7xl px-4 py-8">
	{@render children()}
</main>

<!-- Skeuomorphic Footer -->
<footer class="mt-16 border-t border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] px-4 py-6 shadow-[inset_0_1px_0_var(--theme-bevel-top)]">
	<div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-xs font-medium">
		<div class="flex items-center gap-2">
			<span class="skeuo-badge rounded-xs bg-[var(--theme-surface)] px-1.5 py-0.5 text-[10px] text-[var(--theme-text)]">
				CANON-PROTECTED
			</span>
			<span class="text-[var(--theme-text-muted)]">
				Relational, local-first author operating system.
			</span>
		</div>
		<div class="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--theme-accent)]">
			The author owns the story · The tool protects the story
		</div>
	</div>
</footer>
