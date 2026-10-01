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
			class="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-2xl text-[var(--theme-text)]"
		>
			<div class="flex items-start justify-between gap-3">
				<div>
					<div class="flex items-center gap-2">
						<span
							class="rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] px-2.5 py-0.5 text-[11px] font-semibold tracking-wider text-[var(--theme-text-muted)] uppercase"
						>
							{entry.kind}
						</span>
						<CanonBadge status={entry.status ?? 'canon'} size="sm" />
					</div>
					<h2 id="dossier-title" class="font-display mt-2 text-2xl font-bold text-[var(--theme-text)]">
						{entry.name}
					</h2>
				</div>
				<button
					class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[var(--theme-text-faint)] hover:bg-[var(--theme-surface-subtle)] hover:text-[var(--theme-text)]"
					onclick={onclose}
					aria-label="Close dossier"
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
						<path
							d="M6 6l12 12M18 6L6 18"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
					</svg>
				</button>
			</div>

			{#if entry.aliases && entry.aliases.length > 0}
				<div class="mt-2 text-xs text-[var(--theme-text-muted)]">
					<span class="font-semibold">Aliases:</span>
					{entry.aliases.join(', ')}
				</div>
			{/if}

			<div class="mt-4 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-4 shadow-xs">
				<h3 class="text-xs font-bold tracking-wider text-[var(--theme-text-muted)] uppercase">Canon Record</h3>
				<p class="manuscript mt-2 text-sm leading-relaxed whitespace-pre-wrap text-[var(--theme-text)]">
					{entry.text}
				</p>
			</div>

			<div class="mt-5 flex items-center justify-between border-t border-[var(--theme-border)] pt-4">
				<a
					href="/bible"
					class="text-xs font-medium text-[var(--theme-accent)] underline decoration-[var(--theme-accent)]/40 hover:decoration-[var(--theme-accent)]"
				>
					View in World Bible →
				</a>
				<button
					class="cursor-pointer rounded-lg bg-[var(--theme-accent)] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:opacity-90"
					onclick={onclose}
				>
					Done
				</button>
			</div>
		</div>
	</div>
{/if}
