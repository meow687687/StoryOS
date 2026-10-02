<script lang="ts">
	import {
		computeWordDiff,
		inlineTransformProse,
		type AIConfig,
		type InlineActionType,
		type InlineTransformResult,
		type TextDiffPart
	} from './ai';
	import type { Decision, VoiceProfile, WorldEntry } from './world';

	let {
		selectedText,
		position,
		bible,
		decisions,
		voice,
		cfg,
		onreplace,
		onclose
	}: {
		selectedText: string;
		position: { top: number; left: number };
		bible: WorldEntry[];
		decisions: Decision[];
		voice: VoiceProfile | null;
		cfg: AIConfig;
		onreplace: (newText: string) => void;
		onclose: () => void;
	} = $props();

	let busy = $state(false);
	let customPrompt = $state('');
	let showCustomInput = $state(false);
	let activeResult = $state<InlineTransformResult | null>(null);
	let diffParts = $state<TextDiffPart[]>([]);
	let copied = $state(false);

	async function handleAction(action: InlineActionType) {
		busy = true;
		try {
			const res = await inlineTransformProse(cfg, {
				selectedText,
				action,
				customPrompt: action === 'custom' ? customPrompt : undefined,
				bible,
				decisions,
				voice
			});
			activeResult = res;
			diffParts = computeWordDiff(selectedText, res.transformedText);
		} catch (err) {
			console.error(err);
		} finally {
			busy = false;
		}
	}

	function applyReplacement() {
		if (activeResult) {
			onreplace(activeResult.transformedText);
			onclose();
		}
	}

	async function copyProposed() {
		if (activeResult) {
			await navigator.clipboard.writeText(activeResult.transformedText);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			onclose();
		} else if (e.key === 'Enter' && e.ctrlKey && activeResult) {
			e.preventDefault();
			applyReplacement();
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} />

<!-- Floating Popover Container -->
<div
	class="absolute z-50 flex flex-col gap-2 rounded-xl skeuo-box-lg border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] p-3 text-xs shadow-[0_12px_36px_rgba(0,0,0,0.35),inset_0_1px_0_var(--theme-bevel-top)] backdrop-blur-md transition-all animate-in fade-in zoom-in-95"
	style="top: {position.top}px; left: {position.left}px; min-width: 320px; max-width: 480px;"
>
	<!-- Header / Quick Pill Actions -->
	<div class="flex items-center justify-between gap-1.5 border-b border-[var(--theme-border)] pb-2">
		<div class="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--theme-accent)]">
			<span class="skeuo-seal h-4 w-4 text-[9px] bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-950 font-black">
				⚡
			</span>
			<span>Inline Assistant</span>
		</div>
		<button
			type="button"
			class="cursor-pointer text-xs font-bold text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
			onclick={onclose}
			title="Close (Esc)"
		>
			✕
		</button>
	</div>

	<!-- Action Pills Row -->
	{#if !activeResult}
		<div class="flex flex-wrap items-center gap-1.5 pt-1">
			<button
				type="button"
				class="skeuo-btn flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[var(--theme-text)] disabled:opacity-50"
				disabled={busy}
				onclick={() => handleAction('sensory')}
				title="Strip filter verbs and replace clichés with concrete sensory imagery"
			>
				<span>⚡</span>
				<span>Sensory Punch</span>
			</button>

			<button
				type="button"
				class="skeuo-btn flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[var(--theme-text)] disabled:opacity-50"
				disabled={busy}
				onclick={() => handleAction('dialogue')}
				title="Sharpen dialogue subtext, speech contractions, and remove slop tags"
			>
				<span>💬</span>
				<span>Dialogue Polish</span>
			</button>

			<button
				type="button"
				class="skeuo-btn flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[var(--theme-text)] disabled:opacity-50"
				disabled={busy}
				onclick={() => handleAction('canon')}
				title="Verify against World Bible lore and Decisions Ledger"
			>
				<span>🛡️</span>
				<span>Canon Check</span>
			</button>

			<button
				type="button"
				class="skeuo-btn flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[var(--theme-text)] disabled:opacity-50"
				disabled={busy}
				onclick={() => handleAction('rhythm')}
				title="Vary cadence into alternating 4-22-6 rhythm"
			>
				<span>🎵</span>
				<span>Rhythm</span>
			</button>

			<button
				type="button"
				class="skeuo-btn flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
				onclick={() => (showCustomInput = !showCustomInput)}
				title="Type custom revision instruction"
			>
				<span>✏️</span>
				<span>Custom</span>
			</button>
		</div>

		<!-- Custom Prompt Field -->
		{#if showCustomInput}
			<div class="mt-1 flex items-center gap-1.5 pt-1">
				<input
					type="text"
					bind:value={customPrompt}
					placeholder="e.g. make Kael more guarded and tense..."
					class="skeuo-input min-w-0 flex-1 px-2.5 py-1 text-xs"
					onkeydown={(e) => e.key === 'Enter' && customPrompt.trim() && handleAction('custom')}
				/>
				<button
					type="button"
					class="skeuo-btn-primary px-3 py-1 text-xs font-bold disabled:opacity-50"
					disabled={busy || !customPrompt.trim()}
					onclick={() => handleAction('custom')}
				>
					Run
				</button>
			</div>
		{/if}

		{#if busy}
			<div class="mt-2 flex items-center gap-2 rounded-md bg-[var(--theme-surface-subtle)] p-2 text-xs font-bold text-[var(--theme-accent)]">
				<span class="animate-spin">⚙️</span>
				<span>Refining selection against craft rules...</span>
			</div>
		{/if}
	{:else}
		<!-- Proposed Transformation & Diff Preview Card -->
		<div class="space-y-2 pt-1">
			<div class="flex items-center justify-between text-[11px] font-mono text-[var(--theme-text-muted)]">
				<span class="font-bold uppercase tracking-wider text-[var(--theme-accent)]">
					{activeResult.action.toUpperCase()} REVISION
				</span>
				<span>{activeResult.explanation}</span>
			</div>

			<!-- Canon Warnings Callout -->
			{#if activeResult.canonWarnings && activeResult.canonWarnings.length > 0}
				<div class="rounded-md border border-amber-600/60 bg-amber-500/15 p-2 text-[11px] font-bold text-amber-900 dark:text-amber-200">
					{#each activeResult.canonWarnings as warn}
						<div>{warn}</div>
					{/each}
				</div>
			{/if}

			<!-- Diff Body -->
			<div class="manuscript max-h-48 overflow-y-auto rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-3 text-[13px] leading-relaxed shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
				{#each diffParts as part}
					{#if part.type === 'same'}
						<span>{part.value}</span>
					{:else if part.type === 'added'}
						<mark class="rounded bg-emerald-500/25 px-0.5 font-bold text-emerald-800 dark:text-emerald-300">
							{part.value}
						</mark>
					{:else if part.type === 'removed'}
						<del class="rounded bg-rose-500/20 px-0.5 text-rose-700 line-through opacity-75 dark:text-rose-300">
							{part.value}
						</del>
					{/if}
				{/each}
			</div>

			<!-- Actions Bottom Bar -->
			<div class="flex items-center justify-between pt-1">
				<div class="flex items-center gap-1.5">
					<button
						type="button"
						class="skeuo-btn px-2.5 py-1 text-xs font-bold text-[var(--theme-text)]"
						onclick={() => (activeResult = null)}
					>
						← Back
					</button>
					<button
						type="button"
						class="skeuo-btn px-2.5 py-1 text-xs font-bold text-[var(--theme-text)]"
						onclick={copyProposed}
					>
						{copied ? '✓ Copied' : '📋 Copy'}
					</button>
				</div>

				<button
					type="button"
					class="skeuo-btn-primary px-3.5 py-1 text-xs font-bold"
					onclick={applyReplacement}
				>
					✓ Replace Selection
				</button>
			</div>
		</div>
	{/if}
</div>
