/**
 * Paginated Book & Sheet Model with Smart Enter Transitions
 */

export interface BookPage {
	pageNumber: number;
	headerLeft: string;
	headerRight: string;
	content: string[];
	footerText: string;
	isChapterStart: boolean;
	chapterTitle?: string;
	chapterNumber?: number;
}

export interface SmartEnterResult {
	updatedText: string;
	actionType: 'paragraph' | 'scene_break' | 'chapter_break';
	newCursorPos: number;
}

/**
 * Handle smart Enter keypress logic:
 * - 1 Enter (single): Paragraph break with first-line indent
 * - 2 Enters (double): Scene break with ornamental glyph
 * - 3 Enters (triple): Chapter break marker
 */
export function handleSmartEnter(
	fullText: string,
	cursorPos: number,
	ornamentGlyph = '✦ ✦ ✦'
): SmartEnterResult {
	const before = fullText.slice(0, cursorPos);
	const after = fullText.slice(cursorPos);

	// Check how many trailing newlines directly precede the cursor
	if (before.endsWith('\n\n')) {
		// Triple Enter detected -> Convert to Chapter Break
		const cleanBefore = before.slice(0, -2);
		const chapterMarker = `\n\n# Chapter New\n\n`;
		const updatedText = cleanBefore + chapterMarker + after;
		return {
			updatedText,
			actionType: 'chapter_break',
			newCursorPos: cleanBefore.length + chapterMarker.length
		};
	} else if (before.endsWith('\n')) {
		// Double Enter detected -> Convert to Scene Break
		const cleanBefore = before.slice(0, -1);
		const sceneMarker = `\n\n${ornamentGlyph}\n\n`;
		const updatedText = cleanBefore + sceneMarker + after;
		return {
			updatedText,
			actionType: 'scene_break',
			newCursorPos: cleanBefore.length + sceneMarker.length
		};
	} else {
		// Single Enter -> Standard paragraph break
		const updatedText = before + '\n' + after;
		return {
			updatedText,
			actionType: 'paragraph',
			newCursorPos: cursorPos + 1
		};
	}
}

/**
 * Split a continuous chapter text into structured pages based on approximate lines/words per page
 */
export function paginateManuscriptText(
	novelTitle: string,
	chapterTitle: string,
	chapterNumber: number,
	rawText: string,
	wordsPerPage = 250
): BookPage[] {
	if (!rawText.trim()) {
		return [
			{
				pageNumber: 1,
				headerLeft: novelTitle || 'Novel',
				headerRight: `Chapter ${chapterNumber}: ${chapterTitle}`,
				content: [''],
				footerText: '1',
				isChapterStart: true,
				chapterTitle,
				chapterNumber
			}
		];
	}

	const paragraphs = rawText.split('\n');
	const pages: BookPage[] = [];
	let currentPageParagraphs: string[] = [];
	let currentWordCount = 0;
	let pageCounter = 1;

	for (const p of paragraphs) {
		const pWords = p.trim().split(/\s+/).filter(Boolean).length;

		if (currentWordCount + pWords > wordsPerPage && currentPageParagraphs.length > 0) {
			pages.push({
				pageNumber: pageCounter,
				headerLeft: pageCounter % 2 === 0 ? novelTitle : `Chapter ${chapterNumber}`,
				headerRight: pageCounter % 2 === 0 ? `Chapter ${chapterNumber}` : chapterTitle,
				content: [...currentPageParagraphs],
				footerText: `${pageCounter}`,
				isChapterStart: pageCounter === 1,
				chapterTitle: pageCounter === 1 ? chapterTitle : undefined,
				chapterNumber: pageCounter === 1 ? chapterNumber : undefined
			});
			pageCounter++;
			currentPageParagraphs = [];
			currentWordCount = 0;
		}

		currentPageParagraphs.push(p);
		currentWordCount += pWords;
	}

	if (currentPageParagraphs.length > 0) {
		pages.push({
			pageNumber: pageCounter,
			headerLeft: pageCounter % 2 === 0 ? novelTitle : `Chapter ${chapterNumber}`,
			headerRight: pageCounter % 2 === 0 ? `Chapter ${chapterNumber}` : chapterTitle,
			content: [...currentPageParagraphs],
			footerText: `${pageCounter}`,
			isChapterStart: pageCounter === 1,
			chapterTitle: pageCounter === 1 ? chapterTitle : undefined,
			chapterNumber: pageCounter === 1 ? chapterNumber : undefined
		});
	}

	return pages;
}
