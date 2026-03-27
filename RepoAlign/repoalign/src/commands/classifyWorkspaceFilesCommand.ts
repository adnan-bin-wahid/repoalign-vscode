import * as vscode from 'vscode';
import { loadGitIgnore } from '../utils/gitignore';
import { DEFAULT_ALLOWED_EXTENSIONS, scanFilesRecursively, getRelativePaths } from '../utils/scanner';
import { classifyFiles } from '../utils/classifier';
import { appendCategoryToOutput } from '../utils/output';

export function registerClassifyWorkspaceFilesCommand(outputChannel: vscode.OutputChannel) {
	return vscode.commands.registerCommand('repoalign.classifyWorkspaceFiles', () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;

		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showWarningMessage('No workspace folder is currently open.');
			return;
		}

		const folderPath = workspaceFolders[0].uri.fsPath;

		try {
			const ig = loadGitIgnore(folderPath);
			const allFiles = scanFilesRecursively(folderPath, folderPath, ig, DEFAULT_ALLOWED_EXTENSIONS);
			const relativePaths = getRelativePaths(folderPath, allFiles);
			const categories = classifyFiles(relativePaths);

			outputChannel.clear();
			outputChannel.show(true);

			outputChannel.appendLine('=== RepoAlign File Classification ===');
			outputChannel.appendLine(`Workspace path: ${folderPath}`);
			outputChannel.appendLine(`Total useful files: ${relativePaths.length}`);
			outputChannel.appendLine('');

			const orderedCategories = [
				'Components',
				'Services',
				'Models',
				'Interceptors',
				'Guards',
				'Modules',
				'Routing',
				'Tests',
				'Templates',
				'Styles',
				'Config',
				'TypeScript Files',
				'JavaScript Files',
				'JSON Files',
				'Documentation',
				'Other'
			];

			for (const categoryName of orderedCategories) {
				appendCategoryToOutput(outputChannel, categoryName, categories.get(categoryName as any));
			}

			vscode.window.showInformationMessage(
				`RepoAlign classified ${relativePaths.length} files. See Output panel for details.`
			);
		} catch (error) {
			outputChannel.appendLine('Classification failed.');
			outputChannel.appendLine(String(error));
			vscode.window.showErrorMessage('Failed to classify workspace files.');
			console.error(error);
		}
	});
}