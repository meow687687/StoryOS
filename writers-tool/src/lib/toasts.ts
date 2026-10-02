import { writable } from 'svelte/store';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
	id: string;
	message: string;
	type: ToastType;
	icon?: string;
	durationMs: number;
}

function createToastStore() {
	const { subscribe, update } = writable<ToastItem[]>([]);

	function remove(id: string) {
		update((all) => all.filter((t) => t.id !== id));
	}

	function add(message: string, type: ToastType = 'info', icon?: string, durationMs: number = 3200) {
		const id = 'toast-' + Math.random().toString(36).slice(2, 9);
		const defaultIcon =
			icon ??
			(type === 'success' ? '✓' : type === 'warning' ? '⚠️' : type === 'error' ? '✕' : 'ℹ️');

		const item: ToastItem = { id, message, type, icon: defaultIcon, durationMs };
		update((all) => [...all, item]);

		if (durationMs > 0) {
			setTimeout(() => {
				remove(id);
			}, durationMs);
		}
		return id;
	}

	return {
		subscribe,
		add,
		remove,
		success: (msg: string, icon?: string) => add(msg, 'success', icon ?? '✓'),
		warning: (msg: string, icon?: string) => add(msg, 'warning', icon ?? '⚠️'),
		error: (msg: string, icon?: string) => add(msg, 'error', icon ?? '✕'),
		info: (msg: string, icon?: string) => add(msg, 'info', icon ?? 'ℹ️')
	};
}

export const toasts = createToastStore();
