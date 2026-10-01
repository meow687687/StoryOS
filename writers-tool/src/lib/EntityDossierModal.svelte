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
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
		role="dialog"
		aria-modal="true"
		aria-labelledby="dossier-title"
	>
		<div
			class="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#e7e0d3] bg-[#faf7f2] p-6 shadow-xl"
		>
			<div class="flex items-start justify-between gap-3">
				<div>
					<div class="flex items-center gap-2">
						<span
							class="rounded-full border border-[#e7e0d3] bg-white px-2 py-0.5 text-[11px] font-semibold tracking-wider text-[#57534e] uppercase"
						>
							{entry.kind}
						</span>
						<CanonBadge status={entry.status ?? 'canon'} size="sm" />
					</div>
					<h2 id="dossier-title" class="font-display mt-2 text-2xl font-bold text-[#1c1917]">
						{entry.name}
					</h2>
				</div>
				<button
					class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#78716c] hover:bg-black/5 hover:text-[#1c1917]"
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
				<div class="mt-2 text-xs text-[#78716c]">
					<span class="font-semibold">Aliases:</span>
					{entry.aliases.join(', ')}
				</div>
			{/if}

			<div class="mt-4 rounded-lg border border-[#e7e0d3] bg-white/90 p-4 shadow-xs">
				<h3 class="text-xs font-bold tracking-wider text-[#78716c] uppercase">Canon Record</h3>
				<p class="manuscript mt-2 text-sm leading-relaxed whitespace-pre-wrap text-[#292524]">
					{entry.text}
				</p>
			</div>

			<div class="mt-5 flex items-center justify-between border-t border-[#e7e0d3] pt-4">
				<a
					href="/bible"
					class="text-xs font-medium text-[#9a3412] underline decoration-[#9a3412]/40 hover:decoration-[#9a3412]"
				>
					View in World Bible →
				</a>
				<button
					class="cursor-pointer rounded-lg bg-[#292524] px-4 py-2 text-xs font-medium text-white hover:bg-black"
					onclick={onclose}
				>
					Done
				</button>
			</div>
		</div>
	</div>
{/if}
