import { DependencyPatternEdge } from '../types/graphTypes';

export function getPatternEdgesForFile(
	filePath: string,
	patternEdges: DependencyPatternEdge[]
): DependencyPatternEdge[] {
	return patternEdges.filter(edge => edge.from === filePath);
}

export function getUniquePatternsForFile(
	filePath: string,
	patternEdges: DependencyPatternEdge[]
): string[] {
	const fileEdges = getPatternEdgesForFile(filePath, patternEdges);
	const uniquePatterns = new Set(fileEdges.map(edge => edge.pattern));

	return [...uniquePatterns];
}