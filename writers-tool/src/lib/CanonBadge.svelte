<script lang="ts">
	import type { CanonStatus } from './world';

	let {
		status = 'canon',
		size = 'md'
	}: {
		status?: CanonStatus;
		size?: 'sm' | 'md';
	} = $props();

	const config = $derived.by(() => {
		switch (status) {
			case 'canon':
				return {
					label: 'Canon',
					icon: '🛡️',
					bg: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
				};
			case 'draft':
				return {
					label: 'Draft',
					icon: '📝',
					bg: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
				};
			case 'rejected':
				return {
					label: 'Rejected',
					icon: '❌',
					bg: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
				};
			case 'idea':
			default:
				return {
					label: 'Idea',
					icon: '💡',
					bg: 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800'
				};
		}
	});
</script>

<span
	class="inline-flex items-center gap-1 rounded-md border-[1.5px] border-[var(--theme-border-strong)] font-mono font-bold tracking-wider uppercase shadow-[1.5px_1.5px_0px_var(--theme-shadow-hard)] {config.bg} {size ===
	'sm'
		? 'px-1.5 py-0.5 text-[10px]'
		: 'px-2 py-0.5 text-[11px]'}"
	title="Lifecycle status: {config.label}"
>
	<span aria-hidden="true">{config.icon}</span>
	{config.label}
</span>
