---
description: "Create pull requests — open PR, create PR, push for review. Structured descriptions with plan docs, Linear links, decisions, alternatives. Not for reviewing PRs (use /pr-review) or committing (use /commit)."
---

# Pull Request

Create a pull request for a complete feature with a structured, decision-exposing description.

## Context

Learnings from previous usage (edge cases, patterns, preferences) are auto-merged into this file during sync. To add new learnings, edit the source `LEARNINGS.md` in this skill's folder in the minions repo.

## Core Principles

```
1. ONE PR PER FEATURE  - All sub-tasks ship together in a single PR
2. DECISIONS OVER DIFFS - The PR description explains WHY, the diff shows WHAT
3. LINK TO CONTEXT      - Every PR connects to its plan doc and Linear issue
4. REVIEWER EFFICIENCY  - A reviewer should understand the PR in 2 minutes without reading every line
```

---

## Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   GATHER    │ ──▶ │   WRITE     │ ──▶ │   CREATE    │ ──▶ │   LINK      │
│             │     │             │     │             │     │             │
│ • Full diff │     │ • Title     │     │ • gh pr     │     │ • Linear    │
│ • Plan doc  │     │ • Body      │     │ • Push      │     │ • Impl doc  │
│ • Linear    │     │ • Decisions │     │ • Labels    │     │ • Status    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

---

## Step 0: DETECT Task Type

**Before gathering context, determine the task type:**

1. **Read plan/scope doc** at `docs/plans/` — check the `Type:` field (Feature / Enhancement / Bug Fix)
2. **Check branch name prefix:** `feature/` → Feature, `enhance/` → Enhancement, `fix/` → Bug Fix
3. **Check PR title prefix** if already created: `feat(feature)`, `feat(enhancement)`, `fix(bug-fix)`
4. **If none work:** Ask the engineer

This type determines the PR title format, body emphasis, and which sections to include.

---

## Step 1: GATHER Context

### 1.1 Review All Changes

```bash
# Full diff from the feature branch (use TARGET_BRANCH from Step 3.1 detection)
# If target branch not yet determined, default to main
git status
git diff --stat origin/main...HEAD
git log --oneline origin/main...HEAD
```

Understand the complete scope:
- Total commits on this branch
- All files changed across all sub-tasks
- Overall size of the feature

### 1.2 Find the Plan Doc

```bash
ls docs/plans/
```

If a plan doc exists, read it. Extract:
- Feature overview and flow
- All sub-tasks and their status
- Architecture decisions made during planning
- Edge cases identified

### 1.3 Find the Linear Parent Issue

Look for the parent issue identifier in:
1. Branch name (e.g., `feature/ENG-123-call-analysis`)
2. Plan doc header
3. Ask the engineer if not found

Fetch the parent issue and all sub-issues using Linear MCP tools.

---

## Step 2: WRITE PR Description

### 2.1 Title

```
{type}({task-type}): {description} (max 70 chars)
```

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`
Task type tag: `feature`, `enhancement`, `bug-fix`

Examples:
- `feat(feature): call analysis pipeline with transcription and LLM`
- `feat(enhancement): optimize WhatsApp message batching for scale`
- `fix(bug-fix): duplicate webhook handling across all channels`
- `refactor(enhancement): simplify customer query pipeline`

### 2.2 Body Structure

The PR covers the entire feature. Structure the body to guide the reviewer through it:

```markdown
## Summary
{2-4 bullet points explaining WHAT this does and WHY}

## Task Type
**{Feature | Enhancement | Bug Fix}**

## Linear
[ENG-123](https://linear.app/riverline/issue/ENG-123) {use actual issue ID and URL from Linear MCP}

## Plan
`docs/plans/{name}.md`

## What's Included
{Group changes by sub-task so the reviewer can follow the logical structure}

### {Sub-task 1 title} (ENG-124)
- {What was built/changed/fixed}
- Files: `path/to/file.ts`, `path/to/other.ts`

### {Sub-task 2 title} (ENG-125)
- {What was built/changed/fixed}
- Files: `path/to/file.ts`

---
{Include the sections below based on task type}

### FOR FEATURES — include all of these:

## Architecture
{How the pieces fit together — data flow, service interactions}

## Diagrams
{Copy Mermaid diagrams from plan doc}

## Decisions Made
| Decision | Choice | Alternatives Considered | Reasoning |
|----------|--------|------------------------|-----------|
| {what} | {choice} | {alternatives} | {reasoning} |

## Edge Cases Handled
| Scenario | Handling |
|----------|----------|
| {edge case} | {how it's handled} |

### FOR ENHANCEMENTS — include these instead:

## What Changed
| Before | After | Why |
|--------|-------|-----|
| {old behavior} | {new behavior} | {reason for change} |

## Backward Compatibility
{Breaking changes: none / list}
{Data migration: not needed / describe}

## Impact Assessment
{What other features/consumers are affected by this change}

### FOR BUG FIXES — include these instead:

## Root Cause
{What caused the bug — from the fix doc}

## Fix Description
{What was changed to fix it}

## Regression Test
{Test that verifies the bug is fixed and won't return}

## What Could Break
{Areas to watch — could this fix have side effects?}

---

## Testing

### Tests Written
| Test File | What It Tests | Type |
|-----------|-------------|------|
| `{path/to/test.test.ts}` | {behavior tested} | Unit / Integration |

### TDD Trail
{Describe how TDD was followed during implementation:}
- What tests were written first
- What failed initially and how the implementation made them pass
- Any test issues encountered and how they were resolved (e.g., mocking challenges, flaky tests, unexpected behavior discovered)

### Test Run Results
```
{Paste the test output summary, e.g.:}
Test Suites: X passed, X total
Tests:       X passed, X total
Time:        X.XXs
```

### Coverage Gaps (if any)
{List anything that was NOT tested and why — e.g., "Thin route wrapper not tested — only delegates to service" or "Third-party API integration not unit tested — will be covered in manual QA"}

---

## Gru Review Summary
{Auto-generated from .gru/review-log.jsonl — see instructions below}

## How to Review
{Guide the reviewer through the PR in order}
1. Start with {file/area} — this is the core logic
2. Then check {file/area} — this wires everything together
3. {file/area} is mechanical/boilerplate, skim it

## Test Plan
- [ ] {How to verify the happy path}
- [ ] {Edge case to test}
- [ ] {Regression to check}
```

### 2.3 Gru Review Summary

**MANDATORY: Include full Gru review context in every PR.**

Read the Gru review log at `.gru/review-log.jsonl`. Each line is a JSON object with: `timestamp`, `commit`, `commitMessage`, `verdict`, `linesChanged`, `files`, `findings` (array), `summary`, `quizScore`, `quizResults`, `quizQA` (array of Q&A objects), `path`.

The `quizQA` array contains the actual questions asked and developer answers:
```json
[{
  "question": "What happens if two payments process simultaneously?",
  "category": "concurrency",
  "answer": "We use queue-based processing with BullMQ",
  "verdict": "PASS",
  "expectedAnswer": "..."
}]
```
**Include quiz Q&A in the PR description** when present — this shows the reviewer what the developer understood about the risks and how they justified their approach. It also documents decisions that should be captured in the PR.

Also check commit trailers:
```bash
# Find commits missing Gru-Reviewed trailer (use TARGET_BRANCH)
git log --format="%H" origin/$TARGET_BRANCH..HEAD | while read hash; do
  if ! git log -1 --format="%B" "$hash" | grep -q "Gru-Reviewed:"; then
    echo "$(git log -1 --format='%h %s' $hash)"
  fi
done
```

Generate the `## Gru Review Summary` section with FULL context:

```markdown
## Gru Review Summary

### Overview
- **Total commits:** {N}
- **All reviewed:** {Yes / No — N missing}
- **Review path:** {husky (AI review) / claude-hook (static checks) / mixed}

### Per-Commit Review

#### `abc1234` — (feat): add payment retry logic
- **Verdict:** PASS
- **Lines:** 42 | **Files:** `customer.service.ts`, `payment.retry.ts`
- **Findings:** None
- **Quiz:** n/a

#### `def5678` — (feat): add payment schema fields
- **Verdict:** CONDITIONAL_PASS
- **Lines:** 856 | **Files:** `payment.schema.ts`, `payment.crud.ts`, `payment.route.ts`
- **Findings:**
  - [WARNING] `payment.crud.ts:45` — Missing .lean() on read query → Fixed in next commit
  - [WARNING] `payment.route.ts:12` — Import order: relative import before alias import
- **Quiz:** 3/4 passed, 1 acknowledged
  - **Q&A:**
    - [PASS] "What happens if the transcription API times out mid-call?" → "BullMQ retries with exponential backoff, 3 attempts max, then marks as failed and alerts via Sentry"
    - [PASS] "How do you prevent duplicate processing if the webhook fires twice?" → "Idempotency key on the call ID — processor checks if analysis already exists before starting"
    - [PASS] "What's the rollback strategy if the LLM analysis produces garbage?" → "Analysis is stored with a confidence score, flagged for human review below 0.7"
    - [FAIL (acknowledged)] "What happens if two payments process simultaneously?" → Developer acknowledged concurrency risk, deferred to queue-based processing

#### `ghi9012` — (fix): handle null customer in retry
- **Verdict:** PASS (claude-hook — static checks only)
- **Lines:** 15 | **Files:** `payment.retry.ts`
- **Findings:** None
- **Quiz:** n/a (Claude Code commit)

### Findings Summary

| Severity | Count | Status |
|----------|-------|--------|
| BLOCK | 0 | — |
| WARNING | 2 | 1 fixed in subsequent commit, 1 minor (import order) |
| Quiz acknowledged | 1 | Concurrency risk — deferred to queue design |

### Missing Trailers
{If any commits lack Gru-Reviewed trailer:}
- `jkl3456` — (chore): quick config tweak — **BYPASSED** (no Gru review)

{If none missing:}
All commits have Gru-Reviewed trailer.
```

**Key rules for generating this section:**

1. **Read every line** in `.gru/review-log.jsonl` — each line maps to a review attempt (including BLOCKed attempts that were retried)
2. **Group by commit hash** — a commit may have multiple log entries (BLOCK → fix → PASS). Show the final verdict but mention if earlier attempts were blocked
3. **Include ALL findings** — even warnings on passing commits. The reviewer needs to see what Gru flagged
4. **Include quiz details** — what questions were asked, what was acknowledged, what risks the developer accepted
5. **Cross-reference trailers** — independently verify via git log, don't trust the log file alone
6. **If no log file exists:** State that Gru was not active during development. Flag all commits as unreviewed

**If log file is missing:**
```markdown
## Gru Review Summary

No Gru review log found (`.gru/review-log.jsonl` does not exist). Commits were made before Gru was enabled or the log was deleted.

All {N} commits lack Gru-Reviewed trailer — manual review required for entire PR.
```

### 2.4 Decision Documentation

**This is the most important section.** Document every non-obvious choice:

| Type | Example |
|------|---------|
| Architecture | "Chose BullMQ over cron because processing time varies" |
| Data model | "Added field to Call schema instead of new collection for simpler queries" |
| Library choice | "Used zod over joi because existing validation uses zod" |
| Error handling | "Retry 3x with backoff instead of failing immediately because API is flaky" |
| Pattern | "Followed emailAutomation.service.ts pattern for consistency" |

### 2.4 Adapt Based on Task Type

| Task Type | PR Emphasis |
|-----------|-------------|
| **Feature** | Architecture diagrams, data flow, all decisions, full sub-task breakdown |
| **Enhancement** | What exists vs what changed, backward compatibility, impact on existing users |
| **Bug Fix** | Root cause analysis, fix description, regression test, areas to watch |

---

## Step 3: CREATE the PR

### 3.1 Detect Target Branch

**Determine which branch this PR targets. Only `main` and `develop` are valid targets.**

```bash
# Check if develop branch exists on remote
git fetch origin
DEVELOP_EXISTS=$(git ls-remote --heads origin develop | wc -l | tr -d ' ')
```

**Detection order:**
1. **Engineer specifies it** — if they say "PR to develop", use `develop`
2. **Branch naming convention** — `feature/*`, `fix/*`, `enhance/*` → target `develop` if it exists, otherwise `main`
3. **Default** — `main`

Store the target for all subsequent steps:
```bash
TARGET_BRANCH="main"  # or "develop"
```

### 3.2 Pre-Rebase Safety Checks

**Before touching the branch, ensure a safe state.**

```bash
# 1. Check for uncommitted work
git status --porcelain
```

**If working tree is dirty:**
```bash
git stash push -m "pre-pr-rebase-$(date +%s)"
echo "[WARN] Stashed uncommitted changes. Will restore after PR creation."
```

**If there are staged but uncommitted changes:** Ask the engineer whether to commit or stash them. Do NOT silently discard.

```bash
# 2. Check if anyone else pushed to this feature branch
git fetch origin $(git branch --show-current) 2>/dev/null
LOCAL_HEAD=$(git rev-parse HEAD)
REMOTE_HEAD=$(git rev-parse origin/$(git branch --show-current) 2>/dev/null || echo "")

if [ -n "$REMOTE_HEAD" ] && [ "$LOCAL_HEAD" != "$REMOTE_HEAD" ]; then
    AHEAD=$(git rev-list --count origin/$(git branch --show-current)..HEAD)
    BEHIND_FEATURE=$(git rev-list --count HEAD..origin/$(git branch --show-current))
    echo "Local is $AHEAD ahead, $BEHIND_FEATURE behind remote feature branch"
fi
```

**If feature branch has remote commits not in local:**
```
[WARN] Your feature branch has {N} remote commits not in your local branch.
Someone else may have pushed to this branch.

Options:
1. Pull remote changes first (git pull origin {branch}) — safe, preserves their work
2. Proceed with rebase — will rewrite their commits (dangerous if they're still working)

Which do you prefer?
```

**Always pull remote feature branch changes before rebasing onto target.** Never rebase when someone else's unpulled commits exist on the feature branch.

```bash
# 3. Create a recovery tag (so we can rollback if rebase goes wrong)
git tag -f pre-pr-rebase
echo "Created recovery point: pre-pr-rebase"
```

### 3.3 Sync with Target Branch & Resolve Conflicts

**Fetch the target branch and check divergence.**

```bash
# Fetch latest target
git fetch origin $TARGET_BRANCH

# Check divergence
BEHIND=$(git rev-list --count HEAD..origin/$TARGET_BRANCH)
AHEAD=$(git rev-list --count origin/$TARGET_BRANCH..HEAD)
echo "$AHEAD commits ahead, $BEHIND commits behind origin/$TARGET_BRANCH"
```

**Show what changed on the target branch** (so the engineer knows what they're rebasing onto):

```bash
if [ "$BEHIND" -gt 0 ]; then
    echo "=== Changes on $TARGET_BRANCH since you branched ==="
    git log --oneline HEAD..origin/$TARGET_BRANCH
    echo ""
    echo "=== Files changed on $TARGET_BRANCH ==="
    git diff --stat HEAD...origin/$TARGET_BRANCH
fi
```

**If behind (BEHIND > 0), rebase onto the target branch:**

```bash
git rebase origin/$TARGET_BRANCH
```

**If rebase has conflicts:**

1. List conflicting files:
```bash
git diff --name-only --diff-filter=U
```

2. For each conflicting file:
   - **Read the full file** to understand both sides of the conflict
   - **Read the target branch's version** to understand what changed and why:
     ```bash
     git show origin/$TARGET_BRANCH:{file-path}
     ```
   - **Read the feature branch's version** to understand your changes:
     ```bash
     git show HEAD:{file-path}
     ```
   - Resolve by **integrating both sides** — keep the target branch's structural changes AND your feature's new code
   - **Never blindly accept one side** — understand what changed on the target and why

3. After resolving each file:
```bash
git add {resolved-file}
```

4. Continue the rebase:
```bash
git rebase --continue
```

5. If conflicts are too complex to resolve confidently:
```bash
git rebase --abort
```
Then flag to the engineer:
```
[WARN] Merge conflicts with {TARGET_BRANCH} are too complex to auto-resolve.
Conflicting files:
- {file1} — {describe both sides: what target changed vs what feature changed}
- {file2} — {describe both sides}

Recovery point: git checkout pre-pr-rebase
Please resolve manually or pair on this.
```

### 3.4 Post-Rebase Verification

**MANDATORY: After rebase completes, verify that the target branch's changes are still intact.**

```bash
# 1. Check that no files from the target branch were accidentally dropped
TARGET_FILES=$(git diff --name-only HEAD~$BEHIND..origin/$TARGET_BRANCH 2>/dev/null)
for file in $TARGET_FILES; do
    # Compare each file that was changed on target branch
    # The rebased version should contain the target's changes
    git diff origin/$TARGET_BRANCH -- "$file"
done
```

**For each file that was changed on BOTH branches (the conflict zone):**
- Read the rebased version
- Verify the target branch's changes are present (not just your feature's changes)
- If anything looks dropped, flag it:

```
[WARN] POST-REBASE AUDIT FAILED

The following files may have lost changes from {TARGET_BRANCH}:
- {file} — {TARGET_BRANCH} added {description}, but rebased version is missing it
- {file} — {TARGET_BRANCH} modified {description}, but rebased version has the old code

Recovery: git checkout pre-pr-rebase
```

**If the audit passes**, clean up the recovery tag:
```bash
git tag -d pre-pr-rebase 2>/dev/null
```

### 3.5 Push Branch

```bash
git push -u origin $(git branch --show-current)
# If rebased, may need force push:
git push -u origin $(git branch --show-current) --force-with-lease
```

**Always use `--force-with-lease`** (never `--force`) when force pushing after rebase — it protects against overwriting someone else's pushes.

**If force push fails with `--force-with-lease`:** Someone pushed to the feature branch while you were rebasing. Do NOT use `--force`. Go back to Step 3.2 and pull their changes first.

**Restore stash if one was created:**
```bash
if git stash list | grep -q "pre-pr-rebase"; then
    git stash pop
    echo "Restored stashed changes."
fi
```

### 3.6 Get the Linear Issue URL

Before creating the PR, fetch the Linear issue URL to include in the PR body:

```
Use get_issue MCP tool to get the parent issue details
Extract the issue URL (e.g., https://linear.app/riverline/issue/ENG-123)
Use this URL in the PR body's ## Linear section
```

### 3.7 Create PR with gh CLI

```bash
gh pr create \
  --base $TARGET_BRANCH \
  --title "{type}: {feature description}" \
  --body "$(cat <<'EOF'
{full body from step 2, with Linear URL}

---
_Created with `/pr` skill_
EOF
)"
```

**Always specify `--base`** to ensure the PR targets the correct branch. Never rely on the default.

After creation, capture the PR URL from the `gh pr create` output — you'll need it for the Linear update.

### 3.8 Set PR Metadata

```bash
# Add labels if applicable
gh pr edit --add-label "feature"

# Add reviewers if engineer specifies
gh pr edit --add-reviewer {username}
```

---

## Step 4: LINK Back

### 4.1 Update Linear Parent Issue with Implementation Doc

Use Linear MCP `update_issue` to update the **parent issue** description with a full implementation section. This turns the Linear issue into the complete record — plan + implementation.

**Append to the parent issue description:**

```markdown
---

## Implementation

**PR:** [#{pr_number} — {pr_title}]({github_pr_url})
**Branch:** {branch}

### What was built
{Concise summary of the complete feature — what the code does end-to-end}

### Sub-tasks completed
| Sub-task | Linear | Status |
|----------|--------|--------|
| {title} | ENG-124 | Done |
| {title} | ENG-125 | Done |
| {title} | ENG-126 | Done |

### Files changed
| File | Action | Purpose |
|------|--------|---------|
| `path/to/file.ts` | CREATED | {what it does} |
| `path/to/existing.ts` | MODIFIED | {what changed} |

### Decisions Made
| Decision | Choice | Alternatives Considered | Reasoning |
|----------|--------|------------------------|-----------|
| {what} | {choice} | {alternatives} | {reasoning} |

### Edge Cases Handled
| Scenario | Handling |
|----------|----------|
| {edge case 1} | {how it's handled} |
| {edge case 2} | {how it's handled} |

### How to test
- [ ] {test step 1}
- [ ] {test step 2}
```

### 4.2 Update Linear Issue Statuses

```
Use update_issue to move parent issue to "In Review"
Use update_issue to move all sub-issues to "Done" (they're all in the PR)
```

### 4.3 Report to Engineer

```
PR created: {PR URL}

Title: {title}
Branch: {branch} → {TARGET_BRANCH}
Files changed: {count}
Commits: {count}
Rebased: {Yes — N conflicts resolved / No — already up to date}
Linear: ENG-123 updated with implementation doc, moved to "In Review"
Sub-issues: ENG-124, ENG-125, ENG-126 moved to "Done"

Reviewer can use /pr-review to review with full plan context.
```

### 4.4 Auto-Sync if Merged to Develop

**If the PR was merged to `develop` (not `main`), automatically sync main into develop.**

This keeps develop fresh with any changes that landed on main while this PR was in review. Surfaces merge conflicts early, when context is fresh.

```bash
# Check if there's anything on main that develop doesn't have
git fetch origin
BEHIND=$(git rev-list --count origin/develop..origin/main)
echo "develop is $BEHIND commits behind main"
```

**If `BEHIND > 0`:**
```
Triggering /ship sync — develop is {N} commits behind main.
Merging main into develop to stay current...
```

Run `/ship sync` automatically. No need to ask the engineer — this is always the right thing to do.

**If `BEHIND == 0`:**
```
[PASS] develop is already up to date with main. No sync needed.
```

**If sync has conflicts:** Surface them and stop. The engineer needs to resolve before the next feature PR.

**Why:** The longer develop drifts from main, the bigger the conflicts at release time. Syncing after every PR merge keeps conflicts small and catches them early.

---

## Multi-Commit PRs

Feature PRs will typically have multiple commits. Include a commit summary:

```markdown
## Commits
1. `abc1234` - Add callAnalysis schema fields
2. `def5678` - Create transcription service
3. `ghi9012` - Build LLM analysis service
4. `jkl3456` - Add queue worker and webhook trigger
5. `mno7890` - Wire pipeline end-to-end, add error handling
```

---

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Generic "Updated code" title | Specific type + feature description |
| Empty PR description | Full structured description with all sections |
| Skip decisions section | Document every non-obvious choice |
| PR without Linear link | Always link to the parent issue |
| PR without plan reference | Link to plan doc if one exists |
| "LGTM" test plan | Specific, actionable test steps |
| List files without grouping | Group changes by sub-task for reviewability |

---

## Related Skills
- [[pr-review]] — PRs get reviewed
- [[linear]] — PRs link to Linear issues
- [[implement]] — PRs ship implementation work
- [[ideate]] — enhancement PRs link to scope docs (ideate enhancement mode)
- [[gru]] — PR description includes Gru review summary from pre-commit checks
- [[ship]] — /pr auto-triggers /ship sync after each merge to develop

## Self-Improvement

After completing this skill, if you discovered:
- A PR description section that was missing
- A better way to document decisions
- A pattern for specific PR types

Then **automatically** invoke the `/improve` skill to:
1. Add the learning to `LEARNINGS.md` in this skill folder
2. Update `SKILL.md` if it's a core instruction change
3. Commit and push
4. Notify user to sync


---

# Accumulated Learnings

> Auto-merged from LEARNINGS.md. Apply these edge cases, patterns, and preferences when executing this skill.



## Edge Cases

_(None yet - will be populated as skill is used)_

## User Preferences

_(None yet - will be populated as skill is used)_

## Patterns

- Plan docs live at `docs/plans/{feature-name}.md` in the repo
- Linear issue IDs are extracted from branch names: `feature/ENG-123-description`
- PR body uses heredoc with `gh pr create` to preserve formatting
