import * as vscode from 'vscode';

export function appendCategoryToOutput(
	outputChannel: vscode.OutputChannel,
	categoryName: string,
	files: string[] | undefined
) {
	if (!files || files.length === 0) {
		return;
	}

	outputChannel.appendLine(`${categoryName} (${files.length})`);
	outputChannel.appendLine('-'.repeat(categoryName.length + 5));

	for (const file of files) {
		outputChannel.appendLine(file);
	}

	outputChannel.appendLine('');
}