---
description: "Ship to production — /ship, /ship sync, merge develop to main, release. Full audit of sub-PRs, config drift, conflict zones. Sync mode keeps develop fresh from main. Not for feature PRs (use /pr)."
---

# Ship

Release features from develop to main with a full audit, conflict surface, and structured release PR.

## Context

Learnings from previous usage (edge cases, patterns, preferences) are auto-merged into this file during sync. To add new learnings, edit the source `LEARNINGS.md` in this skill's folder in the minions repo.

## Modes

```
/ship sync      — Merge main into develop (maintenance mode)
/ship           — Full release flow: audit → sync → PR → monitor
/ship main      — Alias for full release flow
```

**When to use each:**
- `/ship sync` — Regular maintenance. Run after any hotfix lands on main, or when develop is falling behind. Also auto-triggered by `/pr` after every PR merge to develop.
- `/ship` — When a feature or set of features is ready for production. This is the full ceremony.

---

## Mode 1: SYNC

Keep develop fresh by merging main into it. Surfaces conflicts early, before the release PR.

### Step 1: Safety Check

```bash
git fetch origin
git status --porcelain
```

If dirty: stash, sync, restore.

```bash
git stash push -m "pre-ship-sync-$(date +%s)"
```

### Step 2: Check Divergence

```bash
BEHIND=$(git rev-list --count origin/develop..origin/main)
echo "develop is $BEHIND commits behind main"
```

If `BEHIND == 0`:
```
[PASS] develop is already up to date with main. No sync needed.
```
Report and exit.

### Step 3: Merge main → develop

```bash
git checkout develop
git pull origin develop
git merge origin/main --no-ff -m "chore: sync main into develop"
```

`--no-ff` creates an explicit merge commit — keeps the sync history visible. The Husky commit-msg hook skips merge commits, so no Gru trailer is appended (this is correct behavior).

### Step 4: Handle Conflicts

If the merge has conflicts:

```bash
git diff --name-only --diff-filter=U
```

For each conflicting file:
1. Read both sides — `git show origin/main:{file}` vs the develop version
2. Integrate both sets of changes — never silently drop either side
3. Stage the resolved file: `git add {file}`

If conflicts are too complex:
```bash
git merge --abort
```
Report to engineer:
- Which files conflict
- What main changed vs what develop has
- Recommendation: pair on resolution

### Step 5: Push and Report

```bash
git push origin develop
```

```
[PASS] Sync complete

develop was {N} commits behind main.
Synced: {list of commits from main that were merged}
Conflicts resolved: {N} files
```

Restore stash if one was created:
```bash
git stash pop
```

---

## Mode 2: FULL SHIP FLOW

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   PHASE 1   │ ──▶ │   PHASE 2   │ ──▶ │   PHASE 3   │ ──▶ │   PHASE 4   │
│             │     │             │     │             │     │             │
│    AUDIT    │     │    SYNC     │     │  CREATE PR  │     │   MONITOR   │
│             │     │             │     │             │     │             │
│ • Sub-PRs   │     │ main→devel  │     │ develop→main│     │ • CI/CD     │
│ • Conflicts │     │ • Conflicts │     │ • Gru review│     │ • Linear    │
│ • Config    │     │ • Tests     │     │ • PR body   │     │ • Report    │
│ • Env drift │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

---

## Phase 1: AUDIT

**Goal:** Understand everything on develop that's not on main. No surprises in the release.

### 1.1 Gather Divergence

```bash
git fetch origin

# All commits on develop not on main
git log origin/main..origin/develop --oneline --no-merges

# Total file diff stats
git diff --stat origin/main...origin/develop
```

### 1.2 Group Commits by PR

```bash
# List all PRs merged to develop since last sync with main
gh pr list \
  --base develop \
  --state merged \
  --json number,title,mergedAt,author,headRefName,files \
  --limit 50
```

Cross-reference with `git log` to confirm each PR's commits are in the diff. Group commits under their PR. Flag any commits that don't belong to a merged PR (orphan commits — direct pushes to develop).

### 1.3 Identify Conflict Zones

Files touched by 2+ PRs are conflict zones — highest risk for silent overwrites.

```bash
# For each PR, get the files it touched
for PR in {pr_numbers}; do
  gh pr view $PR --json files --jq '.files[].path'
done
```

Build a file → PR map. Flag any file that appears in 2+ PRs:

```
[WARN] CONFLICT ZONES (files touched by multiple PRs):
- apps/execution/src/services/call.service.ts — PR #45, #47
- packages/db/src/schemas/customer.schema.ts — PR #45, #49
- package.json — PR #47, #49
```

### 1.4 Config Drift Check

**MANDATORY: Flag any config/infrastructure file changes.**

```bash
git diff origin/main...origin/develop -- \
  '*.env*' \
  'package.json' \
  'yarn.lock' \
  'tsconfig*.json' \
  '.eslintrc*' \
  'eslint.config.*' \
  '.github/workflows/**' \
  'Dockerfile*' \
  'docker-compose*.yml' \
  'ecosystem.config.js' \
  'ecosystem.seabird.config.js' \
  '.prettierrc*'
```

For each changed config file, show the actual diff, which PR introduced it, and the risk level:

| File | Risk Level |
|------|-----------|
| `.github/workflows/*.yml` | CRITICAL — affects CI/CD for everyone |
| `ecosystem.config.js` | HIGH — PM2 process config |
| `package.json` | HIGH — dependency changes, scripts |
| `yarn.lock` | MEDIUM — dependency lock |
| `tsconfig*.json` | MEDIUM — type checking behavior |
| `.env*` | HIGH — environment variables |
| `Dockerfile*` | HIGH — container build |
| `eslint.config.*` | LOW — linting rules |

### 1.5 Env Var Drift Check

**CRITICAL: Compare env.ts files between main and develop to catch new vars that need production setup.**

```bash
# Compare requiredEnvVars arrays between branches
for app in execution operations seabird; do
  ENV_FILE="apps/$app/src/constants/env.ts"
  echo "=== $app ==="

  # Vars on develop but not on main (NEW vars)
  diff <(git show origin/main:$ENV_FILE 2>/dev/null | grep -oP 'process\.env\.\K\w+' | sort) \
       <(git show origin/develop:$ENV_FILE 2>/dev/null | grep -oP 'process\.env\.\K\w+' | sort) \
       | grep "^>" | sed 's/^> /NEW: /'

  # Vars on main but not on develop (REMOVED vars)
  diff <(git show origin/main:$ENV_FILE 2>/dev/null | grep -oP 'process\.env\.\K\w+' | sort) \
       <(git show origin/develop:$ENV_FILE 2>/dev/null | grep -oP 'process\.env\.\K\w+' | sort) \
       | grep "^<" | sed 's/^< /REMOVED: /'
done
```

**For each NEW env var:**
```
[WARN] NEW ENV VARS — Must be set on production BEFORE merge:

| App | Var | Added by PR | Set on prod? |
|-----|-----|-------------|-------------|
| execution | STRIPE_WEBHOOK_SECRET | #45 | [?] Verify |
| execution | CALL_ANALYSIS_MODEL | #47 | [?] Verify |
| seabird | TEMPORAL_NAMESPACE | #49 | [?] Verify |

Action: Confirm these are set on the production EC2 instance before merging.
```

**For each REMOVED env var:**
Flag and verify no other code still references it.

### 1.6 Per-App Diff Stats

```bash
git diff --stat origin/main...origin/develop -- apps/execution/
git diff --stat origin/main...origin/develop -- apps/operations/
git diff --stat origin/main...origin/develop -- apps/seabird/
git diff --stat origin/main...origin/develop -- packages/db/
git diff --stat origin/main...origin/develop -- packages/
```

```
App Breakdown:
  apps/execution     — 42 files, +1,234 -456
  apps/operations    — 8 files, +89 -12
  apps/seabird       — 0 files
  packages/db        — 3 files, +67 -2
```

### 1.7 Orphan Commits

Commits on develop that don't belong to any merged PR:

```
[WARN] Found {N} orphan commits (direct pushes to develop, not via PR):
- abc1234 — (chore): quick config tweak — @author — 2026-02-25
- def5678 — (fix): hotfix something — @author — 2026-02-26

These commits were not code-reviewed via PR. Review manually before release.
```

### 1.8 Present Audit Report

```
=== SHIP AUDIT: develop → main ===

PRs in this release: {N}
  #45 — feat(feature): call analysis pipeline (ENG-234) — @author
  #47 — feat(enhancement): WhatsApp batching (ENG-256) — @author
  #49 — fix(bug-fix): duplicate webhook fix (ENG-261) — @author

Total changes: {X} files, +{Y} -{Z}

Orphan commits: {N}
Conflict zones: {N} files touched by multiple PRs
Config drift: {N} protected files changed
New env vars: {N} (must be set on prod before merge)

Per-app breakdown:
  [table]
```

**Pause and ask:** "Ready to proceed with sync and PR creation? Or review the audit first?"

---

## Phase 2: SYNC

Merge main into develop before creating the release PR. This surfaces conflicts in develop rather than in the production PR.

**Run Mode 1: SYNC** (steps above).

After sync, run tests:

```bash
yarn workspace @torrent/execution test 2>/dev/null || echo "No test script"
```

If tests fail, **STOP**. Report failures. Do not proceed until tests pass.

---

## Phase 3: CREATE RELEASE PR

### 3.1 Combined Gru Review (Advisory)

Run an AI review of the full develop→main diff. This is **advisory only — does NOT block the PR**.

```bash
git diff origin/main...origin/develop
```

The combined review catches things individual PR reviews can't — inter-PR conflicts, circular dependencies, duplicated logic across PRs.

Individual commits already have Gru-Reviewed trailers from pre-commit hooks. This is a higher-level review of how all PRs interact.

### 3.2 PR Body Template

```markdown
## Release: develop → main

**PRs in this release:** {N}
**Total changes:** {X} files, +{Y} -{Z}
**Date:** {YYYY-MM-DD}

---

## Sub-PRs

| # | PR | Linear | Summary | Author |
|---|----|---------| -------|--------|
| 1 | [#45 — call analysis pipeline](url) | ENG-234 | {1-line} | @author |
| 2 | [#47 — WhatsApp batching](url) | ENG-256 | {1-line} | @author |
| 3 | [#49 — duplicate webhook fix](url) | ENG-261 | {1-line} | @author |

---

## Config Drift Report

{If none:}
No protected config files were changed in this release.

{If any:}
[WARN] The following config files changed — review carefully:

| File | Changed by PR | Risk | What Changed |
|------|--------------|------|-------------|
| `.github/workflows/deploy.yml` | #47 | CRITICAL | Added seabird deploy step |
| `package.json` | #49 | HIGH | Added bull 4.12.0 |

---

## Env Var Changes

{If none:}
No env var changes in this release.

{If any:}
[WARN] New environment variables — must be set on production:

| App | Var | Added by PR | Status |
|-----|-----|-------------|--------|
| execution | STRIPE_WEBHOOK_SECRET | #45 | [?] Verify on prod |
| execution | CALL_ANALYSIS_MODEL | #47 | [?] Verify on prod |

---

## Conflict Zones

{If none:}
No files were touched by multiple PRs.

{If any:}
The following files were modified by 2+ PRs — review merge carefully:

| File | PRs | Notes |
|------|-----|-------|
| `call.service.ts` | #45, #47 | Both modified this service |
| `customer.schema.ts` | #45, #49 | Schema changes from two features |

---

## Per-App Changes

| App | Files | Insertions | Deletions |
|-----|-------|-----------|----------|
| apps/execution | 42 | 1,234 | 456 |
| apps/operations | 8 | 89 | 12 |
| apps/seabird | 0 | — | — |
| packages/db | 3 | 67 | 2 |

---

## Risk Areas

{List anything that warrants extra scrutiny:}
- Schema changes in `customer.schema.ts` affect 3 queries — verify indexes
- New env vars from #45 — confirm set on prod EC2
- `ecosystem.config.js` changed — verify PM2 reload won't drop connections

---

## Deployment Notes

### Workflows triggered by this merge:
1. `deploy.yml` — execution + operations → prod EC2 (:4000, :4001)
2. `deploy-seabird.yml` — seabird → prod seabird EC2 (:4002)

### Pre-merge checklist:
- [ ] All sub-PRs individually reviewed and approved
- [ ] Config drift items verified
- [ ] Conflict zones manually validated
- [ ] New env vars confirmed set on production
- [ ] Tests passing on develop branch

---

## Gru Combined Review (Advisory)

AI review of the combined release diff — how all PRs interact.
Individual commits already have Gru-Reviewed trailers from pre-commit hooks.

{Gru advisory output}

---

_Created with `/ship` skill_
```

### 3.3 Create the PR

```bash
gh pr create \
  --base main \
  --head develop \
  --title "release: {feature summary} ({YYYY-MM-DD})" \
  --body "$(cat <<'EOF'
{full body from 3.2}
EOF
)"
```

**Title format:**
- `release: call analysis + WhatsApp batching + webhook fix (2026-02-27)`
- If too long: `release: {N} features — {primary feature} and {N-1} others ({date})`

### 3.4 Add Labels

```bash
gh pr edit {pr-number} --add-label "release"
```

### 3.5 Link Linear Issues

For each Linear issue in the release PRs:

```
Use create_comment on each parent issue:
"Release PR created: #{number}. Ships with {N} other PRs in this release."
```

---

## Phase 4: POST-MERGE MONITORING

After the release PR is merged, monitor both deploy workflows.

### 4.1 Watch Workflows

```bash
# deploy.yml (execution + operations)
gh run list --branch main --workflow deploy.yml --limit 1 --json databaseId,status,conclusion
gh run watch {run-id}

# deploy-seabird.yml (seabird)
gh run list --branch main --workflow deploy-seabird.yml --limit 1 --json databaseId,status,conclusion
gh run watch {run-id}
```

### 4.2 Report

```
=== DEPLOYMENT STATUS ===

deploy.yml (execution + operations → :4000, :4001)
  Status: [PASS] Success / [FAIL] Failed
  Run: {url}
  Duration: {duration}

deploy-seabird.yml (seabird → :4002)
  Status: [PASS] Success / [FAIL] Failed
  Run: {url}
  Duration: {duration}
```

On failure: get logs with `gh run view {id} --log-failed`, identify failure type, provide remediation steps.

### 4.3 Update Linear

```
If both workflows succeed:
  Move all parent issues in this release to "Done"
  Comment: "[PASS] Shipped to production. Release PR: #{number}"

If any workflow fails:
  Comment: "[FAIL] Deploy failed. {1-line cause}. See: {run URL}"
  Do NOT move to Done until fixed.
```

### 4.4 Final Report

```
=== SHIP COMPLETE ===

Release: #{pr-number}
PRs shipped: {N}
Linear issues closed: {list}

deploy.yml: [PASS] Production (execution + operations)
deploy-seabird.yml: [PASS] Production (seabird)

All {N} Linear issues moved to Done.
```

---

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Merge develop→main without auditing | Always run the full audit first |
| Skip the sync step | Always merge main into develop before the release PR |
| Ignore env var drift | Verify every new var is set on prod BEFORE merging |
| Force push develop | Never force push a shared branch — use merge only |
| Skip the pre-merge checklist | Every item must be checked off before merge |
| Merge without monitoring | Always watch the deploy workflows after merge |

---

## Related Skills
- [[pr]] — feature PRs feed into ship releases. `/pr` auto-triggers sync after merge to develop
- [[pr-review]] — ship PRs can be reviewed with `/pr-review`
- [[linear]] — ship closes Linear issues on successful deployment
- [[gru]] — individual commit reviews. Ship adds a combined advisory review


## Self-Improvement

After completing this skill, if you discovered:
- A conflict pattern common in develop→main merges
- A config file that should be in the drift check list
- A better way to structure the release PR body

Then **automatically** invoke the `/improve` skill to:
1. Add the learning to `LEARNINGS.md` in this skill folder
2. Update `SKILL.md` if it's a core instruction change
3. Commit and push
4. Notify user to sync


---

# Accumulated Learnings

> Auto-merged from LEARNINGS.md. Apply these edge cases, patterns, and preferences when executing this skill.



## Edge Cases

_(None yet — will be populated as skill is used)_

## User Preferences

_(None yet — will be populated as skill is used)_

## Patterns

- develop→main release PRs use `release: {summary} ({date})` title format
- Gru combined review is advisory — never block a release PR on it
- Merge commits from sync (main→develop) don't get Gru trailers — Husky skips merge commits by design
- Config drift in workflow files is CRITICAL risk — always surface prominently
- `/ship sync` is idempotent — safe to run multiple times
- The deploy-seabird.yml triggers on BOTH main and develop pushes — watch both after merge
- New env vars MUST be confirmed on production BEFORE merging the release PR
