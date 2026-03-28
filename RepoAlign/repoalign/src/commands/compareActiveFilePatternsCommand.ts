import * as vscode from 'vscode';
import * as path from 'path';
import { findSimilarFiles } from '../utils/apiClient';
import { loadGitIgnore } from '../utils/gitignore';
import {
	DEFAULT_ALLOWED_EXTENSIONS,
	getTypeScriptFiles,
	scanFilesRecursively
} from '../utils/scanner';
import { buildDependencyGraph } from '../utils/graph';
import { buildDependencyPatternEdges } from '../utils/patterns';
import { getUniquePatternsForFile } from '../utils/filePatternSummary';
function getPatternComparisonSummary(
	sharedPatterns: string[],
	activeOnlyPatterns: string[],
	similarOnlyPatterns: string[]
): string {
	if (activeOnlyPatterns.length === 0 && sharedPatterns.length > 0 && similarOnlyPatterns.length === 0) {
		return 'Well aligned with similar file.';
	}

	if (activeOnlyPatterns.length > 0) {
		return 'Potential inconsistency: active file has extra pattern(s) not seen in this similar file.';
	}

	if (similarOnlyPatterns.length > 0) {
		return 'Minor variation: similar file has extra pattern(s) not used by the active file.';
	}

	return 'No meaningful pattern relationship detected.';
}


export function registerCompareActiveFilePatternsCommand(outputChannel: vscode.OutputChannel) {
	return vscode.commands.registerCommand('repoalign.compareActiveFilePatterns', async () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;

		if (!workspaceFolders || workspaceFolders.length === 0) {
			vscode.window.showWarningMessage('No workspace folder is currently open.');
			return;
		}

		const activeEditor = vscode.window.activeTextEditor;

		if (!activeEditor) {
			vscode.window.showWarningMessage('No active file is open in the editor.');
			return;
		}

		const workspacePath = workspaceFolders[0].uri.fsPath;
		const activeFilePath = path.resolve(activeEditor.document.uri.fsPath);
		const normalizedWorkspacePath = path.resolve(workspacePath);

		if (!activeFilePath.startsWith(normalizedWorkspacePath)) {
			vscode.window.showErrorMessage('The active file is not inside the current workspace.');
			return;
		}

		if (!activeFilePath.toLowerCase().endsWith('.ts')) {
			vscode.window.showErrorMessage('The active file is not a TypeScript file.');
			return;
		}

		try {
			const ig = loadGitIgnore(workspacePath);
			const allFiles = scanFilesRecursively(
				workspacePath,
				workspacePath,
				ig,
				DEFAULT_ALLOWED_EXTENSIONS
			);

			const typeScriptFiles = getTypeScriptFiles(allFiles);

			if (!typeScriptFiles.includes(activeFilePath)) {
				vscode.window.showErrorMessage(
					'The active file is not part of the scanned TypeScript candidate set.'
				);
				return;
			}

			const similarityResult = await findSimilarFiles(activeFilePath, typeScriptFiles, 3);
			const similarFiles: string[] = similarityResult.results.map((item: any) => item.file_path);

			const dependencyGraph = buildDependencyGraph(workspacePath, typeScriptFiles);
			const patternEdges = buildDependencyPatternEdges(dependencyGraph.edges);

			const activeRelativePath = path.relative(workspacePath, activeFilePath).replace(/\\/g, '/');
			const activePatterns = getUniquePatternsForFile(activeRelativePath, patternEdges);

			outputChannel.clear();
			outputChannel.show(true);

			outputChannel.appendLine('=== RepoAlign Active File Pattern Comparison ===');
			outputChannel.appendLine(`Workspace path: ${workspacePath}`);
			outputChannel.appendLine(`Active file: ${activeRelativePath}`);
			outputChannel.appendLine('');

			outputChannel.appendLine('Active file patterns:');
			outputChannel.appendLine('------------------------------');

			if (activePatterns.length === 0) {
				outputChannel.appendLine('No dependency patterns found for active file.');
			} else {
				for (const pattern of activePatterns) {
					outputChannel.appendLine(`- ${pattern}`);
				}
			}

			outputChannel.appendLine('');
			outputChannel.appendLine('Similar files comparison:');
			outputChannel.appendLine('------------------------------');

			if (similarFiles.length === 0) {
				outputChannel.appendLine('No similar files found.');
			} else {
				let index = 1;

				for (const similarFilePath of similarFiles) {
					const similarRelativePath = path.relative(workspacePath, similarFilePath).replace(/\\/g, '/');
					const similarPatterns = getUniquePatternsForFile(similarRelativePath, patternEdges);

					const sharedPatterns = activePatterns.filter(pattern => similarPatterns.includes(pattern));
					const activeOnlyPatterns = activePatterns.filter(pattern => !similarPatterns.includes(pattern));
					const similarOnlyPatterns = similarPatterns.filter(pattern => !activePatterns.includes(pattern));

                    const summary = getPatternComparisonSummary(
	sharedPatterns,
	activeOnlyPatterns,
	similarOnlyPatterns
);

					outputChannel.appendLine(`${index}. ${similarRelativePath}`);
                    outputChannel.appendLine(`   Summary: ${summary}`);
					outputChannel.appendLine('   Shared patterns:');

					if (sharedPatterns.length === 0) {
						outputChannel.appendLine('   - None');
					} else {
						for (const pattern of sharedPatterns) {
							outputChannel.appendLine(`   - ${pattern}`);
						}
					}

					outputChannel.appendLine('   Active-only patterns:');

					if (activeOnlyPatterns.length === 0) {
						outputChannel.appendLine('   - None');
					} else {
						for (const pattern of activeOnlyPatterns) {
							outputChannel.appendLine(`   - ${pattern}`);
						}
					}

					outputChannel.appendLine('   Similar-file-only patterns:');

					if (similarOnlyPatterns.length === 0) {
						outputChannel.appendLine('   - None');
					} else {
						for (const pattern of similarOnlyPatterns) {
							outputChannel.appendLine(`   - ${pattern}`);
						}
					}

					outputChannel.appendLine('');
					index++;
				}
			}

			vscode.window.showInformationMessage(
				'RepoAlign compared the active file against similar files. See Output panel for details.'
			);
		} catch (error: any) {
			outputChannel.appendLine('Active file pattern comparison failed.');
			outputChannel.appendLine(String(error));

			vscode.window.showErrorMessage('Failed to compare active file patterns.');
		}
	});
}