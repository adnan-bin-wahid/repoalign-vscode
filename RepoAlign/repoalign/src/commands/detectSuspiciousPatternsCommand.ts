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
	countDependencyPatterns,
	getSuspiciousPatternEdges
} from '../utils/patterns';

export function registerDetectSuspiciousPatternsCommand(outputChannel: vscode.OutputChannel) {
	return vscode.commands.registerCommand('repoalign.detectSuspiciousPatterns', () => {
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
			const suspiciousEdges = getSuspiciousPatternEdges(patternEdges, patternCounts, 1);

			outputChannel.clear();
			outputChannel.show(true);

			outputChannel.appendLine('=== RepoAlign Suspicious Dependency Pattern Detection ===');
			outputChannel.appendLine(`Workspace path: ${workspacePath}`);
			outputChannel.appendLine(`Total TypeScript nodes: ${graph.nodes.length}`);
			outputChannel.appendLine(`Total dependency edges: ${graph.edges.length}`);
			outputChannel.appendLine(`Total suspicious edges: ${suspiciousEdges.length}`);
			outputChannel.appendLine('');

			outputChannel.appendLine('Pattern frequency summary:');
			outputChannel.appendLine('------------------------------');

			const sortedPatterns = [...patternCounts.entries()].sort((a, b) => b[1] - a[1]);

			if (sortedPatterns.length === 0) {
				outputChannel.appendLine('No patterns found.');
			} else {
				for (const [pattern, count] of sortedPatterns) {
					const status = count <= 1 ? 'SUSPICIOUS' : 'NORMAL';
					outputChannel.appendLine(`${pattern}: ${count}  [${status}]`);
				}
			}

			outputChannel.appendLine('');
			outputChannel.appendLine('Suspicious edges:');
			outputChannel.appendLine('------------------------------');

			if (suspiciousEdges.length === 0) {
				outputChannel.appendLine('No suspicious dependency edges found.');
			} else {
				for (const edge of suspiciousEdges) {
					outputChannel.appendLine(
						`${edge.from}  -->  ${edge.to}   [${edge.pattern}]`
					);
				}
			}

			vscode.window.showInformationMessage(
				`RepoAlign found ${suspiciousEdges.length} suspicious dependency edges. See Output panel for details.`
			);
		} catch (error) {
			outputChannel.appendLine('Suspicious pattern detection failed.');
			outputChannel.appendLine(String(error));
			vscode.window.showErrorMessage('Failed to detect suspicious dependency patterns.');
			console.error(error);
		}
	});
}