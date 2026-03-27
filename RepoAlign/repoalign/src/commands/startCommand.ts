import * as vscode from 'vscode';

export function registerStartCommand() {
	return vscode.commands.registerCommand('repoalign.start', () => {
		vscode.window.showInformationMessage('RepoAlign is running successfully!');
	});
}