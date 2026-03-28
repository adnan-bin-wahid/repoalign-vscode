import * as vscode from 'vscode';
import * as path from 'path';
import { findSimilarFiles } from '../utils/apiClient';
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

			outputChannel.appendLine('=== RepoAlign AI Similar File Retrieval ===');
			outputChannel.appendLine(`Workspace path: ${workspacePath}`);
			outputChannel.appendLine(`Query file: ${queryFilePath}`);
			outputChannel.appendLine(`Candidate TypeScript files: ${typeScriptFiles.length}`);
			outputChannel.appendLine('');

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
				outputChannel.appendLine('');
				rank++;
			}

			vscode.window.showInformationMessage(
				`RepoAlign found ${result.results.length} similar files. See Output panel for details.`
			);
		} catch (error: any) {
			outputChannel.appendLine('AI similar file retrieval failed.');
			outputChannel.appendLine(String(error));

			vscode.window.showErrorMessage('Failed to retrieve similar files from backend.');
		}
	});
}