# Git Branching Strategy Guide

This guide teaches you professional Git workflows and branching strategies used in real-world projects.

## 📚 Table of Contents

1. [Branching Models](#branching-models)
2. [Conventional Commits](#conventional-commits)
3. [Git Flow Strategy](#git-flow-strategy)
4. [GitHub Flow Strategy](#github-flow-strategy)
5. [Recommended Workflow](#recommended-workflow)
6. [Practical Examples](#practical-examples)
7. [Best Practices](#best-practices)

---

## 🌳 Branching Models

### Model 1: Git Flow (Complex Projects)

Best for: Large teams, scheduled releases, multiple environments

```
main (production)
  └─ release/ branches
  └─ hotfix/ branches

develop (staging/development)
  └─ feature/ branches
  └─ bugfix/ branches
```

### Model 2: GitHub Flow (Simple, Fast)

Best for: Small teams, continuous deployment, fast iteration

```
main (always deployable)
  └─ feature/ branches
  └─ bugfix/ branches
```

### Model 3: Trunk-Based Development (Extreme Programming)

Best for: Highly experienced teams, microservices

```
main (always stable)
  └─ short-lived feature branches (max 1 day)
```

---

## 📝 Conventional Commits

Standardize your commit messages for better clarity and automation.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style (formatting, semicolons, etc.)
- **refactor**: Code refactoring without feature change
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build, dependencies, tooling
- **ci**: CI/CD configuration
- **revert**: Reverting a previous commit

### Examples

```
feat(auth): add email OTP verification
fix(login): resolve token expiration issue
docs(readme): update installation instructions
refactor(user-service): simplify auth middleware
perf(db): optimize user query with indexing
```

### Commit Body (Optional but Recommended)

```
feat(auth): add email OTP verification

- Implement OTP generation and validation
- Add 5-minute expiration timer
- Send OTP via email using Nodemailer
- Add OTP logging for debugging

Fixes #123
```

---

## 🔄 Git Flow Strategy

### Step 1: Initialize Main Branches

```bash
# Clone and setup
git clone https://github.com/USERNAME/irctc-backend.git
cd irctc-backend

# Create develop branch (if not exists)
git checkout -b develop main
git push -u origin develop
```

### Step 2: Create Feature Branch

```bash
# Always branch from 'develop'
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/user-authentication

# Or: feature/add-otp-verification
# Or: feature/implement-redis-caching
```

### Step 3: Work on Feature

```bash
# Make changes and commit with conventional commits
git add src/controllers/auth.controller.js
git commit -m "feat(auth): implement login endpoint

- Add email/password validation
- Generate JWT tokens
- Store session in Redis

Closes #42"

# Push feature branch
git push -u origin feature/user-authentication
```

### Step 4: Create Pull Request

On GitHub:

1. Go to your repository
2. Click "Pull requests" tab
3. Click "New pull request"
4. Set:
   - **Base**: `develop`
   - **Compare**: `feature/user-authentication`
5. Add title: `feat(auth): implement login endpoint`
6. Add description from commit body
7. Request reviewers
8. Click "Create pull request"

### Step 5: Code Review & Merge

```bash
# After approval, merge on GitHub or locally:
git checkout develop
git pull origin develop
git merge feature/user-authentication
git push origin develop

# Delete feature branch
git branch -d feature/user-authentication
git push origin --delete feature/user-authentication
```

### Step 6: Release Flow (when ready for production)

```bash
# Create release branch from develop
git checkout -b release/1.0.0 develop

# Update version numbers
# npm version minor  (or patch/major)

git commit -m "chore(release): bump version to 1.0.0"
git push -u origin release/1.0.0

# On GitHub: Create PR from release/1.0.0 to main
# After approval, merge and tag:

git checkout main
git merge release/1.0.0
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin main --follow-tags

# Back-merge to develop
git checkout develop
git merge main
git push origin develop

# Delete release branch
git branch -d release/1.0.0
git push origin --delete release/1.0.0
```

### Step 7: Hotfix Flow (for production bugs)

```bash
# Create hotfix from main
git checkout -b hotfix/security-patch main

# Fix the bug
git add .
git commit -m "fix(security): patch SQL injection vulnerability"

# Merge to main
git checkout main
git merge hotfix/security-patch
git tag -a v1.0.1 -m "Hotfix release 1.0.1"
git push origin main --follow-tags

# Back-merge to develop
git checkout develop
git merge main
git push origin develop

# Clean up
git branch -d hotfix/security-patch
git push origin --delete hotfix/security-patch
```

---

## 🚀 GitHub Flow Strategy (Recommended for Your Project)

Simpler than Git Flow, perfect for continuous deployment.

### Step 1: Create Feature Branch

```bash
# Always from main, keep branches short-lived
git checkout main
git pull origin main
git checkout -b feature/add-password-reset
```

### Step 2: Make Changes

```bash
git add .
git commit -m "feat(auth): implement password reset

- Add forgot-password endpoint
- Generate reset tokens
- Send reset link via email
- Add token expiration (1 hour)"

git push -u origin feature/add-password-reset
```

### Step 3: Create Pull Request

```bash
# Via GitHub CLI (faster)
gh pr create --title "feat(auth): implement password reset" \
  --body "Adds password reset functionality with email verification"

# Or manually on GitHub UI
```

### Step 4: Code Review

```bash
# Reviewers test and suggest changes
# Make updates if needed:
git add .
git commit -m "fix(auth): handle token validation edge case"
git push origin feature/add-password-reset
```

### Step 5: Merge to Main

```bash
# After approval, merge via GitHub UI or CLI
gh pr merge --squash  # Squash all commits into one

# Or merge normally (keeps commit history)
git checkout main
git pull origin main
git merge feature/add-password-reset
git push origin main

# Delete feature branch
git branch -d feature/add-password-reset
git push origin --delete feature/add-password-reset
```

---

## ✅ Recommended Workflow (For Your Project)

We recommend **GitHub Flow** with these enhancements:

### Branch Naming Convention

```
feature/description      - New features
bugfix/description       - Bug fixes
docs/description         - Documentation
refactor/description     - Code refactoring
perf/description         - Performance improvements
hotfix/description       - Production critical fixes
```

### Examples

```
feature/user-authentication
feature/add-email-otp
bugfix/fix-redis-connection
docs/update-api-docs
refactor/simplify-auth-middleware
perf/optimize-db-queries
hotfix/critical-security-patch
```

### Complete Workflow Example

```bash
# 1. Start new feature
git checkout main
git pull origin main
git checkout -b feature/implement-password-reset

# 2. Make changes (multiple commits)
git add src/services/auth.service.js
git commit -m "feat(auth): add password reset service

- Generate reset tokens
- Hash tokens before storing
- Add token validation"

git add src/routes/auth.route.js
git commit -m "feat(auth): add password reset endpoints

- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- Validate tokens and expiration"

git add src/templates/password-reset.html
git commit -m "feat(email): add password reset email template"

# 3. Push to GitHub
git push -u origin feature/implement-password-reset

# 4. Create PR (via GitHub or CLI)
gh pr create --title "feat(auth): implement password reset" \
  --body "Adds complete password reset flow with email verification"

# 5. Address review comments
git add src/services/auth.service.js
git commit -m "fix(auth): improve token validation error handling"
git push origin feature/implement-password-reset

# 6. Squash and merge
gh pr merge --squash

# 7. Delete local and remote branch
git branch -d feature/implement-password-reset
git push origin --delete feature/implement-password-reset

# 8. Update local main
git checkout main
git pull origin main
```

---

## 🎯 Practical Examples

### Example 1: Adding OTP Verification

```bash
# 1. Create branch
git checkout main
git pull origin main
git checkout -b feature/add-otp-verification

# 2. Implement in steps
git add src/utils/otp.js
git commit -m "feat(utils): add OTP generation utility

- Generate 6-digit OTP
- Set 5-minute expiration
- Use crypto for randomization"

git add src/service/auth.service.js
git commit -m "feat(auth): add OTP service methods

- sendOTP(email)
- verifyOTP(email, otp)
- expireOTP(email)"

git add src/routes/auth.route.js
git commit -m "feat(auth): add OTP verification endpoints

- POST /api/auth/send-otp
- POST /api/auth/verify-otp"

git add src/templates/otp-email.html
git commit -m "feat(email): create OTP email template"

# 3. Push and create PR
git push -u origin feature/add-otp-verification
gh pr create --title "feat(auth): add OTP verification" \
  --body "Implement email OTP for user registration verification"

# 4. After review merge
gh pr merge --squash
```

### Example 2: Fixing a Bug in Production

```bash
# 1. Create hotfix branch
git checkout main
git pull origin main
git checkout -b hotfix/fix-login-timeout

# 2. Fix the issue
git add src/config/jwt.js
git commit -m "fix(jwt): increase token timeout to prevent premature expiration

- Changed from 10m to 15m for access token
- Updated refresh token logic
- Added debug logging"

# 3. Push and create PR
git push -u origin hotfix/fix-login-timeout
gh pr create --title "fix(jwt): increase token timeout" \
  --body "Fixes issue where users get logged out too quickly"

# 4. Merge (fast-track for production fix)
gh pr merge --merge  # Use regular merge for hotfix

# 5. Tag release
git checkout main
git pull origin main
git tag -a v1.0.1 -m "Hotfix: Increase token timeout"
git push origin --follow-tags
```

### Example 3: Documentation Update

```bash
git checkout main
git pull origin main
git checkout -b docs/update-setup-guide

git add docs/setup/README.md
git commit -m "docs(setup): update installation steps for Node 20"

git add docs/concepts/authentication.md
git commit -m "docs(auth): clarify JWT token flow with diagram"

git push -u origin docs/update-setup-guide
gh pr create --title "docs: update setup guide for Node 20" \
  --body "Update installation instructions and add clarifications"

# Merge when ready
gh pr merge --squash
```

---

## 🏆 Best Practices

### ✅ DO

```bash
# 1. Pull before starting
git checkout main
git pull origin main

# 2. Create descriptive branch names
git checkout -b feature/implement-user-role-system

# 3. Make atomic commits (one logical change per commit)
git commit -m "feat(user): add role-based access control"

# 4. Write meaningful commit messages
git commit -m "fix(auth): resolve token validation bug

- Check token expiration before processing
- Add proper error logging
- Return 401 for expired tokens"

# 5. Push regularly
git push origin feature/branch-name

# 6. Keep branches short-lived (< 1 week)
# 7. Keep branches up to date with main
git fetch origin
git rebase origin/main

# 8. Review your own PR before requesting review
gh pr view  # Check all changes

# 9. Use squash merge to keep main history clean
gh pr merge --squash
```

### ❌ DON'T

```bash
# 1. Don't work directly on main
git checkout -b feature/... # Always create branch

# 2. Don't write vague commit messages
git commit -m "fix stuff"  # ❌ Bad
git commit -m "fix(auth): resolve JWT token validation"  # ✅ Good

# 3. Don't mix multiple features in one branch
# Keep one feature per branch

# 4. Don't force push to main (ever!)
git push -f origin main  # ❌ NEVER DO THIS

# 5. Don't leave long-lived branches
# Merge within a week

# 6. Don't ignore merge conflicts
# Resolve locally before pushing:
git merge origin/main
# Fix conflicts in editor
git add .
git commit -m "merge: resolve conflicts"
```

---

## 📊 Visualizing Branch History

```bash
# View branch graph
git log --oneline --graph --all

# Output example:
# * abc1234 (HEAD -> main) feat: add password reset
# * def5678 fix: improve token validation
# * ghi9101 docs: update README
# * jkl1112 (tag: v1.0.0) Release version 1.0.0

# View specific branch history
git log main --oneline

# Show branches with last commit
git branch -v
```

---

## 🔗 GitHub CLI Cheat Sheet

```bash
# Create and push PR in one command
gh pr create --title "feat: new feature" --body "Description" --head feature/new-feature

# Merge PR
gh pr merge <number> --squash

# List all PRs
gh pr list

# View PR details
gh pr view <number>

# Check PR status
gh pr status

# Create issue from PR
gh issue create --title "Bug found" --body "From PR review"
```

---

## 📚 Learning Resources

- **Official Git Docs**: https://git-scm.com/doc
- **GitHub Flow Guide**: https://guides.github.com/introduction/flow/
- **Git Flow**: https://nvie.com/posts/a-successful-git-branching-model/
- **Conventional Commits**: https://www.conventionalcommits.org/
- **GitHub CLI Docs**: https://cli.github.com/manual

---

## 🚀 Next Steps

1. Set up branch protection rules on GitHub
2. Enable required PR reviews before merge
3. Set up status checks (linting, testing)
4. Create `.gitignore` and `.env.example` (✅ Already done!)
5. Start using this workflow for all changes

---

**Ready to use professional Git workflows! 🎉**
