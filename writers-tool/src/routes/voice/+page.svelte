<script lang="ts">
	import { onMount } from 'svelte';
	import {
		loadVoiceProfile,
		saveVoiceProfile,
		extractVoiceMetrics,
		serializeVoiceMarkdown,
		parseVoiceMarkdown,
		downloadFile,
		loadChapters,
		SAMPLE_VOICE_PROFILE,
		type VoiceProfile,
		type Chapter
	} from '$lib/world';

	let profile = $state<VoiceProfile>({ ...SAMPLE_VOICE_PROFILE });
	let sampleInput = $state(
		'The courier died before the candle guttered. Frost edged the window glass, thick as grease. Kael did not touch the body; he knew how belladonna smells on skin. "Three minutes," he muttered to the empty room. He drew the dagger anyway.'
	);
	let chapters = $state<Chapter[]>([]);
	let selectedChapterId = $state('');
	let showMarkdownDrawer = $state(false);
	let saveNotification = $state(false);
	let rawMarkdownImport = $state('');
	let showImportModal = $state(false);
	let newDonTouchQuirk = $state('');

	const neutralPrompt =
		'Write ~300 words: a character you know well waits for someone who is late. They wait somewhere specific. No genre required — a kitchen, a bus stop, anything. Include a little dialogue and one thing the character notices about the place. Messy is fine; your habits matter more than polish.';

	onMount(() => {
		const saved = loadVoiceProfile();
		if (saved) {
			profile = saved;
			if (saved.sampleText) sampleInput = saved.sampleText;
		}
		chapters = loadChapters();
	});

	function handleExtractMetrics() {
		if (!sampleInput.trim()) return;
		const extracted = extractVoiceMetrics(sampleInput);
		profile = {
			...profile,
			sampleText: sampleInput,
			avgSentenceLength: extracted.avgSentenceLength ?? profile.avgSentenceLength,
			sentenceLengthDistribution:
				extracted.sentenceLengthDistribution ?? profile.sentenceLengthDistribution,
			contractionRate: extracted.contractionRate ?? profile.contractionRate,
			formality: extracted.formality ?? profile.formality,
			sentenceHabit: extracted.sentenceHabit ?? profile.sentenceHabit,
			diction: extracted.diction ?? profile.diction,
			evidenceQuotes: extracted.evidenceQuotes ?? profile.evidenceQuotes,
			updatedAt: new Date().toISOString()
		};
		handleSave();
	}

	function handleLoadFromChapter() {
		const ch = chapters.find((c) => c.id === selectedChapterId);
		if (ch && ch.text.trim()) {
			sampleInput = ch.text.slice(0, 2000);
			handleExtractMetrics();
		}
	}

	function handleSetNeutralPrompt() {
		sampleInput = '';
	}

	function handleSave() {
		saveVoiceProfile(profile);
		saveNotification = true;
		setTimeout(() => {
			saveNotification = false;
		}, 2500);
	}

	function addQuirk() {
		if (!newDonTouchQuirk.trim()) return;
		if (!profile.dontTouchList.includes(newDonTouchQuirk.trim())) {
			profile.dontTouchList = [...profile.dontTouchList, newDonTouchQuirk.trim()];
			newDonTouchQuirk = '';
			handleSave();
		}
	}

	function removeQuirk(quirk: string) {
		profile.dontTouchList = profile.dontTouchList.filter((q) => q !== quirk);
		handleSave();
	}

	function exportMarkdown() {
		const md = serializeVoiceMarkdown(profile);
		downloadFile('voice.md', md, 'text/markdown');
	}

	function handleImportMarkdown() {
		if (!rawMarkdownImport.trim()) return;
		const parsed = parseVoiceMarkdown(rawMarkdownImport);
		profile = {
			...profile,
			...parsed,
			updatedAt: new Date().toISOString()
		};
		showImportModal = false;
		handleSave();
	}

	let markdownOutput = $derived(serializeVoiceMarkdown(profile));
</script>

<svelte:head>
	<title>Voice Lab & Calibration — Story OS</title>
</svelte:head>

<div class="space-y-8">
	<!-- Hero Header -->
	<header
		class="neo-box flex flex-wrap items-center justify-between gap-4 bg-[var(--theme-surface)] p-6"
	>
		<div>
			<div class="flex items-center gap-2">
				<span
					class="neo-badge border border-current bg-[var(--theme-accent)] px-2 py-0.5 text-xs text-[var(--theme-accent-fg)]"
				>
					PORTABLE NOVEL CRAFT SUITE
				</span>
				<span class="font-mono text-xs text-[var(--theme-text-muted)]">voice.md sync</span>
			</div>
			<h1 class="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight">
				🎙️ Voice Lab & Calibration
			</h1>
			<p class="mt-1 max-w-2xl text-sm text-[var(--theme-text-muted)]">
				Every author has an involuntary fingerprint. Calibrate your rhythm, contraction rate, and
				protected quirks here so the Prose Elevator and Continuity Gate never homogenize your
				voice.
			</p>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<button
				type="button"
				class="neo-btn px-3 py-1.5 text-xs font-bold"
				onclick={() => (showImportModal = true)}
			>
				📥 Import voice.md
			</button>
			<button
				type="button"
				class="neo-btn px-3 py-1.5 text-xs font-bold"
				onclick={() => (showMarkdownDrawer = !showMarkdownDrawer)}
			>
				👁️ {showMarkdownDrawer ? 'Hide voice.md' : 'View voice.md'}
			</button>
			<button
				type="button"
				class="neo-btn-primary px-4 py-1.5 text-xs font-bold"
				onclick={handleSave}
			>
				💾 Save Profile
			</button>
		</div>
	</header>

	{#if saveNotification}
		<div
			class="neo-box border-emerald-600 bg-emerald-500/15 p-3 text-sm font-bold text-emerald-800 dark:text-emerald-200"
		>
			✓ Voice profile saved and synchronized with local workspace!
		</div>
	{/if}

	<!-- Calibration Workspace Grid -->
	<div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
		<!-- Left: Exercise Canvas & Sample (5 cols) -->
		<section class="space-y-6 lg:col-span-5">
			<div class="neo-box space-y-4 bg-[var(--theme-surface)] p-5">
				<div class="flex items-center justify-between border-b pb-3">
					<h2 class="font-display text-base font-bold uppercase">Writing Sample</h2>
					<span class="text-xs text-[var(--theme-text-muted)]"
						>{sampleInput.split(/\s+/).filter(Boolean).length} words</span
					>
				</div>

				<div class="rounded-lg border border-[var(--theme-border-strong)] bg-[var(--theme-surface-subtle)] p-3 text-xs leading-relaxed">
					<p class="font-bold text-[var(--theme-accent)]">Neutral Prompt Verbatim:</p>
					<p class="mt-1 italic text-[var(--theme-text-muted)]">"{neutralPrompt}"</p>
					<button
						type="button"
						class="mt-2 text-[11px] font-bold underline hover:text-[var(--theme-accent)]"
						onclick={handleSetNeutralPrompt}
					>
						Clear canvas to write fresh prompt
					</button>
				</div>

				{#if chapters.length > 0}
					<div class="flex items-center gap-2">
						<select
							bind:value={selectedChapterId}
							class="neo-input flex-1 p-1.5 text-xs"
						>
							<option value="">-- Or choose from existing chapter draft --</option>
							{#each chapters as ch}
								<option value={ch.id}>{ch.title}</option>
							{/each}
						</select>
						<button
							type="button"
							class="neo-btn px-2.5 py-1.5 text-xs font-bold"
							disabled={!selectedChapterId}
							onclick={handleLoadFromChapter}
						>
							Load
						</button>
					</div>
				{/if}

				<div>
					<label for="sample-input" class="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
						Prose Sample (Draft or Exercise)
					</label>
					<textarea
						id="sample-input"
						bind:value={sampleInput}
						rows="12"
						placeholder="Paste or write ~300 words of your prose here..."
						class="neo-input w-full p-3 font-mono text-xs leading-relaxed"
					></textarea>
				</div>

				<button
					type="button"
					class="neo-btn-primary w-full py-2.5 text-xs font-black uppercase tracking-wider"
					onclick={handleExtractMetrics}
				>
					⚡ Extract Fingerprints & Calibrate
				</button>
			</div>

			<!-- Don't-Touch List Card -->
			<div class="neo-box space-y-4 bg-[var(--theme-surface)] p-5">
				<div class="flex items-center justify-between border-b pb-2">
					<div>
						<h2 class="font-display text-sm font-bold uppercase">Don't-Touch List</h2>
						<p class="text-xs text-[var(--theme-text-muted)]">
							Binds all AI tools: these quirks are author voice, never errors.
						</p>
					</div>
				</div>

				<div class="flex flex-wrap gap-2">
					{#each profile.dontTouchList as quirk}
						<span
							class="neo-badge inline-flex items-center gap-1.5 bg-[var(--theme-surface-subtle)] px-2.5 py-1 font-mono text-xs"
						>
							<span>{quirk}</span>
							<button
								type="button"
								class="text-red-500 hover:text-red-700"
								onclick={() => removeQuirk(quirk)}
								aria-label="Remove quirk"
							>
								×
							</button>
						</span>
					{/each}
					{#if profile.dontTouchList.length === 0}
						<p class="text-xs italic text-[var(--theme-text-muted)]">
							No quirks added yet. Add fragments, dialect terms, or deliberate tics below.
						</p>
					{/if}
				</div>

				<form
					onsubmit={(e) => {
						e.preventDefault();
						addQuirk();
					}}
					class="flex items-center gap-2 pt-2"
				>
					<input
						type="text"
						bind:value={newDonTouchQuirk}
						placeholder="e.g. sentence fragments in fights, archaic nouns..."
						class="neo-input flex-1 p-2 text-xs"
					/>
					<button type="submit" class="neo-btn px-3 py-2 text-xs font-bold">
						+ Add
					</button>
				</form>
			</div>
		</section>

		<!-- Right: Fingerprint Metrics Dashboard (7 cols) -->
		<section class="space-y-6 lg:col-span-7">
			<!-- Metrics Stat Grid -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div class="neo-box bg-[var(--theme-surface)] p-4">
					<span class="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
						Contraction Rate
					</span>
					<div class="mt-2 flex items-baseline gap-2">
						<span class="font-mono text-3xl font-black text-[var(--theme-accent)]">
							{profile.contractionRate}%
						</span>
						<span class="text-xs font-bold text-[var(--theme-text-muted)]">
							{profile.contractionRate > 60
								? 'High (Natural)'
								: profile.contractionRate > 30
									? 'Moderate'
									: 'Low (Formal)'}
						</span>
					</div>
					<p class="mt-2 text-[11px] text-[var(--theme-text-muted)]">
						Continuity audits reject drafts deviating by ±15%.
					</p>
				</div>

				<div class="neo-box bg-[var(--theme-surface)] p-4">
					<span class="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
						Avg Sentence Length
					</span>
					<div class="mt-2 flex items-baseline gap-2">
						<span class="font-mono text-3xl font-black">
							{profile.avgSentenceLength}
						</span>
						<span class="text-xs font-bold text-[var(--theme-text-muted)]">words/sentence</span>
					</div>
					<p class="mt-2 text-[11px] text-[var(--theme-text-muted)]">
						Target pacing cadence for scene rhythm.
					</p>
				</div>

				<div class="neo-box bg-[var(--theme-surface)] p-4">
					<span class="text-[11px] font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
						Formality Register
					</span>
					<div class="mt-2">
						<select
							bind:value={profile.formality}
							onchange={handleSave}
							class="neo-input w-full p-1.5 font-bold uppercase text-xs"
						>
							<option value="casual">Casual</option>
							<option value="neutral">Neutral</option>
							<option value="formal">Formal</option>
						</select>
					</div>
					<p class="mt-2 text-[11px] text-[var(--theme-text-muted)]">
						Governs dialogue vocabulary & tags.
					</p>
				</div>
			</div>

			<!-- Sentence Distribution Bar -->
			<div class="neo-box space-y-3 bg-[var(--theme-surface)] p-5">
				<div class="flex items-center justify-between">
					<h3 class="text-xs font-bold uppercase tracking-wider text-[var(--theme-text-muted)]">
						Sentence Length Rhythm Distribution
					</h3>
					<span class="text-xs font-mono">
						Short: {profile.sentenceLengthDistribution.short} · Med: {profile.sentenceLengthDistribution.medium} · Long: {profile.sentenceLengthDistribution.long}
					</span>
				</div>
				<div class="flex h-5 w-full overflow-hidden rounded-md border-2 border-[var(--theme-border-strong)]">
					<div
						class="bg-amber-400 flex items-center justify-center text-[10px] font-bold text-black"
						style="width: {Math.max(
							5,
							(profile.sentenceLengthDistribution.short /
								(profile.sentenceLengthDistribution.short +
									profile.sentenceLengthDistribution.medium +
									profile.sentenceLengthDistribution.long || 1)) *
								100
						)}%"
						title="Short (≤8 words)"
					>
						Short
					</div>
					<div
						class="bg-blue-400 flex items-center justify-center text-[10px] font-bold text-black"
						style="width: {Math.max(
							5,
							(profile.sentenceLengthDistribution.medium /
								(profile.sentenceLengthDistribution.short +
									profile.sentenceLengthDistribution.medium +
									profile.sentenceLengthDistribution.long || 1)) *
								100
						)}%"
						title="Medium (9–24 words)"
					>
						Med
					</div>
					<div
						class="bg-emerald-400 flex items-center justify-center text-[10px] font-bold text-black"
						style="width: {Math.max(
							5,
							(profile.sentenceLengthDistribution.long /
								(profile.sentenceLengthDistribution.short +
									profile.sentenceLengthDistribution.medium +
									profile.sentenceLengthDistribution.long || 1)) *
								100
						)}%"
						title="Long (25+ words)"
					>
						Long
					</div>
				</div>
			</div>

			<!-- Qualitative Fingerprints -->
			<div class="neo-box space-y-4 bg-[var(--theme-surface)] p-5">
				<h3 class="font-display text-sm font-bold uppercase">Qualitative Fingerprints</h3>

				<div class="space-y-3">
					<div>
						<label for="profile-diction" class="block text-xs font-bold uppercase text-[var(--theme-text-muted)]">
							1. Diction & Sensory Vocabulary
						</label>
						<input
							id="profile-diction"
							type="text"
							bind:value={profile.diction}
							onchange={handleSave}
							class="neo-input mt-1 w-full p-2 text-xs"
						/>
					</div>

					<div>
						<label for="profile-sentence-habit" class="block text-xs font-bold uppercase text-[var(--theme-text-muted)]">
							2. Sentence Habit
						</label>
						<input
							id="profile-sentence-habit"
							type="text"
							bind:value={profile.sentenceHabit}
							onchange={handleSave}
							class="neo-input mt-1 w-full p-2 text-xs"
						/>
					</div>

					<div>
						<label for="profile-signature-move" class="block text-xs font-bold uppercase text-[var(--theme-text-muted)]">
							3. Signature Move
						</label>
						<input
							id="profile-signature-move"
							type="text"
							bind:value={profile.signatureMove}
							onchange={handleSave}
							class="neo-input mt-1 w-full p-2 text-xs"
						/>
					</div>

					<div>
						<span class="block text-xs font-bold uppercase text-[var(--theme-text-muted)]">
							4. Craft Lesson Depth
						</span>
						<div class="mt-2 flex gap-4">
							<label class="flex items-center gap-2 text-xs cursor-pointer font-bold">
								<input
									type="radio"
									bind:group={profile.lessonDepth}
									value="experienced"
									onchange={handleSave}
								/>
								Experienced (terse craft notes)
							</label>
							<label class="flex items-center gap-2 text-xs cursor-pointer font-bold">
								<input
									type="radio"
									bind:group={profile.lessonDepth}
									value="new_writer"
									onchange={handleSave}
								/>
								New Writer (detailed exercises & explanations)
							</label>
						</div>
					</div>
				</div>
			</div>

			<!-- Evidence Quotes Card -->
			<div class="neo-box space-y-3 bg-[var(--theme-surface)] p-5">
				<h3 class="font-display text-sm font-bold uppercase">Evidence Quotes (Ground Truth)</h3>
				<div class="space-y-2">
					{#each profile.evidenceQuotes as quote}
						<blockquote class="border-l-4 border-[var(--theme-accent)] bg-[var(--theme-surface-subtle)] p-2.5 text-xs italic">
							"{quote}"
						</blockquote>
					{/each}
				</div>
			</div>
		</section>
	</div>

	<!-- voice.md Live Drawer -->
	{#if showMarkdownDrawer}
		<div class="neo-box space-y-3 bg-[var(--theme-surface)] p-6">
			<div class="flex items-center justify-between border-b pb-3">
				<div>
					<h3 class="font-display text-base font-bold uppercase">voice.md Markdown Artifact</h3>
					<p class="text-xs text-[var(--theme-text-muted)]">
						Standardized format compatible with Claude Code, Cursor, and portable agents.
					</p>
				</div>
				<div class="flex items-center gap-2">
					<button
						type="button"
						class="neo-btn px-3 py-1.5 text-xs font-bold"
						onclick={() => navigator.clipboard.writeText(markdownOutput)}
					>
						📋 Copy to Clipboard
					</button>
					<button
						type="button"
						class="neo-btn-primary px-3 py-1.5 text-xs font-bold"
						onclick={exportMarkdown}
					>
						💾 Download voice.md
					</button>
				</div>
			</div>
			<pre
				class="max-h-96 overflow-auto rounded-lg border border-[var(--theme-border-strong)] bg-[var(--theme-surface-subtle)] p-4 font-mono text-xs leading-relaxed">{markdownOutput}</pre>
		</div>
	{/if}
</div>

<!-- Import Modal -->
{#if showImportModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
	>
		<div
			class="neo-box w-full max-w-xl space-y-4 bg-[var(--theme-surface)] p-6 shadow-[8px_8px_0px_var(--theme-shadow-hard)]"
		>
			<h3 class="font-display text-lg font-bold uppercase">Import voice.md File</h3>
			<p class="text-xs text-[var(--theme-text-muted)]">
				Paste the contents of your existing <code class="font-mono">voice.md</code> to restore your calibrated fingerprints.
			</p>

			<textarea
				bind:value={rawMarkdownImport}
				rows="10"
				placeholder="# Voice: ...&#10;## Fingerprints&#10;1. Diction: ..."
				class="neo-input w-full p-3 font-mono text-xs"
			></textarea>

			<div class="flex justify-end gap-2">
				<button
					type="button"
					class="neo-btn px-4 py-2 text-xs font-bold"
					onclick={() => (showImportModal = false)}
				>
					Cancel
				</button>
				<button
					type="button"
					class="neo-btn-primary px-4 py-2 text-xs font-bold"
					onclick={handleImportMarkdown}
				>
					Apply Import
				</button>
			</div>
		</div>
	</div>
{/if}
