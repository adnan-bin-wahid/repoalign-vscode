import * as vscode from 'vscode';
import * as path from 'path';
import { getStagedFiles } from '../utils/git';
import { findSimilarFiles, getIndexStatus, rebuildProfileIndex } from '../utils/apiClient';
import { loadGitIgnore } from '../utils/gitignore';
import {
	DEFAULT_ALLOWED_EXTENSIONS,
	getTypeScriptFiles,
	scanFilesRecursively
} from '../utils/scanner';

export function registerAnalyzeStagedFilesCommand(outputChannel: vscode.OutputChannel) {
	return vscode.commands.registerCommand('repoalign.analyzeStagedFiles', async () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;

		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showWarningMessage('No workspace folder is currently open.');
			return;
		}

		const workspacePath = workspaceFolders[0].uri.fsPath;

		try {
			outputChannel.clear();
			outputChannel.show(true);

			outputChannel.appendLine('=== RepoAlign Staged File Analysis ===');
			outputChannel.appendLine(`Workspace path: ${workspacePath}`);
			outputChannel.appendLine('');

			const stagedRelativePaths = await getStagedFiles(workspacePath);

			if (stagedRelativePaths.length === 0) {
				outputChannel.appendLine('No staged files found.');
				vscode.window.showInformationMessage('No staged files found.');
				return;
			}

			const stagedTypeScriptFiles = stagedRelativePaths
				.filter((file: string) => file.toLowerCase().endsWith('.ts'))
				.map((file: string) => path.resolve(workspacePath, file));

			outputChannel.appendLine(`Total staged files: ${stagedRelativePaths.length}`);
			outputChannel.appendLine(`Staged TypeScript files: ${stagedTypeScriptFiles.length}`);
			outputChannel.appendLine('');

			if (stagedTypeScriptFiles.length === 0) {
				outputChannel.appendLine('No staged TypeScript files found.');
				vscode.window.showInformationMessage('No staged TypeScript files found.');
				return;
			}

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
				const rebuildChoice = await vscode.window.showWarningMessage(
					'RepoAlign index is stale. Rebuild the semantic index now before analyzing staged files?',
					'Yes, rebuild now',
					'No, continue anyway'
				);

				if (rebuildChoice === 'Yes, rebuild now') {
					outputChannel.appendLine('Rebuilding semantic index before staged analysis...');
					outputChannel.appendLine('');

					const rebuildResult = await rebuildProfileIndex(workspacePath);

					outputChannel.appendLine('Semantic index rebuild completed.');
					outputChannel.appendLine(`Indexed workspace: ${rebuildResult.workspace_path}`);
					outputChannel.appendLine(`Total indexed files: ${rebuildResult.total_files}`);
					outputChannel.appendLine(`Output path: ${rebuildResult.output_path}`);
					outputChannel.appendLine('');
				} else {
					outputChannel.appendLine('Continuing staged analysis with stale semantic index.');
					outputChannel.appendLine('');
				}
			}

			const ig = loadGitIgnore(workspacePath);
			const allFiles = scanFilesRecursively(
				workspacePath,
				workspacePath,
				ig,
				DEFAULT_ALLOWED_EXTENSIONS
			);
			const typeScriptFiles = getTypeScriptFiles(allFiles);

			for (const stagedFilePath of stagedTypeScriptFiles) {
				const relativeStagedPath = path.relative(workspacePath, stagedFilePath).replace(/\\/g, '/');

				outputChannel.appendLine(`Staged file: ${relativeStagedPath}`);
				outputChannel.appendLine('------------------------------');

				const result = await findSimilarFiles(stagedFilePath, typeScriptFiles, 3);

				if (!result.results || result.results.length === 0) {
					outputChannel.appendLine('No similar files found.');
					outputChannel.appendLine('');
					continue;
				}

				let rank = 1;

				for (const item of result.results) {
					const relativePath = path.relative(workspacePath, item.file_path).replace(/\\/g, '/');

					outputChannel.appendLine(`${rank}. ${relativePath}`);
					outputChannel.appendLine(`   Hybrid score: ${item.similarity}`);
					outputChannel.appendLine(`   Embedding similarity: ${item.embedding_similarity ?? 'N/A'}`);
					outputChannel.appendLine(`   Graph overlap score: ${item.graph_overlap_score ?? 'N/A'}`);
					outputChannel.appendLine(`   Role: ${item.role ?? 'unknown'}`);

					if (item.class_names && item.class_names.length > 0) {
						outputChannel.appendLine(`   Class names: ${item.class_names.join(', ')}`);
					}

					if (item.constructor_injections && item.constructor_injections.length > 0) {
						outputChannel.appendLine(
							`   Constructor injections: ${item.constructor_injections.join(', ')}`
						);
					}

					outputChannel.appendLine('');
					rank++;
				}

				outputChannel.appendLine('');
			}

			vscode.window.showInformationMessage(
				'RepoAlign analyzed the staged TypeScript files. See Output panel for details.'
			);
		} catch (error: any) {
			outputChannel.appendLine('Staged file analysis failed.');
			outputChannel.appendLine(String(error));

			vscode.window.showErrorMessage('Failed to analyze staged files.');
		}
	});
}