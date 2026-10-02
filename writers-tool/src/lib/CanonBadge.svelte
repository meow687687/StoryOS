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
					bg: 'bg-gradient-to-b from-emerald-600 to-emerald-800 text-emerald-50 border-emerald-900/80 shadow-[0_2px_4px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.3)]'
				};
			case 'draft':
				return {
					label: 'Draft',
					icon: '📝',
					bg: 'bg-gradient-to-b from-amber-100 to-amber-200 text-amber-950 border-amber-400/80 dark:from-stone-800 dark:to-stone-900 dark:text-amber-200 dark:border-amber-700/70 shadow-[0_1px_3px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)]'
				};
			case 'rejected':
				return {
					label: 'Rejected',
					icon: '❌',
					bg: 'bg-gradient-to-b from-rose-100 to-rose-200 text-rose-950 border-rose-400/80 dark:from-rose-950/60 dark:to-rose-900/60 dark:text-rose-200 dark:border-rose-800 shadow-[0_1px_3px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.2)]'
				};
			case 'idea':
			default:
				return {
					label: 'Idea',
					icon: '💡',
					bg: 'bg-gradient-to-b from-sky-100 to-sky-200 text-sky-950 border-sky-400/80 dark:from-sky-950/60 dark:to-sky-900/60 dark:text-sky-200 dark:border-sky-800 shadow-[0_1px_3px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)]'
				};
		}
	});
</script>

<span
	class="inline-flex items-center gap-1 rounded-md border font-mono font-bold tracking-wider uppercase {config.bg} {size ===
	'sm'
		? 'px-1.5 py-0.5 text-[10px]'
		: 'px-2 py-0.5 text-[11px]'}"
	title="Lifecycle status: {config.label}"
>
	<span aria-hidden="true">{config.icon}</span>
	{config.label}
</span>
