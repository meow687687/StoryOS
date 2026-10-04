<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		loadBible,
		loadChapters,
		loadMysteries,
		type Chapter,
		type MysteryNode,
		type WorldEntry
	} from './world';
	import { MAGIC_ARCHETYPES } from './magic';

	let isOpen = $state(false);
	let query = $state('');
	let selectedIndex = $state(0);
	let inputEl = $state<HTMLInputElement | null>(null);

	let chapters = $state<Chapter[]>([]);
	let bible = $state<WorldEntry[]>([]);
	let mysteries = $state<MysteryNode[]>([]);

	export function openPalette() {
		chapters = loadChapters();
		bible = loadBible();
		mysteries = loadMysteries();
		query = '';
		selectedIndex = 0;
		isOpen = true;
		setTimeout(() => inputEl?.focus(), 50);
	}

	export function closePalette() {
		isOpen = false;
	}

	interface PaletteItem {
		id: string;
		category: 'Chapter' | 'Bible' | 'Mystery' | 'Action' | 'Magic';
		title: string;
		subtitle: string;
		icon: string;
		action: () => void;
	}

	const commandActions: PaletteItem[] = [
		{
			id: 'act-partner',
			category: 'Action',
			title: 'Open Shaping Partner',
			subtitle: 'Dump, discuss, and shape with your editor',
			icon: '💬',
			action: () => goto('/partner')
		},
		{
			id: 'act-bible',
			category: 'Action',
			title: 'Open World Bible',
			subtitle: 'Characters, locations, factions & hard magic rules',
			icon: '📖',
			action: () => goto('/bible')
		},
		{
			id: 'act-decisions',
			category: 'Action',
			title: 'Open Decisions Ledger',
			subtitle: 'Locked author canon decisions (decisions.md)',
			icon: '🛡️',
			action: () => goto('/decisions')
		}
	];

	const filteredItems = $derived.by(() => {
		const q = query.trim().toLowerCase();
		const results: PaletteItem[] = [];

		if (!q) {
			return commandActions;
		}

		// Search Actions
		for (const act of commandActions) {
			if (act.title.toLowerCase().includes(q) || act.subtitle.toLowerCase().includes(q)) {
				results.push(act);
			}
		}

		// Search Chapters
		for (let i = 0; i < chapters.length; i++) {
			const c = chapters[i];
			if (c.title.toLowerCase().includes(q) || (c.act && c.act.toLowerCase().includes(q))) {
				results.push({
					id: `ch-${c.id}`,
					category: 'Chapter',
					title: `Chapter ${i + 1}: ${c.title}`,
					subtitle: c.act ? `Act: ${c.act}` : 'Manuscript Scene',
					icon: '📜',
					action: () => goto(`/chapters?id=${c.id}`)
				});
			}
		}

		// Search Bible
		for (const ent of bible) {
			if (
				ent.name.toLowerCase().includes(q) ||
				ent.text.toLowerCase().includes(q) ||
				ent.aliases?.some((a) => a.toLowerCase().includes(q))
			) {
				results.push({
					id: `ent-${ent.id}`,
					category: 'Bible',
					title: ent.name,
					subtitle: `[${ent.kind.toUpperCase()}] ${ent.text.slice(0, 70)}...`,
					icon: ent.kind === 'magic' ? '✨' : ent.kind === 'character' ? '👤' : '📍',
					action: () => goto(`/bible?select=${ent.id}`)
				});
			}
		}

		// Search Magic Archetypes
		for (const arch of MAGIC_ARCHETYPES) {
			if (
				arch.name.toLowerCase().includes(q) ||
				arch.source.toLowerCase().includes(q) ||
				arch.tagline.toLowerCase().includes(q) ||
				arch.famousInspirations.some((ex) => ex.toLowerCase().includes(q))
			) {
				results.push({
					id: `magic-arch-${arch.id}`,
					category: 'Magic',
					title: `Magic: ${arch.name}`,
					subtitle: `[Hardness ${arch.hardness}/5] ${arch.tagline.slice(0, 70)}...`,
					icon: '🔮',
					action: () => goto('/magic')
				});
			}
		}

		// Search Mysteries
		for (const m of mysteries) {
			if (m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)) {
				results.push({
					id: `myst-${m.id}`,
					category: 'Mystery',
					title: m.title,
					subtitle: `[${m.type.toUpperCase()}] status: ${m.status}`,
					icon: '🔍',
					action: () => goto(`/mysteries?select=${m.id}`)
				});
			}
		}

		return results.slice(0, 16);
	});

	function handleGlobalKeyDown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && (e.key === 'p' || e.key === 'k')) {
			// If inside textarea and text is selected, let inline bubble handle Cmd+K
			const activeElement = document.activeElement;
			if (
				activeElement instanceof HTMLTextAreaElement &&
				activeElement.selectionStart !== activeElement.selectionEnd &&
				e.key === 'k'
			) {
				return;
			}
			e.preventDefault();
			if (isOpen) {
				closePalette();
			} else {
				openPalette();
			}
		} else if (isOpen) {
			if (e.key === 'Escape') {
				e.preventDefault();
				closePalette();
			} else if (e.key === 'ArrowDown') {
				e.preventDefault();
				selectedIndex = (selectedIndex + 1) % (filteredItems.length || 1);
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				selectedIndex = (selectedIndex - 1 + (filteredItems.length || 1)) % (filteredItems.length || 1);
			} else if (e.key === 'Enter') {
				e.preventDefault();
				const item = filteredItems[selectedIndex];
				if (item) {
					item.action();
					closePalette();
				}
			}
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleGlobalKeyDown);
		return () => window.removeEventListener('keydown', handleGlobalKeyDown);
	});
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-20 backdrop-blur-xs"
		role="dialog"
		aria-modal="true"
		aria-label="Command and Jump Palette"
		tabindex="-1"
	>
		<button
			type="button"
			class="fixed inset-0 -z-10 h-full w-full cursor-default border-none bg-transparent"
			onclick={closePalette}
			tabindex="-1"
			aria-label="Close dialog backdrop"
		></button>
		<div
			class="skeuo-paper-sheet w-full max-w-2xl overflow-hidden rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all animate-in fade-in zoom-in-95"
		>
			<!-- Search Input Box -->
			<div class="flex items-center gap-3 border-b border-[var(--theme-border)] px-4 py-3.5 bg-[var(--theme-surface)]">
				<span class="text-base text-[var(--theme-accent)]">🔍</span>
				<input
					bind:this={inputEl}
					bind:value={query}
					type="text"
					placeholder="Search chapters, bible lore, mysteries, or commands..."
					class="w-full bg-transparent font-serif text-sm font-semibold text-[var(--theme-text)] placeholder:text-[var(--theme-text-faint)] focus:outline-hidden"
				/>
				<span class="rounded border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] px-2 py-0.5 font-sans text-[10px] font-semibold text-[var(--theme-text-muted)] shadow-[0_1px_1px_rgba(0,0,0,0.1)]">
					Esc
				</span>
			</div>

			<!-- Results List -->
			<div class="max-h-96 overflow-y-auto p-2 space-y-1 bg-[var(--theme-surface-card)]">
				{#each filteredItems as item, idx (item.id)}
					<button
						type="button"
						class="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-all {idx ===
						selectedIndex
							? 'border border-[var(--theme-border)] bg-[var(--theme-btn-primary-gradient,var(--theme-accent))] text-[var(--theme-accent-fg)] font-semibold shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.4)]'
							: 'border border-transparent text-[var(--theme-text)] hover:bg-[var(--theme-surface-subtle)]'}"
						onclick={() => {
							item.action();
							closePalette();
						}}
					>
						<div class="flex items-center gap-3 min-w-0 flex-1">
							<span class="h-6 w-6 rounded-md text-xs bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)] flex items-center justify-center shrink-0">
								{item.icon}
							</span>
							<div class="min-w-0 flex-1 truncate">
								<div class="font-serif font-bold truncate leading-snug">{item.title}</div>
								<div class="text-[11px] font-sans opacity-80 truncate">{item.subtitle}</div>
							</div>
						</div>
						<span class="rounded border border-current/25 px-2 py-0.5 font-serif text-[10px] font-semibold shrink-0">
							{item.category}
						</span>
					</button>
				{/each}

				{#if filteredItems.length === 0}
					<div class="py-8 text-center text-xs font-serif text-[var(--theme-text-muted)]">
						No results matching "{query}".
					</div>
				{/if}
			</div>

			<!-- Footer Keys Hint -->
			<div class="flex items-center justify-between border-t border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] px-4 py-2.5 text-[11px] font-sans text-[var(--theme-text-muted)]">
				<div class="flex items-center gap-3">
					<span><kbd class="font-semibold px-1 py-0.5 rounded border border-[var(--theme-border)] bg-[var(--theme-surface)]">↑↓</kbd> navigate</span>
					<span><kbd class="font-semibold px-1 py-0.5 rounded border border-[var(--theme-border)] bg-[var(--theme-surface)]">↵</kbd> select</span>
					<span><kbd class="font-semibold px-1 py-0.5 rounded border border-[var(--theme-border)] bg-[var(--theme-surface)]">esc</kbd> close</span>
				</div>
				<div class="font-serif italic text-[11px]">
					<span>Story OS Quick Jump</span>
				</div>
			</div>
		</div>
	</div>
{/if}
