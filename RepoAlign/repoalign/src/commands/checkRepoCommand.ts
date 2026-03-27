import * as vscode from 'vscode';

export function registerCheckRepoCommand() {
	return vscode.commands.registerCommand('repoalign.checkRepo', async () => {
		const repoName = await vscode.window.showInputBox({
			prompt: 'Enter your repository name',
			placeHolder: 'Example: repoalign-vscode'
		});

		if (!repoName) {
			vscode.window.showWarningMessage('No repository name was entered.');
			return;
		}

		vscode.window.showInformationMessage(`RepoAlign will analyze: ${repoName}`);
	});
}