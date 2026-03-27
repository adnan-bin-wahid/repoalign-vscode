import * as vscode from 'vscode';

export function registerShowWorkspacePathCommand() {
	return vscode.commands.registerCommand('repoalign.showWorkspacePath', () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;

		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showWarningMessage('No workspace folder is currently open.');
			return;
		}

		const folderPath = workspaceFolders[0].uri.fsPath;
		vscode.window.showInformationMessage(`Current workspace path: ${folderPath}`);
	});
}