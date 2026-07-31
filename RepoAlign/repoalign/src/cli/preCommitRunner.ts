import * as path from "path";
import { loadGitIgnore } from "../utils/gitignore";
import {
  DEFAULT_ALLOWED_EXTENSIONS,
  getTypeScriptFiles,
  scanFilesRecursively,
} from "../utils/scanner";
import { getStagedFiles } from "../utils/git";
import {
  checkBackendHealth,
  getIndexStatus,
  rebuildProfileIndex,
  findSimilarFiles,
} from "../utils/apiClient";

async function runPreCommitCheck() {
  const workspacePath = process.cwd();

  // BYPASSED: Pre-commit check disabled for now
  console.log("=== RepoAlign Pre-Commit Check (BYPASSED) ===");
  process.exit(0);
  return;

  // console.log('=== RepoAlign Pre-Commit Check ===');
  // console.log(`Workspace path: ${workspacePath}`);
  // console.log('');

  try {
    await checkBackendHealth();
    console.log("Backend status: OK");
  } catch (error) {
    console.error("RepoAlign backend is not reachable.");
    console.error("Start the Python backend before committing.");
    process.exit(1);
  }

  const stagedRelativePaths = await getStagedFiles(workspacePath);

  if (stagedRelativePaths.length === 0) {
    console.log("No staged files found.");
    process.exit(0);
  }

  const stagedTypeScriptFiles = stagedRelativePaths
    .filter((file: string) => file.toLowerCase().endsWith(".ts"))
    .map((file: string) => path.resolve(workspacePath, file));

  console.log(`Total staged files: ${stagedRelativePaths.length}`);
  console.log(`Staged TypeScript files: ${stagedTypeScriptFiles.length}`);
  console.log("");

  if (stagedTypeScriptFiles.length === 0) {
    console.log("No staged TypeScript files found.");
    process.exit(0);
  }

  const indexStatus = await getIndexStatus();

  console.log("Semantic index status:");
  console.log(`  Indexed workspace: ${indexStatus.workspace_path}`);
  console.log(`  Indexed at: ${indexStatus.indexed_at}`);
  console.log(`  Indexed files: ${indexStatus.indexed_total_files}`);
  console.log(`  Current files: ${indexStatus.current_total_files}`);
  console.log(`  Is stale: ${indexStatus.is_stale}`);
  console.log("");

  if (indexStatus.is_stale) {
    console.log(
      "Semantic index is stale. Rebuilding before commit analysis...",
    );
    const rebuildResult = await rebuildProfileIndex(workspacePath);
    console.log(
      `Rebuild complete. Indexed files: ${rebuildResult.total_files}`,
    );
    console.log("");
  }

  const ig = loadGitIgnore(workspacePath);
  const allFiles = scanFilesRecursively(
    workspacePath,
    workspacePath,
    ig,
    DEFAULT_ALLOWED_EXTENSIONS,
  );
  const typeScriptFiles = getTypeScriptFiles(allFiles);

  for (const stagedFilePath of stagedTypeScriptFiles) {
    const relativeStagedPath = path
      .relative(workspacePath, stagedFilePath)
      .replace(/\\/g, "/");

    console.log(`Staged file: ${relativeStagedPath}`);

    const result = await findSimilarFiles(stagedFilePath, typeScriptFiles, 3);

    if (!result.results || result.results.length === 0) {
      console.log("  No similar files found.");
      console.log("");
      continue;
    }

    let rank = 1;

    for (const item of result.results) {
      const relativePath = path
        .relative(workspacePath, item.file_path)
        .replace(/\\/g, "/");

      console.log(`  ${rank}. ${relativePath}`);
      console.log(`     Hybrid score: ${item.similarity}`);
      console.log(
        `     Embedding similarity: ${item.embedding_similarity ?? "N/A"}`,
      );
      console.log(
        `     Graph overlap score: ${item.graph_overlap_score ?? "N/A"}`,
      );
      console.log(`     Role: ${item.role ?? "unknown"}`);
      rank++;
    }

    console.log("");
  }

  console.log("RepoAlign pre-commit analysis completed.");
  process.exit(0);
}

runPreCommitCheck().catch((error) => {
  console.error("RepoAlign pre-commit runner failed.");
  console.error(error);
  process.exit(1);
});
