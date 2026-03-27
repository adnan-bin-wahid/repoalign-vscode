import * as vscode from 'vscode';
import { loadGitIgnore } from '../utils/gitignore';
import { DEFAULT_ALLOWED_EXTENSIONS, scanFilesRecursively, getRelativePaths } from '../utils/scanner';

export function registerScanWorkspaceRecursivelyCommand(outputChannel: vscode.OutputChannel) {
	return vscode.commands.registerCommand('repoalign.scanWorkspaceRecursively', () => {
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

			outputChannel.clear();
			outputChannel.show(true);

			outputChannel.appendLine('=== RepoAlign Workspace Scan ===');
			outputChannel.appendLine(`Workspace path: ${folderPath}`);
			outputChannel.appendLine(`Total useful files: ${allFiles.length}`);
			outputChannel.appendLine('Rules: .gitignore respected, extension filtered');
			outputChannel.appendLine('');
			outputChannel.appendLine('Scanned files:');
			outputChannel.appendLine('------------------------------');

			for (const relativePath of relativePaths) {
				outputChannel.appendLine(relativePath);
			}

			vscode.window.showInformationMessage(
				`RepoAlign scanned ${allFiles.length} useful files. See Output panel for details.`
			);
		} catch (error) {
			outputChannel.appendLine('Scan failed.');
			outputChannel.appendLine(String(error));
			vscode.window.showErrorMessage('Failed to scan workspace.');
			console.error(error);
		}
	});
}