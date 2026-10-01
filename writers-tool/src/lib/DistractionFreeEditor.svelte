<script lang="ts">
	import CanonBadge from './CanonBadge.svelte';
	import { findEntityMentions, type WorldEntry } from './world';

	let {
		text = $bindable(),
		bible,
		ontouch,
		onselectentity
	}: {
		text: string;
		bible: WorldEntry[];
		ontouch: () => void;
		onselectentity: (entry: WorldEntry) => void;
	} = $props();

	let textareaEl = $state<HTMLTextAreaElement | null>(null);
	let isFocusMode = $state(false);
	let autocompleteQuery = $state<string | null>(null);
	let autocompleteIndex = $state(0);

	const words = $derived(text.trim() ? text.trim().split(/\s+/).length : 0);
	const readingTimeMinutes = $derived(Math.ceil(words / 220));

	// Ambient entity detections in current text
	const detectedMentions = $derived.by(() => {
		const mentions = findEntityMentions(bible, text);
		// Deduplicate by entryId
		const seen = new Set<string>();
		const unique: typeof mentions = [];
		for (const m of mentions) {
			if (!seen.has(m.entryId)) {
				seen.add(m.entryId);
				unique.push(m);
			}
		}
		return unique;
	});

	// Autocomplete candidates when user types @
	const filteredCandidates = $derived.by(() => {
		if (autocompleteQuery === null) return [];
		const q = autocompleteQuery.toLowerCase();
		return bible.filter(
			(e) =>
				e.name.toLowerCase().includes(q) ||
				e.aliases?.some((a) => a.toLowerCase().includes(q))
		);
	});

	function handleInput(e: Event) {
		ontouch();
		checkAutocomplete();
	}

	function checkAutocomplete() {
		if (!textareaEl) return;
		const cursorPos = textareaEl.selectionStart;
		const textBefore = text.slice(0, cursorPos);
		const lastAt = textBefore.lastIndexOf('@');

		if (lastAt !== -1 && cursorPos - lastAt <= 20) {
			const query = textBefore.slice(lastAt + 1);
			if (!query.includes(' ') && !query.includes('\n')) {
				autocompleteQuery = query;
				autocompleteIndex = 0;
				return;
			}
		}
		autocompleteQuery = null;
	}

	function insertEntity(entry: WorldEntry) {
		if (!textareaEl) return;
		const cursorPos = textareaEl.selectionStart;
		const textBefore = text.slice(0, cursorPos);
		const lastAt = textBefore.lastIndexOf('@');

		if (lastAt !== -1) {
			const textAfter = text.slice(cursorPos);
			text = text.slice(0, lastAt) + entry.name + ' ' + textAfter;
			autocompleteQuery = null;
			ontouch();

			// Restore focus and cursor
			setTimeout(() => {
				if (textareaEl) {
					textareaEl.focus();
					const newPos = lastAt + entry.name.length + 1;
					textareaEl.setSelectionRange(newPos, newPos);
				}
			}, 10);
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (autocompleteQuery !== null && filteredCandidates.length > 0) {
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				autocompleteIndex = (autocompleteIndex + 1) % filteredCandidates.length;
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				autocompleteIndex =
					(autocompleteIndex - 1 + filteredCandidates.length) % filteredCandidates.length;
			} else if (e.key === 'Enter' || e.key === 'Tab') {
				e.preventDefault();
				insertEntity(filteredCandidates[autocompleteIndex]);
			} else if (e.key === 'Escape') {
				autocompleteQuery = null;
			}
		}
	}
</script>

<div
	class="relative flex flex-col rounded-xl border border-[#e7e0d3] bg-white transition-all duration-300 shadow-sm {isFocusMode
		? 'fixed inset-0 z-50 rounded-none border-none p-6 md:p-12'
		: 'p-4'}"
>
	<!-- Editor Toolbar / Stats Header -->
	<div class="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#e7e0d3] pb-2">
		<div class="flex items-center gap-3 text-xs text-[#78716c]">
			<span class="font-medium text-[#292524]">{words} words</span>
			<span>·</span>
			<span>{readingTimeMinutes} min read</span>
			<span>·</span>
			<span class="hidden sm:inline">Type <kbd class="rounded bg-stone-100 px-1 py-0.5 font-mono text-[10px] text-stone-600">@</kbd> to insert entity</span>
		</div>

		<div class="flex items-center gap-2">
			<button
				type="button"
				class="cursor-pointer rounded-md border border-[#e7e0d3] px-2.5 py-1 text-xs font-medium text-[#57534e] hover:bg-stone-50"
				onclick={() => (isFocusMode = !isFocusMode)}
				title={isFocusMode ? 'Exit focus mode (Esc)' : 'Enter distraction-free focus mode'}
			>
				{isFocusMode ? 'Exit Focus' : 'Focus Mode ⛶'}
			</button>
		</div>
	</div>

	<!-- Textarea with Autocomplete -->
	<div class="relative min-w-0 flex-1">
		<textarea
			bind:this={textareaEl}
			bind:value={text}
			oninput={handleInput}
			onkeydown={handleKeyDown}
			placeholder="Begin drafting... Every character, secret, and rule connects here."
			class="manuscript min-h-[380px] w-full resize-y bg-transparent text-[16px] leading-[1.8] text-[#292524] placeholder:text-stone-300 focus:outline-hidden"
			style={isFocusMode ? 'height: calc(100vh - 220px);' : ''}
		></textarea>

		<!-- Autocomplete Menu -->
		{#if autocompleteQuery !== null && filteredCandidates.length > 0}
			<div
				class="absolute bottom-12 left-4 z-40 max-h-48 w-72 overflow-y-auto rounded-lg border border-[#e7e0d3] bg-white p-1 shadow-lg"
			>
				<div class="px-2 py-1 text-[10px] font-bold tracking-wider text-stone-400 uppercase">
					Bible Entities
				</div>
				{#each filteredCandidates as candidate, idx (candidate.id)}
					<button
						type="button"
						class="flex w-full cursor-pointer items-center justify-between rounded px-2 py-1.5 text-left text-xs {idx ===
						autocompleteIndex
							? 'bg-[#9a3412] text-white'
							: 'text-[#292524] hover:bg-stone-100'}"
						onclick={() => insertEntity(candidate)}
					>
						<span class="font-medium truncate">{candidate.name}</span>
						<span
							class="text-[10px] uppercase {idx === autocompleteIndex
								? 'text-white/80'
								: 'text-stone-400'}"
						>
							{candidate.kind}
						</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Ambient Entity Mentions Bar -->
	{#if detectedMentions.length > 0}
		<div class="mt-3 border-t border-[#e7e0d3] pt-2">
			<div class="flex flex-wrap items-center gap-1.5 text-xs">
				<span class="text-[11px] font-semibold tracking-wider text-[#78716c] uppercase">
					Linked in Scene:
				</span>
				{#each detectedMentions as mention (mention.entryId)}
					{@const fullEntry = bible.find((e) => e.id === mention.entryId)}
					{#if fullEntry}
						<button
							type="button"
							class="inline-flex cursor-pointer items-center gap-1 rounded-md border border-[#e7e0d3] bg-[#faf7f2] px-2 py-0.5 text-xs text-[#292524] transition-colors hover:border-[#9a3412] hover:bg-white"
							onclick={() => onselectentity(fullEntry)}
							title="Click to view dossier and temporal state"
						>
							<span class="font-medium">{mention.entryName}</span>
							<CanonBadge status={mention.status} size="sm" />
						</button>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>
