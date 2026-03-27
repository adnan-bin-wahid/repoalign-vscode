import * as fs from 'fs';
import * as path from 'path';
import ignore from 'ignore';

export function loadGitIgnore(basePath: string) {
	const ig = ignore();
	const gitignorePath = path.join(basePath, '.gitignore');

	if (fs.existsSync(gitignorePath)) {
		const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
		ig.add(gitignoreContent);
	}

	return ig;
}