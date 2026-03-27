import * as path from 'path';
import { DependencyEdge, DependencyGraph } from '../types/graphTypes';
import { extractImportsFromTypeScriptFile, isLocalImport } from './imports';
import { resolveLocalImport } from './resolver';

export function buildDependencyGraph(
	workspacePath: string,
	typeScriptFiles: string[]
): DependencyGraph {
	const nodes = typeScriptFiles.map(file =>
		path.relative(workspacePath, file).replace(/\\/g, '/')
	);

	const edges: DependencyEdge[] = [];

	for (const sourceFile of typeScriptFiles) {
		const imports = extractImportsFromTypeScriptFile(sourceFile);
		const localImports = imports.filter(isLocalImport);

		for (const importPath of localImports) {
			const resolvedFile = resolveLocalImport(sourceFile, importPath);

			if (!resolvedFile) {
				continue;
			}

			const from = path.relative(workspacePath, sourceFile).replace(/\\/g, '/');
			const to = path.relative(workspacePath, resolvedFile).replace(/\\/g, '/');

			edges.push({
				from,
				to,
				importPath
			});
		}
	}

	return {
		nodes,
		edges
	};
}

export function countOutgoingDependencies(edges: DependencyEdge[]): Map<string, number> {
	const counts = new Map<string, number>();

	for (const edge of edges) {
		counts.set(edge.from, (counts.get(edge.from) || 0) + 1);
	}

	return counts;
}

export function countIncomingDependencies(edges: DependencyEdge[]): Map<string, number> {
	const counts = new Map<string, number>();

	for (const edge of edges) {
		counts.set(edge.to, (counts.get(edge.to) || 0) + 1);
	}

	return counts;
}