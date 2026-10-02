<script lang="ts">
	import { toasts, type ToastItem } from './toasts';

	let activeToasts = $state<ToastItem[]>([]);

	$effect(() => {
		const unsub = toasts.subscribe((val) => {
			activeToasts = val;
		});
		return unsub;
	});
</script>

<div
	class="pointer-events-none fixed bottom-5 right-5 z-50 flex max-w-sm flex-col gap-2.5"
	aria-live="polite"
	aria-atomic="true"
>
	{#each activeToasts as toast (toast.id)}
		<div
			class="pointer-events-auto flex items-center justify-between gap-3 rounded-lg border border-[var(--theme-border-strong)] bg-[var(--theme-surface-card)] px-3.5 py-2.5 text-xs font-bold text-[var(--theme-text)] shadow-[0_4px_16px_rgba(0,0,0,0.22),inset_0_1px_0_var(--theme-bevel-top)] transition-all animate-in fade-in slide-in-from-bottom-2 {toast.type ===
			'success'
				? 'border-emerald-600/70 text-emerald-950 dark:text-emerald-200'
				: toast.type === 'error'
					? 'border-rose-600/70 text-rose-950 dark:text-rose-200'
					: toast.type === 'warning'
						? 'border-amber-600/70 text-amber-950 dark:text-amber-200'
						: 'border-[var(--theme-border-strong)]'}"
			role="alert"
		>
			<div class="flex items-center gap-2">
				<span
					class="skeuo-seal h-5 w-5 text-[10px] font-black {toast.type === 'success'
						? 'bg-emerald-600 text-white'
						: toast.type === 'error'
							? 'bg-rose-600 text-white'
							: toast.type === 'warning'
								? 'bg-amber-600 text-amber-950'
								: 'bg-[var(--theme-accent)] text-[var(--theme-accent-fg)]'}"
				>
					{toast.icon}
				</span>
				<span class="leading-snug">{toast.message}</span>
			</div>
			<button
				type="button"
				class="cursor-pointer text-sm font-bold opacity-60 hover:opacity-100"
				onclick={() => toasts.remove(toast.id)}
				aria-label="Dismiss toast"
			>
				×
			</button>
		</div>
	{/each}
</div>
