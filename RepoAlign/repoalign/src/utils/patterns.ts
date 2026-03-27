import { DependencyEdge, DependencyPatternEdge } from '../types/graphTypes';
import { getFileCategory } from './classifier';

export function buildDependencyPatternEdges(edges: DependencyEdge[]): DependencyPatternEdge[] {
	return edges.map((edge) => {
		const fromCategory = getFileCategory(edge.from);
		const toCategory = getFileCategory(edge.to);
		const pattern = `${fromCategory} -> ${toCategory}`;

		return {
			from: edge.from,
			to: edge.to,
			importPath: edge.importPath,
			fromCategory,
			toCategory,
			pattern
		};
	});
}

export function countDependencyPatterns(
	patternEdges: DependencyPatternEdge[]
): Map<string, number> {
	const counts = new Map<string, number>();

	for (const edge of patternEdges) {
		counts.set(edge.pattern, (counts.get(edge.pattern) || 0) + 1);
	}

	return counts;
}