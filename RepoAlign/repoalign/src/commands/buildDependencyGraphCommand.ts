import * as vscode from 'vscode';
import { loadGitIgnore } from '../utils/gitignore';
import {
	DEFAULT_ALLOWED_EXTENSIONS,
	getTypeScriptFiles,
	scanFilesRecursively
} from '../utils/scanner';
import {
	buildDependencyGraph,
	countIncomingDependencies,
	countOutgoingDependencies
} from '../utils/graph';

export function registerBuildDependencyGraphCommand(outputChannel: vscode.OutputChannel) {
	return vscode.commands.registerCommand('repoalign.buildDependencyGraph', () => {
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

			const outgoingCounts = countOutgoingDependencies(graph.edges);
			const incomingCounts = countIncomingDependencies(graph.edges);

			outputChannel.clear();
			outputChannel.show(true);

			outputChannel.appendLine('=== RepoAlign Dependency Graph ===');
			outputChannel.appendLine(`Workspace path: ${workspacePath}`);
			outputChannel.appendLine(`Total TypeScript nodes: ${graph.nodes.length}`);
			outputChannel.appendLine(`Total dependency edges: ${graph.edges.length}`);
			outputChannel.appendLine('');

			outputChannel.appendLine('Edges:');
			outputChannel.appendLine('------------------------------');

			if (graph.edges.length === 0) {
				outputChannel.appendLine('No resolved local dependency edges found.');
			} else {
				for (const edge of graph.edges) {
					outputChannel.appendLine(`${edge.from}  -->  ${edge.to}   [${edge.importPath}]`);
				}
			}

			outputChannel.appendLine('');
			outputChannel.appendLine('Top outgoing dependencies:');
			outputChannel.appendLine('------------------------------');

			const topOutgoing = [...outgoingCounts.entries()]
				.sort((a, b) => b[1] - a[1])
				.slice(0, 10);

			if (topOutgoing.length === 0) {
				outputChannel.appendLine('No outgoing dependencies found.');
			} else {
				for (const [file, count] of topOutgoing) {
					outputChannel.appendLine(`${file}: ${count}`);
				}
			}

			outputChannel.appendLine('');
			outputChannel.appendLine('Top incoming dependencies:');
			outputChannel.appendLine('------------------------------');

			const topIncoming = [...incomingCounts.entries()]
				.sort((a, b) => b[1] - a[1])
				.slice(0, 10);

			if (topIncoming.length === 0) {
				outputChannel.appendLine('No incoming dependencies found.');
			} else {
				for (const [file, count] of topIncoming) {
					outputChannel.appendLine(`${file}: ${count}`);
				}
			}

			vscode.window.showInformationMessage(
				`RepoAlign built a dependency graph with ${graph.nodes.length} nodes and ${graph.edges.length} edges.`
			);
		} catch (error) {
			outputChannel.appendLine('Dependency graph build failed.');
			outputChannel.appendLine(String(error));
			vscode.window.showErrorMessage('Failed to build dependency graph.');
			console.error(error);
		}
	});
}