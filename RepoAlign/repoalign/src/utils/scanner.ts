import * as fs from 'fs';
import * as path from 'path';
import ignore from 'ignore';

export function scanFilesRecursively(
	folderPath: string,
	basePath: string,
	ig: ReturnType<typeof ignore>,
	allowedExtensions: Set<string>
): string[] {
	let results: string[] = [];

	const items = fs.readdirSync(folderPath);

	for (const item of items) {
		const fullPath = path.join(folderPath, item);
		const relativePath = path.relative(basePath, fullPath).replace(/\\/g, '/');

		if (ig.ignores(relativePath)) {
			continue;
		}

		const stats = fs.statSync(fullPath);

		if (stats.isDirectory()) {
			const nestedFiles = scanFilesRecursively(fullPath, basePath, ig, allowedExtensions);
			results = results.concat(nestedFiles);
		} else {
			const extension = path.extname(item).toLowerCase();

			if (allowedExtensions.has(extension)) {
				results.push(fullPath);
			}
		}
	}

	return results;
}

export function getRelativePaths(basePath: string, files: string[]): string[] {
	return files.map(file => path.relative(basePath, file).replace(/\\/g, '/'));
}

export function getTypeScriptFiles(allFiles: string[]): string[] {
	return allFiles.filter(file => file.toLowerCase().endsWith('.ts'));
}

export const DEFAULT_ALLOWED_EXTENSIONS = new Set([
	'.ts',
	'.js',
	'.json',
	'.md',
	'.html',
	'.css',
	'.scss'
]);