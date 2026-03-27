import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

function scanFilesRecursively(folderPath: string, ignoredFolders: Set<string>): string[] {
	let results: string[] = [];

	const items = fs.readdirSync(folderPath);

	for (const item of items) {
		const fullPath = path.join(folderPath, item);
		const stats = fs.statSync(fullPath);

		if (stats.isDirectory()) {
			if (ignoredFolders.has(item)) {
				continue;
			}

			const nestedFiles = scanFilesRecursively(fullPath, ignoredFolders);
			results = results.concat(nestedFiles);
		} else {
			results.push(fullPath);
		}
	}

	return results;
}

export function activate(context: vscode.ExtensionContext) {
	console.log('RepoAlign extension is now active.');

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

		const ignoredFolders = new Set([
			'node_modules',
			'.git',
			'dist',
			'out',
			'.next',
			'build'
		]);

		try {
			const allFiles = scanFilesRecursively(folderPath, ignoredFolders);

			if (allFiles.length === 0) {
				vscode.window.showInformationMessage('No files were found in the workspace.');
				return;
			}

			const sampleFiles = allFiles.slice(0, 10).map(file => path.relative(folderPath, file));
			const message = `Found ${allFiles.length} files. Sample: ${sampleFiles.join(', ')}`;

			vscode.window.showInformationMessage(message);
			console.log(`Workspace path: ${folderPath}`);
			console.log(`Total files found: ${allFiles.length}`);
			console.log('Sample files:', sampleFiles);
		} catch (error) {
			vscode.window.showErrorMessage('Failed to scan workspace recursively.');
			console.error(error);
		}
	});

	context.subscriptions.push(startCommand);
	context.subscriptions.push(checkRepoCommand);
	context.subscriptions.push(showWorkspacePathCommand);
	context.subscriptions.push(listWorkspaceFilesCommand);
	context.subscriptions.push(scanWorkspaceRecursivelyCommand);
}

export function deactivate() {}