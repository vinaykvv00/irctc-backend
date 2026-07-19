# Initial Git Setup with Branching Strategy

Step-by-step guide to initialize your GitHub repo using professional Git workflow.

## 🎯 Initial Setup (One Time)

### Step 1: Initialize Git Locally

```powershell
# Navigate to project
cd c:\Users\z00542kh\Vinay\irctc-backend

# Initialize git repository
git init

# Check what will be committed
git status

# Add all files (respects .gitignore)
git add .

# Verify .env is ignored
git check-ignore -v user-service/.env
git check-ignore -v notification-service/.env
```

### Step 2: Create Initial Commit

```powershell
# Create first commit
git commit -m "chore(init): initialize project structure

- User service with JWT authentication
- OTP verification flow
- PostgreSQL database with Prisma
- Redis caching layer
- Kafka message broker
- Docker Compose infrastructure
- Comprehensive documentation

Excludes: notification-service (separate repository)"

# Verify commit
git log --oneline
```

### Step 3: Set Git Configuration

```powershell
# Configure your name and email
git config --global user.name "Your Name"
git config --global user.email "your_email@github.com"

# Verify configuration
git config --list
```

### Step 4: Create GitHub Repository

1. Go to https://github.com/new
2. Fill in:
   - **Repository name**: `irctc-backend`
   - **Description**: "IRCTC Backend - User Service with Authentication"
   - **Visibility**: `Public` or `Private`
3. **DO NOT** initialize with README/gitignore
4. Click **Create repository**

### Step 5: Add Remote and Set Main Branch

```powershell
# Add GitHub as remote (replace USERNAME)
git remote add origin https://github.com/USERNAME/irctc-backend.git

# Verify remote
git remote -v

# Rename branch to main (if needed)
git branch -M main

# Push initial commit
git push -u origin main

# Verify push
git branch -vv
```

### Step 6: Set Up Branch Protection (On GitHub)

1. Go to repository **Settings**
2. Click **Branches** (left sidebar)
3. Click **Add rule** under "Branch protection rules"
4. Branch name pattern: `main`
5. Enable:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
6. Click **Create**

---

## 📋 Ongoing Workflow (For Every Feature)

### Workflow Summary

```
main branch (production-ready, always stable)
    ↓
Create feature branch
    ↓
Make changes with clean commits
    ↓
Push to GitHub
    ↓
Create Pull Request
    ↓
Code review & discussion
    ↓
Merge to main
    ↓
Delete feature branch
```

### Complete Example: Adding New Feature

#### 1️⃣ Start New Feature

```powershell
# Ensure main is up to date
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/implement-password-reset
```

#### 2️⃣ Make Changes (Multiple Commits)

```powershell
# Change 1: Add service logic
git add src/service/auth.service.js
git commit -m "feat(auth): add password reset service

- Generate reset tokens using crypto
- Hash tokens before storing in DB
- Add 1-hour token expiration"

# Change 2: Add API routes
git add src/routes/auth.route.js
git commit -m "feat(auth): add password reset endpoints

- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- Validate email and token"

# Change 3: Add email template
git add src/templates/password-reset.html
git commit -m "feat(email): add password reset email template"

# View commits
git log --oneline -3
```

#### 3️⃣ Keep Branch Updated

```powershell
# If main was updated while you worked
git fetch origin
git rebase origin/main

# If there are conflicts, resolve them:
# - Edit conflicted files
# - git add .
# - git rebase --continue
```

#### 4️⃣ Push to GitHub

```powershell
# Push feature branch
git push -u origin feature/implement-password-reset

# Verify
git branch -vv
```

#### 5️⃣ Create Pull Request

**Option A: Via GitHub Web UI**

1. Go to your repository
2. Click **Pull requests** tab
3. Click **New pull request**
4. Set **Base**: `main`, **Compare**: `feature/implement-password-reset`
5. Add title: `feat(auth): implement password reset`
6. Add description with details
7. Click **Create pull request**

**Option B: Via GitHub CLI** (Faster)

```powershell
# Create PR directly
gh pr create --title "feat(auth): implement password reset" `
  --body "Implement complete password reset flow with email verification"

# View PR
gh pr view
```

#### 6️⃣ Code Review & Updates

```powershell
# If reviewers suggest changes:

# Make updates
git add src/service/auth.service.js
git commit -m "fix(auth): improve error handling in password reset"

# Push updates (automatically updates PR)
git push origin feature/implement-password-reset

# View PR status
gh pr status
```

#### 7️⃣ Merge to Main

```powershell
# Option A: Squash merge (recommended - keeps main clean)
gh pr merge --squash

# Option B: Regular merge (keeps all commits)
gh pr merge --merge

# Option C: Rebase merge (linear history)
gh pr merge --rebase
```

#### 8️⃣ Clean Up

```powershell
# Delete local branch
git branch -d feature/implement-password-reset

# Delete remote branch
git push origin --delete feature/implement-password-reset

# Update local main
git checkout main
git pull origin main

# View branch history
git log --oneline --graph
```

---

## 🔧 Common Commands

### Viewing Changes

```powershell
# View uncommitted changes
git diff

# View staged changes
git diff --cached

# View commits on current branch
git log --oneline -10

# View branch graph
git log --oneline --graph --all

# Compare branches
git diff main feature/my-feature
```

### Undoing Changes

```powershell
# Unstage a file
git restore --staged src/file.js

# Discard changes to a file
git restore src/file.js

# Undo last commit (before push)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Revert a specific commit
git revert abc1234
```

### Handling Conflicts

```powershell
# Fetch latest
git fetch origin

# Start rebase
git rebase origin/main

# If conflicts occur:
# 1. Open files and resolve conflicts (VS Code helps with this)
# 2. Stage resolved files
git add .

# 3. Continue rebase
git rebase --continue

# Or abort if needed
git rebase --abort
```

---

## 📊 Commit Message Examples

### Good Examples ✅

```
feat(auth): add email OTP verification
fix(login): resolve JWT token expiration bug
docs(readme): update installation instructions
refactor(middleware): simplify error handling
perf(db): optimize user query with indexing
test(auth): add OTP generation tests
chore(deps): update prisma to latest version
```

### Detailed Examples ✅

```
feat(auth): implement password reset

- Add forgot-password endpoint
- Generate secure reset tokens
- Send reset link via email
- Add 1-hour token expiration
- Validate tokens before processing

Closes #42
```

---

## 🚨 Important Rules

### ✅ DO

- ✅ Always pull main before creating branch
- ✅ Use descriptive branch names
- ✅ Make atomic commits (one feature per commit)
- ✅ Write clear commit messages
- ✅ Keep branches short-lived (< 1 week)
- ✅ Push regularly to GitHub
- ✅ Request code review before merge

### ❌ DON'T

- ❌ Never commit directly to main
- ❌ Never force push (git push -f)
- ❌ Never mix multiple features in one branch
- ❌ Never write vague commit messages
- ❌ Never leave uncommitted changes
- ❌ Never ignore merge conflicts

---

## 🎓 Learning Path

1. **Week 1**: Master basic commands (add, commit, push, pull)
2. **Week 2**: Practice branching and merging
3. **Week 3**: Get comfortable with PRs and code reviews
4. **Week 4**: Help others with Git workflows

---

## 🆘 Troubleshooting

### "fatal: repository not found"

```powershell
git remote -v
# Check GitHub username and token
```

### "Permission denied (publickey)"

```powershell
# Test SSH
ssh -T git@github.com

# Or use HTTPS instead
git remote set-url origin https://github.com/USERNAME/irctc-backend.git
```

### "Branch has conflicts"

```powershell
# Update from main
git fetch origin
git rebase origin/main
# Resolve conflicts in editor
git add .
git rebase --continue
```

### "Need to undo a push"

```powershell
# (Only if not yet merged to main)
git reset --hard abc1234
git push -f origin feature/branch
```

---

## 📚 Reference

See **GIT_BRANCHING_STRATEGY.md** for detailed explanations of:

- Git Flow vs GitHub Flow
- Conventional commits
- Professional workflows
- Best practices

---

**Now you're ready for professional Git development! 🚀**
