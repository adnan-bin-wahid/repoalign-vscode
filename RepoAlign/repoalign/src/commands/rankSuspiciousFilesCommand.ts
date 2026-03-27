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
	rankFilesBySuspiciousEdges
} from '../utils/patterns';

export function registerRankSuspiciousFilesCommand(outputChannel: vscode.OutputChannel) {
	return vscode.commands.registerCommand('repoalign.rankSuspiciousFiles', () => {
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

			outputChannel.clear();
			outputChannel.show(true);

			outputChannel.appendLine('=== RepoAlign Suspicious File Ranking ===');
			outputChannel.appendLine(`Workspace path: ${workspacePath}`);
			outputChannel.appendLine(`Total TypeScript nodes: ${graph.nodes.length}`);
			outputChannel.appendLine(`Total dependency edges: ${graph.edges.length}`);
			outputChannel.appendLine(`Files with suspicious edges: ${suspiciousFiles.size}`);
			outputChannel.appendLine('');

			if (suspiciousFiles.size === 0) {
				outputChannel.appendLine('No suspicious files found.');
				vscode.window.showInformationMessage('No suspicious files found.');
				return;
			}

			outputChannel.appendLine('Ranked suspicious files:');
			outputChannel.appendLine('------------------------------');

			let rank = 1;

			for (const [file, edges] of suspiciousFiles.entries()) {
				outputChannel.appendLine(`${rank}. ${file}`);
				outputChannel.appendLine(`   Suspicious edge count: ${edges.length}`);

				for (const edge of edges) {
					outputChannel.appendLine(`   -> ${edge.to}   [${edge.pattern}]`);
				}

				outputChannel.appendLine('');
				rank++;
			}

			vscode.window.showInformationMessage(
				`RepoAlign ranked ${suspiciousFiles.size} suspicious files. See Output panel for details.`
			);
		} catch (error) {
			outputChannel.appendLine('Suspicious file ranking failed.');
			outputChannel.appendLine(String(error));
			vscode.window.showErrorMessage('Failed to rank suspicious files.');
			console.error(error);
		}
	});
}