import * as vscode from 'vscode';
import * as path from 'path';
import { loadGitIgnore } from '../utils/gitignore';
import { DEFAULT_ALLOWED_EXTENSIONS, scanFilesRecursively, getTypeScriptFiles } from '../utils/scanner';
import { extractImportsFromTypeScriptFile, isLocalImport } from '../utils/imports';
import { resolveLocalImport } from '../utils/resolver';

export function registerResolveLocalImportsCommand(outputChannel: vscode.OutputChannel) {
	return vscode.commands.registerCommand('repoalign.resolveLocalImports', () => {
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

			outputChannel.appendLine('=== RepoAlign Local Import Resolution ===');
			outputChannel.appendLine(`Workspace path: ${folderPath}`);
			outputChannel.appendLine(`Total TypeScript files: ${tsFiles.length}`);
			outputChannel.appendLine('');

			let resolvedCount = 0;
			let unresolvedCount = 0;

			for (const file of tsFiles) {
				const relativeSourceFile = path.relative(folderPath, file).replace(/\\/g, '/');
				const imports = extractImportsFromTypeScriptFile(file);
				const localImports = imports.filter(isLocalImport);

				if (localImports.length === 0) {
					continue;
				}

				outputChannel.appendLine(`SOURCE: ${relativeSourceFile}`);
				outputChannel.appendLine('-'.repeat(8 + relativeSourceFile.length));

				for (const importPath of localImports) {
					const resolvedPath = resolveLocalImport(file, importPath);

					if (resolvedPath) {
						const relativeResolvedPath = path.relative(folderPath, resolvedPath).replace(/\\/g, '/');
						outputChannel.appendLine(`  ${importPath}  ->  ${relativeResolvedPath}`);
						resolvedCount++;
					} else {
						outputChannel.appendLine(`  ${importPath}  ->  [UNRESOLVED]`);
						unresolvedCount++;
					}
				}

				outputChannel.appendLine('');
			}

			outputChannel.appendLine('=== Summary ===');
			outputChannel.appendLine(`Resolved local imports: ${resolvedCount}`);
			outputChannel.appendLine(`Unresolved local imports: ${unresolvedCount}`);

			vscode.window.showInformationMessage(
				`RepoAlign resolved ${resolvedCount} local imports. See Output panel for details.`
			);
		} catch (error) {
			outputChannel.appendLine('Local import resolution failed.');
			outputChannel.appendLine(String(error));
			vscode.window.showErrorMessage('Failed to resolve local imports.');
			console.error(error);
		}
	});
}