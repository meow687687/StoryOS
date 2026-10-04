/**
 * Native Local File System Access API Bridge & Project Sync
 * Allows authors to directly bind a local folder on their computer
 * to Story OS, reading and writing standard .md / .txt files in real-time.
 */

export interface LocalFileEntry {
	name: string;
	path: string;
	kind: 'file' | 'directory';
	handle?: FileSystemFileHandle | FileSystemDirectoryHandle;
	size?: number;
	lastModified?: number;
}

export interface LocalProjectState {
	isConnected: boolean;
	dirName: string;
	dirHandle: FileSystemDirectoryHandle | null;
	files: LocalFileEntry[];
	lastSyncedAt: string | null;
	syncStatus: 'idle' | 'syncing' | 'error';
	errorMessage?: string;
}

const STORAGE_KEY = 'story_os_local_dir_name';

/**
 * Check if the browser supports the native File System Access API
 */
export function isFileSystemAccessSupported(): boolean {
	return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Request user to pick a local folder on their filesystem
 */
export async function pickLocalDirectory(): Promise<{
	dirHandle: FileSystemDirectoryHandle;
	dirName: string;
	files: LocalFileEntry[];
}> {
	if (!isFileSystemAccessSupported()) {
		throw new Error('File System Access API is not supported in this browser. Please use Chrome, Edge, or Brave, or use manual file export.');
	}

	// @ts-expect-error - showDirectoryPicker is standard in modern Chromium
	const dirHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
		mode: 'readwrite'
	});

	const dirName = dirHandle.name;
	const files = await listDirectoryFiles(dirHandle);

	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, dirName);
	}

	return {
		dirHandle,
		dirName,
		files
	};
}

/**
 * Recursively or flatly list all text/markdown files within the directory
 */
export async function listDirectoryFiles(dirHandle: FileSystemDirectoryHandle): Promise<LocalFileEntry[]> {
	const entries: LocalFileEntry[] = [];

	for await (const [name, handle] of (dirHandle as any).entries()) {
		if (handle.kind === 'file') {
			if (name.endsWith('.md') || name.endsWith('.txt') || name.endsWith('.json')) {
				try {
					const file = await (handle as FileSystemFileHandle).getFile();
					entries.push({
						name,
						path: name,
						kind: 'file',
						handle: handle as FileSystemFileHandle,
						size: file.size,
						lastModified: file.lastModified
					});
				} catch {
					entries.push({
						name,
						path: name,
						kind: 'file',
						handle: handle as FileSystemFileHandle
					});
				}
			}
		}
	}

	// Sort files alphabetically
	entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
	return entries;
}

/**
 * Read the string content of a file handle
 */
export async function readLocalFile(fileHandle: FileSystemFileHandle): Promise<string> {
	const file = await fileHandle.getFile();
	return await file.text();
}

/**
 * Write/Save text content directly to a local file handle
 */
export async function writeLocalFile(
	fileHandle: FileSystemFileHandle,
	content: string
): Promise<void> {
	const writable = await (fileHandle as any).createWritable();
	await writable.write(content);
	await writable.close();
}

/**
 * Create a new file inside the directory and return its handle
 */
export async function createLocalFile(
	dirHandle: FileSystemDirectoryHandle,
	fileName: string,
	initialContent = ''
): Promise<FileSystemFileHandle> {
	const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
	if (initialContent) {
		await writeLocalFile(fileHandle, initialContent);
	}
	return fileHandle;
}

/**
 * Save an entire chapter directly to disk
 */
export async function saveChapterToDisk(
	dirHandle: FileSystemDirectoryHandle | null,
	chapterTitle: string,
	content: string
): Promise<string> {
	if (!dirHandle) {
		throw new Error('No local folder is currently connected.');
	}

	// Clean filename
	const safeName = chapterTitle.toLowerCase().replace(/[^a-z0-9_-]+/g, '_').slice(0, 50) || 'chapter';
	const fileName = `${safeName}.md`;

	const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
	await writeLocalFile(fileHandle, content);
	return fileName;
}
