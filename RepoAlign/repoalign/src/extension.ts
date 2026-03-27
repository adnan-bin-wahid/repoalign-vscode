import * as vscode from 'vscode';
import { registerStartCommand } from './commands/startCommand';
import { registerCheckRepoCommand } from './commands/checkRepoCommand';
import { registerShowWorkspacePathCommand } from './commands/showWorkspacePathCommand';
import { registerListWorkspaceFilesCommand } from './commands/listWorkspaceFilesCommand';
import { registerScanWorkspaceRecursivelyCommand } from './commands/scanWorkspaceRecursivelyCommand';
import { registerClassifyWorkspaceFilesCommand } from './commands/classifyWorkspaceFilesCommand';
import { registerExtractTypeScriptImportsCommand } from './commands/extractTypeScriptImportsCommand';
import { registerResolveLocalImportsCommand } from './commands/resolveLocalImportsCommand';
import { registerBuildDependencyGraphCommand } from './commands/buildDependencyGraphCommand';
import { registerAnalyzeDependencyPatternsCommand } from './commands/analyzeDependencyPatternsCommand';

export function activate(context: vscode.ExtensionContext) {
	console.log('RepoAlign extension is now active.');

	const outputChannel = vscode.window.createOutputChannel('RepoAlign');

	context.subscriptions.push(outputChannel);
	context.subscriptions.push(registerStartCommand());
	context.subscriptions.push(registerCheckRepoCommand());
	context.subscriptions.push(registerShowWorkspacePathCommand());
	context.subscriptions.push(registerListWorkspaceFilesCommand());
	context.subscriptions.push(registerScanWorkspaceRecursivelyCommand(outputChannel));
	context.subscriptions.push(registerClassifyWorkspaceFilesCommand(outputChannel));
	context.subscriptions.push(registerExtractTypeScriptImportsCommand(outputChannel));
	context.subscriptions.push(registerResolveLocalImportsCommand(outputChannel));
	context.subscriptions.push(registerBuildDependencyGraphCommand(outputChannel));
	context.subscriptions.push(registerAnalyzeDependencyPatternsCommand(outputChannel));
}

export function deactivate() {}