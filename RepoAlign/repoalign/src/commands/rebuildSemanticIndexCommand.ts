import * as vscode from 'vscode';
import { rebuildProfileIndex } from '../utils/apiClient';

export function registerRebuildSemanticIndexCommand(outputChannel: vscode.OutputChannel) {
	return vscode.commands.registerCommand('repoalign.rebuildSemanticIndex', async () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;

		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showWarningMessage('No workspace folder is currently open.');
			return;
		}

		const workspacePath = workspaceFolders[0].uri.fsPath;

		try {
			outputChannel.clear();
			outputChannel.show(true);

			outputChannel.appendLine('=== RepoAlign Semantic Index Rebuild ===');
			outputChannel.appendLine(`Workspace path: ${workspacePath}`);
			outputChannel.appendLine('Starting rebuild...');
			outputChannel.appendLine('');

			const result = await rebuildProfileIndex(workspacePath);

			outputChannel.appendLine('Rebuild completed successfully.');
			outputChannel.appendLine(`Indexed workspace: ${result.workspace_path}`);
			outputChannel.appendLine(`Total indexed files: ${result.total_files}`);
			outputChannel.appendLine(`Output path: ${result.output_path}`);

			vscode.window.showInformationMessage(
				`RepoAlign rebuilt the semantic index for ${result.total_files} files.`
			);
		} catch (error: any) {
			outputChannel.appendLine('Semantic index rebuild failed.');
			outputChannel.appendLine(String(error));

			vscode.window.showErrorMessage('Failed to rebuild semantic index.');
		}
	});
}