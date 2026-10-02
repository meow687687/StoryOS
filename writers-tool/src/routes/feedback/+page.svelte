<script lang="ts">
	import { onMount } from 'svelte';
	import {
		loadFeedbackItems,
		saveFeedbackItems,
		loadChapters,
		loadDecisions,
		saveDecisions,
		clusterFeedback,
		serializeFeedbackMarkdown,
		parseFeedbackMarkdown,
		downloadFile,
		SAMPLE_FEEDBACK_ITEMS,
		type BetaFeedbackItem,
		type FeedbackClass,
		type FeedbackVerdict,
		type Chapter,
		type Decision
	} from '$lib/world';

	let feedbackItems = $state<BetaFeedbackItem[]>([...SAMPLE_FEEDBACK_ITEMS]);
	let chapters = $state<Chapter[]>([]);
	let showImportModal = $state(false);
	let showExportDrawer = $state(false);
	let rawMarkdownImport = $state('');
	let alertMessage = $state<string | null>(null);

	// New Feedback Form State
	let newReader = $state('');
	let newChapterId = $state('c1');
	let newParagraph = $state<number | undefined>(undefined);
	let newQuote = $state('');
	let newObservation = $state('');
	let newClass = $state<FeedbackClass>('confusion');

	// Active Verdict Modal State
	let activeVerdictItem = $state<BetaFeedbackItem | null>(null);
	let verdictDecisionText = $state('');
	let verdictType = $state<FeedbackVerdict>('accepted');

	onMount(() => {
		const saved = loadFeedbackItems();
		if (saved && saved.length > 0) {
			feedbackItems = saved;
		}
		chapters = loadChapters();
		if (chapters.length > 0 && !newChapterId) {
			newChapterId = chapters[0].id;
		}
	});

	function handleAddFeedback() {
		if (!newReader.trim() || !newObservation.trim()) return;

		const targetCh = chapters.find((c) => c.id === newChapterId);

		const item: BetaFeedbackItem = {
			id: 'fb-' + Date.now().toString().slice(-6),
			readerName: newReader.trim(),
			chapterId: newChapterId,
			chapterTitle: targetCh ? targetCh.title : newChapterId,
			paragraphIndex: newParagraph,
			quote: newQuote.trim(),
			feedback: newObservation.trim(),
			candidateClass: newClass,
			weight: newClass === 'taste' ? 1 : 1,
			verdict: 'open',
			createdAt: new Date().toISOString()
		};

		feedbackItems = [item, ...feedbackItems];
		saveFeedbackItems(feedbackItems);

		newReader = '';
		newQuote = '';
		newObservation = '';
		newParagraph = undefined;

		showAlert('Feedback observation ingested and clustered!');
	}

	function openVerdictModal(item: BetaFeedbackItem, type: FeedbackVerdict) {
		activeVerdictItem = item;
		verdictType = type;
		verdictDecisionText = item.verdictNotes || (type === 'accepted' ? item.feedback : '');
	}

	function commitVerdict() {
		if (!activeVerdictItem) return;

		const targetId = activeVerdictItem.id;
		let createdDecisionId: string | undefined;

		// If accepted or modified, lock directly into decisions.md!
		if (verdictType === 'accepted' || verdictType === 'modified') {
			const existingDecisions = loadDecisions();
			const newDecision: Decision = {
				id: `d${Date.now().toString().slice(-4)}`,
				date: new Date().toISOString().slice(0, 10),
				topic: `Beta Feedback: ${activeVerdictItem.candidateClass.toUpperCase()} in ${activeVerdictItem.chapterTitle || activeVerdictItem.chapterId}`,
				decision: verdictDecisionText || activeVerdictItem.feedback,
				authorWords: verdictDecisionText || activeVerdictItem.feedback,
				source: `Beta Reader (${activeVerdictItem.readerName})`,
				affects: activeVerdictItem.chapterTitle || activeVerdictItem.chapterId,
				status: 'locked'
			};
			saveDecisions([newDecision, ...existingDecisions]);
			createdDecisionId = newDecision.id;
		}

		feedbackItems = feedbackItems.map((it) => {
			if (it.id === targetId) {
				return {
					...it,
					verdict: verdictType,
					verdictNotes: verdictDecisionText,
					linkedDecisionId: createdDecisionId ?? it.linkedDecisionId
				};
			}
			return it;
		});

		saveFeedbackItems(feedbackItems);
		activeVerdictItem = null;

		if (createdDecisionId) {
			showAlert(
				`Verdict recorded! Locked into decisions.md as ${createdDecisionId}. Proceed to manuscript revisions.`
			);
		} else {
			showAlert(`Verdict recorded as ${verdictType}.`);
		}
	}

	function deleteItem(id: string) {
		feedbackItems = feedbackItems.filter((it) => it.id !== id);
		saveFeedbackItems(feedbackItems);
		showAlert('Feedback note removed.');
	}

	function exportMarkdown() {
		const md = serializeFeedbackMarkdown(feedbackItems);
		downloadFile('feedback.md', md, 'text/markdown');
	}

	function handleImportMarkdown() {
		if (!rawMarkdownImport.trim()) return;
		const parsed = parseFeedbackMarkdown(rawMarkdownImport);
		if (parsed.length > 0) {
			feedbackItems = [...parsed, ...feedbackItems];
			saveFeedbackItems(feedbackItems);
			showAlert(`Imported ${parsed.length} feedback items from markdown.`);
		}
		showImportModal = false;
	}

	function showAlert(msg: string) {
		alertMessage = msg;
		setTimeout(() => {
			alertMessage = null;
		}, 3000);
	}

	let clusters = $derived(clusterFeedback(feedbackItems));
	let markdownOutput = $derived(serializeFeedbackMarkdown(feedbackItems));
</script>

<svelte:head>
	<title>Beta Reader Feedback Triage — Story OS</title>
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
					PORTABLE REVISION SUITE
				</span>
				<span class="font-mono text-xs text-[var(--theme-text-muted)]">feedback.md & decisions.md sync</span>
			</div>
			<h1 class="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight">
				💬 Beta Reader Feedback Triage
			</h1>
			<p class="mt-1 max-w-2xl text-sm text-[var(--theme-text-muted)]">
				Intake and cluster reader notes. Multi-reader confusion and character blockers rank first.
				Conflicting opinions appear side-by-side. Accepted verdicts write directly to <code
					class="font-mono font-bold">decisions.md</code
				> before you touch the manuscript.
			</p>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<button
				type="button"
				class="neo-btn px-3 py-1.5 text-xs font-bold"
				onclick={() => (showImportModal = true)}
			>
				📥 Import feedback.md
			</button>
			<button
				type="button"
				class="neo-btn px-3 py-1.5 text-xs font-bold"
				onclick={() => (showExportDrawer = !showExportDrawer)}
			>
				👁️ {showExportDrawer ? 'Hide feedback.md' : 'View feedback.md'}
			</button>
			<button
				type="button"
				class="neo-btn-primary px-3 py-1.5 text-xs font-bold"
				onclick={exportMarkdown}
			>
				💾 Download feedback.md
			</button>
		</div>
	</header>

	{#if alertMessage}
		<div
			class="neo-box border-emerald-600 bg-emerald-500/15 p-3 text-sm font-bold text-emerald-800 dark:text-emerald-200"
		>
			✓ {alertMessage}
		</div>
	{/if}

	<!-- Main Grid: Intake Form (4 cols) & Clustered Triage Board (8 cols) -->
	<div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
		<!-- Left: Intake Form -->
		<section class="space-y-6 lg:col-span-4">
			<div class="neo-box space-y-4 bg-[var(--theme-surface)] p-5">
				<h2 class="font-display text-base font-bold uppercase">📥 Ingest Reader Observation</h2>

				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleAddFeedback();
					}}
					class="space-y-3"
				>
					<div>
						<label for="fb-reader-name" class="block text-xs font-bold uppercase text-[var(--theme-text-muted)]">
							Reader Name / Identifier *
						</label>
						<input
							id="fb-reader-name"
							type="text"
							bind:value={newReader}
							placeholder="e.g. Beta-Alex, Reader-2"
							required
							class="neo-input mt-1 w-full p-2 text-xs font-bold"
						/>
					</div>

					<div class="grid grid-cols-2 gap-2">
						<div>
							<label for="fb-chapter" class="block text-xs font-bold uppercase text-[var(--theme-text-muted)]">
								Chapter *
							</label>
							<select
								id="fb-chapter"
								bind:value={newChapterId}
								class="neo-input mt-1 w-full p-2 text-xs font-bold"
							>
								{#each chapters as ch}
									<option value={ch.id}>{ch.title}</option>
								{/each}
								{#if chapters.length === 0}
									<option value="c1">Chapter 1</option>
								{/if}
							</select>
						</div>

						<div>
							<label for="fb-para-idx" class="block text-xs font-bold uppercase text-[var(--theme-text-muted)]">
								Para Index (opt)
							</label>
							<input
								id="fb-para-idx"
								type="number"
								min="1"
								bind:value={newParagraph}
								placeholder="e.g. 3"
								class="neo-input mt-1 w-full p-2 text-xs"
							/>
						</div>
					</div>

					<div>
						<label for="fb-quote" class="block text-xs font-bold uppercase text-[var(--theme-text-muted)]">
							Manuscript Quote (Exact where)
						</label>
						<input
							id="fb-quote"
							type="text"
							bind:value={newQuote}
							placeholder="e.g. Kael took the coin without looking..."
							class="neo-input mt-1 w-full p-2 text-xs italic"
						/>
					</div>

					<div>
						<label for="fb-feedback" class="block text-xs font-bold uppercase text-[var(--theme-text-muted)]">
							Reader Observation / Issue *
						</label>
						<textarea
							id="fb-feedback"
							bind:value={newObservation}
							rows="4"
							placeholder="e.g. Felt rushed. Why does he trust the courier so quickly?"
							required
							class="neo-input mt-1 w-full p-2 text-xs leading-relaxed"
						></textarea>
					</div>

					<div>
						<label for="fb-candidate-class" class="block text-xs font-bold uppercase text-[var(--theme-text-muted)]">
							Feedback Class *
						</label>
						<select
							id="fb-candidate-class"
							bind:value={newClass}
							class="neo-input mt-1 w-full p-2 text-xs font-bold"
						>
							<option value="confusion">Confusion (Reader lost / blocking)</option>
							<option value="character">Character (Motivation / believability)</option>
							<option value="stakes">Stakes ("Didn't care" / scene goal)</option>
							<option value="pacing">Pacing (Too rushed / drags)</option>
							<option value="prose">Prose (Line-level flow / anti-slop)</option>
							<option value="taste">Taste (Subjective preference / Safe to ignore)</option>
						</select>
					</div>

					<button
						type="submit"
						class="neo-btn-primary w-full py-2.5 text-xs font-black uppercase tracking-wider"
					>
						+ Ingest & Cluster
					</button>
				</form>
			</div>

			<!-- Classification Legend -->
			<div class="neo-box space-y-3 bg-[var(--theme-surface-subtle)] p-4 text-xs">
				<h3 class="font-display font-bold uppercase">Triage Protocol Rules</h3>
				<ul class="space-y-1.5 text-[11px] text-[var(--theme-text-muted)]">
					<li>
						<strong class="text-red-500">1. Confusion & Character:</strong> High priority. Check world
						bible gaps before asking.
					</li>
					<li>
						<strong class="text-amber-500">2. Pacing:</strong> Multi-reader clusters get beat
						density analysis.
					</li>
					<li>
						<strong class="text-blue-500">3. Conflicting Notes:</strong> Presented side by side;
						never averaged.
					</li>
					<li>
						<strong class="text-gray-400">4. Taste:</strong> Always marked "Safe to Ignore" unless
						author explicitly opts in.
					</li>
				</ul>
			</div>
		</section>

		<!-- Right: Ranked Clusters & Verdict Triage Board -->
		<section class="space-y-6 lg:col-span-8">
			<div class="flex items-center justify-between">
				<div>
					<h2 class="font-display text-lg font-bold uppercase">
						Ranked Multi-Reader Clusters ({clusters.length})
					</h2>
					<p class="text-xs text-[var(--theme-text-muted)]">
						Sorted by priority: Multi-reader blocking issues first, taste preferences last.
					</p>
				</div>
			</div>

			{#if clusters.length === 0}
				<div class="neo-box bg-[var(--theme-surface)] p-8 text-center">
					<p class="text-sm font-bold text-[var(--theme-text-muted)]">
						No feedback observations recorded yet. Ingest your beta reader notes on the left.
					</p>
				</div>
			{/if}

			<div class="space-y-4">
				{#each clusters as cluster, cIdx}
					<div
						class="neo-box space-y-4 bg-[var(--theme-surface)] p-5 {cluster.candidateClass === 'taste'
							? 'opacity-85'
							: ''}"
					>
						<!-- Cluster Header Banner -->
						<div class="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
							<div class="flex items-center gap-2">
								<span class="font-mono text-xs font-black">F{cIdx + 1}</span>
								<span
									class="neo-badge text-[10px] uppercase {cluster.candidateClass === 'confusion'
										? 'bg-red-500 text-white'
										: cluster.candidateClass === 'character'
											? 'bg-amber-500 text-black'
											: cluster.candidateClass === 'stakes'
												? 'bg-purple-500 text-white'
												: cluster.candidateClass === 'pacing'
													? 'bg-blue-500 text-white'
													: cluster.candidateClass === 'taste'
														? 'bg-neutral-500 text-white'
														: 'bg-emerald-500 text-white'}"
								>
									{cluster.candidateClass}
								</span>
								<span class="text-xs font-bold">
									{cluster.chapterTitle || cluster.chapterId}
									{#if cluster.paragraphIndex !== undefined}
										<span class="font-mono text-[var(--theme-text-muted)]"
											>(Para {cluster.paragraphIndex})</span
										>
									{/if}
								</span>
							</div>

							<div class="flex items-center gap-2">
								<span class="neo-badge bg-[var(--theme-surface-subtle)] text-[10px]">
									{cluster.items.length} reader{cluster.items.length > 1 ? 's' : ''} (weight {cluster.totalWeight})
								</span>
								{#if cluster.candidateClass === 'taste'}
									<span class="neo-badge border-amber-600 bg-amber-400/20 text-[10px] text-amber-700 dark:text-amber-300">
										SAFE TO IGNORE
									</span>
								{/if}
							</div>
						</div>

						<!-- Conflict Alert Callout -->
						{#if cluster.hasConflict}
							<div class="rounded-lg border-2 border-amber-500 bg-amber-500/10 p-3 text-xs">
								<span class="font-bold text-amber-600">⚡ Conflicting Reader Observations:</span>
								<p class="mt-1 text-[var(--theme-text)]">{cluster.conflictDetails}</p>
								<p class="mt-1 text-[11px] text-[var(--theme-text-muted)]">
									Rule: Do not average feedback. Choose one direction or protect the original vision.
								</p>
							</div>
						{/if}

						<!-- Individual Observations inside Cluster -->
						<div class="space-y-3">
							{#each cluster.items as item}
								<div
									class="rounded-lg border border-[var(--theme-border-strong)] bg-[var(--theme-surface-subtle)] p-3.5 space-y-2"
								>
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											<span class="font-mono text-xs font-bold text-[var(--theme-accent)]"
												>@{item.readerName}</span
											>
											<span
												class="neo-badge text-[9px] uppercase {item.verdict === 'accepted'
													? 'bg-emerald-500 text-white'
													: item.verdict === 'rejected'
														? 'bg-red-500 text-white'
														: item.verdict === 'modified'
															? 'bg-blue-500 text-white'
															: 'bg-neutral-400 text-black'}"
											>
												{item.verdict}
											</span>
										</div>
										<button
											type="button"
											class="text-xs text-[var(--theme-text-muted)] hover:text-red-500"
											onclick={() => deleteItem(item.id)}
											title="Delete observation"
										>
											×
										</button>
									</div>

									{#if item.quote}
										<p class="border-l-2 border-[var(--theme-accent)] pl-2 text-xs italic text-[var(--theme-text-muted)]">
											"{item.quote}"
										</p>
									{/if}

									<p class="text-xs font-medium leading-relaxed">{item.feedback}</p>

									{#if item.verdictNotes}
										<div class="rounded-md border border-[var(--theme-border-strong)] bg-[var(--theme-surface)] p-2 text-xs">
											<span class="font-bold uppercase text-[10px] text-[var(--theme-accent)]"
												>Author Verdict Note:</span
											>
											<p class="mt-0.5">{item.verdictNotes}</p>
											{#if item.linkedDecisionId}
												<a
													href="/decisions"
													class="mt-1 inline-block text-[11px] font-bold text-[var(--theme-accent)] underline"
												>
													→ View locked decision in decisions.md ({item.linkedDecisionId})
												</a>
											{/if}
										</div>
									{/if}

									<!-- Author Verdict Actions -->
									<div class="flex flex-wrap items-center gap-1.5 pt-1">
										<button
											type="button"
											class="neo-btn px-2.5 py-1 text-[11px] font-bold hover:bg-emerald-500 hover:text-white"
											onclick={() => openVerdictModal(item, 'accepted')}
										>
											✓ Accept & Lock Decision
										</button>
										<button
											type="button"
											class="neo-btn px-2.5 py-1 text-[11px] font-bold hover:bg-blue-500 hover:text-white"
											onclick={() => openVerdictModal(item, 'modified')}
										>
											✎ Modify & Lock
										</button>
										<button
											type="button"
											class="neo-btn px-2.5 py-1 text-[11px] font-bold hover:bg-red-500 hover:text-white"
											onclick={() => openVerdictModal(item, 'rejected')}
										>
											✕ Reject
										</button>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</section>
	</div>

	<!-- feedback.md Drawer -->
	{#if showExportDrawer}
		<div class="neo-box space-y-3 bg-[var(--theme-surface)] p-6">
			<div class="flex items-center justify-between border-b pb-3">
				<div>
					<h3 class="font-display text-base font-bold uppercase">feedback.md Artifact</h3>
					<p class="text-xs text-[var(--theme-text-muted)]">
						Ranked cluster markdown conforming to portable novel craft agent schemas.
					</p>
				</div>
				<button
					type="button"
					class="neo-btn px-3 py-1.5 text-xs font-bold"
					onclick={() => navigator.clipboard.writeText(markdownOutput)}
				>
					📋 Copy to Clipboard
				</button>
			</div>
			<pre
				class="max-h-96 overflow-auto rounded-lg border border-[var(--theme-border-strong)] bg-[var(--theme-surface-subtle)] p-4 font-mono text-xs leading-relaxed">{markdownOutput}</pre>
		</div>
	{/if}
</div>

<!-- Verdict Commitment Modal -->
{#if activeVerdictItem}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
	>
		<div
			class="neo-box w-full max-w-lg space-y-4 bg-[var(--theme-surface)] p-6 shadow-[8px_8px_0px_var(--theme-shadow-hard)]"
		>
			<h3 class="font-display text-lg font-bold uppercase">
				Commit Verdict: {verdictType.toUpperCase()}
			</h3>
			<p class="text-xs text-[var(--theme-text-muted)]">
				Observation from <strong class="text-[var(--theme-accent)]"
					>@{activeVerdictItem.readerName}</strong
				> on {activeVerdictItem.chapterTitle || activeVerdictItem.chapterId}:
			</p>
			<blockquote
				class="rounded-md border-l-4 border-[var(--theme-accent)] bg-[var(--theme-surface-subtle)] p-2.5 text-xs italic"
			>
				"{activeVerdictItem.feedback}"
			</blockquote>

			<div>
				<label for="verdict-notes-input" class="block text-xs font-bold uppercase text-[var(--theme-text-muted)]">
					{verdictType === 'accepted' || verdictType === 'modified'
						? 'Author Decision Resolution (written directly to decisions.md):'
						: 'Reason for Rejection:'}
				</label>
				<textarea
					id="verdict-notes-input"
					bind:value={verdictDecisionText}
					rows="4"
					placeholder="State your exact craft decision or why this was rejected..."
					class="neo-input mt-1 w-full p-2.5 text-xs leading-relaxed"
				></textarea>
			</div>

			<div class="flex justify-end gap-2 pt-2">
				<button
					type="button"
					class="neo-btn px-4 py-2 text-xs font-bold"
					onclick={() => (activeVerdictItem = null)}
				>
					Cancel
				</button>
				<button
					type="button"
					class="neo-btn-primary px-4 py-2 text-xs font-bold"
					onclick={commitVerdict}
				>
					{verdictType === 'accepted' || verdictType === 'modified'
						? '🔒 Commit & Lock in decisions.md'
						: 'Confirm Rejection'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Import Modal -->
{#if showImportModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
	>
		<div
			class="neo-box w-full max-w-xl space-y-4 bg-[var(--theme-surface)] p-6 shadow-[8px_8px_0px_var(--theme-shadow-hard)]"
		>
			<h3 class="font-display text-lg font-bold uppercase">Import feedback.md</h3>
			<p class="text-xs text-[var(--theme-text-muted)]">
				Paste feedback observations formatted in standard triage markdown.
			</p>

			<textarea
				bind:value={rawMarkdownImport}
				rows="10"
				placeholder="# Beta Reader Feedback Triage&#10;&#10;### F1 — Reader-A — ch: c1, para: 3&#10;- Class: character (1 reader → weight 1)&#10;  - [Reader-A] &quot;quote&quot;: feedback"
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
					Import Items
				</button>
			</div>
		</div>
	</div>
{/if}
