import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import ignore from 'ignore';

function loadGitIgnore(basePath: string) {
	const ig = ignore();

	const gitignorePath = path.join(basePath, '.gitignore');

	if (fs.existsSync(gitignorePath)) {
		const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
		ig.add(gitignoreContent);
	}

	return ig;
}

function scanFilesRecursively(
	folderPath: string,
	basePath: string,
	ig: ReturnType<typeof ignore>,
	allowedExtensions: Set<string>
): string[] {
	let results: string[] = [];

	const items = fs.readdirSync(folderPath);

	for (const item of items) {
		const fullPath = path.join(folderPath, item);
		const relativePath = path.relative(basePath, fullPath).replace(/\\/g, '/');

		if (ig.ignores(relativePath)) {
			continue;
		}

		const stats = fs.statSync(fullPath);

		if (stats.isDirectory()) {
			const nestedFiles = scanFilesRecursively(fullPath, basePath, ig, allowedExtensions);
			results = results.concat(nestedFiles);
		} else {
			const extension = path.extname(item).toLowerCase();

			if (allowedExtensions.has(extension)) {
				results.push(fullPath);
			}
		}
	}

	return results;
}

export function activate(context: vscode.ExtensionContext) {
	console.log('RepoAlign extension is now active.');

	const outputChannel = vscode.window.createOutputChannel('RepoAlign');

	const startCommand = vscode.commands.registerCommand('repoalign.start', () => {
		vscode.window.showInformationMessage('RepoAlign is running successfully!');
	});

	const checkRepoCommand = vscode.commands.registerCommand('repoalign.checkRepo', async () => {
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

	const showWorkspacePathCommand = vscode.commands.registerCommand('repoalign.showWorkspacePath', () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;

		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showWarningMessage('No workspace folder is currently open.');
			return;
		}

		const firstWorkspaceFolder = workspaceFolders[0];
		const folderPath = firstWorkspaceFolder.uri.fsPath;

		vscode.window.showInformationMessage(`Current workspace path: ${folderPath}`);
		console.log(`Current workspace path: ${folderPath}`);
	});

	const listWorkspaceFilesCommand = vscode.commands.registerCommand('repoalign.listWorkspaceFiles', () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;

		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showWarningMessage('No workspace folder is currently open.');
			return;
		}

		const firstWorkspaceFolder = workspaceFolders[0];
		const folderPath = firstWorkspaceFolder.uri.fsPath;

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

			const message = `Workspace items: ${detailedItems.join(', ')}`;

			vscode.window.showInformationMessage(message);
			console.log(`Workspace path: ${folderPath}`);
			console.log(`Workspace items: ${detailedItems.join(', ')}`);
		} catch (error) {
			vscode.window.showErrorMessage('Failed to read workspace files.');
			console.error(error);
		}
	});

	const scanWorkspaceRecursivelyCommand = vscode.commands.registerCommand('repoalign.scanWorkspaceRecursively', () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;

		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showWarningMessage('No workspace folder is currently open.');
			return;
		}

		const firstWorkspaceFolder = workspaceFolders[0];
		const folderPath = firstWorkspaceFolder.uri.fsPath;

		const allowedExtensions = new Set([
			'.ts',
			'.js',
			'.json',
			'.md',
			'.html',
			'.css',
			'.scss'
		]);

		try {
			const ig = loadGitIgnore(folderPath);
			const allFiles = scanFilesRecursively(folderPath, folderPath, ig, allowedExtensions);

			outputChannel.clear();
			outputChannel.show(true);

			outputChannel.appendLine('=== RepoAlign Workspace Scan ===');
			outputChannel.appendLine(`Workspace path: ${folderPath}`);
			outputChannel.appendLine(`Total useful files: ${allFiles.length}`);
			outputChannel.appendLine('Rules: .gitignore respected, extension filtered');
			outputChannel.appendLine('');

			if (allFiles.length === 0) {
				outputChannel.appendLine('No matching source files found.');
				vscode.window.showInformationMessage('No matching source files found.');
				return;
			}

			outputChannel.appendLine('Scanned files:');
			outputChannel.appendLine('------------------------------');

			for (const file of allFiles.slice(0, 200)) {
				const relativePath = path.relative(folderPath, file).replace(/\\/g, '/');
				outputChannel.appendLine(relativePath);
			}

			if (allFiles.length > 200) {
				outputChannel.appendLine('');
				outputChannel.appendLine(`...and ${allFiles.length - 200} more files`);
			}

			vscode.window.showInformationMessage(
				`RepoAlign scanned ${allFiles.length} useful files. See Output panel for details.`
			);
		} catch (error) {
			outputChannel.appendLine('Scan failed.');
			outputChannel.appendLine(String(error));
			outputChannel.show(true);

			vscode.window.showErrorMessage('Failed to scan workspace.');
			console.error(error);
		}
	});

	context.subscriptions.push(outputChannel);
	context.subscriptions.push(startCommand);
	context.subscriptions.push(checkRepoCommand);
	context.subscriptions.push(showWorkspacePathCommand);
	context.subscriptions.push(listWorkspaceFilesCommand);
	context.subscriptions.push(scanWorkspaceRecursivelyCommand);
}

export function deactivate() {}