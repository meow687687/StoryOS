import type { EntryKind } from './world';

export type WriterArchetype = 'discovery' | 'architect' | 'reviser';

export interface ArchetypeMeta {
	id: WriterArchetype;
	label: string;
	tagline: string;
	/** Appended to partner system prompts (Phase 2) to tune the editor's voice. */
	partnerVoice: string;
	/** Bible kinds emphasized in the starter bible for this archetype. */
	starterKinds: EntryKind[];
	/** Focus lens for per-session craft notes (Phase 4). */
	craftLens: string;
}

export const ARCHETYPES: ArchetypeMeta[] = [
	{
		id: 'discovery',
		label: 'Discovery writer',
		tagline: 'You find the story by writing it. The partner asks, you wander, lore lands after.',
		partnerVoice:
			'The author is a discovery writer: ask more, never push an outline. Let ideas stay loose; organize only what has clearly converged.',
		starterKinds: ['character', 'mystery', 'lore'],
		craftLens: 'Noticing which wandering produced gold vs. noise; naming the shift when a loose thread tightens.'
	},
	{
		id: 'architect',
		label: 'Architect',
		tagline: 'You build the structure first. The partner stress-tests causality and timelines.',
		partnerVoice:
			'The author is an architect: push structure, causality, and chronology. Challenge plot holes and unearned outcomes early and directly.',
		starterKinds: ['timeline', 'faction', 'magic'],
		craftLens: 'Whether the structure earned its load; flagging where scaffolding shows through the prose.'
	},
	{
		id: 'reviser',
		label: 'Reviser',
		tagline: 'You have material. The partner interrogates, sharpens continuity, and guards voice.',
		partnerVoice:
			'The author is revising existing material: assume drafts exist. Focus on interrogation, continuity breaks, and voice consistency over invention.',
		starterKinds: ['character', 'timeline', 'magic'],
		craftLens: 'Continuity discipline and voice drift; what got sharper this session vs. what still wobbles.'
	}
];

export interface AuthorProfile {
	name: string;
	archetype: WriterArchetype;
	createdAt: string;
}

const PROFILE_KEY = 'writers-tool.profile.v1';

export function archetypeMeta(id: WriterArchetype): ArchetypeMeta {
	return ARCHETYPES.find((a) => a.id === id) ?? ARCHETYPES[0];
}

export function loadProfile(): AuthorProfile | null {
	try {
		if (typeof localStorage === 'undefined') return null;
		const raw = localStorage.getItem(PROFILE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as AuthorProfile;
		if (!parsed.name || !ARCHETYPES.some((a) => a.id === parsed.archetype)) return null;
		return parsed;
	} catch {
		return null;
	}
}

export function saveProfile(profile: AuthorProfile): void {
	try {
		localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
	} catch {
		/* storage full / private mode — ignore */
	}
}
