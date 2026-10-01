<script lang="ts">
	import CanonBadge from './CanonBadge.svelte';
	import type { WorldEntry } from './world';

	let {
		entry,
		onclose
	}: {
		entry: WorldEntry | null;
		onclose: () => void;
	} = $props();
</script>

{#if entry}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
		role="dialog"
		aria-modal="true"
		aria-labelledby="dossier-title"
	>
		<div
			class="relative max-h-[85vh] w-full max-w-lg overflow-y-auto neo-box-lg border-2 border-[var(--theme-border-strong)] bg-[var(--theme-surface)] p-6 text-[var(--theme-text)]"
		>
			<div class="flex items-start justify-between gap-3">
				<div>
					<div class="flex items-center gap-2">
						<span
							class="neo-badge uppercase font-mono tracking-wider"
						>
							{entry.kind}
						</span>
						<CanonBadge status={entry.status ?? 'canon'} size="sm" />
					</div>
					<h2 id="dossier-title" class="font-display mt-2 text-2xl font-bold tracking-tight text-[var(--theme-text)]">
						{entry.name}
					</h2>
				</div>
				<button
					class="neo-btn flex h-8 w-8 items-center justify-center p-0 text-[var(--theme-text)]"
					onclick={onclose}
					aria-label="Close dossier"
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
						<path
							d="M6 6l12 12M18 6L6 18"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
						/>
					</svg>
				</button>
			</div>

			{#if entry.aliases && entry.aliases.length > 0}
				<div class="mt-2 text-xs text-[var(--theme-text-muted)] font-mono">
					<span class="font-bold text-[var(--theme-text)]">Aliases:</span>
					{entry.aliases.join(', ')}
				</div>
			{/if}

			<div class="mt-4 neo-box-sm bg-[var(--theme-surface-subtle)] p-4">
				<h3 class="text-xs font-bold font-mono tracking-wider text-[var(--theme-text-muted)] uppercase">Canon Record</h3>
				<p class="manuscript mt-2 text-sm leading-relaxed whitespace-pre-wrap text-[var(--theme-text)]">
					{entry.text}
				</p>
			</div>

			<div class="mt-5 flex items-center justify-between border-t-2 border-[var(--theme-border-strong)] pt-4">
				<a
					href="/bible"
					class="text-xs font-bold text-[var(--theme-accent)] hover:underline decoration-2"
				>
					View in World Bible →
				</a>
				<button
					class="neo-btn-primary px-4 py-2 text-xs font-bold"
					onclick={onclose}
				>
					Done
				</button>
			</div>
		</div>
	</div>
{/if}
