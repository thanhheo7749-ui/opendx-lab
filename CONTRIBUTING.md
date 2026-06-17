<!--
OpenDX-Lab - Contributing Guidelines
Copyright (C) 2026 OpenDX-Lab Contributors
SPDX-License-Identifier: GPL-3.0-or-later
-->

# Contributing Guidelines

Welcome to **OpenDX-Lab**! We appreciate and value all contributions from the community, whether it's fixing a typo, improving documentation, or developing new features for the Digital Transformation ecosystem.

---

## 🛠️ Contribution Workflow

To contribute effectively and avoid merge conflicts, please follow this process:

### 1. Find or Create an Issue
Before writing code, make sure there is an issue describing the problem or feature:
* Search the existing [Issues](https://github.com/thanhheo7749-ui/opendx-lab/issues) to see if it's already been raised.
* If not, create a new issue using the provided templates (Bug Report or Feature Request).

### 2. Fork & Clone the Repository
1. Fork this repository to your GitHub account.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/opendx-lab.git
   cd opendx-lab
   ```

### 3. Create a New Branch
Always create a new branch from `main` with a descriptive name:
```bash
git checkout -b feat/sso-integration      # For new features
git checkout -b fix/postgres-init-bug     # For bug fixes
git checkout -b docs/add-api-guide        # For documentation updates
```

### 4. Develop and Test
* Make your changes.
* Ensure your code doesn't break other services in the Docker Compose stack.
* Test locally before committing.

### 5. Commit and Push
Write clear and concise commit messages. We recommend using [Conventional Commits](https://www.conventionalcommits.org/):
```bash
# Examples
git commit -m "feat: add realm export for keycloak authentication"
git commit -m "fix: resolve db connection timeout in dashboard container"
```
Then push your branch:
```bash
git push origin your-branch-name
```

### 6. Open a Pull Request (PR)
1. Navigate to the upstream repository `thanhheo7749-ui/opendx-lab` on GitHub.
2. You will see a prompt to create a Pull Request for your recently pushed branch.
3. Click "Compare & pull request".
4. Describe your changes in detail, referencing related issues (use keywords like `Closes #123` to auto-close issues when the PR is merged).
5. Submit the PR and wait for the maintainers to review.

---

## 💻 Local Development Setup

See the detailed instructions in [README.md](README.md) or [Deployment Guide](docs/deployment.md).

Summary:
1. Ensure you have **Docker** and **Docker Compose** installed.
2. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```
3. Start the entire stack with one command:
   ```bash
   docker compose up -d
   ```

---

## 🎨 Coding & Commit Standards

1. **License**: All new source code files must comply with the **GNU GPL v3.0** license. Please add a copyright header at the top of important code files.
2. **Languages**:
   * Main application (Dashboard Next.js): Use **TypeScript/JavaScript**.
   * Utility scripts: Use **Bash** (`.sh`) or **Python**.
   * Documentation: Write in **English**.
3. **Issues/PRs**: Clearly describe the objective, how to test, and expected results.

---

Thank you for contributing to OpenDX-Lab and helping build a comprehensive open-source Digital Transformation solution!
