/**
 * Literary Typesetting & 8-Theme Palette Engine for Story OS
 */

export interface ThemeDefinition {
	id: string;
	name: string;
	tagline: string;
	icon: string;
	category: 'paper' | 'dark' | 'vintage' | 'botanical';
	styles: {
		bg: string;
		surface: string;
		surfaceSubtle: string;
		border: string;
		text: string;
		textMuted: string;
		accent: string;
		accentHover: string;
		paperSheet: string;
		paperShadow: string;
		groove: string;
		bevelTop: string;
		bevelBottom: string;
	};
}

export interface TypographySettings {
	fontFamily: string;
	fontSize: number; // in px
	lineHeight: number; // multiplier e.g. 1.8
	firstLineIndent: number; // in em e.g. 1.5
	paragraphSpacing: number; // in em e.g. 0.5
	textAlign: 'left' | 'justify' | 'center';
	trimSize: '6x9' | 'a5' | 'hardcover' | 'full';
	pageMargin: number; // in px e.g. 48
	ornamentGlyph: string; // e.g. '* * *' or '✦ ✦ ✦' or '§'
}

export const LITERARY_FONTS = [
	{ id: 'newsreader', name: 'Newsreader', category: 'Serif', fontStack: '"Newsreader", Georgia, "Times New Roman", serif' },
	{ id: 'eb-garamond', name: 'EB Garamond', category: 'Serif', fontStack: '"EB Garamond", Garamond, "Times New Roman", serif' },
	{ id: 'merriweather', name: 'Merriweather', category: 'Serif', fontStack: '"Merriweather", Georgia, serif' },
	{ id: 'instrument-sans', name: 'Instrument Sans', category: 'Sans', fontStack: '"Instrument Sans", system-ui, -apple-system, sans-serif' },
	{ id: 'geist', name: 'Geist Sans', category: 'Sans', fontStack: '"Geist", -apple-system, system-ui, sans-serif' },
	{ id: 'jetbrains-mono', name: 'JetBrains Mono', category: 'Monospace', fontStack: '"JetBrains Mono", "Courier New", monospace' },
	{ id: 'opendyslexic', name: 'OpenDyslexic (Legibility)', category: 'Accessible', fontStack: 'OpenDyslexic, "Comic Sans MS", -apple-system, sans-serif' }
];

export const TACTILE_THEMES: ThemeDefinition[] = [
	{
		id: 'antique-parchment',
		name: 'Antique Parchment',
		tagline: 'Aged sepia vellum with deep umber ink',
		icon: '📜',
		category: 'vintage',
		styles: {
			bg: '#e8dec8',
			surface: '#f6f0dd',
			surfaceSubtle: '#ede5ce',
			border: '#c8b998',
			text: '#2d2116',
			textMuted: '#685441',
			accent: '#8b4513',
			accentHover: '#a0522d',
			paperSheet: '#faf6eb',
			paperShadow: 'rgba(70, 50, 30, 0.25)',
			groove: '#ded4bc',
			bevelTop: 'rgba(255, 255, 255, 0.75)',
			bevelBottom: 'rgba(60, 40, 20, 0.2)'
		}
	},
	{
		id: 'royal-bureau',
		name: 'Royal Bureau',
		tagline: 'Polished mahogany desk with warm ivory stationery',
		icon: '🏛️',
		category: 'vintage',
		styles: {
			bg: '#2b1b17',
			surface: '#f9f6f0',
			surfaceSubtle: '#eee7db',
			border: '#d4af37',
			text: '#1a1412',
			textMuted: '#594a42',
			accent: '#c59b27',
			accentHover: '#dbb13b',
			paperSheet: '#fffdfa',
			paperShadow: 'rgba(0, 0, 0, 0.45)',
			groove: '#e0d8c8',
			bevelTop: 'rgba(255, 255, 255, 0.6)',
			bevelBottom: 'rgba(0, 0, 0, 0.35)'
		}
	},
	{
		id: 'obsidian-ink',
		name: 'Obsidian Ink',
		tagline: 'Deep velvet night with luminous amber script',
		icon: '🖤',
		category: 'dark',
		styles: {
			bg: '#121214',
			surface: '#1a1a1f',
			surfaceSubtle: '#24242b',
			border: '#363642',
			text: '#f2eed9',
			textMuted: '#a39d89',
			accent: '#e6a13c',
			accentHover: '#f5b458',
			paperSheet: '#1e1e24',
			paperShadow: 'rgba(0, 0, 0, 0.6)',
			groove: '#141418',
			bevelTop: 'rgba(255, 255, 255, 0.08)',
			bevelBottom: 'rgba(0, 0, 0, 0.7)'
		}
	},
	{
		id: 'midnight-velvet',
		name: 'Midnight Velvet',
		tagline: 'Deep indigo night with moonlight sterling type',
		icon: '🌙',
		category: 'dark',
		styles: {
			bg: '#0d131a',
			surface: '#151e28',
			surfaceSubtle: '#1d2937',
			border: '#2a3a4d',
			text: '#e2e8f0',
			textMuted: '#8b9bb0',
			accent: '#38bdf8',
			accentHover: '#60a5fa',
			paperSheet: '#18222f',
			paperShadow: 'rgba(0, 0, 0, 0.65)',
			groove: '#0f1722',
			bevelTop: 'rgba(255, 255, 255, 0.1)',
			bevelBottom: 'rgba(0, 0, 0, 0.8)'
		}
	},
	{
		id: 'warm-linen',
		name: 'Warm Linen',
		tagline: 'Crisp woven linen canvas with soft graphite',
		icon: '🌾',
		category: 'paper',
		styles: {
			bg: '#eae6df',
			surface: '#f7f5f0',
			surfaceSubtle: '#ece8e0',
			border: '#cfc9be',
			text: '#222220',
			textMuted: '#63605a',
			accent: '#7c5e42',
			accentHover: '#967353',
			paperSheet: '#fdfcf9',
			paperShadow: 'rgba(50, 45, 40, 0.18)',
			groove: '#dedad0',
			bevelTop: 'rgba(255, 255, 255, 0.85)',
			bevelBottom: 'rgba(40, 35, 30, 0.15)'
		}
	},
	{
		id: 'forest-sage',
		name: 'Forest Sage',
		tagline: 'Botanical pine and sage with pale birch leaves',
		icon: '🌲',
		category: 'botanical',
		styles: {
			bg: '#1b2620',
			surface: '#f3f6f3',
			surfaceSubtle: '#e2eae2',
			border: '#8fa89b',
			text: '#19261f',
			textMuted: '#4b6154',
			accent: '#2e6f40',
			accentHover: '#3b8b51',
			paperSheet: '#fafcfa',
			paperShadow: 'rgba(10, 25, 15, 0.35)',
			groove: '#d7e2d7',
			bevelTop: 'rgba(255, 255, 255, 0.7)',
			bevelBottom: 'rgba(15, 35, 20, 0.25)'
		}
	},
	{
		id: 'cyber-monokai',
		name: 'Cyber Monokai',
		tagline: 'Slate terminal with high-contrast cyber highlights',
		icon: '⚡',
		category: 'dark',
		styles: {
			bg: '#18191c',
			surface: '#22242a',
			surfaceSubtle: '#2d3038',
			border: '#404450',
			text: '#f8f8f2',
			textMuted: '#8f93a2',
			accent: '#a6e22e',
			accentHover: '#66d9ef',
			paperSheet: '#272a32',
			paperShadow: 'rgba(0, 0, 0, 0.55)',
			groove: '#1c1e24',
			bevelTop: 'rgba(255, 255, 255, 0.08)',
			bevelBottom: 'rgba(0, 0, 0, 0.65)'
		}
	},
	{
		id: 'classic-typescript',
		name: 'Classic Typescript',
		tagline: 'Newsprint typing paper with stark carbon black ink',
		icon: '⌨️',
		category: 'paper',
		styles: {
			bg: '#e4e2dd',
			surface: '#f4f3ef',
			surfaceSubtle: '#e8e6e0',
			border: '#b8b4ab',
			text: '#111111',
			textMuted: '#555550',
			accent: '#b91c1c',
			accentHover: '#dc2626',
			paperSheet: '#fbfbfa',
			paperShadow: 'rgba(30, 30, 30, 0.2)',
			groove: '#d8d5cd',
			bevelTop: 'rgba(255, 255, 255, 0.9)',
			bevelBottom: 'rgba(30, 30, 30, 0.25)'
		}
	}
];

export const DEFAULT_TYPOGRAPHY: TypographySettings = {
	fontFamily: 'newsreader',
	fontSize: 18,
	lineHeight: 1.8,
	firstLineIndent: 1.5,
	paragraphSpacing: 0.4,
	textAlign: 'justify',
	trimSize: '6x9',
	pageMargin: 48,
	ornamentGlyph: '✦ ✦ ✦'
};

const THEME_STORAGE_KEY = 'story_os_active_tactile_theme';
const TYPO_STORAGE_KEY = 'story_os_typography_settings';

export function loadActiveTheme(): string {
	if (typeof localStorage === 'undefined') return 'antique-parchment';
	return localStorage.getItem(THEME_STORAGE_KEY) || 'antique-parchment';
}

export function saveActiveTheme(themeId: string): void {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(THEME_STORAGE_KEY, themeId);
	}
	applyThemeToDocument(themeId);
}

export function loadTypographySettings(): TypographySettings {
	if (typeof localStorage === 'undefined') return { ...DEFAULT_TYPOGRAPHY };
	const raw = localStorage.getItem(TYPO_STORAGE_KEY);
	if (!raw) return { ...DEFAULT_TYPOGRAPHY };
	try {
		return { ...DEFAULT_TYPOGRAPHY, ...JSON.parse(raw) };
	} catch {
		return { ...DEFAULT_TYPOGRAPHY };
	}
}

export function saveTypographySettings(settings: TypographySettings): void {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(TYPO_STORAGE_KEY, JSON.stringify(settings));
	}
}

export function applyThemeToDocument(themeId: string): void {
	if (typeof document === 'undefined') return;
	const theme = TACTILE_THEMES.find((t) => t.id === themeId) || TACTILE_THEMES[0];
	const root = document.documentElement;

	root.setAttribute('data-tactile-theme', theme.id);
	root.style.setProperty('--theme-bg', theme.styles.bg);
	root.style.setProperty('--theme-surface', theme.styles.surface);
	root.style.setProperty('--theme-surface-subtle', theme.styles.surfaceSubtle);
	root.style.setProperty('--theme-border', theme.styles.border);
	root.style.setProperty('--theme-text', theme.styles.text);
	root.style.setProperty('--theme-text-muted', theme.styles.textMuted);
	root.style.setProperty('--theme-accent', theme.styles.accent);
	root.style.setProperty('--theme-accent-hover', theme.styles.accentHover);
	root.style.setProperty('--theme-paper-sheet', theme.styles.paperSheet);
	root.style.setProperty('--theme-paper-shadow', theme.styles.paperShadow);
	root.style.setProperty('--theme-groove', theme.styles.groove);
	root.style.setProperty('--theme-bevel-top', theme.styles.bevelTop);
	root.style.setProperty('--theme-bevel-bottom', theme.styles.bevelBottom);
}
