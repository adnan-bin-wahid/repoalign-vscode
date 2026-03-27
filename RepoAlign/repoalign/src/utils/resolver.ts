import * as fs from 'fs';
import * as path from 'path';

function fileExists(filePath: string): boolean {
	return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function tryResolveAsFile(basePath: string): string | null {
	const possibleFiles = [
		basePath,
		`${basePath}.ts`,
		`${basePath}.tsx`,
		`${basePath}.js`,
		`${basePath}.jsx`
	];

	for (const filePath of possibleFiles) {
		if (fileExists(filePath)) {
			return filePath;
		}
	}

	return null;
}

function tryResolveAsIndexFile(folderPath: string): string | null {
	const possibleIndexFiles = [
		path.join(folderPath, 'index.ts'),
		path.join(folderPath, 'index.tsx'),
		path.join(folderPath, 'index.js'),
		path.join(folderPath, 'index.jsx')
	];

	for (const filePath of possibleIndexFiles) {
		if (fileExists(filePath)) {
			return filePath;
		}
	}

	return null;
}

export function resolveLocalImport(fromFilePath: string, importPath: string): string | null {
	const currentFileDirectory = path.dirname(fromFilePath);
	const absoluteImportBasePath = path.resolve(currentFileDirectory, importPath);

	const resolvedFile = tryResolveAsFile(absoluteImportBasePath);
	if (resolvedFile) {
		return resolvedFile;
	}

	const resolvedIndexFile = tryResolveAsIndexFile(absoluteImportBasePath);
	if (resolvedIndexFile) {
		return resolvedIndexFile;
	}

	return null;
}