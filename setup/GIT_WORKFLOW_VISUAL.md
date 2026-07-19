# Git Workflow Visual Guide

Visual representation of professional Git workflows and branching strategies.

## 🎬 GitHub Flow (Recommended for Your Project)

The simplest and most modern workflow, perfect for continuous deployment.

### Visual Flow

```
main (always production-ready)
  │
  ├─────────────────────────────┐
  │                             │
  │  (1) Create branch          │
  ▼                             │
feature/password-reset          │
  │                             │
  ├─ commit: feat: add reset    │
  ├─ commit: fix: validation    │
  ├─ commit: docs: update       │
  │                             │
  │  (2) Create PR              │
  │  (3) Code review            │
  │  (4) Merge                  │
  │                             │
  └─────────────────────────────┘
  │
  ▼
main (updated, production-ready)
```

### Complete Timeline Example

```
MAIN BRANCH:
v1.0.0
  │
  ├─────────────────────────────────────┐
  │                                     │
FEATURE WORK (parallel to main):        │
  │ feature/add-otp                     │
  │  ├─ Add OTP service                 │
  │  ├─ Add OTP endpoints               │
  │  ├─ Add email template              │
  │  └─ Create Pull Request             │
  │                                     │
  ├─────────────────────────────────────┘
  │
REVIEW & MERGE:
  └─ ✓ Approved by reviewer
  └─ ✓ All checks passed
  └─ ✓ Merged to main
  │
  ▼
main
v1.0.1 (new feature included)
```

---

## 🔀 Git Flow (For Complex Projects)

More structured workflow with separate develop and main branches.

### Branch Structure

```
MAIN (Production)
├─ v1.0.0 ──┐
├─ v1.1.0 ──┤
├─ v2.0.0 ──┼─ Merges only from release/ and hotfix/
└─ ...     │
           │
DEVELOP (Staging)
├─ Merges from feature/ branches
├─ Source for release/ branches
└─ Updated from main (hotfix backmerge)
│
├──────────────────────────────────┐
│                                  │
FEATURES (Work in Progress)         │
├─ feature/auth                     │
├─ feature/payments                 │
├─ feature/notifications            │
│                                  │
└──────────────────────────────────┘
│
RELEASES (Prepare for production)
├─ release/1.0.0 ─────┐
├─ release/1.1.0 ─────┼─ Tag version, merge to main
├─ release/2.0.0 ─────┘
│
HOTFIXES (Emergency fixes)
├─ hotfix/security-patch ────┐
├─ hotfix/critical-bug ───────┼─ Branch from main
├─ hotfix/data-loss ──────────┘
```

### Complete Git Flow Example

```
Timeline:
─────────────────────────────────────────────────────────────────

MAIN:     v1.0.0
           │
           ├─────────────────────────────────────────────┐
           │                                             │
DEVELOP:  (based on v1.0.0)                              │
           │                                             │
           ├─ feature/auth                               │
           │  ├─ commit                                 │
           │  ├─ commit                                 │
           │  └─ merged to develop                      │
           │                                             │
           ├─ feature/payments                           │
           │  ├─ commit                                 │
           │  └─ merged to develop                      │
           │                                             │
           ├─ release/1.1.0 (branch from develop)       │
           │  ├─ Version bump                           │
           │  ├─ Bug fixes                              │
           │  └─ merged to main as v1.1.0               │
           │  └─ back-merged to develop                 │
           │                                             │
           └─────────────────────────────────────────────┘
           │
MAIN:      v1.1.0 (release complete)
           │
           ├─────────────────────────────────────────────┐
           │                                             │
DEVELOP:  (continue with new features)                   │
           │                                             │
           ├─ feature/users                              │
           │  ├─ commit                                 │
           │  ├─ commit                                 │
           │  └─ merged to develop                      │
           │                                             │
           ├─ hotfix/security (branch from main v1.1.0) │
           │  ├─ Security patch                         │
           │  └─ merged to main as v1.1.1               │
           │  └─ back-merged to develop                 │
           │                                             │
           └─────────────────────────────────────────────┘
           │
MAIN:      v1.1.1 (after hotfix)
```

---

## 📊 Commit History Visualization

### Clean History with Squash Merge

```
Feature work:
  ├─ Fix typo
  ├─ Implement feature
  ├─ Update tests
  ├─ Fix review comments
  └─ Squash merge to main

Result on main:
  └─ Single commit: "feat(auth): add password reset"

(Clean, readable history)
```

### Detailed History with Regular Merge

```
Feature work:
  ├─ Implement feature
  ├─ Add tests
  └─ Fix review comments

Result on main:
  ├─ Merge commit (merge-message)
  ├─ Implement feature
  ├─ Add tests
  └─ Fix review comments

(Detailed history, shows all work)
```

---

## 🔄 Branch Lifecycle

### Single Feature Branch Lifecycle

```
Step 1: CREATE
─────────────────────────────────────
$ git checkout -b feature/password-reset

main: ──────────────────────────────
       ↓
feature/password-reset: [created]

Step 2: DEVELOP
─────────────────────────────────────
$ git commit -m "feat: add password reset"
$ git push origin feature/password-reset

main: ────────────────────────────────
       ↓
feature/password-reset: ──●──●──●──

Step 3: PULL REQUEST
─────────────────────────────────────
[PR created on GitHub]
[Code review in progress]

main: ────────────────────────────────
       ↓
feature/password-reset: ──●──●──●──●
                        (awaiting merge)

Step 4: MERGE
─────────────────────────────────────
$ gh pr merge --squash

main: ──────────●────────────────────
       ↓        (merged)
feature/password-reset: [deleted]

Step 5: CLEANUP
─────────────────────────────────────
$ git branch -d feature/password-reset

(branch history shown in main commit)
```

---

## 🌐 Multi-Developer Workflow

### Two Developers Working Simultaneously

```
Developer A                          Developer B
────────────                        ────────────

git checkout main                   git checkout main
git pull origin main                git pull origin main

git checkout -b                     git checkout -b
  feature/auth                        feature/payments

Make commits...                     Make commits...

Push branch:                        Push branch:
git push -u origin                  git push -u origin
  feature/auth                        feature/payments

                    main (on GitHub)
                        │
                    ┌───┴───┐
                    │       │
                  PR-1    PR-2
              (feature/auth) (feature/payments)
                    │       │
              Review OK    Review OK
                    └───┬───┘
                        │
                ✓ Merge both to main
                        │
                    main (updated)
                   ┌─────────┐
                   │         │
                ● feature/auth
                   (merged)

                ● feature/payments
                   (merged)
```

---

## 🆚 Comparing Branch States

### Before and After PR

```
BEFORE PR (feature branch):
─────────────────────────────────
main (GitHub):     ●───●───●

feature/password-reset: ●───●───●

difference:        3 commits ahead


AFTER PR (merged to main):
─────────────────────────────────
main (GitHub):     ●───●───●───●
                           ↑
                      (merged commit)

feature/password-reset: [deleted]

difference:        0 commits (aligned)
```

---

## 🎯 Conflict Resolution Flow

### Handling Merge Conflicts

```
Developer A                          Developer B
────────────                        ────────────
Push feature/auth ───┐
                     │
                  main updated
                     │
Push feature/payments─┤
                     │
Pull both branches   │
                     └──→ Conflict!

main: ...●───●───●
          │
feature/payments:
       ...●───●───●
                 ↑
           (conflict here)

RESOLUTION:
──────────
$ git merge origin/main
  (conflicts shown)

Edit conflicted files:
  ▼▼▼ from main
  ═══════════════
  ▲▲▲ from feature/payments

$ git add .
$ git commit -m "merge: resolve conflicts"
$ git push origin feature/payments

Now ready to merge!
```

---

## 🚀 Release Process Flow

### From Development to Production

```
DEVELOPMENT PHASE:
──────────────────
develop: ●─●─●─●─●
         (features accumulate)

RELEASE PHASE:
──────────────────
release/1.0.0: (branch from develop)
  │
  ├─ Version bump
  ├─ Final testing
  ├─ Bug fixes
  └─ Tag v1.0.0

PRODUCTION PHASE:
──────────────────
main:    ●─●─●─●[v1.0.0]
              ↑
         (merged from release)

MAINTENANCE PHASE:
──────────────────
develop: ●─●─●─●─● (continue)
         (back-merged from main)

NEW DEVELOPMENT:
──────────────────
develop: (ready for next features)
```

---

## 📋 Command Sequence Diagrams

### Feature Branch Complete Sequence

```
1. Start
   $ git checkout main
   $ git pull origin main

2. Create feature
   $ git checkout -b feature/add-users

3. Make changes
   $ git add src/models/user.js
   $ git commit -m "feat(user): add user model"
   $ git add src/routes/user.route.js
   $ git commit -m "feat(user): add user routes"

4. Push branch
   $ git push -u origin feature/add-users

5. Create PR
   $ gh pr create --title "feat(user): add user model and routes"

6. Code review (on GitHub)
   [Reviewers check]
   [Discussions, suggestions]

7. Update if needed
   $ git add src/models/user.js
   $ git commit -m "fix(user): improve validation"
   $ git push origin feature/add-users

8. Merge
   $ gh pr merge --squash

9. Clean up
   $ git branch -d feature/add-users
   $ git push origin --delete feature/add-users

10. Update local
    $ git checkout main
    $ git pull origin main
```

---

## 🎨 Branch Color Legend

In Git visualizations:

```
● = commit
─ = branch line
* = tag
◆ = merge commit
┬ = branch split
┴ = branch merge
```

---

## 📚 When to Use Which Strategy

### GitHub Flow (✅ Recommended for your project)

```
When to use:
- Small to medium teams
- Continuous deployment
- Fast iteration cycles
- All features go to main

Your project: ✓ User service
             ✓ Notification service
             ✓ Quick releases
```

### Git Flow

```
When to use:
- Large teams
- Planned releases
- Multiple versions in maintenance
- Complex deployment process

Your project (later):
- If you need parallel release versions
- If you have scheduled releases
```

---

**Visualize your workflow to code better! 📊**
