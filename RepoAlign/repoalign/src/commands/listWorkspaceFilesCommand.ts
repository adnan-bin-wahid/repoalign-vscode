import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function registerListWorkspaceFilesCommand() {
	return vscode.commands.registerCommand('repoalign.listWorkspaceFiles', () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;

		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showWarningMessage('No workspace folder is currently open.');
			return;
		}

		const folderPath = workspaceFolders[0].uri.fsPath;

		try {
			const items = fs.readdirSync(folderPath);

			if (items.length === 0) {
				vscode.window.showInformationMessage('The workspace folder is empty.');
				return;
			}

			const detailedItems = items.slice(0, 10).map((item) => {
				const fullPath = path.join(folderPath, item);
				const stats = fs.statSync(fullPath);
				return stats.isDirectory() ? `[Folder] ${item}` : `[File] ${item}`;
			});

			vscode.window.showInformationMessage(`Workspace items: ${detailedItems.join(', ')}`);
		} catch (error) {
			vscode.window.showErrorMessage('Failed to read workspace files.');
			console.error(error);
		}
	});
}