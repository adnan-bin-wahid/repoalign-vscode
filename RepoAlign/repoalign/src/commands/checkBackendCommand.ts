import * as vscode from 'vscode';
import { checkBackendHealth } from '../utils/apiClient';

export function registerCheckBackendCommand(outputChannel: vscode.OutputChannel) {
	return vscode.commands.registerCommand('repoalign.checkBackend', async () => {
		try {
			outputChannel.clear();
			outputChannel.show(true);

			outputChannel.appendLine('=== RepoAlign Backend Check ===');

			const result = await checkBackendHealth();

			outputChannel.appendLine('Backend response:');
			outputChannel.appendLine(JSON.stringify(result, null, 2));

			vscode.window.showInformationMessage('Backend is connected successfully.');
		} catch (error: any) {
			outputChannel.appendLine('Failed to connect to backend.');
			outputChannel.appendLine(String(error));

			vscode.window.showErrorMessage('Backend connection failed.');
		}
	});
}