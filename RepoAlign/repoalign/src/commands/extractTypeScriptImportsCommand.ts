import * as vscode from 'vscode';
import * as path from 'path';
import { loadGitIgnore } from '../utils/gitignore';
import { DEFAULT_ALLOWED_EXTENSIONS, scanFilesRecursively, getTypeScriptFiles } from '../utils/scanner';
import { extractImportsFromTypeScriptFile, isLocalImport } from '../utils/imports';

export function registerExtractTypeScriptImportsCommand(outputChannel: vscode.OutputChannel) {
	return vscode.commands.registerCommand('repoalign.extractTypeScriptImports', () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;

		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showWarningMessage('No workspace folder is currently open.');
			return;
		}

		const folderPath = workspaceFolders[0].uri.fsPath;

		try {
			const ig = loadGitIgnore(folderPath);
			const allFiles = scanFilesRecursively(folderPath, folderPath, ig, DEFAULT_ALLOWED_EXTENSIONS);
			const tsFiles = getTypeScriptFiles(allFiles);

			outputChannel.clear();
			outputChannel.show(true);

			outputChannel.appendLine('=== RepoAlign TypeScript Import Extraction ===');
			outputChannel.appendLine(`Workspace path: ${folderPath}`);
			outputChannel.appendLine(`Total TypeScript files: ${tsFiles.length}`);
			outputChannel.appendLine('');

			for (const file of tsFiles) {
				const relativePath = path.relative(folderPath, file).replace(/\\/g, '/');
				const imports = extractImportsFromTypeScriptFile(file);

				outputChannel.appendLine(`FILE: ${relativePath}`);
				outputChannel.appendLine('-'.repeat(6 + relativePath.length));

				if (imports.length === 0) {
					outputChannel.appendLine('  No imports found.');
				} else {
					for (const importPath of imports) {
						const importType = isLocalImport(importPath) ? 'LOCAL' : 'EXTERNAL';
						outputChannel.appendLine(`  [${importType}] ${importPath}`);
					}
				}

				outputChannel.appendLine('');
			}

			vscode.window.showInformationMessage(
				`RepoAlign extracted imports from ${tsFiles.length} TypeScript files. See Output panel for details.`
			);
		} catch (error) {
			outputChannel.appendLine('Import extraction failed.');
			outputChannel.appendLine(String(error));
			vscode.window.showErrorMessage('Failed to extract TypeScript imports.');
			console.error(error);
		}
	});
}