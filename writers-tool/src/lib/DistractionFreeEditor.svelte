<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import CanonBadge from './CanonBadge.svelte';
	import InlineAIBubble from './InlineAIBubble.svelte';
	import {
		countWords,
		findEntityMentions,
		type Decision,
		type EntityMention,
		type VoiceProfile,
		type WorldEntry
	} from './world';
	import { type AIConfig, DEFAULT_OLLAMA_MODEL } from './ai';
	import { toasts } from './toasts';

	let {
		text = $bindable(),
		bible,
		decisions = [],
		voice = null,
		cfg = { provider: 'ollama', apiKey: '', model: DEFAULT_OLLAMA_MODEL },
		ontouch,
		onselectentity
	}: {
		text: string;
		bible: WorldEntry[];
		decisions?: Decision[];
		voice?: VoiceProfile | null;
		cfg?: AIConfig;
		ontouch: () => void;
		onselectentity: (entry: WorldEntry) => void;
	} = $props();

	let textareaEl = $state<HTMLTextAreaElement | null>(null);
	let isFocusMode = $state(false);
	let isTypewriterMode = $state(false);
	let soundEnabled = $state(false);
	let sessionTarget = $state(500);
	let initialWordCount = $state<number | null>(null);

	let autocompleteQuery = $state<string | null>(null);
	let autocompleteIndex = $state(0);

	// Floating Inline AI Bubble State
	let selectedSnippet = $state<string>('');
	let selectionCoords = $state<{ top: number; left: number } | null>(null);
	let selectionRange = $state<{ start: number; end: number } | null>(null);

	const words = $derived(countWords(text));
	const readingTimeMinutes = $derived(Math.ceil(words / 220));

	const sessionWordsWritten = $derived(
		initialWordCount !== null ? Math.max(0, words - initialWordCount) : 0
	);
	const targetPercent = $derived(
		Math.min(100, Math.round((sessionWordsWritten / sessionTarget) * 100))
	);

	let detectedMentions = $state<EntityMention[]>([]);
	let mentionsTimer: ReturnType<typeof setTimeout> | null = null;

	// Web Audio Synthesizer for subtle mechanical typewriter click
	let audioCtx: AudioContext | null = null;

	function playMechanicalClick() {
		if (!soundEnabled) return;
		try {
			if (!audioCtx) {
				const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
				audioCtx = new AudioContextClass();
			}
			if (audioCtx.state === 'suspended') {
				audioCtx.resume();
			}

			const osc = audioCtx.createOscillator();
			const gain = audioCtx.createGain();
			const filter = audioCtx.createBiquadFilter();

			filter.type = 'bandpass';
			filter.frequency.value = 1800 + Math.random() * 400;
			filter.Q.value = 3;

			osc.type = 'triangle';
			osc.frequency.setValueAtTime(120, audioCtx.currentTime);
			osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.02);

			gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.025);

			osc.connect(filter);
			filter.connect(gain);
			gain.connect(audioCtx.destination);

			osc.start();
			osc.stop(audioCtx.currentTime + 0.03);
		} catch {
			/* audio ignored */
		}
	}

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
		initialWordCount = countWords(text);
		updateMentions();
	});

	onDestroy(() => {
		if (mentionsTimer) clearTimeout(mentionsTimer);
		if (audioCtx) audioCtx.close().catch(() => {});
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

	function handleSelectionCheck() {
		if (!textareaEl) return;
		const start = textareaEl.selectionStart;
		const end = textareaEl.selectionEnd;

		if (start !== end && end - start >= 3) {
			const snippet = text.slice(start, end);
			selectedSnippet = snippet;
			selectionRange = { start, end };

			// Estimate position relative to textarea
			const textBefore = text.slice(0, start);
			const lines = textBefore.split('\n');
			const lineIndex = lines.length;
			const lineHeight = 28; // approx 16px font with 1.8 leading
			const top = Math.max(60, Math.min(textareaEl.clientHeight - 120, lineIndex * lineHeight + 40));
			const left = Math.min(Math.max(20, textareaEl.clientWidth / 2 - 160), textareaEl.clientWidth - 340);

			selectionCoords = { top, left };
		} else if (!selectedSnippet) {
			selectionCoords = null;
			selectionRange = null;
		}
	}

	function handleInput(e: Event) {
		ontouch();
		playMechanicalClick();
		checkAutocomplete();
		scheduleMentionsUpdate();
		handleTypewriterScroll();
	}

	function handleTypewriterScroll() {
		if (!isTypewriterMode || !textareaEl) return;
		const cursorPos = textareaEl.selectionStart;
		const textBefore = text.slice(0, cursorPos);
		const lines = textBefore.split('\n').length;
		const approxLineTop = lines * 28;
		const viewportMiddle = window.innerHeight * 0.45;
		
		const rect = textareaEl.getBoundingClientRect();
		const targetWindowY = window.scrollY + rect.top + approxLineTop - viewportMiddle;
		
		window.scrollTo({
			top: targetWindowY,
			behavior: 'smooth'
		});
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
		// Cmd+K to summon inline AI when text is selected
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			if (textareaEl && textareaEl.selectionStart !== textareaEl.selectionEnd) {
				e.preventDefault();
				handleSelectionCheck();
				return;
			}
		}

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

	function handleReplaceSnippet(replacement: string) {
		if (!selectionRange || !textareaEl) return;
		const before = text.slice(0, selectionRange.start);
		const after = text.slice(selectionRange.end);
		text = before + replacement + after;
		ontouch();
		toasts.success('Replaced selection and synchronized manuscript!');

		const newPos = selectionRange.start + replacement.length;
		selectionCoords = null;
		selectionRange = null;
		selectedSnippet = '';

		setTimeout(() => {
			if (textareaEl) {
				textareaEl.focus();
				textareaEl.setSelectionRange(newPos, newPos);
			}
		}, 20);
	}
</script>

<div
	class="relative flex flex-col rounded-xl skeuo-paper transition-all duration-200 {isFocusMode
		? 'fixed inset-0 z-50 rounded-none border-none p-6 md:p-12 shadow-none'
		: 'p-6'}"
>
	<!-- Editor Toolbar / Stats Header -->
	<div class="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--theme-border)] pb-2.5">
		<div class="flex flex-wrap items-center gap-2.5 text-xs font-mono font-bold text-[var(--theme-text-muted)]">
			<span class="rounded bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)] px-2.5 py-0.5 text-[var(--theme-text)] shadow-[inset_0_1px_1px_rgba(0,0,0,0.15)]">
				{words} words
			</span>
			<span>·</span>
			<span>{readingTimeMinutes} min read</span>
			<span>·</span>

			<!-- Session Goal Progress Meter -->
			<button
				type="button"
				class="skeuo-badge flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-mono cursor-pointer hover:border-[var(--theme-accent)]"
				onclick={() => {
					const targets = [250, 500, 1000, 2000];
					const nextIdx = (targets.indexOf(sessionTarget) + 1) % targets.length;
					sessionTarget = targets[nextIdx];
				}}
				title="Session word target: Click to cycle (250, 500, 1000, 2000 words)"
			>
				<span>🎯</span>
				<span>{sessionWordsWritten}/{sessionTarget}w</span>
				<div class="h-1.5 w-12 overflow-hidden rounded-full bg-[var(--theme-border)]">
					<div
						class="h-full bg-emerald-500 transition-all duration-300"
						style="width: {targetPercent}%"
					></div>
				</div>
				<span class="opacity-80">{targetPercent}%</span>
			</button>

			<span class="hidden sm:inline font-sans text-xs font-normal">Type <kbd class="rounded border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[var(--theme-text)] shadow-[0_1px_1px_rgba(0,0,0,0.1)]">@</kbd> to insert entity</span>
		</div>

		<div class="flex flex-wrap items-center gap-1.5">
			<!-- Sound Synthesizer Toggle -->
			<button
				type="button"
				class="skeuo-btn rounded-md px-2.5 py-1 text-xs font-bold text-[var(--theme-text)] {soundEnabled
					? 'bg-[var(--theme-surface-subtle)] text-[var(--theme-accent)]'
					: 'opacity-75'}"
				onclick={() => {
					soundEnabled = !soundEnabled;
					if (soundEnabled) playMechanicalClick();
				}}
				title="Toggle mechanical key clicks (synthesized)"
			>
				{soundEnabled ? '🔊 Sound' : '🔇 Mute'}
			</button>

			<!-- Typewriter Scrolling Toggle -->
			<button
				type="button"
				class="skeuo-btn rounded-md px-2.5 py-1 text-xs font-bold transition-all {isTypewriterMode
					? 'skeuo-btn-primary border-black/20 text-[var(--theme-accent-fg)]'
					: 'text-[var(--theme-text)]'}"
				onclick={() => (isTypewriterMode = !isTypewriterMode)}
				title="Typewriter Scrolling: Keep current line vertically centered"
			>
				📜 Typewriter {isTypewriterMode ? 'ON' : 'OFF'}
			</button>

			<!-- Focus Mode Toggle -->
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

	<!-- Textarea with Autocomplete & Selection Tracking -->
	<div class="relative min-w-0 flex-1">
		<textarea
			bind:this={textareaEl}
			bind:value={text}
			oninput={handleInput}
			onkeydown={handleKeyDown}
			onmouseup={handleSelectionCheck}
			onkeyup={handleSelectionCheck}
			placeholder="Begin drafting... Every character, secret, and rule connects here. Select any passage and press Cmd+K for Inline AI."
			class="manuscript min-h-[380px] w-full resize-y bg-transparent text-[16px] leading-[1.8] text-[var(--theme-text)] placeholder:text-[var(--theme-text-faint)] focus:outline-hidden"
			style={isFocusMode ? 'height: calc(100vh - 220px);' : ''}
		></textarea>

		<!-- Floating Inline AI Bubble on Selection -->
		{#if selectionCoords && selectedSnippet}
			<InlineAIBubble
				selectedText={selectedSnippet}
				position={selectionCoords}
				{bible}
				{decisions}
				{voice}
				{cfg}
				onreplace={handleReplaceSnippet}
				onclose={() => {
					selectionCoords = null;
					selectedSnippet = '';
				}}
			/>
		{/if}

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
