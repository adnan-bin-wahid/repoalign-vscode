# RepoAlign: Developer End-to-End Testing Guide

This guide describes how to run and verify the complete **RepoAlign** workflow—from starting the local FastAPI neural backend to triggering semantic similarity checks and Git pre-commit hooks inside a VS Code Extension Development Host.

---

## 📋 Prerequisites & Checklists

Before beginning the interactive tests, verify your local environment is correctly configured:

```bash
# 1. Check Python version (3.11+ recommended)
python --version

# 2. Check Node.js version (18.0+ recommended)
node --version

# 3. Verify TypeScript compiles without errors
cd RepoAlign/repoalign
npm run compile
```

---

## 🏃 STEP 1: Launch the FastAPI Backend

The backend engine performs embedding inferences (`all-MiniLM-L6-v2`) and manages the semantic profile index cache.

1. Open your terminal and navigate to the python engine folder:
   ```bash
   cd RepoAlign/repoalign/python_engine
   ```
2. Activate your virtual environment:
   - **Windows (PowerShell)**: `.\venv\Scripts\activate`
   - **Windows (CMD)**: `venv\Scripts\activate.bat`
   - **macOS/Linux**: `source venv/bin/activate`
3. Launch the Uvicorn server:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```
4. **Verification**: Open `http://127.0.0.1:8000/docs` in your browser. You should see the interactive FastAPI Swagger UI documentation.

---

## 💻 STEP 2: Launch the VS Code Extension Host

1. Open the directory `RepoAlign/repoalign` in your primary VS Code window.
2. Open `src/extension.ts` or any other file, and press **`F5`** (or go to `Run and Debug` in the sidebar and click **Extension**).
3. This opens a new window titled **`[Extension Development Host]`**.
4. In this new window, open any workspace containing TypeScript files (you can open `RepoAlign/repoalign` itself to test it on its own 34 TS files).

---

## 🧪 STEP 3: Interactive Extension Commands Testing

All commands are run using the Command Palette: press **`Ctrl+Shift+P`** (Windows/Linux) or **`Cmd+Shift+P`** (macOS).

### Test 3.1: Check Backend Health
* **Action**: Run `RepoAlign: Check Backend Connection` in the Command Palette.
* **Expected Result**: A success message: *"Connected to RepoAlign backend successfully!"* (and the Output channel for RepoAlign will show a log confirming status code 200).

### Test 3.2: Rebuild Workspace Semantic Index
* **Action**: Run `RepoAlign: Rebuild Semantic Index` in the Command Palette.
* **Expected Result**: 
  - A notification stating how many files were successfully indexed.
  - The `RepoAlign` Output channel will display:
    ```text
    === RepoAlign Semantic Index Rebuild ===
    Workspace path: E:/...
    Starting rebuild...
    Rebuild completed successfully.
    Indexed workspace: E:/...
    Total indexed files: 34
    Output path: data/profile_index.json
    ```
  - Verification: Look inside `RepoAlign/repoalign/python_engine/data/profile_index.json`. It will contain the updated profile index with 384-dimension vector embeddings.

### Test 3.3: Surface File Commonalities & Similar Files
* **Action**: Open any `.ts` file (e.g. `src/utils/git.ts`), open the Command Palette, and run `RepoAlign: Find Similar Files (AI)`.
* **Expected Result**: The extension queries the FastAPI backend's `/find-similar-files` endpoint, runs hybrid cosine-similarity + dependency graph weighting, and prints the top-3 most architecturally consistent files into the Output log.

### Test 3.4: Active File Inconsistency Verification
* **Action**: Run `RepoAlign: Compare Active File Against Similar Files`.
* **Expected Result**: Compares class patterns, constructor injections, and method lists to detect structural drift, indicating whether naming conventions or injected dependencies match similar modules.

---

## 📦 STEP 4: Testing Git Pre-Commit Hook Integration

RepoAlign features a CLI pre-commit validator that analyzes staged files prior to a git commit.

### Scenario A: Test CLI Runner Manually
Run the pre-commit script manually in your repository to simulate a git pre-commit hook execution:
```bash
# From RepoAlign/repoalign directory:
npm run repoalign:precommit
```
* **Expected Result**: If no files are staged, it logs `"No staged files found."` and exits with code 0.

### Scenario B: Test on Staged Code changes
1. Make a small edit in any `.ts` file (e.g., add a dummy comment in `src/utils/gitignore.ts`).
2. Stage the file using git:
   ```bash
   git add src/utils/gitignore.ts
   ```
3. Execute the CLI runner:
   ```bash
   npm run repoalign:precommit
   ```
4. **Expected Result**:
   - The CLI detects `1` staged TypeScript file.
   - It contacts the backend to verify the index status.
   - If the index is stale (because you edited the file), it automatically triggers `/build-profile-index` to update the cache.
   - It performs the consistency scan and logs the similarity rankings against similar files (displaying their Hybrid, Embedding, and Graph overlap scores).

---

## 🔍 STEP 5: Troubleshooting Test Failures

### 1. Inconsistencies or Stale Index Warnings
* **Symptom**: CLI or extension states that the index is out of date.
* **Test**: Check `GET http://127.0.0.1:8000/index-status`. The field `"is_stale"` will be `true` if files in the workspace have newer modification times than the `"indexed_at"` timestamp. Run the rebuild command to update it.

### 2. Connection Refused Errors
* **Symptom**: Commands fail with `Network Error` or `Connection Refused`.
* **Test**: Ensure the FastAPI server is running on port 8000. If port 8000 is occupied, free it using:
  - **Windows**: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force`
  - **Linux/macOS**: `kill -9 $(lsof -t -i:8000)`
