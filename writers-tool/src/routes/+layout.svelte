<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import ThemeSwitcher from '$lib/ThemeSwitcher.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>Story OS — The Operating System for Your Story</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="sticky top-0 z-50 border-b border-[var(--theme-border)] bg-[var(--theme-header-bg)] backdrop-blur-md transition-colors">
	<nav aria-label="Primary" class="mx-auto flex max-w-6xl items-center gap-1 px-4 py-2.5">
		<a
			href="/"
			class="mr-2 flex min-h-[40px] items-center gap-2 font-display text-2xl font-bold tracking-tight text-[var(--theme-text)] transition-colors hover:text-[var(--theme-accent)]"
		>
			<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<path
					d="M12 2c1 4 4 5 4 9a4 4 0 0 1-8 0c0-4 3-5 4-9Z"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linejoin="round"
				/>
				<path d="M12 22v-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
			</svg>
			Story OS
		</a>
		<a
			href="/chapters"
			class="flex min-h-[38px] items-center gap-1.5 rounded-lg px-2.5 text-[14px] font-medium text-[var(--theme-text)] transition-colors hover:bg-[var(--theme-surface-subtle)] hover:text-[var(--theme-accent)]"
		>
			<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<path
					d="m16 4 4 4L8 20l-5 1 1-5L16 4Z"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			Editor
		</a>
		<a
			href="/timeline"
			class="flex min-h-[38px] items-center gap-1.5 rounded-lg px-2.5 text-[14px] font-medium text-[var(--theme-text)] transition-colors hover:bg-[var(--theme-surface-subtle)] hover:text-[var(--theme-accent)]"
		>
			<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" />
				<path d="M12 7v5l3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
			</svg>
			Timeline
		</a>
		<a
			href="/mysteries"
			class="flex min-h-[38px] items-center gap-1.5 rounded-lg px-2.5 text-[14px] font-medium text-[var(--theme-text)] transition-colors hover:bg-[var(--theme-surface-subtle)] hover:text-[var(--theme-accent)]"
		>
			<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<path
					d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3m.08 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			Mysteries
		</a>
		<a
			href="/maps"
			class="flex min-h-[38px] items-center gap-1.5 rounded-lg px-2.5 text-[14px] font-medium text-[var(--theme-text)] transition-colors hover:bg-[var(--theme-surface-subtle)] hover:text-[var(--theme-accent)]"
		>
			<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
				<line x1="8" y1="2" x2="8" y2="18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
				<line x1="16" y1="6" x2="16" y2="22" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
			Maps
		</a>
		<a
			href="/bible"
			class="flex min-h-[38px] items-center gap-1.5 rounded-lg px-2.5 text-[14px] font-medium text-[var(--theme-text)] transition-colors hover:bg-[var(--theme-surface-subtle)] hover:text-[var(--theme-accent)]"
		>
			<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<path
					d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Zm0 0a2 2 0 0 0 2 2h13"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			Bible
		</a>
		<a
			href="/decisions"
			class="flex min-h-[38px] items-center gap-1.5 rounded-lg px-2.5 text-[14px] font-medium text-[var(--theme-text)] transition-colors hover:bg-[var(--theme-surface-subtle)] hover:text-[var(--theme-accent)]"
		>
			<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<path
					d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			Decisions
		</a>
		<a
			href="/guide"
			class="flex min-h-[38px] items-center gap-1.5 rounded-lg px-2.5 text-[14px] font-semibold text-[var(--theme-accent)] transition-colors hover:bg-[var(--theme-surface-subtle)]"
		>
			<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8" />
				<path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
			</svg>
			Guide
		</a>

		<div class="ml-auto flex items-center gap-2">
			<ThemeSwitcher />
		</div>
	</nav>
</header>
<main class="mx-auto max-w-6xl px-4 py-8">
	{@render children()}
</main>
<footer class="mx-auto max-w-6xl px-4 pb-10 text-sm text-[var(--theme-text-muted)]">
	<div class="border-t border-[var(--theme-border)] pt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
		<p>
			Story OS · Relational, local-first narrative system. The AI never changes canon without your approval.
		</p>
		<p class="text-[var(--theme-text-faint)]">
			The author owns the story · The tool protects the story
		</p>
	</div>
</footer>
