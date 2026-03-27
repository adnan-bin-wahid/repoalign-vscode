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
	rankFilesBySuspiciousEdges,
	explainSuspiciousFiles
} from '../utils/patterns';

export function registerExplainSuspiciousFilesCommand(outputChannel: vscode.OutputChannel) {
	return vscode.commands.registerCommand('repoalign.explainSuspiciousFiles', () => {
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
			const suspiciousFiles = rankFilesBySuspiciousEdges(patternEdges, patternCounts, 1);
			const explanations = explainSuspiciousFiles(suspiciousFiles, patternCounts);

			outputChannel.clear();
			outputChannel.show(true);

			outputChannel.appendLine('=== RepoAlign Suspicious File Explanations ===');
			outputChannel.appendLine(`Workspace path: ${workspacePath}`);
			outputChannel.appendLine(`Total TypeScript nodes: ${graph.nodes.length}`);
			outputChannel.appendLine(`Total dependency edges: ${graph.edges.length}`);
			outputChannel.appendLine(`Explained suspicious files: ${explanations.length}`);
			outputChannel.appendLine('');

			if (explanations.length === 0) {
				outputChannel.appendLine('No suspicious files found.');
				vscode.window.showInformationMessage('No suspicious files found.');
				return;
			}

			let index = 1;

			for (const explanation of explanations) {
				outputChannel.appendLine(`${index}. ${explanation.file}`);
				outputChannel.appendLine(`   Suspicious score: ${explanation.suspiciousEdgeCount}`);
				outputChannel.appendLine(`   Confidence: ${explanation.confidence}`);
				outputChannel.appendLine('   Reasons:');

				for (const reason of explanation.reasons) {
					outputChannel.appendLine(`   - ${reason}`);
				}

				outputChannel.appendLine('   Suspicious edges:');

				for (const edge of explanation.edges) {
					outputChannel.appendLine(`   -> ${edge.to}   [${edge.pattern}]`);
				}

				outputChannel.appendLine('');
				index++;
			}

			vscode.window.showInformationMessage(
				`RepoAlign explained ${explanations.length} suspicious files. See Output panel for details.`
			);
		} catch (error) {
			outputChannel.appendLine('Suspicious file explanation failed.');
			outputChannel.appendLine(String(error));
			vscode.window.showErrorMessage('Failed to explain suspicious files.');
			console.error(error);
		}
	});
}