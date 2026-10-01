<script lang="ts">
	import type { Chapter, WorldEntry } from './world';

	let {
		chapter,
		bible,
		ontouch
	}: {
		chapter: Chapter;
		bible: WorldEntry[];
		ontouch: () => void;
	} = $props();

	let collapsed = $state(false);
	let newThread = $state('');

	const magicRules = $derived(bible.filter((e) => e.kind === 'magic'));
	const characters = $derived(bible.filter((e) => e.kind === 'character'));

	function addThread() {
		if (!newThread.trim()) return;
		chapter.threads = [...(chapter.threads ?? []), newThread.trim()];
		newThread = '';
		ontouch();
	}

	function removeThread(index: number) {
		chapter.threads = (chapter.threads ?? []).filter((_, i) => i !== index);
		ontouch();
	}

	function toggleRule(id: string) {
		const current = new Set(chapter.rulesPinned ?? []);
		if (current.has(id)) {
			current.delete(id);
		} else {
			current.add(id);
		}
		chapter.rulesPinned = Array.from(current);
		ontouch();
	}
</script>

<aside
	class="neo-box rounded-xl transition-all duration-200 {collapsed
		? 'p-2.5'
		: 'p-4'}"
	aria-label="Story Context"
>
	<div class="flex items-center justify-between border-b-2 border-[var(--theme-border-strong)] pb-2">
		<button
			class="flex cursor-pointer items-center gap-2 text-left"
			onclick={() => (collapsed = !collapsed)}
		>
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				class="text-[var(--theme-accent)] transition-transform duration-200 {collapsed ? '-rotate-90' : ''}"
			>
				<path
					d="M19 9l-7 7-7-7"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			<span class="font-display text-xs font-black tracking-wider text-[var(--theme-text)] uppercase">
				Story Context HUD
			</span>
		</button>
		<span class="neo-badge rounded-sm bg-[var(--theme-surface-subtle)] px-2 py-0.5 text-[10px] text-[var(--theme-text)]">
			{collapsed ? 'Expand' : 'Active Scene'}
		</span>
	</div>

	{#if !collapsed}
		<div class="mt-3.5 space-y-3.5 text-sm">
			<!-- Act & Arc -->
			<div>
				<label for="hud-act" class="block font-mono text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">
					Act / Arc
				</label>
				<input
					id="hud-act"
					bind:value={chapter.act}
					oninput={ontouch}
					placeholder="e.g. Act I — The Inciting Incident"
					class="neo-input mt-1 w-full rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--theme-text)] placeholder:text-[var(--theme-text-faint)]"
				/>
			</div>

			<!-- POV Character -->
			<div>
				<label for="hud-pov" class="block font-mono text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">
					POV Character
				</label>
				<div class="mt-1 flex gap-1">
					<input
						id="hud-pov"
						bind:value={chapter.pov}
						oninput={ontouch}
						placeholder="e.g. Lucan"
						list="pov-candidates"
						class="neo-input w-full rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--theme-text)] placeholder:text-[var(--theme-text-faint)]"
					/>
					<datalist id="pov-candidates">
						{#each characters as c (c.id)}
							<option value={c.name}></option>
						{/each}
					</datalist>
				</div>
			</div>

			<!-- Scene Goal / Dramatic Turn -->
			<div>
				<label for="hud-goal" class="block font-mono text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">
					Dramatic Scene Goal
				</label>
				<textarea
					id="hud-goal"
					bind:value={chapter.goal}
					oninput={ontouch}
					rows={2}
					placeholder="What must change by the end of this scene? What is at stake?"
					class="neo-input mt-1 w-full rounded-md p-2 text-xs leading-relaxed text-[var(--theme-text)] placeholder:text-[var(--theme-text-faint)]"
				></textarea>
			</div>

			<!-- Pinned World & Magic Rules -->
			<div>
				<div class="flex items-center justify-between">
					<span class="font-mono text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">
						Active World Laws ({chapter.rulesPinned?.length ?? 0})
					</span>
				</div>
				{#if magicRules.length === 0}
					<p class="mt-1 text-[11px] text-[var(--theme-text-faint)]">
						No magic rules in Bible. Add magic entries with "cannot/never/only" to pin them here.
					</p>
				{:else}
					<div class="mt-1.5 max-h-32 space-y-1.5 overflow-y-auto pr-1">
						{#each magicRules as rule (rule.id)}
							{@const isPinned = (chapter.rulesPinned ?? []).includes(rule.id)}
							<button
								type="button"
								class="flex w-full cursor-pointer items-start gap-1.5 rounded-md border-2 p-1.5 text-left text-[11px] transition-transform active:translate-x-0.5 active:translate-y-0.5 {isPinned
									? 'border-[var(--theme-border-strong)] bg-[var(--theme-accent)] text-[var(--theme-accent-fg)] font-bold shadow-[2px_2px_0px_var(--theme-shadow-hard)]'
									: 'border-[var(--theme-border-strong)] bg-[var(--theme-surface-subtle)] text-[var(--theme-text)] hover:bg-[var(--theme-surface)]'}"
								onclick={() => toggleRule(rule.id)}
							>
								<span class="mt-0.5">{isPinned ? '📌' : '▫️'}</span>
								<div class="min-w-0 flex-1">
									<div class="font-bold">{rule.name}</div>
									<div class="line-clamp-2 text-[10px] opacity-80">{rule.text}</div>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Unresolved Threads / Open Clues -->
			<div>
				<span class="block font-mono text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">
					Unresolved Threads ({chapter.threads?.length ?? 0})
				</span>
				<div class="mt-1 space-y-1.5">
					{#each chapter.threads ?? [] as thread, i (thread + i)}
						<div
							class="flex items-center justify-between gap-1 rounded-md border-[1.5px] border-[var(--theme-border-strong)] bg-[var(--theme-surface-subtle)] px-2 py-1 text-xs font-medium text-[var(--theme-text)] shadow-[1.5px_1.5px_0px_var(--theme-shadow-hard)]"
						>
							<span class="min-w-0 flex-1 truncate">• {thread}</span>
							<button
								class="cursor-pointer font-bold text-[var(--theme-text-faint)] hover:text-rose-500"
								onclick={() => removeThread(i)}
								aria-label="Remove thread"
							>
								×
							</button>
						</div>
					{/each}
					<div class="flex gap-1.5 pt-1">
						<input
							bind:value={newThread}
							onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addThread())}
							placeholder="Plant or advance a clue…"
							class="neo-input min-w-0 flex-1 rounded-md px-2 py-1 text-xs text-[var(--theme-text)] placeholder:text-[var(--theme-text-faint)]"
						/>
						<button
							class="neo-btn rounded-md px-3 py-1 text-xs font-bold text-[var(--theme-text)]"
							onclick={addThread}
						>
							Add
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</aside>
