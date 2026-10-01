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
		class="neo-btn flex min-h-[38px] items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold text-[var(--theme-text)]"
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
				class="h-3.5 w-3.5 rounded-sm border-[1.5px] border-[var(--theme-border-strong)]"
				style="background-color: {activeOption.accentHex};"
			></span>
		</span>
		<span class="hidden sm:inline font-mono tracking-tight">{activeOption.name}</span>
		<svg
			class="h-3.5 w-3.5 transition-transform {isOpen ? 'rotate-180' : ''}"
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
			class="neo-box-lg absolute right-0 z-50 mt-2 w-72 rounded-xl p-2"
			role="listbox"
			tabindex="-1"
		>
			<div class="border-b-2 border-[var(--theme-border-strong)] px-2.5 pb-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--theme-text-faint)]">
				Theme Presets
			</div>
			<div class="mt-1 space-y-1 max-h-80 overflow-y-auto">
				{#each THEMES as theme (theme.id)}
					<button
						type="button"
						role="option"
						aria-selected={theme.id === currentTheme}
						class="flex w-full cursor-pointer items-center justify-between rounded-lg border-2 px-2.5 py-2 text-left text-xs transition-transform active:translate-x-0.5 active:translate-y-0.5 {theme.id ===
						currentTheme
							? 'border-[var(--theme-border-strong)] bg-[var(--theme-accent)] font-bold text-[var(--theme-accent-fg)] shadow-[2px_2px_0px_var(--theme-shadow-hard)]'
							: 'border-transparent text-[var(--theme-text)] hover:border-[var(--theme-border-strong)] hover:bg-[var(--theme-surface-subtle)]'}"
						onclick={() => selectTheme(theme.id)}
					>
						<div class="flex items-center gap-2.5">
							<!-- 3-square color preview -->
							<div class="flex items-center -space-x-1">
								<span
									class="h-3.5 w-3.5 rounded-xs border border-[var(--theme-border-strong)] shadow-xs"
									style="background-color: {theme.bgHex};"
								></span>
								<span
									class="h-3.5 w-3.5 rounded-xs border border-[var(--theme-border-strong)] shadow-xs"
									style="background-color: {theme.surfaceHex};"
								></span>
								<span
									class="h-3.5 w-3.5 rounded-xs border border-[var(--theme-border-strong)] shadow-xs"
									style="background-color: {theme.accentHex};"
								></span>
							</div>
							<div>
								<div class="flex items-center gap-1.5 font-bold">
									<span>{theme.name}</span>
									<span class="rounded border border-current px-1 py-0.2 text-[9px] font-mono uppercase">
										{theme.mode}
									</span>
								</div>
								<div class="text-[10px] opacity-80 leading-tight">
									{theme.description}
								</div>
							</div>
						</div>
						{#if theme.id === currentTheme}
							<span class="text-sm font-bold">✓</span>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>
