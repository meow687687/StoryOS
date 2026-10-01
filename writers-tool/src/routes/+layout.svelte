<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import ThemeSwitcher from '$lib/ThemeSwitcher.svelte';
	import { page } from '$app/state';

	let { children } = $props();

	const navItems = [
		{
			href: '/chapters',
			label: 'Editor',
			icon: 'pen',
			pathMatch: (path: string) => path.startsWith('/chapters')
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

<!-- Neobrutalist Top Command Header -->
<header class="sticky top-0 z-50 border-b-2 border-[var(--theme-border-strong)] bg-[var(--theme-header-bg)] shadow-[0_3px_0_0_var(--theme-shadow-hard)]">
	<div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5">
		<!-- Brand Logo Stamp -->
		<a
			href="/"
			class="neo-btn flex items-center gap-2 rounded-lg bg-[var(--theme-surface)] px-3 py-1.5 text-base font-extrabold uppercase tracking-tight text-[var(--theme-text)]"
		>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="text-[var(--theme-accent)]" aria-hidden="true">
				<path
					d="M12 2c1 4 4 5 4 9a4 4 0 0 1-8 0c0-4 3-5 4-9Z"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linejoin="round"
				/>
				<path d="M12 22v-7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
			</svg>
			<span class="font-display font-black tracking-tighter">Story OS</span>
			<span class="rounded-xs border border-current bg-[var(--theme-accent)] px-1 py-0.2 font-mono text-[10px] font-bold text-[var(--theme-accent-fg)]">
				v1.0
			</span>
		</a>

		<!-- Segmented Tactile Navigation Rail -->
		<nav aria-label="Primary" class="flex flex-wrap items-center gap-1 rounded-xl border-2 border-[var(--theme-border-strong)] bg-[var(--theme-surface-subtle)] p-1 shadow-[2px_2px_0px_var(--theme-shadow-hard)]">
			{#each navItems as item}
				{@const isActive = item.pathMatch(page.url.pathname)}
				<a
					href={item.href}
					class="flex min-h-[34px] items-center gap-1.5 rounded-lg border-2 px-3 py-1 text-xs font-bold transition-all active:translate-x-0.5 active:translate-y-0.5 {isActive
						? 'border-[var(--theme-border-strong)] bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] shadow-[2px_2px_0px_var(--theme-shadow-hard)]'
						: 'border-transparent text-[var(--theme-text)] hover:border-[var(--theme-border-strong)] hover:bg-[var(--theme-surface)]'}"
				>
					{#if item.icon === 'pen'}
						<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 4 4 4L8 20l-5 1 1-5L16 4Z"/></svg>
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

		<!-- Right Tooling: Theme Switcher -->
		<div class="flex items-center gap-2">
			<ThemeSwitcher />
		</div>
	</div>
</header>

<main class="mx-auto max-w-7xl px-4 py-8">
	{@render children()}
</main>

<!-- Neobrutalist Footer -->
<footer class="mt-16 border-t-2 border-[var(--theme-border-strong)] bg-[var(--theme-surface-subtle)] px-4 py-6 shadow-[0_-2px_0_0_var(--theme-shadow-hard)]">
	<div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-xs font-medium">
		<div class="flex items-center gap-2">
			<span class="neo-badge rounded-xs bg-[var(--theme-surface)] px-1.5 py-0.5 text-[10px] text-[var(--theme-text)]">
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
