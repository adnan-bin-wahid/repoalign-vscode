import * as path from 'path';
import { FileCategory } from '../types/repoTypes';

export function getFileCategory(relativePath: string): FileCategory {
	const normalizedPath = relativePath.replace(/\\/g, '/').toLowerCase();
	const fileName = path.basename(normalizedPath);

	if (fileName.endsWith('.component.ts')) return 'Components';
	if (fileName.endsWith('.service.ts')) return 'Services';
	if (fileName.endsWith('.model.ts')) return 'Models';
	if (fileName.endsWith('.interceptor.ts')) return 'Interceptors';
	if (fileName.endsWith('.guard.ts')) return 'Guards';
	if (fileName.endsWith('.module.ts')) return 'Modules';
	if (fileName.endsWith('.routes.ts') || fileName.includes('routing.module.ts')) return 'Routing';
	if (fileName.endsWith('.spec.ts') || fileName.endsWith('.test.ts')) return 'Tests';

	if (
		fileName === 'angular.json' ||
		fileName === 'package.json' ||
		fileName === 'package-lock.json' ||
		fileName === 'tsconfig.json' ||
		fileName.startsWith('tsconfig.') ||
		fileName === 'main.ts' ||
		fileName.includes('config') ||
		fileName === 'proxy.conf.json'
	) {
		return 'Config';
	}

	if (fileName.endsWith('.html')) return 'Templates';
	if (fileName.endsWith('.css') || fileName.endsWith('.scss')) return 'Styles';
	if (fileName.endsWith('.ts')) return 'TypeScript Files';
	if (fileName.endsWith('.js')) return 'JavaScript Files';
	if (fileName.endsWith('.json')) return 'JSON Files';
	if (fileName.endsWith('.md')) return 'Documentation';

	return 'Other';
}

export function classifyFiles(relativePaths: string[]): Map<FileCategory, string[]> {
	const categories = new Map<FileCategory, string[]>();

	for (const relativePath of relativePaths) {
		const category = getFileCategory(relativePath);

		if (!categories.has(category)) {
			categories.set(category, []);
		}

		categories.get(category)?.push(relativePath);
	}

	return categories;
}