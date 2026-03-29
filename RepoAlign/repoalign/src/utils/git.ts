import { exec } from 'child_process';

export function getStagedFiles(workspacePath: string): Promise<string[]> {
	return new Promise((resolve, reject) => {
		exec(
			'git diff --cached --name-only',
			{ cwd: workspacePath },
			(error, stdout, stderr) => {
				if (error) {
					reject(error);
					return;
				}

				if (stderr) {
					// Git sometimes writes non-fatal messages to stderr, so don't reject only for that.
				}

				const files = stdout
					.split('\n')
					.map(line => line.trim())
					.filter(line => line.length > 0);

				resolve(files);
			}
		);
	});
}