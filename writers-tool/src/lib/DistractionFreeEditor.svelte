<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import CanonBadge from './CanonBadge.svelte';
	import { countWords, findEntityMentions, type EntityMention, type WorldEntry } from './world';

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

	const words = $derived(countWords(text));
	const readingTimeMinutes = $derived(Math.ceil(words / 220));

	let detectedMentions = $state<EntityMention[]>([]);
	let mentionsTimer: ReturnType<typeof setTimeout> | null = null;

	function updateMentions() {
		const mentions = findEntityMentions(bible, text);
		const seen = new Set<string>();
		const unique: typeof mentions = [];
		for (const m of mentions) {
			if (!seen.has(m.entryId)) {
				seen.add(m.entryId);
				unique.push(m);
			}
		}
		detectedMentions = unique;
	}

	function scheduleMentionsUpdate() {
		if (mentionsTimer) clearTimeout(mentionsTimer);
		mentionsTimer = setTimeout(() => {
			updateMentions();
			mentionsTimer = null;
		}, 300);
	}

	onMount(() => {
		updateMentions();
	});

	onDestroy(() => {
		if (mentionsTimer) clearTimeout(mentionsTimer);
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
		scheduleMentionsUpdate();
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
	class="relative flex flex-col rounded-xl skeuo-paper transition-all duration-200 {isFocusMode
		? 'fixed inset-0 z-50 rounded-none border-none p-6 md:p-12 shadow-none'
		: 'p-6'}"
>
	<!-- Editor Toolbar / Stats Header -->
	<div class="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--theme-border)] pb-2.5">
		<div class="flex items-center gap-3 text-xs font-mono font-bold text-[var(--theme-text-muted)]">
			<span class="rounded bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)] px-2.5 py-0.5 text-[var(--theme-text)] shadow-[inset_0_1px_1px_rgba(0,0,0,0.15)]">
				{words} words
			</span>
			<span>·</span>
			<span>{readingTimeMinutes} min read</span>
			<span>·</span>
			<span class="hidden sm:inline font-sans text-xs font-normal">Type <kbd class="rounded border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[var(--theme-text)] shadow-[0_1px_1px_rgba(0,0,0,0.1)]">@</kbd> to insert entity</span>
		</div>

		<div class="flex items-center gap-2">
			<button
				type="button"
				class="skeuo-btn rounded-md px-3 py-1 text-xs font-bold text-[var(--theme-text)]"
				onclick={() => (isFocusMode = !isFocusMode)}
				title={isFocusMode ? 'Exit focus mode (Esc)' : 'Enter distraction-free focus mode'}
			>
				{isFocusMode ? '✕ Exit Focus' : 'Focus Mode ⛶'}
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
			class="manuscript min-h-[380px] w-full resize-y bg-transparent text-[16px] leading-[1.8] text-[var(--theme-text)] placeholder:text-[var(--theme-text-faint)] focus:outline-hidden"
			style={isFocusMode ? 'height: calc(100vh - 220px);' : ''}
		></textarea>

		<!-- Autocomplete Menu -->
		{#if autocompleteQuery !== null && filteredCandidates.length > 0}
			<div
				class="skeuo-box-lg absolute bottom-12 left-4 z-40 max-h-52 w-72 overflow-y-auto rounded-xl p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-md"
			>
				<div class="border-b border-[var(--theme-border)] px-2 py-1 text-[10px] font-mono font-bold tracking-wider text-[var(--theme-text-faint)] uppercase">
					Bible Entities
				</div>
				{#each filteredCandidates as candidate, idx (candidate.id)}
					<button
						type="button"
						class="flex w-full cursor-pointer items-center justify-between rounded-md border px-2 py-1.5 text-left text-xs transition-all {idx ===
						autocompleteIndex
							? 'border-[var(--theme-border-strong)] bg-[var(--theme-btn-primary-gradient,var(--theme-accent))] font-bold text-[var(--theme-accent-fg)] shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.35)]'
							: 'border-transparent text-[var(--theme-text)] hover:bg-[var(--theme-surface-subtle)]'}"
						onclick={() => insertEntity(candidate)}
					>
						<span class="font-bold truncate">{candidate.name}</span>
						<span
							class="text-[10px] uppercase font-mono {idx === autocompleteIndex
								? 'opacity-90'
								: 'text-[var(--theme-text-faint)]'}"
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
		<div class="mt-4 border-t border-[var(--theme-border)] pt-3">
			<div class="flex flex-wrap items-center gap-1.5 text-xs">
				<span class="font-mono text-[11px] font-bold tracking-wider text-[var(--theme-text-faint)] uppercase">
					Linked in Scene:
				</span>
				{#each detectedMentions as mention (mention.entryId)}
					{@const fullEntry = bible.find((e) => e.id === mention.entryId)}
					{#if fullEntry}
						<button
							type="button"
							class="skeuo-btn inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-[var(--theme-text)]"
							onclick={() => onselectentity(fullEntry)}
							title="Click to view dossier and temporal state"
						>
							<span class="font-bold">{mention.entryName}</span>
							<CanonBadge status={mention.status} size="sm" />
						</button>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>
