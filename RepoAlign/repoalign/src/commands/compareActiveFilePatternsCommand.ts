import * as vscode from 'vscode';
import * as path from 'path';
import { findSimilarFiles, getIndexStatus, rebuildProfileIndex } from '../utils/apiClient';
import { loadGitIgnore } from '../utils/gitignore';
import {
	DEFAULT_ALLOWED_EXTENSIONS,
	getTypeScriptFiles,
	scanFilesRecursively
} from '../utils/scanner';
import { buildDependencyGraph } from '../utils/graph';
import { buildDependencyPatternEdges } from '../utils/patterns';
import { getUniquePatternsForFile } from '../utils/filePatternSummary';

function getSharedItems(itemsA: string[], itemsB: string[]): string[] {
	return itemsA.filter(item => itemsB.includes(item));
}

function getOnlyItems(itemsA: string[], itemsB: string[]): string[] {
	return itemsA.filter(item => !itemsB.includes(item));
}

function getPatternComparisonSummary(
	sharedPatterns: string[],
	activeOnlyPatterns: string[],
	similarOnlyPatterns: string[],
	roleMatch: boolean
): string {
	if (
		roleMatch &&
		activeOnlyPatterns.length === 0 &&
		similarOnlyPatterns.length === 0 &&
		sharedPatterns.length > 0
	) {
		return 'Strong alignment: semantic role and dependency patterns match closely.';
	}

	if (
		roleMatch &&
		sharedPatterns.length > 0 &&
		activeOnlyPatterns.length === 0
	) {
		return 'Good alignment: semantic role matches and dependency behavior is similar.';
	}

	if (activeOnlyPatterns.length > 0) {
		return 'Potential inconsistency: active file has extra dependency pattern(s) not seen in this similar file.';
	}

	if (similarOnlyPatterns.length > 0) {
		return 'Minor variation: similar file has extra dependency pattern(s) not used by the active file.';
	}

	return 'Weak structural alignment: semantic similarity exists, but graph evidence is limited.';
}

export function registerCompareActiveFilePatternsCommand(outputChannel: vscode.OutputChannel) {
	return vscode.commands.registerCommand('repoalign.compareActiveFilePatterns', async () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;

		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showWarningMessage('No workspace folder is currently open.');
			return;
		}

		const activeEditor = vscode.window.activeTextEditor;

		if (!activeEditor) {
			vscode.window.showWarningMessage('No active file is open in the editor.');
			return;
		}

		const workspacePath = workspaceFolders[0].uri.fsPath;
		const activeFilePath = path.resolve(activeEditor.document.uri.fsPath);
		const normalizedWorkspacePath = path.resolve(workspacePath);

		if (!activeFilePath.startsWith(normalizedWorkspacePath)) {
			vscode.window.showErrorMessage('The active file is not inside the current workspace.');
			return;
		}

		if (!activeFilePath.toLowerCase().endsWith('.ts')) {
			vscode.window.showErrorMessage('The active file is not a TypeScript file.');
			return;
		}

		try {
			const ig = loadGitIgnore(workspacePath);
			const allFiles = scanFilesRecursively(
				workspacePath,
				workspacePath,
				ig,
				DEFAULT_ALLOWED_EXTENSIONS
			);

			const typeScriptFiles = getTypeScriptFiles(allFiles);

			if (!typeScriptFiles.includes(activeFilePath)) {
				vscode.window.showErrorMessage(
					'The active file is not part of the scanned TypeScript candidate set.'
				);
				return;
			}

			const dependencyGraph = buildDependencyGraph(workspacePath, typeScriptFiles);
			const patternEdges = buildDependencyPatternEdges(dependencyGraph.edges);

			const activeRelativePath = path.relative(workspacePath, activeFilePath).replace(/\\/g, '/');
			const activePatterns = getUniquePatternsForFile(activeRelativePath, patternEdges);

			outputChannel.clear();
			outputChannel.show(true);

			outputChannel.appendLine('=== RepoAlign Active File Semantic + Pattern Comparison ===');
			outputChannel.appendLine(`Workspace path: ${workspacePath}`);
			outputChannel.appendLine(`Active file: ${activeRelativePath}`);
			outputChannel.appendLine('Comparison mode: indexed semantic retrieval + graph pattern verification');
			outputChannel.appendLine('');

			const indexStatus = await getIndexStatus();

			outputChannel.appendLine('Semantic index status:');
			outputChannel.appendLine('------------------------------');
			outputChannel.appendLine(`Indexed workspace: ${indexStatus.workspace_path}`);
			outputChannel.appendLine(`Indexed at: ${indexStatus.indexed_at}`);
			outputChannel.appendLine(`Indexed files: ${indexStatus.indexed_total_files}`);
			outputChannel.appendLine(`Current files: ${indexStatus.current_total_files}`);
			outputChannel.appendLine(`Is stale: ${indexStatus.is_stale}`);
			outputChannel.appendLine('');

			if (indexStatus.is_stale) {
				outputChannel.appendLine(
					'Warning: semantic profile index is stale. Comparison may use outdated repository semantics.'
				);
				outputChannel.appendLine('');

				const rebuildChoice = await vscode.window.showWarningMessage(
					'RepoAlign index is stale. Rebuild the semantic index now before comparison?',
					'Yes, rebuild now',
					'No, continue anyway'
				);

				if (rebuildChoice === 'Yes, rebuild now') {
					outputChannel.appendLine('Rebuilding semantic index before comparison...');
					outputChannel.appendLine('');

					const rebuildResult = await rebuildProfileIndex(workspacePath);

					outputChannel.appendLine('Semantic index rebuild completed.');
					outputChannel.appendLine(`Indexed workspace: ${rebuildResult.workspace_path}`);
					outputChannel.appendLine(`Total indexed files: ${rebuildResult.total_files}`);
					outputChannel.appendLine(`Output path: ${rebuildResult.output_path}`);
					outputChannel.appendLine('');

					vscode.window.showInformationMessage(
						`RepoAlign rebuilt the semantic index for ${rebuildResult.total_files} files.`
					);
				} else {
					outputChannel.appendLine('Continuing comparison with stale semantic index.');
					outputChannel.appendLine('');
				}
			}

			outputChannel.appendLine('Active file dependency patterns:');
			outputChannel.appendLine('------------------------------');

			if (activePatterns.length === 0) {
				outputChannel.appendLine('No dependency patterns found for active file.');
			} else {
				for (const pattern of activePatterns) {
					outputChannel.appendLine(`- ${pattern}`);
				}
			}

			outputChannel.appendLine('');
			outputChannel.appendLine('Retrieved semantic peers and graph comparison:');
			outputChannel.appendLine('------------------------------');

			const similarityResult = await findSimilarFiles(activeFilePath, typeScriptFiles, 3);
			const similarResults = similarityResult.results ?? [];

			if (similarResults.length === 0) {
				outputChannel.appendLine('No similar files found.');
				vscode.window.showInformationMessage('No similar files found.');
				return;
			}

			const activeRole = activeRelativePath.toLowerCase().endsWith('.component.ts')
				? 'component'
				: activeRelativePath.toLowerCase().endsWith('.service.ts')
					? 'service'
					: 'unknown';

			let index = 1;

			for (const item of similarResults) {
				const similarFilePath = item.file_path as string;
				const similarRelativePath = path.relative(workspacePath, similarFilePath).replace(/\\/g, '/');
				const similarPatterns = getUniquePatternsForFile(similarRelativePath, patternEdges);

				const similarRole = item.role ?? 'unknown';
				const roleMatch = activeRole === similarRole;

				const sharedPatterns = getSharedItems(activePatterns, similarPatterns);
				const activeOnlyPatterns = getOnlyItems(activePatterns, similarPatterns);
				const similarOnlyPatterns = getOnlyItems(similarPatterns, activePatterns);

				const summary = getPatternComparisonSummary(
					sharedPatterns,
					activeOnlyPatterns,
					similarOnlyPatterns,
					roleMatch
				);

				outputChannel.appendLine(`${index}. ${similarRelativePath}`);
				outputChannel.appendLine(`   Similarity score: ${item.similarity}`);
				outputChannel.appendLine(`   Retrieved role: ${similarRole}`);
				outputChannel.appendLine(`   Role match: ${roleMatch ? 'Yes' : 'No'}`);
				outputChannel.appendLine(
					`   Retrieved class names: ${
						item.class_names && item.class_names.length > 0
							? item.class_names.join(', ')
							: 'None'
					}`
				);
				outputChannel.appendLine(
					`   Retrieved constructor injections: ${
						item.constructor_injections && item.constructor_injections.length > 0
							? item.constructor_injections.join(', ')
							: 'None'
					}`
				);
				outputChannel.appendLine(`   Summary: ${summary}`);

				outputChannel.appendLine('   Shared dependency patterns:');
				if (sharedPatterns.length === 0) {
					outputChannel.appendLine('   - None');
				} else {
					for (const pattern of sharedPatterns) {
						outputChannel.appendLine(`   - ${pattern}`);
					}
				}

				outputChannel.appendLine('   Active-only dependency patterns:');
				if (activeOnlyPatterns.length === 0) {
					outputChannel.appendLine('   - None');
				} else {
					for (const pattern of activeOnlyPatterns) {
						outputChannel.appendLine(`   - ${pattern}`);
					}
				}

				outputChannel.appendLine('   Similar-file-only dependency patterns:');
				if (similarOnlyPatterns.length === 0) {
					outputChannel.appendLine('   - None');
				} else {
					for (const pattern of similarOnlyPatterns) {
						outputChannel.appendLine(`   - ${pattern}`);
					}
				}

				outputChannel.appendLine('');
				index++;
			}

			vscode.window.showInformationMessage(
				'RepoAlign completed semantic peer retrieval and graph-based comparison. See Output panel for details.'
			);
		} catch (error: any) {
			outputChannel.appendLine('Active file semantic + pattern comparison failed.');
			outputChannel.appendLine(String(error));

			vscode.window.showErrorMessage('Failed to compare active file against semantic peers.');
		}
	});
}