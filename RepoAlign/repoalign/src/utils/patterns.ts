import {
	DependencyEdge,
	DependencyPatternEdge,
	SuspiciousFileExplanation
} from '../types/graphTypes';
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

export function getSuspiciousPatternEdges(
	patternEdges: DependencyPatternEdge[],
	patternCounts: Map<string, number>,
	threshold: number = 1
): DependencyPatternEdge[] {
	return patternEdges.filter((edge) => {
		const count = patternCounts.get(edge.pattern) || 0;
		return count <= threshold;
	});
}

export function rankFilesBySuspiciousEdges(
	patternEdges: DependencyPatternEdge[],
	patternCounts: Map<string, number>,
	threshold: number = 1
): Map<string, DependencyPatternEdge[]> {
	const suspiciousByFile = new Map<string, DependencyPatternEdge[]>();

	for (const edge of patternEdges) {
		const count = patternCounts.get(edge.pattern) || 0;

		if (count > threshold) {
			continue;
		}

		if (!suspiciousByFile.has(edge.from)) {
			suspiciousByFile.set(edge.from, []);
		}

		suspiciousByFile.get(edge.from)?.push(edge);
	}

	return new Map(
		[...suspiciousByFile.entries()].sort((a, b) => b[1].length - a[1].length)
	);
}

export function getConfidenceLevel(edgeCount: number): 'Low' | 'Medium' | 'High' {
	if (edgeCount >= 3) {
		return 'High';
	}

	if (edgeCount === 2) {
		return 'Medium';
	}

	return 'Low';
}

export function explainSuspiciousFiles(
	suspiciousFiles: Map<string, DependencyPatternEdge[]>,
	patternCounts: Map<string, number>
): SuspiciousFileExplanation[] {
	const explanations: SuspiciousFileExplanation[] = [];

	for (const [file, edges] of suspiciousFiles.entries()) {
		const reasons: string[] = [];

		for (const edge of edges) {
			const patternCount = patternCounts.get(edge.pattern) || 0;

			reasons.push(
				`Uses rare dependency pattern: ${edge.pattern} (appears ${patternCount} time${patternCount === 1 ? '' : 's'} in repository)`
			);
		}

		explanations.push({
			file,
			suspiciousEdgeCount: edges.length,
			confidence: getConfidenceLevel(edges.length),
			reasons,
			edges
		});
	}

	return explanations.sort((a, b) => b.suspiciousEdgeCount - a.suspiciousEdgeCount);
}