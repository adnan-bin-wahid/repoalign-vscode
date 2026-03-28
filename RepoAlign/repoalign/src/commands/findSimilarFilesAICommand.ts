import * as vscode from 'vscode';
import * as path from 'path';
import { findSimilarFiles, getIndexStatus, rebuildProfileIndex } from '../utils/apiClient';
import { loadGitIgnore } from '../utils/gitignore';
import {
	DEFAULT_ALLOWED_EXTENSIONS,
	getTypeScriptFiles,
	scanFilesRecursively
} from '../utils/scanner';

export function registerFindSimilarFilesAICommand(outputChannel: vscode.OutputChannel) {
	return vscode.commands.registerCommand('repoalign.findSimilarFilesAI', async () => {
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
		const queryFilePath = path.resolve(activeEditor.document.uri.fsPath);
		const normalizedWorkspacePath = path.resolve(workspacePath);

		if (!queryFilePath.startsWith(normalizedWorkspacePath)) {
			vscode.window.showErrorMessage(
				'The active file is not inside the current workspace.'
			);
			return;
		}

		if (!queryFilePath.toLowerCase().endsWith('.ts')) {
			vscode.window.showErrorMessage(
				'The active file is not a TypeScript file. Please open a .ts file.'
			);
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

			if (!typeScriptFiles.includes(queryFilePath)) {
				vscode.window.showErrorMessage(
					'The active file is not part of the scanned TypeScript candidate set.'
				);
				return;
			}

			outputChannel.clear();
			outputChannel.show(true);

			const queryRelativePath = path.relative(workspacePath, queryFilePath).replace(/\\/g, '/');

			outputChannel.appendLine('=== RepoAlign AI Similar File Retrieval ===');
			outputChannel.appendLine(`Workspace path: ${workspacePath}`);
			outputChannel.appendLine(`Query file: ${queryRelativePath}`);
			outputChannel.appendLine(`Candidate TypeScript files: ${typeScriptFiles.length}`);
			outputChannel.appendLine('Retrieval mode: semantic profile embedding');
			outputChannel.appendLine('');

			const indexStatus = await getIndexStatus();

			outputChannel.appendLine('Index status:');
			outputChannel.appendLine('------------------------------');
			outputChannel.appendLine(`Indexed workspace: ${indexStatus.workspace_path}`);
			outputChannel.appendLine(`Indexed at: ${indexStatus.indexed_at}`);
			outputChannel.appendLine(`Indexed files: ${indexStatus.indexed_total_files}`);
			outputChannel.appendLine(`Current files: ${indexStatus.current_total_files}`);
			outputChannel.appendLine(`Is stale: ${indexStatus.is_stale}`);
			outputChannel.appendLine('');

			if (indexStatus.is_stale) {
				outputChannel.appendLine(
					'Warning: semantic profile index is stale. Retrieval may use outdated repository semantics.'
				);
				outputChannel.appendLine('');

				const rebuildChoice = await vscode.window.showWarningMessage(
					'RepoAlign index is stale. Rebuild the semantic index now before retrieval?',
					'Yes, rebuild now',
					'No, continue anyway'
				);

				if (rebuildChoice === 'Yes, rebuild now') {
					outputChannel.appendLine('Rebuilding semantic index before retrieval...');
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
					outputChannel.appendLine('Continuing retrieval with stale semantic index.');
					outputChannel.appendLine('');
				}
			}

			const result = await findSimilarFiles(queryFilePath, typeScriptFiles, 5);

			outputChannel.appendLine('Top similar files:');
			outputChannel.appendLine('------------------------------');

			if (!result.results || result.results.length === 0) {
				outputChannel.appendLine('No similar files found.');
				vscode.window.showInformationMessage('No similar files found.');
				return;
			}

			let rank = 1;

			for (const item of result.results) {
				const relativePath = path.relative(workspacePath, item.file_path).replace(/\\/g, '/');

				outputChannel.appendLine(`${rank}. ${relativePath}`);
				outputChannel.appendLine(`   Similarity: ${item.similarity}`);
				outputChannel.appendLine(`   Role: ${item.role ?? 'unknown'}`);

				if (item.class_names && item.class_names.length > 0) {
					outputChannel.appendLine(`   Class names: ${item.class_names.join(', ')}`);
				} else {
					outputChannel.appendLine('   Class names: None');
				}

				if (item.constructor_injections && item.constructor_injections.length > 0) {
					outputChannel.appendLine(
						`   Constructor injections: ${item.constructor_injections.join(', ')}`
					);
				} else {
					outputChannel.appendLine('   Constructor injections: None');
				}

				outputChannel.appendLine('');
				rank++;
			}

			vscode.window.showInformationMessage(
				`RepoAlign found ${result.results.length} semantically similar files. See Output panel for details.`
			);
		} catch (error: any) {
			outputChannel.appendLine('AI similar file retrieval failed.');
			outputChannel.appendLine(String(error));

			vscode.window.showErrorMessage('Failed to retrieve similar files from backend.');
		}
	});
}