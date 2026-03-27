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

function getFileCategory(relativePath: string): string {
	const normalizedPath = relativePath.replace(/\\/g, '/').toLowerCase();
	const fileName = path.basename(normalizedPath);

	if (fileName.endsWith('.component.ts')) {
		return 'Components';
	}

	if (fileName.endsWith('.service.ts')) {
		return 'Services';
	}

	if (fileName.endsWith('.model.ts')) {
		return 'Models';
	}

	if (fileName.endsWith('.interceptor.ts')) {
		return 'Interceptors';
	}

	if (fileName.endsWith('.guard.ts')) {
		return 'Guards';
	}

	if (fileName.endsWith('.module.ts')) {
		return 'Modules';
	}

	if (fileName.endsWith('.routes.ts') || fileName.includes('routing.module.ts')) {
		return 'Routing';
	}

	if (fileName.endsWith('.spec.ts') || fileName.endsWith('.test.ts')) {
		return 'Tests';
	}

	if (
		fileName === 'angular.json' ||
		fileName === 'package.json' ||
		fileName === 'package-lock.json' ||
		fileName === 'tsconfig.json' ||
		fileName.startsWith('tsconfig.') ||
		fileName === 'main.ts' ||
		fileName.includes('config') ||
		fileName === 'proxy.conf.json'
	) {
		return 'Config';
	}

	if (fileName.endsWith('.html')) {
		return 'Templates';
	}

	if (fileName.endsWith('.css') || fileName.endsWith('.scss')) {
		return 'Styles';
	}

	if (fileName.endsWith('.ts')) {
		return 'TypeScript Files';
	}

	if (fileName.endsWith('.js')) {
		return 'JavaScript Files';
	}

	if (fileName.endsWith('.json')) {
		return 'JSON Files';
	}

	if (fileName.endsWith('.md')) {
		return 'Documentation';
	}

	return 'Other';
}

function classifyFiles(relativePaths: string[]): Map<string, string[]> {
	const categories = new Map<string, string[]>();

	for (const relativePath of relativePaths) {
		const category = getFileCategory(relativePath);

		if (!categories.has(category)) {
			categories.set(category, []);
		}

		categories.get(category)?.push(relativePath);
	}

	return categories;
}

function appendCategoryToOutput(
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

function extractImportsFromTypeScriptFile(filePath: string): string[] {
	try {
		const content = fs.readFileSync(filePath, 'utf-8');

		const importRegex = /import\s+.*?\s+from\s+['"](.*?)['"]/g;
		const imports: string[] = [];

		let match: RegExpExecArray | null;

		while ((match = importRegex.exec(content)) !== null) {
			imports.push(match[1]);
		}

		return imports;
	} catch (error) {
		console.error(`Failed to read imports from file: ${filePath}`, error);
		return [];
	}
}

function getTypeScriptFiles(allFiles: string[]): string[] {
	return allFiles.filter(file => file.toLowerCase().endsWith('.ts'));
}

function isLocalImport(importPath: string): boolean {
	return importPath.startsWith('./') || importPath.startsWith('../');
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

			for (const file of allFiles) {
				const relativePath = path.relative(folderPath, file).replace(/\\/g, '/');
				outputChannel.appendLine(relativePath);
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

	const classifyWorkspaceFilesCommand = vscode.commands.registerCommand('repoalign.classifyWorkspaceFiles', () => {
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
			const relativePaths = allFiles.map(file => path.relative(folderPath, file).replace(/\\/g, '/'));
			const categories = classifyFiles(relativePaths);

			outputChannel.clear();
			outputChannel.show(true);

			outputChannel.appendLine('=== RepoAlign File Classification ===');
			outputChannel.appendLine(`Workspace path: ${folderPath}`);
			outputChannel.appendLine(`Total useful files: ${relativePaths.length}`);
			outputChannel.appendLine('');

			if (relativePaths.length === 0) {
				outputChannel.appendLine('No matching source files found.');
				vscode.window.showInformationMessage('No matching source files found.');
				return;
			}

			const orderedCategories = [
				'Components',
				'Services',
				'Models',
				'Interceptors',
				'Guards',
				'Modules',
				'Routing',
				'Tests',
				'Templates',
				'Styles',
				'Config',
				'TypeScript Files',
				'JavaScript Files',
				'JSON Files',
				'Documentation',
				'Other'
			];

			for (const categoryName of orderedCategories) {
				appendCategoryToOutput(outputChannel, categoryName, categories.get(categoryName));
			}

			vscode.window.showInformationMessage(
				`RepoAlign classified ${relativePaths.length} files. See Output panel for details.`
			);
		} catch (error) {
			outputChannel.appendLine('Classification failed.');
			outputChannel.appendLine(String(error));
			outputChannel.show(true);

			vscode.window.showErrorMessage('Failed to classify workspace files.');
			console.error(error);
		}
	});

	const extractTypeScriptImportsCommand = vscode.commands.registerCommand('repoalign.extractTypeScriptImports', () => {
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
			const tsFiles = getTypeScriptFiles(allFiles);

			outputChannel.clear();
			outputChannel.show(true);

			outputChannel.appendLine('=== RepoAlign TypeScript Import Extraction ===');
			outputChannel.appendLine(`Workspace path: ${folderPath}`);
			outputChannel.appendLine(`Total TypeScript files: ${tsFiles.length}`);
			outputChannel.appendLine('');

			if (tsFiles.length === 0) {
				outputChannel.appendLine('No TypeScript files found.');
				vscode.window.showInformationMessage('No TypeScript files found.');
				return;
			}

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
			outputChannel.show(true);

			vscode.window.showErrorMessage('Failed to extract TypeScript imports.');
			console.error(error);
		}
	});

	context.subscriptions.push(outputChannel);
	context.subscriptions.push(startCommand);
	context.subscriptions.push(checkRepoCommand);
	context.subscriptions.push(showWorkspacePathCommand);
	context.subscriptions.push(listWorkspaceFilesCommand);
	context.subscriptions.push(scanWorkspaceRecursivelyCommand);
	context.subscriptions.push(classifyWorkspaceFilesCommand);
	context.subscriptions.push(extractTypeScriptImportsCommand);
}

export function deactivate() {}