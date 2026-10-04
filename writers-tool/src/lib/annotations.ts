/**
 * Annotations, Multi-Ink Highlighting & Margin Comments Engine
 */

export type HighlightColor = 'amber' | 'emerald' | 'rose' | 'indigo' | 'gold';

export interface ManuscriptHighlight {
	id: string;
	chapterId: string;
	startIndex: number;
	endIndex: number;
	text: string;
	color: HighlightColor;
	createdAt: string;
}

export interface MarginComment {
	id: string;
	chapterId: string;
	highlightId?: string;
	quote?: string;
	content: string;
	author: string;
	status: 'open' | 'resolved' | 'locked_decision';
	decisionId?: string;
	createdAt: string;
}

const HIGHLIGHTS_STORAGE_KEY = 'story_os_manuscript_highlights';
const COMMENTS_STORAGE_KEY = 'story_os_manuscript_comments';

export const HIGHLIGHT_PALETTE: { color: HighlightColor; name: string; bg: string; text: string }[] = [
	{ color: 'amber', name: 'Amber Glow', bg: 'rgba(245, 158, 11, 0.35)', text: '#92400e' },
	{ color: 'emerald', name: 'Emerald Sage', bg: 'rgba(16, 185, 129, 0.35)', text: '#065f46' },
	{ color: 'rose', name: 'Rose Red', bg: 'rgba(244, 63, 94, 0.35)', text: '#9f1239' },
	{ color: 'indigo', name: 'Indigo Night', bg: 'rgba(99, 102, 241, 0.35)', text: '#3730a3' },
	{ color: 'gold', name: 'Gilded Gold', bg: 'rgba(234, 179, 8, 0.4)', text: '#854d0e' }
];

export function loadHighlights(chapterId?: string): ManuscriptHighlight[] {
	if (typeof localStorage === 'undefined') return [];
	const raw = localStorage.getItem(HIGHLIGHTS_STORAGE_KEY);
	if (!raw) return [];
	try {
		const all: ManuscriptHighlight[] = JSON.parse(raw);
		return chapterId ? all.filter((h) => h.chapterId === chapterId) : all;
	} catch {
		return [];
	}
}

export function saveHighlights(highlights: ManuscriptHighlight[]): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify(highlights));
}

export function addHighlight(
	chapterId: string,
	startIndex: number,
	endIndex: number,
	text: string,
	color: HighlightColor = 'amber'
): ManuscriptHighlight {
	const all = loadHighlights();
	const newH: ManuscriptHighlight = {
		id: `hl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
		chapterId,
		startIndex,
		endIndex,
		text,
		color,
		createdAt: new Date().toISOString()
	};
	all.push(newH);
	saveHighlights(all);
	return newH;
}

export function deleteHighlight(highlightId: string): void {
	const all = loadHighlights().filter((h) => h.id !== highlightId);
	saveHighlights(all);
}

export function loadComments(chapterId?: string): MarginComment[] {
	if (typeof localStorage === 'undefined') return [];
	const raw = localStorage.getItem(COMMENTS_STORAGE_KEY);
	if (!raw) return [];
	try {
		const all: MarginComment[] = JSON.parse(raw);
		return chapterId ? all.filter((c) => c.chapterId === chapterId) : all;
	} catch {
		return [];
	}
}

export function saveComments(comments: MarginComment[]): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments));
}

export function addComment(
	chapterId: string,
	content: string,
	quote?: string,
	highlightId?: string,
	author = 'Author'
): MarginComment {
	const all = loadComments();
	const newC: MarginComment = {
		id: `cm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
		chapterId,
		highlightId,
		quote,
		content,
		author,
		status: 'open',
		createdAt: new Date().toISOString()
	};
	all.push(newC);
	saveComments(all);
	return newC;
}

export function resolveComment(commentId: string): void {
	const all = loadComments().map((c) => (c.id === commentId ? { ...c, status: 'resolved' as const } : c));
	saveComments(all);
}

export function deleteComment(commentId: string): void {
	const all = loadComments().filter((c) => c.id !== commentId);
	saveComments(all);
}
