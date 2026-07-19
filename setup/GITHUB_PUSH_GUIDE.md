# IRCTC Backend - GitHub Push Guide

This guide will help you push the IRCTC Backend project to GitHub securely and professionally.

## 📋 Pre-Push Checklist

- ✅ `.gitignore` created (excludes .env, node_modules, etc.)
- ✅ `.env.example` created for configuration template
- ✅ `.dockerignore` created for Docker builds
- ✅ `README.md` created with full documentation
- ✅ `CONTRIBUTING.md` created for contributors
- ✅ `notification-service` will be pushed separately

## 🔒 Security Verification

Run these commands to verify no sensitive data will be pushed:

```bash
# Check what will be committed
git status

# See what files are staged
git diff --cached

# Verify .env is NOT included
git check-ignore user-service/.env

# List files that would be committed
git ls-files
```

## 📝 Step-by-Step Push Instructions

### 1. Initialize Local Git Repository

```bash
# Navigate to project root
cd c:\Users\z00542kh\Vinay\irctc-backend

# Initialize git
git init

# Add all files (respects .gitignore)
git add .

# Verify files to be committed
git status
```

### 2. Create Initial Commit

```bash
git commit -m "feat: initial commit - IRCTC backend with user service

- User authentication with JWT and OTP verification
- PostgreSQL database with Prisma ORM
- Redis caching layer
- Kafka message broker integration
- Docker Compose infrastructure setup
- Comprehensive documentation and configuration templates

Excludes: notification-service (separate repository)"
```

### 3. Create GitHub Repository

**Via GitHub Web UI:**

1. Go to https://github.com/new
2. **Repository name**: `irctc-backend` (or your preferred name)
3. **Description**: "IRCTC Backend Services - User Authentication & Management"
4. **Visibility**: Select `Public` or `Private`
5. **DO NOT** initialize with README, .gitignore, or LICENSE (we already have these)
6. Click **Create repository**

### 4. Add Remote and Push

```bash
# Add GitHub as remote (replace USERNAME with your GitHub username)
git remote add origin https://github.com/USERNAME/irctc-backend.git

# Verify remote is added
git remote -v

# Push to GitHub main branch
git branch -M main
git push -u origin main
```

### 5. Verify Push Success

```bash
# Check remote tracking branch
git branch -vv

# Verify all commits pushed
git log --oneline -5
```

## 🔐 Using SSH Instead of HTTPS (Recommended)

For better security, use SSH instead of HTTPS:

```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add SSH key to your GitHub account:
# https://github.com/settings/ssh/new

# Use SSH remote instead
git remote remove origin
git remote add origin git@github.com:USERNAME/irctc-backend.git
git push -u origin main
```

## 🔄 After First Push - Regular Workflow

```bash
# Make changes and stage them
git add .

# Commit with clear message
git commit -m "feat(auth): add password reset functionality"

# Push to GitHub
git push origin main

# Create feature branch for new features
git checkout -b feature/new-feature
git add .
git commit -m "feat: implement new feature"
git push origin feature/new-feature

# Then create Pull Request on GitHub
```

## 📌 Branch Protection Rules (Optional)

Set up on GitHub repository settings:

1. Go to **Settings > Branches**
2. Add rule for `main` branch
3. Enable:
   - Require pull request reviews (2 reviewers)
   - Require status checks to pass
   - Require branches to be up to date

## 🔗 GitHub Workflow Tips

```bash
# View git log
git log --oneline

# See what changed
git diff main

# Undo last commit (before push)
git reset --soft HEAD~1

# View branches
git branch -a

# Delete local branch after merge
git branch -d feature/completed-feature

# Delete remote branch
git push origin --delete feature/completed-feature
```

## ⚠️ Critical Security Reminders

✅ **DO ensure:**

- `.env` is in `.gitignore` ✓
- `node_modules/` is in `.gitignore` ✓
- `.env.example` has no real credentials ✓
- `docker-compose.yml` doesn't expose passwords ✓

❌ **DO NOT push:**

- Real `.env` files
- API keys or secrets
- Personal credentials
- Large binary files (use .gitattributes for Git LFS)

## 🐛 Troubleshooting

### "fatal: repository not found"

```bash
# Verify you're using correct GitHub username
git remote -v

# Update remote URL if needed
git remote set-url origin https://github.com/CORRECT_USERNAME/irctc-backend.git
```

### "Permission denied (publickey)"

```bash
# Test SSH connection
ssh -T git@github.com

# If fails, re-add SSH key to ssh-agent
ssh-add ~/.ssh/id_ed25519
```

### "Updates were rejected because the tip of your current branch is behind"

```bash
# Pull latest changes first
git pull origin main

# Then push
git push origin main
```

## 📚 Useful GitHub CLI Commands

```bash
# Install GitHub CLI: https://cli.github.com/

# Create repo directly from CLI
gh repo create irctc-backend --public --source=. --remote=origin --push

# View repo info
gh repo view

# Create issue
gh issue create --title "Bug: login failing" --body "Description"

# Create pull request
gh pr create --title "Feature: add password reset" --body "Description"
```

## ✅ Final Verification Checklist

Before pushing, run:

```bash
# Check git status - should be clean or only have staged changes
git status

# Verify .env is ignored
git check-ignore -v user-service/.env

# Count commits
git log --oneline | wc -l

# See repository size
du -sh .git

# Verify no large files (>50MB)
find . -size +50M -type f

# Final dry-run
git push --dry-run origin main
```

---

**Happy pushing! 🚀**

For more help, visit: https://docs.github.com/en/get-started
