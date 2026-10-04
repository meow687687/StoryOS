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
	import {
		LITERARY_FONTS,
		TACTILE_THEMES,
		loadActiveTheme,
		saveActiveTheme,
		loadTypographySettings,
		saveTypographySettings,
		type TypographySettings
	} from './themes';
	import { handleSmartEnter, paginateManuscriptText, type BookPage } from './pagination';
	import {
		HIGHLIGHT_PALETTE,
		loadHighlights,
		saveHighlights,
		addHighlight,
		deleteHighlight,
		loadComments,
		saveComments,
		addComment,
		deleteComment,
		resolveComment,
		type ManuscriptHighlight,
		type MarginComment,
		type HighlightColor
	} from './annotations';
	import {
		WRITER_ARCHETYPES,
		loadActiveArchetype,
		saveActiveArchetype,
		type WriterArchetypeId
	} from './archetypes';
	import { isFileSystemAccessSupported, pickLocalDirectory, saveChapterToDisk } from './filesystem';

	let {
		text = $bindable(),
		chapterTitle = 'Chapter 1',
		chapterNumber = 1,
		novelTitle = 'My Novel',
		chapterId = 'c1',
		bible,
		decisions = [],
		voice = null,
		cfg = { provider: 'ollama', apiKey: '', model: DEFAULT_OLLAMA_MODEL },
		ontouch,
		onselectentity
	}: {
		text: string;
		chapterTitle?: string;
		chapterNumber?: number;
		novelTitle?: string;
		chapterId?: string;
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

	// View Modes: Paginated WYSIWYG vs Continuous Drafter
	let isPaginatedView = $state(false);
	let showTypesettingDrawer = $state(false);
	let showMarginComments = $state(true);

	// Adaptive Archetype
	let activeArchetype = $state<WriterArchetypeId>('plantser');
	let sprintTimerSeconds = $state(0);
	let sprintRunning = $state(false);
	let sprintInterval: ReturnType<typeof setInterval> | null = null;
	let showBraindumpModal = $state(false);
	let braindumpText = $state('');

	// Typography & Theme
	let typography = $state<TypographySettings>(loadTypographySettings());
	let activeThemeId = $state(loadActiveTheme());

	// Highlights & Comments
	let highlights = $state<ManuscriptHighlight[]>([]);
	let comments = $state<MarginComment[]>([]);
	let newCommentText = $state('');

	// Local File System Access State
	let localDirHandle = $state<FileSystemDirectoryHandle | null>(null);
	let localDirName = $state<string | null>(null);
	let isSavingToDisk = $state(false);

	let autocompleteQuery = $state<string | null>(null);
	let autocompleteIndex = $state(0);

	// Floating Inline AI / Highlight Bubble State
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

	// Computed Paginated Pages for WYSIWYG view
	const paginatedPages = $derived<BookPage[]>(
		paginateManuscriptText(novelTitle, chapterTitle, chapterNumber, text, 260)
	);

	let detectedMentions = $state<EntityMention[]>([]);
	let mentionsTimer: ReturnType<typeof setTimeout> | null = null;

	// Web Audio Synthesizer for subtle mechanical typewriter click
	let audioCtx: AudioContext | null = null;

	function playMechanicalClick() {
		if (!soundEnabled) return;
		try {
			if (!audioCtx) {
				const AudioContextClass =
					window.AudioContext ||
					(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
		typography = loadTypographySettings();
		activeThemeId = loadActiveTheme();
		activeArchetype = loadActiveArchetype();
		highlights = loadHighlights(chapterId);
		comments = loadComments(chapterId);
		updateMentions();

		// Check saved local dir name
		if (typeof localStorage !== 'undefined') {
			const saved = localStorage.getItem('story_os_local_dir_name');
			if (saved) localDirName = saved;
		}
	});

	onDestroy(() => {
		if (mentionsTimer) clearTimeout(mentionsTimer);
		if (audioCtx) audioCtx.close().catch(() => {});
		if (sprintInterval) clearInterval(sprintInterval);
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

	async function handleConnectLocalFolder() {
		try {
			const result = await pickLocalDirectory();
			localDirHandle = result.dirHandle;
			localDirName = result.dirName;
			toasts.success(`Connected local folder: ${result.dirName} (${result.files.length} files found)`, '📁');
		} catch (err) {
			toasts.warning((err as Error).message || 'Folder connection cancelled');
		}
	}

	async function handleSaveChapterDirectlyToDisk() {
		if (!localDirHandle) {
			await handleConnectLocalFolder();
			if (!localDirHandle) return;
		}

		try {
			isSavingToDisk = true;
			const fileName = await saveChapterToDisk(localDirHandle, chapterTitle, text);
			toasts.success(`Saved chapter directly to ${localDirName}/${fileName}!`, '💾');
		} catch (err) {
			toasts.warning(`Save to disk failed: ${(err as Error).message}`);
		} finally {
			isSavingToDisk = false;
		}
	}

	function handleSelectionCheck() {
		if (!textareaEl) return;
		const start = textareaEl.selectionStart;
		const end = textareaEl.selectionEnd;

		if (start !== end && end - start >= 2) {
			const snippet = text.slice(start, end);
			selectedSnippet = snippet;
			selectionRange = { start, end };

			const textBefore = text.slice(0, start);
			const lines = textBefore.split('\n');
			const lineIndex = lines.length;
			const lineHeight = 28;
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
		// Option+D (Alt+D) to trigger quick Inline Braindump Popover
		if (e.altKey && (e.key === 'd' || e.key === 'D')) {
			e.preventDefault();
			showBraindumpModal = true;
			return;
		}

		// Cmd+K to summon inline AI when text is selected
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			if (textareaEl && textareaEl.selectionStart !== textareaEl.selectionEnd) {
				e.preventDefault();
				handleSelectionCheck();
				return;
			}
		}

		// Smart Enter Keybind Transitions (Single = Indent, Double = Scene Break, Triple = Chapter Break)
		if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey && autocompleteQuery === null) {
			if (textareaEl) {
				e.preventDefault();
				const cursorPos = textareaEl.selectionStart;
				const res = handleSmartEnter(text, cursorPos, typography.ornamentGlyph);

				text = res.updatedText;
				ontouch();
				playMechanicalClick();

				if (res.actionType === 'scene_break') {
					toasts.info('Inserted Scene Break separator (✦ ✦ ✦)');
				} else if (res.actionType === 'chapter_break') {
					toasts.success('Created Chapter Break marker (# Chapter)');
				}

				setTimeout(() => {
					if (textareaEl) {
						textareaEl.focus();
						textareaEl.setSelectionRange(res.newCursorPos, res.newCursorPos);
					}
				}, 10);
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

	function handleApplyHighlight(color: HighlightColor) {
		if (!selectionRange || !selectedSnippet) return;
		const newH = addHighlight(chapterId, selectionRange.start, selectionRange.end, selectedSnippet, color);
		highlights = [...highlights, newH];
		toasts.success(`Highlighted selection in ${color}!`, '🖍️');
	}

	function handleAddMarginComment() {
		if (!newCommentText.trim()) return;
		const newC = addComment(chapterId, newCommentText.trim(), selectedSnippet || undefined);
		comments = [...comments, newC];
		newCommentText = '';
		toasts.success('Added margin note!', '📝');
	}

	function handleToggleSprint() {
		if (sprintRunning) {
			if (sprintInterval) clearInterval(sprintInterval);
			sprintRunning = false;
			toasts.info(`Sprint paused at ${Math.floor(sprintTimerSeconds / 60)}m ${sprintTimerSeconds % 60}s`);
		} else {
			sprintRunning = true;
			sprintInterval = setInterval(() => {
				sprintTimerSeconds++;
			}, 1000);
			toasts.success('Sprint timer started! Focus on words.', '⚡');
		}
	}

	function handleSaveBraindump() {
		if (!braindumpText.trim()) return;
		addComment(chapterId, `[BRAINDUMP]: ${braindumpText.trim()}`);
		comments = loadComments(chapterId);
		braindumpText = '';
		showBraindumpModal = false;
		toasts.success('Parked braindump thought into margin rail!', '💡');
	}

	function handleUpdateTheme(themeId: string) {
		activeThemeId = themeId;
		saveActiveTheme(themeId);
		toasts.success(`Switched theme to ${themeId}!`, '🎨');
	}

	function handleUpdateTypography(key: keyof TypographySettings, val: string | number) {
		typography = { ...typography, [key]: val };
		saveTypographySettings(typography);
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
	class="relative flex flex-col rounded-2xl skeuo-paper-sheet transition-all duration-200 {isFocusMode
		? 'fixed inset-0 z-50 rounded-none border-none p-8 md:p-16 shadow-none overflow-y-auto'
		: 'p-6 sm:p-10 md:p-12 min-h-[640px]'}"
	style="font-family: {LITERARY_FONTS.find((f) => f.id === typography.fontFamily)?.fontStack || 'inherit'};"
>
	<!-- Top Desk Ribbon & Master Toolbar -->
	<div class="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--theme-border)] pb-3">
		<!-- Left Word Stats & Local Folder Status -->
		<div class="flex flex-wrap items-center gap-3 text-xs font-serif text-[var(--theme-text-muted)]">
			<span class="rounded bg-[var(--theme-surface-subtle)] border border-[var(--theme-border)] px-2.5 py-0.5 font-sans font-semibold text-[var(--theme-text)] shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)]">
				{words} words
			</span>
			<span>·</span>
			<span class="font-sans">{readingTimeMinutes} min read</span>
			<span>·</span>

			<!-- Local Folder Connection Button -->
			<button
				type="button"
				class="skeuo-btn flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-sans font-semibold cursor-pointer"
				onclick={handleConnectLocalFolder}
				title={localDirName ? `Connected to local folder: ${localDirName}` : 'Connect a local folder on your computer'}
			>
				<span>📁</span>
				<span>{localDirName ? localDirName : 'Connect Local Folder'}</span>
			</button>

			<!-- Save to Disk Direct Button -->
			{#if localDirName}
				<button
					type="button"
					class="skeuo-btn flex items-center gap-1 px-2 py-0.5 text-[11px] font-sans font-bold text-amber-700 dark:text-amber-300"
					onclick={handleSaveChapterDirectlyToDisk}
					disabled={isSavingToDisk}
					title="Save .md directly to local folder"
				>
					<span>{isSavingToDisk ? '⏳' : '💾'}</span>
					<span>Save .md</span>
				</button>
			{/if}

			<!-- Session Goal Progress Meter -->
			<button
				type="button"
				class="skeuo-badge flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-sans font-semibold cursor-pointer hover:border-[var(--theme-accent)]"
				onclick={() => {
					const targets = [250, 500, 1000, 2000];
					const nextIdx = (targets.indexOf(sessionTarget) + 1) % targets.length;
					sessionTarget = targets[nextIdx];
				}}
				title="Session word target: Click to cycle (250, 500, 1000, 2000 words)"
			>
				<span>🎯</span>
				<span>{sessionWordsWritten}/{sessionTarget}w</span>
				<div class="h-1.5 w-14 overflow-hidden rounded-full bg-[var(--theme-border)]">
					<div
						class="h-full bg-emerald-500 transition-all duration-300"
						style="width: {targetPercent}%"
					></div>
				</div>
				<span class="opacity-80">{targetPercent}%</span>
			</button>

			<!-- Pantser Sprint Timer -->
			<button
				type="button"
				class="skeuo-badge flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-sans font-bold cursor-pointer {sprintRunning
					? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40'
					: ''}"
				onclick={handleToggleSprint}
				title="Click to start/pause drafting sprint timer"
			>
				<span>⚡</span>
				<span>{Math.floor(sprintTimerSeconds / 60)}:{String(sprintTimerSeconds % 60).padStart(2, '0')}</span>
			</button>
		</div>

		<!-- Right Controls: View Mode, Typesetting & Sound -->
		<div class="flex flex-wrap items-center gap-1.5 font-serif text-xs">
			<!-- Writer Archetype Switcher -->
			<select
				class="skeuo-groove p-1 text-[11px] font-serif font-bold rounded bg-[var(--theme-surface)] text-[var(--theme-text)] cursor-pointer"
				value={activeArchetype}
				onchange={(e) => {
					const val = (e.target as HTMLSelectElement).value as WriterArchetypeId;
					activeArchetype = val;
					saveActiveArchetype(val);
					toasts.info(`Switched workflow to ${WRITER_ARCHETYPES[val].name}`);
				}}
			>
				<option value="pantser">⚡ Pantser (Fast Sprint)</option>
				<option value="plotter">📐 Plotter (Architect)</option>
				<option value="plantser">🌱 Plantser (Hybrid)</option>
			</select>

			<!-- Paginated Book View Toggle -->
			<button
				type="button"
				class="skeuo-btn rounded-md px-2.5 py-1 text-xs font-semibold transition-all {isPaginatedView
					? 'skeuo-btn-primary text-[var(--theme-accent-fg)] font-bold'
					: 'text-[var(--theme-text)]'}"
				onclick={() => {
					isPaginatedView = !isPaginatedView;
					toasts.info(isPaginatedView ? 'Switched to Paginated Book View (WYSIWYG)' : 'Switched to Continuous Drafter');
				}}
				title="Toggle Paginated Book View (WYSIWYG sheets with running headers/footers)"
			>
				{isPaginatedView ? '📖 Book Sheets' : '✍️ Continuous'}
			</button>

			<!-- Typesetting Studio Popover Toggle -->
			<button
				type="button"
				class="skeuo-btn rounded-md px-2.5 py-1 text-xs font-semibold text-[var(--theme-text)]"
				onclick={() => (showTypesettingDrawer = !showTypesettingDrawer)}
				title="Customize fonts, size, leading, indents, and 8 tactile themes"
			>
				🎨 Typeset & Theme
			</button>

			<!-- Sound Mechanical Click -->
			<button
				type="button"
				class="skeuo-btn rounded-md px-2 py-1 text-xs font-semibold text-[var(--theme-text)] {soundEnabled
					? 'bg-[var(--theme-surface-subtle)] text-[var(--theme-accent)]'
					: 'opacity-75'}"
				onclick={() => {
					soundEnabled = !soundEnabled;
					if (soundEnabled) playMechanicalClick();
				}}
				title="Toggle mechanical key clicks"
			>
				{soundEnabled ? '🔊' : '🔇'}
			</button>

			<!-- Typewriter Scroll -->
			<button
				type="button"
				class="skeuo-btn rounded-md px-2.5 py-1 text-xs font-semibold transition-all {isTypewriterMode
					? 'skeuo-btn-primary border-black/20 text-[var(--theme-accent-fg)]'
					: 'text-[var(--theme-text)]'}"
				onclick={() => (isTypewriterMode = !isTypewriterMode)}
				title="Typewriter Scrolling: Keep current line vertically centered"
			>
				📜 Typewriter
			</button>

			<!-- Focus Mode -->
			<button
				type="button"
				class="skeuo-btn rounded-md px-2.5 py-1 text-xs font-semibold text-[var(--theme-text)]"
				onclick={() => (isFocusMode = !isFocusMode)}
			>
				{isFocusMode ? '✕ Exit' : '⛶ Focus'}
			</button>
		</div>
	</div>

	<!-- Typesetting & 8-Theme Drawer -->
	{#if showTypesettingDrawer}
		<div class="mb-5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] p-4 space-y-4 animate-in fade-in">
			<div class="flex items-center justify-between border-b border-[var(--theme-border)] pb-2">
				<span class="font-serif text-xs font-bold text-[var(--theme-accent)]">
					🎨 Literary Typesetting Studio & Theme Engine
				</span>
				<button
					type="button"
					class="text-xs text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
					onclick={() => (showTypesettingDrawer = false)}
				>
					✕ Close
				</button>
			</div>

			<!-- 8 Tactile Themes Palette -->
			<div>
				<div class="font-serif text-xs font-bold text-[var(--theme-text)] mb-2">
					8 Tactile Skeuomorphic Themes:
				</div>
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
					{#each TACTILE_THEMES as t}
						<button
							type="button"
							class="p-2 rounded-lg border text-left text-xs transition-all flex items-center gap-2 {activeThemeId === t.id
								? 'border-[var(--theme-accent)] bg-[var(--theme-surface)] font-bold shadow-sm'
								: 'border-[var(--theme-border)] bg-[var(--theme-surface)]/50 hover:bg-[var(--theme-surface)]'}"
							onclick={() => handleUpdateTheme(t.id)}
						>
							<span class="text-base shrink-0">{t.icon}</span>
							<div class="min-w-0 flex-1">
								<div class="truncate text-[11px]">{t.name}</div>
								<div class="text-[9px] text-[var(--theme-text-muted)] truncate">{t.category}</div>
							</div>
						</button>
					{/each}
				</div>
			</div>

			<!-- Typography Sliders & Font Gallery -->
			<div class="grid gap-3 sm:grid-cols-3 text-xs pt-2 border-t border-[var(--theme-border)]">
				<!-- Font Family -->
				<div>
					<label for="typo-font" class="font-bold text-[var(--theme-text-muted)] block">Font Family</label>
					<select
						id="typo-font"
						class="skeuo-groove w-full p-1.5 text-xs rounded mt-1 bg-[var(--theme-surface)]"
						value={typography.fontFamily}
						onchange={(e) => handleUpdateTypography('fontFamily', (e.target as HTMLSelectElement).value)}
					>
						{#each LITERARY_FONTS as f}
							<option value={f.id}>{f.name} ({f.category})</option>
						{/each}
					</select>
				</div>

				<!-- Font Size Slider -->
				<div>
					<div class="flex items-center justify-between">
						<span class="font-bold text-[var(--theme-text-muted)]">Font Size</span>
						<span class="font-mono text-[11px]">{typography.fontSize}px</span>
					</div>
					<input
						type="range"
						min="14"
						max="28"
						step="1"
						value={typography.fontSize}
						oninput={(e) => handleUpdateTypography('fontSize', Number((e.target as HTMLInputElement).value))}
						class="w-full mt-2 accent-[var(--theme-accent)] cursor-pointer"
					/>
				</div>

				<!-- Line Leading Slider -->
				<div>
					<div class="flex items-center justify-between">
						<span class="font-bold text-[var(--theme-text-muted)]">Line Leading</span>
						<span class="font-mono text-[11px]">{typography.lineHeight}x</span>
					</div>
					<input
						type="range"
						min="1.4"
						max="2.4"
						step="0.1"
						value={typography.lineHeight}
						oninput={(e) => handleUpdateTypography('lineHeight', Number((e.target as HTMLInputElement).value))}
						class="w-full mt-2 accent-[var(--theme-accent)] cursor-pointer"
					/>
				</div>
			</div>

			<!-- Indent & Alignment -->
			<div class="grid gap-3 sm:grid-cols-3 text-xs pt-2 border-t border-[var(--theme-border)]">
				<div>
					<div class="flex items-center justify-between">
						<span class="font-bold text-[var(--theme-text-muted)]">First-Line Indent</span>
						<span class="font-mono text-[11px]">{typography.firstLineIndent}em</span>
					</div>
					<input
						type="range"
						min="0"
						max="3.0"
						step="0.25"
						value={typography.firstLineIndent}
						oninput={(e) => handleUpdateTypography('firstLineIndent', Number((e.target as HTMLInputElement).value))}
						class="w-full mt-2 accent-[var(--theme-accent)] cursor-pointer"
					/>
				</div>

				<div>
					<span class="font-bold text-[var(--theme-text-muted)] block">Text Alignment</span>
					<div class="flex items-center gap-1 mt-1">
						{#each ['left', 'justify', 'center'] as align}
							<button
								type="button"
								class="px-2.5 py-1 rounded border text-xs font-serif capitalize {typography.textAlign === align
									? 'bg-[var(--theme-accent)] text-stone-950 font-bold border-amber-600'
									: 'bg-[var(--theme-surface)] text-[var(--theme-text)] border-[var(--theme-border)]'}"
								onclick={() => handleUpdateTypography('textAlign', align)}
							>
								{align}
							</button>
						{/each}
					</div>
				</div>

				<div>
					<label for="typo-glyph" class="font-bold text-[var(--theme-text-muted)] block">Scene Break Ornament</label>
					<input
						id="typo-glyph"
						type="text"
						value={typography.ornamentGlyph}
						oninput={(e) => handleUpdateTypography('ornamentGlyph', (e.target as HTMLInputElement).value)}
						class="skeuo-groove w-full p-1.5 text-xs rounded mt-1 bg-[var(--theme-surface)] text-center font-bold"
					/>
				</div>
			</div>
		</div>
	{/if}

	<!-- Inline Braindump Popover (Alt+D) -->
	{#if showBraindumpModal}
		<div class="mb-4 rounded-xl border border-amber-600/40 bg-amber-500/10 p-3.5 space-y-2 animate-in fade-in">
			<div class="flex items-center justify-between">
				<span class="font-serif text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
					<span>💡</span>
					<span>Pantser Quick Braindump (Park thought without losing typing momentum)</span>
				</span>
				<button type="button" class="text-xs text-[var(--theme-text-muted)]" onclick={() => (showBraindumpModal = false)}>✕</button>
			</div>
			<textarea
				bind:value={braindumpText}
				rows="2"
				placeholder="Quick thought / plot idea / character note..."
				class="skeuo-groove w-full p-2 text-xs rounded"
			></textarea>
			<button type="button" class="skeuo-btn-primary px-3 py-1 text-xs font-bold" onclick={handleSaveBraindump}>
				Park in Margin Rail ↵
			</button>
		</div>
	{/if}

	<!-- Main Canvas: Paginated Sheets vs Continuous Textarea -->
	{#if isPaginatedView}
		<!-- Paginated Book Sheet Viewer (WYSIWYG) -->
		<div class="space-y-8 py-4">
			{#each paginatedPages as page (page.pageNumber)}
				<div
					class="relative mx-auto max-w-[650px] min-h-[750px] p-8 sm:p-12 skeuo-paper-sheet bg-[var(--theme-paper-sheet)] shadow-[0_4px_20px_var(--theme-paper-shadow)] border border-[var(--theme-border)] rounded-md flex flex-col justify-between"
					style="font-size: {typography.fontSize}px; line-height: {typography.lineHeight}; text-align: {typography.textAlign};"
				>
					<!-- Running Header -->
					<div class="border-b border-[var(--theme-border)]/60 pb-2 text-[11px] font-serif text-[var(--theme-text-muted)] flex items-center justify-between uppercase tracking-wider mb-6">
						<span>{page.headerLeft}</span>
						<span>{page.headerRight}</span>
					</div>

					<!-- Page Body Content -->
					<div class="flex-1 space-y-3">
						{#if page.isChapterStart}
							<div class="text-center my-6">
								<h2 class="letterpress-title text-2xl sm:text-3xl font-serif font-bold text-[var(--theme-text)]">
									{page.chapterTitle || 'Chapter'}
								</h2>
								<div class="mt-2 text-xs text-[var(--theme-accent)] font-serif">
									{typography.ornamentGlyph}
								</div>
							</div>
						{/if}

						{#each page.content as paragraph}
							{#if paragraph.trim() === typography.ornamentGlyph || paragraph.trim() === '* * *'}
								<div class="text-center my-4 font-serif text-sm text-[var(--theme-accent)] font-bold">
									{typography.ornamentGlyph}
								</div>
							{:else if paragraph.trim().startsWith('# ')}
								<h3 class="text-xl font-serif font-bold text-[var(--theme-text)] mt-4 mb-2">
									{paragraph.replace(/^#\s*/, '')}
								</h3>
							{:else if paragraph.trim()}
								<p
									class="text-[var(--theme-text)]"
									style="text-indent: {page.isChapterStart ? '0' : `${typography.firstLineIndent}em`};"
								>
									{paragraph}
								</p>
							{/if}
						{/each}
					</div>

					<!-- Running Footer with Page Number -->
					<div class="border-t border-[var(--theme-border)]/60 pt-3 text-center text-xs font-serif text-[var(--theme-text-muted)] mt-6">
						— {page.footerText} —
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<!-- Continuous Drafter Textarea with Smart Enter & Highlight Support -->
		<div class="relative min-w-0 flex-1 flex flex-col">
			<textarea
				bind:this={textareaEl}
				bind:value={text}
				oninput={handleInput}
				onkeydown={handleKeyDown}
				onmouseup={handleSelectionCheck}
				onkeyup={handleSelectionCheck}
				placeholder="Begin drafting... Press Enter for paragraph, double Enter for scene break (✦ ✦ ✦), triple Enter for chapter break. Press Alt+D for quick braindump."
				class="manuscript flex-1 min-h-[520px] w-full bg-transparent text-[var(--theme-text)] placeholder:text-[var(--theme-text-faint)] focus:outline-none focus:ring-0 focus:border-none border-none outline-none resize-none"
				style="font-size: {typography.fontSize}px; line-height: {typography.lineHeight}; text-align: {typography.textAlign}; min-height: {isFocusMode ? 'calc(100vh - 220px)' : '520px'};"
			></textarea>

			<!-- Selection Floating Action Bar (Highlight & Inline AI) -->
			{#if selectionCoords && selectedSnippet}
				<div
					class="absolute z-40 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.25)] backdrop-blur-md flex items-center gap-1.5 text-xs animate-in fade-in"
					style="top: {selectionCoords.top}px; left: {selectionCoords.left}px;"
				>
					<!-- Highlighting Pigments -->
					<div class="flex items-center gap-1 pr-2 border-r border-[var(--theme-border)]">
						{#each HIGHLIGHT_PALETTE as hl}
							<button
								type="button"
								class="h-5 w-5 rounded-full border border-black/20 transition-transform hover:scale-110"
								style="background-color: {hl.bg};"
								title="Highlight {hl.name}"
								onclick={() => handleApplyHighlight(hl.color)}
							></button>
						{/each}
					</div>

					<button
						type="button"
						class="skeuo-btn px-2 py-1 text-xs font-serif font-bold text-[var(--theme-accent)]"
						onclick={() => {
							// Open Inline AI bubble
						}}
					>
						✨ AI Assist (⌘K)
					</button>

					<button
						type="button"
						class="text-xs text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] px-1"
						onclick={() => {
							selectionCoords = null;
							selectedSnippet = '';
						}}
					>
						✕
					</button>
				</div>
			{/if}

			<!-- Autocomplete Candidates Menu -->
			{#if autocompleteQuery !== null && filteredCandidates.length > 0}
				<div
					class="skeuo-box-lg absolute bottom-12 left-4 z-40 max-h-52 w-72 overflow-y-auto rounded-xl p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-md"
				>
					<div class="border-b border-[var(--theme-border)] px-2 py-1 text-[10px] font-mono font-bold tracking-wider text-[var(--theme-text-faint)] uppercase">
						Bible Entities (@)
					</div>
					{#each filteredCandidates as candidate, idx (candidate.id)}
						<button
							type="button"
							class="flex w-full cursor-pointer items-center justify-between rounded-md border px-2 py-1.5 text-left text-xs transition-all {idx ===
							autocompleteIndex
								? 'border-[var(--theme-border-strong)] bg-[var(--theme-btn-primary-gradient,var(--theme-accent))] font-bold text-[var(--theme-accent-fg)] shadow-[0_2px_4px_rgba(0,0,0,0.2)]'
								: 'border-transparent text-[var(--theme-text)] hover:bg-[var(--theme-surface-subtle)]'}"
							onclick={() => insertEntity(candidate)}
						>
							<span class="font-bold truncate">{candidate.name}</span>
							<span class="text-[10px] uppercase font-mono opacity-80">{candidate.kind}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Margin Notes & Sticky Comments Drawer -->
	{#if comments.length > 0 || showMarginComments}
		<div class="mt-6 border-t border-[var(--theme-border)] pt-4 space-y-3">
			<div class="flex items-center justify-between">
				<div class="font-serif text-xs font-bold text-[var(--theme-accent)] flex items-center gap-2">
					<span>📝</span>
					<span>Margin Notes & Braindumps ({comments.length})</span>
				</div>
				<button
					type="button"
					class="text-[10px] font-serif text-[var(--theme-text-muted)] hover:text-[var(--theme-text)]"
					onclick={() => (showMarginComments = !showMarginComments)}
				>
					{showMarginComments ? 'Hide Rail' : 'Show Rail'}
				</button>
			</div>

			{#if showMarginComments}
				<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-xs">
					{#each comments as c (c.id)}
						<div class="p-2.5 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface-subtle)] space-y-1.5">
							{#if c.quote}
								<div class="text-[10px] italic text-[var(--theme-accent)] border-l-2 border-[var(--theme-accent)] pl-1.5 line-clamp-2">
									"{c.quote}"
								</div>
							{/if}
							<p class="text-[11px] text-[var(--theme-text)] leading-relaxed">{c.content}</p>
							<div class="flex items-center justify-between text-[10px] text-[var(--theme-text-muted)] pt-1 border-t border-[var(--theme-border)]/50">
								<span>{c.author}</span>
								<button
									type="button"
									class="text-rose-600 hover:underline"
									onclick={() => {
										deleteComment(c.id);
										comments = loadComments(chapterId);
									}}
								>
									Delete
								</button>
							</div>
						</div>
					{/each}
				</div>

				<!-- Add New Margin Note Input -->
				<div class="flex items-center gap-2 pt-2">
					<input
						type="text"
						bind:value={newCommentText}
						placeholder="Add a margin note or braindump..."
						class="skeuo-groove flex-1 p-2 text-xs rounded bg-[var(--theme-surface)]"
						onkeydown={(e) => {
							if (e.key === 'Enter') handleAddMarginComment();
						}}
					/>
					<button
						type="button"
						class="skeuo-btn-primary px-3 py-2 text-xs font-serif font-bold"
						onclick={handleAddMarginComment}
					>
						+ Note
					</button>
				</div>
			{/if}
		</div>
	{/if}

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
