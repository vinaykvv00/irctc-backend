# Git Commands Quick Reference

Quick lookup for common Git commands used in professional workflows.

## 🚀 Getting Started

```bash
git config --global user.name "Your Name"
git config --global user.email "your_email@github.com"

git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/repo.git
git push -u origin main
```

## 🌿 Branch Operations

```bash
# List branches
git branch                    # Local branches
git branch -a                 # All branches (local + remote)
git branch -v                 # With last commit info

# Create branch
git checkout -b feature/name  # Create and switch
git branch feature/name       # Create only

# Switch branch
git checkout main
git switch develop            # Newer syntax

# Rename branch
git branch -m old-name new-name
git branch -m new-name        # Rename current

# Delete branch
git branch -d feature/name    # Safe delete
git branch -D feature/name    # Force delete
git push origin --delete feature/name  # Delete remote

# Check branch tracking
git branch -vv                # Show remote tracking
```

## 📝 Commit Operations

```bash
# Stage changes
git add .                     # Stage all
git add src/file.js           # Stage specific file
git add src/                  # Stage directory

# Commit
git commit -m "feat: description"
git commit -am "fix: description"  # Add + commit tracked files
git commit --amend            # Modify last commit
git commit --no-edit          # Use default merge message

# View commits
git log                       # Full log
git log --oneline             # One line per commit
git log --oneline -10         # Last 10 commits
git log --graph --all         # Branch graph
git log feature/name          # Commits on branch
```

## 🔄 Sync with Remote

```bash
# Fetch (download without merging)
git fetch origin              # Fetch all branches
git fetch origin main         # Fetch specific branch

# Pull (fetch + merge)
git pull origin main          # Pull from main
git pull --rebase             # Pull with rebase

# Push (upload commits)
git push origin feature/name  # Push branch
git push -u origin feature/name  # Push + set tracking
git push origin --delete feature/name  # Delete remote
git push --force              # Force push (careful!)
```

## 👀 View Changes

```bash
# Show differences
git diff                      # Unstaged changes
git diff --staged             # Staged changes
git diff main feature/name    # Between branches
git diff abc1234 def5678      # Between commits

# Show file status
git status                    # Current status
git status -s                 # Short format

# Show specific commit
git show abc1234              # Show commit details
git show abc1234:src/file.js  # Show file at commit

# Show file history
git log src/file.js           # History of file
git blame src/file.js         # Who changed what
```

## ↩️ Undo Changes

```bash
# Discard changes
git restore src/file.js       # Discard unstaged
git restore --staged src/file.js  # Unstage

# Undo commits
git reset --soft HEAD~1       # Undo, keep changes staged
git reset --mixed HEAD~1      # Undo, keep changes unstaged
git reset --hard HEAD~1       # Undo and discard changes
git revert abc1234            # Create new commit undoing changes

# Clean up
git clean -fd                 # Delete untracked files/dirs
```

## 🔀 Merge & Rebase

```bash
# Merge
git merge develop             # Merge develop into current
git merge --no-ff develop     # Merge with merge commit
git merge --squash develop    # Squash commits before merge

# Rebase
git rebase main               # Rebase on main
git rebase -i HEAD~3          # Interactive rebase last 3

# Handle conflicts
git status                    # Show conflicts
# Edit files in editor
git add .
git commit                    # Complete merge/rebase
# Or abort
git merge --abort
git rebase --abort
```

## 🏷️ Tags

```bash
# Create tag
git tag v1.0.0                # Lightweight tag
git tag -a v1.0.0 -m "Release 1.0.0"  # Annotated tag

# List tags
git tag
git tag -l "v1.*"

# Show tag
git show v1.0.0

# Delete tag
git tag -d v1.0.0
git push origin --delete v1.0.0

# Push tags
git push origin --tags        # Push all tags
git push origin v1.0.0        # Push specific tag
```

## 🎯 Advanced

```bash
# Cherry-pick commit
git cherry-pick abc1234       # Apply specific commit

# Stash changes
git stash                     # Save changes temporarily
git stash list                # List stashes
git stash pop                 # Apply and remove stash
git stash apply               # Apply without removing
git stash drop stash@{0}      # Delete specific stash

# Search commits
git log -S "search_text"      # Commits containing text
git log --grep="pattern"      # Commits with pattern in message
git log --author="name"       # Commits by author

# View reflog
git reflog                    # History of HEAD changes
git reset --hard abc1234      # Go back to specific state
```

## 🐙 GitHub CLI (gh)

```bash
# Pull Requests
gh pr create --title "Title" --body "Description"
gh pr view                    # View current PR
gh pr list                    # List all PRs
gh pr merge <number>          # Merge PR
gh pr merge --squash          # Squash merge
gh pr merge --rebase          # Rebase merge

# Issues
gh issue create --title "Title"
gh issue list
gh issue view <number>

# Repository
gh repo create name --public --source=.
gh repo view
gh repo clone owner/name
```

## 📊 Common Workflows

### Create and merge feature

```bash
git checkout main
git pull origin main
git checkout -b feature/name
# make changes
git add .
git commit -m "feat: description"
git push -u origin feature/name
# Create PR on GitHub
# After approval:
gh pr merge --squash
git checkout main
git pull origin main
git branch -d feature/name
```

### Sync with main while working

```bash
git fetch origin
git rebase origin/main
# Resolve conflicts if any
git push origin feature/name --force-with-lease
```

### Undo last commit (before push)

```bash
git reset --soft HEAD~1
# Make changes
git add .
git commit -m "new message"
```

### Undo last push (advanced)

```bash
# Find commit to revert to
git log --oneline
# Reset to that commit
git reset --hard abc1234
# Force push (only if not shared yet!)
git push -f origin main
```

---

## 🎨 Git Configuration Tips

```bash
# Set default editor
git config --global core.editor "code"

# Set diff tool
git config --global diff.tool vscode

# Pretty log alias
git config --global alias.lg "log --oneline --graph --all"
git lg  # Now works as shortcut

# Status alias
git config --global alias.s "status -s"
git s

# Add all + commit
git config --global alias.ac "!git add -A && git commit"
git ac -m "message"
```

## 🚨 Dangerous Commands

⚠️ **Use with extreme caution:**

```bash
git push -f origin main      # ❌ Force push to main - NEVER!
git reset --hard             # ❌ Permanent data loss
git clean -fd                # ❌ Deletes untracked files
```

---

**Bookmark this page for quick reference! 📚**
