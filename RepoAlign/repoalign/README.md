# RepoAlign

**AI-driven repository-level semantic consistency checker for VS Code**

RepoAlign is a powerful VS Code extension that analyzes your codebase to ensure semantic consistency across your project. It leverages AI to detect inconsistencies in naming conventions, code patterns, and overall repository structure.

---

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation & Setup](#installation--setup)
- [Development](#development)
- [Available Commands](#available-commands)
- [Build & Compilation](#build--compilation)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Release Notes](#release-notes)

---

## Features

- **Semantic Consistency Checking**: Analyzes your repository for inconsistent naming conventions and patterns
- **AI-Powered Analysis**: Intelligent detection of code structure anomalies
- **Repository Scanning**: Quick repository-level checks with detailed insights
- **Workspace Integration**: Seamless integration with VS Code's workspace features
- **Real-time Feedback**: Instant analysis and reporting

---

## Requirements

Before you begin, ensure you have the following installed on your system:

- **Node.js**: v18 or higher (recommended: v20 LTS)
- **npm**: v8 or higher (comes with Node.js)
- **VS Code**: v1.110.0 or higher
- **Git**: For cloning the repository

### Check your versions:

```bash
node --version
npm --version
code --version
```

---

## Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/repoalign.git
cd repoalign
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required development dependencies including TypeScript, ESLint, and VS Code testing tools.

### Step 3: Verify Installation

```bash
npm run compile
```

You should see no errors if everything is set up correctly. The compiled output will be in the `out/` directory.

---

## Development

### Project Structure

```
repoalign/
├── src/
│   ├── extension.ts          # Main extension entry point
│   └── test/
│       └── extension.test.ts  # Test suite
├── out/                       # Compiled JavaScript (auto-generated)
├── package.json              # Project manifest
├── tsconfig.json             # TypeScript configuration
├── eslint.config.mjs         # ESLint configuration
└── README.md                 # This file
```

### Available npm Scripts

```bash
# Compile TypeScript to JavaScript
npm run compile

# Watch mode - automatically recompile on file changes (recommended for development)
npm run watch

# Run linter to check code quality
npm run lint

# Run the full test suite (includes compile and lint)
npm run pretest

# Execute tests
npm run test

# Prepare extension for publication
npm run vscode:prepublish
```

---

## Available Commands

Once installed, RepoAlign provides the following commands (accessible via Ctrl+Shift+P):

1. **RepoAlign: Start**
   - Starts the RepoAlign service and verifies the extension is active

2. **RepoAlign: Check Repository**
   - Prompts for a repository name and initiates semantic consistency analysis

3. **RepoAlign: Show Workspace Path**
   - Displays the current workspace folder path

4. **RepoAlign: List Workspace Files**
   - Shows a summary of files in the current workspace

---

## Build & Compilation

### Development Build

```bash
npm run compile
```

Output will be in the `out/` directory.

### Watch Mode (Recommended for Development)

```bash
npm run watch
```

This runs the TypeScript compiler in watch mode, automatically recompiling whenever you modify source files.

### Production Build

```bash
npm run vscode:prepublish
```

This optimizes the extension for publication.

---

## Testing

### Run All Tests

```bash
npm run pretest
```

This command:
1. Compiles TypeScript
2. Runs the linter
3. Executes the test suite

### Run Tests Only

```bash
npm run test
```

### Debug Tests in VS Code

1. Open the project in VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
3. Run: **Tasks: Run Task** → **npm: watch**
4. Open the **Testing** view from the Activity Bar
5. Click **Run Test** or press `Ctrl+; A`

---

## Local Extension Testing

### Method 1: Debug Mode (Recommended for Development)

1. Open the project folder in VS Code
2. Press `F5` to launch the extension in debug mode
3. A new VS Code window opens with the extension loaded
4. Test commands via **Command Palette** (`Ctrl+Shift+P`)

### Method 2: Manual Installation

1. Build the extension:
   ```bash
   npm run compile
   ```

2. Package the extension:
   ```bash
   npm install -g vsce
   vsce package
   ```

3. Install the `.vsix` file in VS Code:
   - Open VS Code
   - Go to **Extensions** (Ctrl+Shift+X)
   - Click **⋯** → **Install from VSIX**
   - Select the generated `.vsix` file

---

## Troubleshooting

### Issue: npm install fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: TypeScript compilation errors

**Solution:**
```bash
# Restart the TypeScript compiler
npm run compile

# Or use watch mode and check for specific errors
npm run watch
```

### Issue: Extension won't load in VS Code

**Solution:**
- Ensure VS Code version meets requirements: `code --version`
- Rebuild the extension:
  ```bash
  npm run compile
  npm run vscode:prepublish
  ```
- Reload VS Code window (Ctrl+R in debug window)

### Issue: Linting errors

**Solution:**
```bash
npm run lint
```

Fix issues manually or check ESLint configuration in `eslint.config.mjs`.

### Issue: Port already in use (if applicable)

**Solution:** Check for conflicting processes or modify the port in configuration files.

---

## Extension Guidelines

This extension follows the official [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines) to ensure quality and consistency.

---

## Release Notes

### Version 0.0.1 (Initial Release - 2026-03-27)

- Initial release of RepoAlign
- Core semantic consistency checking engine
- AI-powered repository analysis
- Four foundational commands:
  - Start service
  - Check repository
  - Show workspace path
  - List workspace files
- Full test suite
- ESLint integration for code quality

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -m "Add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License. See LICENSE file for details.

---

## Support & Feedback

- **Report Issues**: [GitHub Issues](https://github.com/yourusername/repoalign/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/yourusername/repoalign/discussions)
- **VS Code Extension Marketplace**: Coming soon

---

**Happy coding! 🚀**
