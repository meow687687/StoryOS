<script lang="ts">
	import { onMount } from 'svelte';
	import { applyTheme, getStoredTheme, THEMES, type ThemeId, type ThemeOption } from './theme';

	let currentTheme = $state<ThemeId>('parchment');
	let isOpen = $state(false);
	let menuRef = $state<HTMLDivElement | null>(null);

	onMount(() => {
		currentTheme = getStoredTheme();
		applyTheme(currentTheme);

		function handleClickOutside(e: MouseEvent) {
			if (menuRef && !menuRef.contains(e.target as Node)) {
				isOpen = false;
			}
		}

		window.addEventListener('click', handleClickOutside);
		return () => window.removeEventListener('click', handleClickOutside);
	});

	function selectTheme(id: ThemeId) {
		currentTheme = id;
		applyTheme(id);
		isOpen = false;
	}

	const activeOption = $derived(
		THEMES.find((t) => t.id === currentTheme) ?? THEMES[0]
	);
</script>

<div class="relative inline-block" bind:this={menuRef}>
	<button
		type="button"
		class="flex min-h-[38px] cursor-pointer items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--theme-text)] shadow-xs transition-colors hover:border-[var(--theme-border-strong)]"
		onclick={(e) => {
			e.stopPropagation();
			isOpen = !isOpen;
		}}
		aria-expanded={isOpen}
		aria-haspopup="listbox"
		title="Change appearance theme"
	>
		<!-- Color dot swatch -->
		<span class="flex items-center gap-1">
			<span
				class="h-3 w-3 rounded-full border border-black/20"
				style="background-color: {activeOption.accentHex};"
			></span>
		</span>
		<span class="hidden sm:inline">{activeOption.name}</span>
		<svg
			class="h-3.5 w-3.5 opacity-60 transition-transform {isOpen ? 'rotate-180' : ''}"
			viewBox="0 0 20 20"
			fill="currentColor"
		>
			<path
				fill-rule="evenodd"
				d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
				clip-rule="evenodd"
			/>
		</svg>
	</button>

	{#if isOpen}
		<div
			class="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-1.5 shadow-xl backdrop-blur-md"
			role="listbox"
			tabindex="-1"
		>
			<div class="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-faint)]">
				Theme Presets
			</div>
			<div class="space-y-0.5 max-h-80 overflow-y-auto">
				{#each THEMES as theme (theme.id)}
					<button
						type="button"
						role="option"
						aria-selected={theme.id === currentTheme}
						class="flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors {theme.id ===
						currentTheme
							? 'bg-[var(--theme-surface-subtle)] font-semibold text-[var(--theme-accent)]'
							: 'text-[var(--theme-text)] hover:bg-[var(--theme-surface-subtle)]'}"
						onclick={() => selectTheme(theme.id)}
					>
						<div class="flex items-center gap-2.5">
							<!-- 3-dot color preview -->
							<div class="flex items-center -space-x-1">
								<span
									class="h-3.5 w-3.5 rounded-full border border-black/20 shadow-xs"
									style="background-color: {theme.bgHex};"
								></span>
								<span
									class="h-3.5 w-3.5 rounded-full border border-black/20 shadow-xs"
									style="background-color: {theme.surfaceHex};"
								></span>
								<span
									class="h-3.5 w-3.5 rounded-full border border-black/20 shadow-xs"
									style="background-color: {theme.accentHex};"
								></span>
							</div>
							<div>
								<div class="flex items-center gap-1.5">
									<span>{theme.name}</span>
									<span class="rounded px-1 py-0.2 text-[9px] font-medium uppercase opacity-60">
										{theme.mode}
									</span>
								</div>
								<div class="text-[10px] opacity-70 leading-tight">
									{theme.description}
								</div>
							</div>
						</div>
						{#if theme.id === currentTheme}
							<svg class="h-4 w-4 shrink-0 text-[var(--theme-accent)]" viewBox="0 0 20 20" fill="currentColor">
								<path
									fill-rule="evenodd"
									d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
									clip-rule="evenodd"
								/>
							</svg>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>
