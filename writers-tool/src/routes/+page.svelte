<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	// Phase 0: home IS the partner. The old landing page is shelved in git history.
	onMount(() => {
		goto('/partner', { replaceState: true });
	});
</script>

<p class="p-8 font-serif text-sm text-[var(--theme-text-muted)]">Opening your partner…</p>
