import {
	EDITOR_SYSTEM,
	GHOSTWRITER_SYSTEM,
	INTERROGATOR_SYSTEM,
	LIBRARIAN_SYSTEM,
	editorUser,
	ghostwriterUser,
	interrogatorUser,
	librarianUser
} from './prompts';
import { describe, expect, it } from 'vitest';

describe('system prompts', () => {
	it('librarian enforces strict entry format', () => {
		expect.assertions(3);
		expect(LIBRARIAN_SYSTEM).toContain('# <Entry name>');
		expect(LIBRARIAN_SYSTEM).toContain('cannot / never / only');
		expect(librarianUser('Kael, a prince')).toContain('Kael');
	});

	it('editor demands quotes and stays terse', () => {
		expect.assertions(3);
		expect(EDITOR_SYSTEM).toContain('quote');
		expect(EDITOR_SYSTEM).toContain('No issues found');
		expect(editorUser('bible', 'chapter')).toContain('WORLD BIBLE');
	});

	it('interrogator acts as Socratic developmental editor without ghostwriting', () => {
		expect.assertions(4);
		expect(INTERROGATOR_SYSTEM).toContain('The author owns the story');
		expect(INTERROGATOR_SYSTEM).toContain('NEVER write prose');
		expect(INTERROGATOR_SYSTEM).toContain('Character Agency & Motivation');
		expect(interrogatorUser('bible', 'decisions', 'chapter draft', 'reveal secret')).toContain(
			'CHAPTER GOAL'
		);
	});

	it('ghostwriter constrains length and lore', () => {
		expect.assertions(3);
		expect(GHOSTWRITER_SYSTEM).toContain('120-180');
		expect(GHOSTWRITER_SYSTEM).toContain('no new lore');
		expect(ghostwriterUser('bible', 'a beat')).toContain('Beat to expand');
	});
});
