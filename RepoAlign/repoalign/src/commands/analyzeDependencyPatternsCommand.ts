import * as vscode from 'vscode';
import { loadGitIgnore } from '../utils/gitignore';
import {
	DEFAULT_ALLOWED_EXTENSIONS,
	getTypeScriptFiles,
	scanFilesRecursively
} from '../utils/scanner';
import { buildDependencyGraph } from '../utils/graph';
import {
	buildDependencyPatternEdges,
	countDependencyPatterns
} from '../utils/patterns';

export function registerAnalyzeDependencyPatternsCommand(outputChannel: vscode.OutputChannel) {
	return vscode.commands.registerCommand('repoalign.analyzeDependencyPatterns', () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;

		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showWarningMessage('No workspace folder is currently open.');
			return;
		}

		const workspacePath = workspaceFolders[0].uri.fsPath;

		try {
			const ig = loadGitIgnore(workspacePath);
			const allFiles = scanFilesRecursively(
				workspacePath,
				workspacePath,
				ig,
				DEFAULT_ALLOWED_EXTENSIONS
			);

			const typeScriptFiles = getTypeScriptFiles(allFiles);
			const graph = buildDependencyGraph(workspacePath, typeScriptFiles);
			const patternEdges = buildDependencyPatternEdges(graph.edges);
			const patternCounts = countDependencyPatterns(patternEdges);

			outputChannel.clear();
			outputChannel.show(true);

			outputChannel.appendLine('=== RepoAlign Dependency Pattern Analysis ===');
			outputChannel.appendLine(`Workspace path: ${workspacePath}`);
			outputChannel.appendLine(`Total TypeScript nodes: ${graph.nodes.length}`);
			outputChannel.appendLine(`Total dependency edges: ${graph.edges.length}`);
			outputChannel.appendLine(`Total pattern edges: ${patternEdges.length}`);
			outputChannel.appendLine('');

			outputChannel.appendLine('Pattern summary:');
			outputChannel.appendLine('------------------------------');

			const sortedPatterns = [...patternCounts.entries()].sort((a, b) => b[1] - a[1]);

			if (sortedPatterns.length === 0) {
				outputChannel.appendLine('No dependency patterns found.');
			} else {
				for (const [pattern, count] of sortedPatterns) {
					outputChannel.appendLine(`${pattern}: ${count}`);
				}
			}

			outputChannel.appendLine('');
			outputChannel.appendLine('Detailed pattern edges:');
			outputChannel.appendLine('------------------------------');

			if (patternEdges.length === 0) {
				outputChannel.appendLine('No detailed dependency edges found.');
			} else {
				for (const edge of patternEdges) {
					outputChannel.appendLine(
						`${edge.from}  -->  ${edge.to}   [${edge.pattern}]`
					);
				}
			}

			vscode.window.showInformationMessage(
				`RepoAlign analyzed ${patternEdges.length} dependency patterns. See Output panel for details.`
			);
		} catch (error) {
			outputChannel.appendLine('Dependency pattern analysis failed.');
			outputChannel.appendLine(String(error));
			vscode.window.showErrorMessage('Failed to analyze dependency patterns.');
			console.error(error);
		}
	});
}