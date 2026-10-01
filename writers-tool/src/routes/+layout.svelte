<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<title>Story OS — The Operating System for Your Story</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="sticky top-0 z-50 border-b border-[#e7e0d3] bg-[#faf7f2]/95 backdrop-blur">
	<nav aria-label="Primary" class="mx-auto flex max-w-6xl items-center gap-1 px-4 py-3">
		<a
			href="/"
			class="mr-3 flex min-h-[44px] items-center gap-2 font-display text-2xl font-bold tracking-tight transition-colors duration-200 hover:text-[#9a3412]"
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
			class="flex min-h-[44px] items-center gap-1.5 rounded px-3 text-[15px] font-medium transition-colors duration-200 hover:bg-black/5 hover:text-[#9a3412]"
		>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
			class="flex min-h-[44px] items-center gap-1.5 rounded px-3 text-[15px] font-medium transition-colors duration-200 hover:bg-black/5 hover:text-[#9a3412]"
		>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" />
				<path d="M12 7v5l3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
			</svg>
			Timeline
		</a>
		<a
			href="/bible"
			class="flex min-h-[44px] items-center gap-1.5 rounded px-3 text-[15px] font-medium transition-colors duration-200 hover:bg-black/5 hover:text-[#9a3412]"
		>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<path
					d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Zm0 0a2 2 0 0 0 2 2h13"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			World Bible
		</a>
		<a
			href="/decisions"
			class="flex min-h-[44px] items-center gap-1.5 rounded px-3 text-[15px] font-medium transition-colors duration-200 hover:bg-black/5 hover:text-[#9a3412]"
		>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<path
					d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					stroke="currentColor"
					stroke-width="1.8"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			Decisions Ledger
		</a>
		<span
			class="ml-auto hidden items-center rounded-full border border-[#e7e0d3] px-3 py-1 text-xs font-medium text-[#57534e] lg:flex"
		>
			The author owns the story · The tool protects the story
		</span>
	</nav>
</header>
<main class="mx-auto max-w-6xl px-4 py-8">
	{@render children()}
</main>
<footer class="mx-auto max-w-6xl px-4 pb-10 text-sm text-[#57534e]">
	<p class="border-t border-[#e7e0d3] pt-4">
		Story OS · Relational, local-first narrative system. The AI never changes canon without your approval.
	</p>
</footer>
