import * as fs from 'fs';

export function extractImportsFromTypeScriptFile(filePath: string): string[] {
	try {
		const content = fs.readFileSync(filePath, 'utf-8');
		const importRegex = /import\s+.*?\s+from\s+['"](.*?)['"]/g;
		const imports: string[] = [];

		let match: RegExpExecArray | null;

		while ((match = importRegex.exec(content)) !== null) {
			imports.push(match[1]);
		}

		return imports;
	} catch (error) {
		console.error(`Failed to read imports from file: ${filePath}`, error);
		return [];
	}
}

export function isLocalImport(importPath: string): boolean {
	return importPath.startsWith('./') || importPath.startsWith('../');
}