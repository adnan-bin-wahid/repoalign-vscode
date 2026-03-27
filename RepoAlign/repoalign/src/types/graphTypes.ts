export interface DependencyEdge {
	from: string;
	to: string;
	importPath: string;
}

export interface DependencyGraph {
	nodes: string[];
	edges: DependencyEdge[];
}

export interface DependencyPatternEdge {
	from: string;
	to: string;
	importPath: string;
	fromCategory: string;
	toCategory: string;
	pattern: string;
}