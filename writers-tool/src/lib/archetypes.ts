/**
 * Adaptive Writer Archetype Presets & Workflow Modes
 */

export type WriterArchetypeId = 'pantser' | 'plotter' | 'plantser';

export interface WriterArchetypePreset {
	id: WriterArchetypeId;
	name: string;
	tagline: string;
	icon: string;
	philosophy: string;
	features: string[];
	layout: {
		showBinder: boolean;
		showBeatTree: boolean;
		showSprintHUD: boolean;
		showMarginRail: boolean;
		showInlineBraindump: boolean;
		typewriterMode: boolean;
	};
}

export const WRITER_ARCHETYPES: Record<WriterArchetypeId, WriterArchetypePreset> = {
	pantser: {
		id: 'pantser',
		name: 'Pantser (The Discovery Drafter)',
		tagline: 'Write into the dark with zero distractions and pure momentum.',
		icon: '⚡',
		philosophy: 'Follow character impulses; edit nothing until the first draft is born.',
		features: [
			'Distraction-free pure typewriter canvas',
			'Word count velocity & sprint timer',
			'Instant "Inline Braindump" popover (⌥D) to park thoughts without stopping',
			'Auto-hiding chrome and navigation'
		],
		layout: {
			showBinder: false,
			showBeatTree: false,
			showSprintHUD: true,
			showMarginRail: false,
			showInlineBraindump: true,
			typewriterMode: true
		}
	},
	plotter: {
		id: 'plotter',
		name: 'Plotter (The Master Architect)',
		tagline: 'Structure beats, character arcs, and world rules before laying prose.',
		icon: '📐',
		philosophy: 'Flawless structural pacing prevents third-act collapses.',
		features: [
			'Split-screen beat sheets (Save the Cat / 3-Act)',
			'Side-by-side Character Dossiers & World Bible',
			'Scene goal, conflict & disaster checklists',
			'Direct chapter-to-outline binding'
		],
		layout: {
			showBinder: true,
			showBeatTree: true,
			showSprintHUD: false,
			showMarginRail: true,
			showInlineBraindump: false,
			typewriterMode: false
		}
	},
	plantser: {
		id: 'plantser',
		name: 'Plantser (The Flexible Hybrid)',
		tagline: 'Lighthouse plotting: know the next milestone, discover the path.',
		icon: '🌱',
		philosophy: 'Plan the big tentpoles, let scenes breathe organically.',
		features: [
			'Visual Scene Cards Corkboard',
			'Floating Margin Notes & Threaded Comments',
			'Flexible milestone markers',
			'Collapsible beat strip'
		],
		layout: {
			showBinder: true,
			showBeatTree: false,
			showSprintHUD: true,
			showMarginRail: true,
			showInlineBraindump: true,
			typewriterMode: false
		}
	}
};

const ARCHETYPE_STORAGE_KEY = 'story_os_active_writer_archetype';

export function loadActiveArchetype(): WriterArchetypeId {
	if (typeof localStorage === 'undefined') return 'plantser';
	return (localStorage.getItem(ARCHETYPE_STORAGE_KEY) as WriterArchetypeId) || 'plantser';
}

export function saveActiveArchetype(id: WriterArchetypeId): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(ARCHETYPE_STORAGE_KEY, id);
}
