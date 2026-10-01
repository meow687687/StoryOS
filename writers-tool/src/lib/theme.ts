export type ThemeId =
	| 'parchment'
	| 'kanagawa-wave'
	| 'kanagawa-dragon'
	| 'everforest-dark'
	| 'everforest-light'
	| 'catppuccin-mocha'
	| 'catppuccin-latte'
	| 'gruvbox-dark';

export interface ThemeOption {
	id: ThemeId;
	name: string;
	mode: 'light' | 'dark';
	description: string;
	bgHex: string;
	surfaceHex: string;
	accentHex: string;
	textHex: string;
}

export const THEMES: ThemeOption[] = [
	{
		id: 'parchment',
		name: 'Classic Parchment',
		mode: 'light',
		description: 'Warm editorial paper & burnt ember ink',
		bgHex: '#faf7f2',
		surfaceHex: '#ffffff',
		accentHex: '#9a3412',
		textHex: '#1c1917'
	},
	{
		id: 'kanagawa-wave',
		name: 'Kanagawa Wave',
		mode: 'dark',
		description: 'Deep Japanese sumi-e indigo & autumn red',
		bgHex: '#1f1f28',
		surfaceHex: '#2a2a37',
		accentHex: '#e46876',
		textHex: '#dcd7ba'
	},
	{
		id: 'kanagawa-dragon',
		name: 'Kanagawa Dragon',
		mode: 'dark',
		description: 'Midnight sumi ink & dragon amber',
		bgHex: '#181616',
		surfaceHex: '#222020',
		accentHex: '#c4746e',
		textHex: '#c5c9c5'
	},
	{
		id: 'everforest-dark',
		name: 'Everforest Dark',
		mode: 'dark',
		description: 'Comforting natural forest moss & earth',
		bgHex: '#2d353b',
		surfaceHex: '#343f44',
		accentHex: '#a7c080',
		textHex: '#d3c6aa'
	},
	{
		id: 'everforest-light',
		name: 'Everforest Light',
		mode: 'light',
		description: 'Gentle organic matcha, cream & sage',
		bgHex: '#fdf6e3',
		surfaceHex: '#f4f0d9',
		accentHex: '#8da101',
		textHex: '#5c6a72'
	},
	{
		id: 'catppuccin-mocha',
		name: 'Catppuccin Mocha',
		mode: 'dark',
		description: 'Modern cozy dark pastel with lavender',
		bgHex: '#1e1e2e',
		surfaceHex: '#181825',
		accentHex: '#cba6f7',
		textHex: '#cdd6f4'
	},
	{
		id: 'catppuccin-latte',
		name: 'Catppuccin Latte',
		mode: 'light',
		description: 'Clean light pastel paper & rosewater',
		bgHex: '#eff1f5',
		surfaceHex: '#ffffff',
		accentHex: '#8839ef',
		textHex: '#4c4f69'
	},
	{
		id: 'gruvbox-dark',
		name: 'Gruvbox Dark',
		mode: 'dark',
		description: 'Warm retro groove dark with amber orange',
		bgHex: '#282828',
		surfaceHex: '#1d2021',
		accentHex: '#fe8019',
		textHex: '#ebdbb2'
	}
];

const THEME_KEY = 'story_os_theme';

export function getStoredTheme(): ThemeId {
	if (typeof localStorage === 'undefined') return 'parchment';
	const stored = localStorage.getItem(THEME_KEY) as ThemeId;
	if (stored && THEMES.some((t) => t.id === stored)) {
		return stored;
	}
	return 'parchment';
}

export function applyTheme(themeId: ThemeId): void {
	if (typeof document === 'undefined') return;
	document.documentElement.setAttribute('data-theme', themeId);
	try {
		localStorage.setItem(THEME_KEY, themeId);
	} catch {
		/* ignore */
	}
}
