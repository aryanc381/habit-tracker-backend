---
description: "Review pull requests — review PR, check PR, re-review, review again, I've fixed the issues, check the PR again. Code quality, design, plan compliance, change requests. Not for creating PRs (use /pr)."
---

# PR Review

Review a pull request for code quality, design decisions, and plan compliance.

## Context

Learnings from previous usage (edge cases, patterns, preferences) are auto-merged into this file during sync. To add new learnings, edit the source `LEARNINGS.md` in this skill's folder in the minions repo.

## The Iron Law

```
NOTHING LEAVES THIS CONVERSATION WITHOUT EXPLICIT REVIEWER APPROVAL.

No GitHub comments. No GitHub reviews. No Linear updates. No merges.
Not a single character gets posted anywhere until the reviewer says "post it."
```

Violating this — even once, even for "obvious" findings — is a failure of this skill. The reviewer is the decision maker. Always.

## Core Principles

```
1. REVIEWER IS SOVEREIGN  - Nothing is posted anywhere without explicit approval. Period.
2. DESIGN BEFORE CODE     - Check if the approach is right before checking if the code is clean
3. PLAN COMPLIANCE        - Verify the PR implements what was planned
4. DECISIONS ARE REVIEWABLE - Evaluate the choices, not just the syntax
5. ACTIONABLE FEEDBACK    - Every comment must be specific and fixable
6. TRUST THE TOOLS        - Don't review formatting/linting — CI handles that
```

---

## Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   GATHER    │ ──▶ │   DESIGN    │ ──▶ │    CODE     │ ──▶ │   VERDICT   │
│             │     │   REVIEW    │     │   REVIEW    │     │   + SUBMIT  │
│ • PR diff   │     │ • Plan doc  │     │ • Bugs      │     │ • GitHub    │
│ • Plan doc  │     │ • Decisions │     │ • Security  │     │ • Linear    │
│ • Linear    │     │ • Approach  │     │ • Patterns  │     │ • Comments  │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                   │
                                                    ┌──────────────┘
                                                    ▼
                                        ┌─────────────────────┐
                                  ┌──── │     RE-REVIEW?      │
                                  │     │  (if changes req'd) │
                                  │     └─────────┬───────────┘
                                  │               │ Author pushes fixes
                                  │               ▼
                                  │     ┌─────────────────────┐
                                  │     │  CHECK ACTION ITEMS │
                                  │     │  + NEW CHANGES      │──── Loop until APPROVE
                                  │     └─────────────────────┘
                                  │
                                  ▼
                        ┌───────────────────┐
                        │   POST-MERGE      │
                        │   DEPLOY MONITOR  │
                        └───────────────────┘
```

---

## Step 0: DETECT Task Type

**Before gathering context, determine the task type:**

1. **Read plan/scope doc** linked in PR body — check the `Type:` field
2. **Check PR title tag:** `feat(feature)`, `feat(enhancement)`, `fix(bug-fix)`
3. **Check branch name prefix:** `feature/` → Feature, `enhance/` → Enhancement, `fix/` → Bug Fix
4. **If none work:** Infer from PR description or ask the author

This type determines which review checklist to apply in Step 2.

---

## Step 1: GATHER Context

### 1.1 Get PR Details

```bash
# Get PR info (use PR number or URL provided by engineer)
gh pr view {pr-number} --json title,body,headRefName,baseRefName,files,additions,deletions,author

# Get the full diff
gh pr diff {pr-number}
```

### 1.2 PR Quality & Provenance Check

**Before reading the PR in detail, determine HOW it was created and whether code was reviewed by Gru.**

#### 1.2.1 Detect /pr Skill Usage

Check if the PR body contains the `/pr` skill footer:

```
Look for: "Created with `/pr` skill" at the bottom of the PR body
```

| Found | Assessment |
|-------|-----------|
| Footer present | PR was created with `/pr` skill — structured format, decisions documented, Gru summary should be present |
| Footer missing | PR was created manually — may be missing sections, decisions, Gru context. Apply extra scrutiny to completeness |

#### 1.2.2 Gru Review Status (Upfront Notification)

**IMMEDIATELY check Gru status before diving into the review.** This tells the reviewer how much trust to place in the code.

```bash
# Check all PR commits for Gru trailer
gh pr view {pr-number} --json commits --jq '.commits[].oid' | while read hash; do
  TRAILER=$(git log -1 --format="%B" "$hash" | grep "Gru-Reviewed:" || echo "MISSING")
  echo "$hash: $TRAILER"
done
```

**Surface this as the FIRST thing the reviewer sees:**

```markdown
### PR Provenance

| Check | Status |
|-------|--------|
| **Created with /pr skill** | [PASS] Yes / [FAIL] No (manual PR) |
| **Gru reviewed** | [PASS] All {N} commits / [WARN] {N}/{M} commits / [FAIL] No commits |
| **Gru summary in PR body** | [PASS] Present / [FAIL] Missing |
| **Greptile reviewed** | [PASS] Yes ({N} findings) / [WARN] Pending / [FAIL] Not run |
```

**Reviewer guidance based on provenance:**

| Scenario | Guidance |
|----------|----------|
| `/pr` skill + Gru + Greptile | Best case — structured PR, code pre-screened at commit level (Gru) and PR level (Greptile). Focus on design, decisions, and cross-referencing findings |
| `/pr` skill + Gru, no Greptile | Strong — missing Greptile's broader analysis but commit-level review exists. Cover what Greptile would catch (complexity, patterns across files) |
| `/pr` skill + Greptile, no Gru | PR-level review exists but individual commits weren't screened. Check for issues that accumulate across commits |
| Manual PR + no Gru + no Greptile | **Highest scrutiny** — no automated checks ran at any level. Flag immediately |

**If no Gru and no /pr skill:**
```
[WARN] This PR was created manually without /pr skill, and no commits have Gru review trailers.
No automated quality checks ran on this code. Applying maximum review scrutiny.
Recommend the author re-create using /pr skill and ensure Gru is enabled.
```

#### 1.2.3 Gather Greptile Review

**Invoke the `/greptile` skill to fetch automated code review findings.**

```
/greptile {pr-number}
```

The `/greptile` skill will:
1. Fetch Greptile's review and line comments via `gh api` (primary method)
2. Categorize findings (Bug, Security, Performance, Style, Architecture, Other)
3. Infer addressed vs unaddressed status from author replies and diff changes
4. Return structured output in a format ready for cross-referencing
5. If Greptile MCP is available (check for `mcp__greptile__*` tools), use it for richer data

**If Greptile has NOT reviewed yet:** The skill will report "Not available". Proceed without it — do not wait.

**If Greptile HAS reviewed:** Store the structured findings for cross-referencing in Steps 2-3. The skill output includes summary, charts/metrics, risk scores, and categorized line comments.

**Add to the PR Provenance table:**

```markdown
| **Greptile reviewed** | [PASS] Yes ({N} findings) / [WARN] Pending / [FAIL] Not run |
```

#### 1.2.3.1 Check Greptile False Positive History

**Before cross-referencing Greptile findings with your own analysis, check for known false positive patterns.**

Invoke the greptile skill's false positive check (Mode 5.2):

1. Read the False Positive Registry in `greptile/LEARNINGS.md`
2. For each Greptile finding, check if it matches a known dismissed pattern
3. Annotate matches with history and recommended action

Annotated findings look like:
```
[Bug] service.ts:42 — Missing null check on optional param
  [HISTORY x3] Dismissed 3 times in PRs #187, #201, #215. Reason: "Param validated upstream by middleware." Recommend: Dismiss
```

These annotations inform the cross-reference step — known false positives get lower confidence and are pre-tagged for the reviewer. The reviewer still has final say.

**If the registry is empty (no patterns yet):** Skip this step and proceed normally.

#### 1.2.4 Read the PR Description

From the PR body, extract:
- **Summary** — what does this PR claim to do?
- **Linear issue** — which issue is this for?
- **Plan doc** — is there a plan doc linked?
- **Decisions** — what choices were made?
- **Testing section** — what tests were written, TDD trail, test results, coverage gaps
- **Test plan** — how should this be verified?

**If the PR has no Testing section:** Flag this.

```
[WARN] PR has no Testing section. Cannot verify TDD compliance or test quality.
Ask the author to document what tests were written and how TDD was followed.
```

**If the PR has no description or a vague one:** Flag this immediately.

```
[WARN] PR has no description. Cannot review design decisions without context.
Ask the author to add a description using /pr skill, or provide context here.
```

### 1.3 Read the Plan Doc

If a plan doc is linked (e.g., `docs/plans/{feature}.md`):

```bash
# Checkout the branch to read the plan doc
git fetch origin {branch-name}
```

Read the plan doc and extract:
- The full feature scope (all sub-tasks should be in this one PR)
- Architecture decisions made during planning
- Edge cases that should be handled
- Expected files to create/modify

### 1.4 Get Linear Issue Context

If a Linear issue is referenced, use Linear MCP tools:
- Fetch the issue details
- Read the parent issue for full feature context
- Check if there are specific requirements in the description

---

## Step 2: DESIGN REVIEW (Do This FIRST)

**Before looking at code quality, evaluate the approach.**

### 2.1 Plan Compliance

| Check | Question |
|-------|----------|
| **Scope** | Does this PR cover the complete feature? All sub-tasks included? |
| **Architecture** | Does it follow the architecture described in the plan doc? |
| **App placement** | Is the code in the right app (Execution vs Operations)? |
| **Decisions** | Do the PR decisions align with plan decisions? Any contradictions? |
| **Files** | Are the files created/modified the ones expected by the plan? |

If no plan doc exists, evaluate the approach on its own merits.

### 2.2 Decision Evaluation

For each decision listed in the PR description:

```
Decision: {what was decided}
Choice: {what they chose}

Evaluation:
- Is this the right choice for the problem?
- Are there better alternatives they didn't consider?
- Does this align with existing patterns in the codebase?
- Will this cause problems at scale or over time?
```

**Flag decisions that seem wrong or unconsidered:**

```
[WARN] Decision: "Poll recording API every 30s"
   Concern: There's already a recording-ready webhook in call.route.ts:142.
   Suggestion: Use the existing webhook instead of polling.
```

### 2.3 Missing Considerations

Check if the PR handles what the plan specified:

- [ ] All edge cases from the plan doc addressed?
- [ ] Error handling matches the plan's error handling section?
- [ ] All files listed in the plan accounted for?
- [ ] Nothing extra that wasn't in the plan?

### 2.4 Approach Assessment

Even without a plan doc, evaluate:

| Aspect | Question |
|--------|----------|
| **Simplicity** | Is this the simplest approach that works? |
| **Reuse** | Does similar code already exist that could be extended? |
| **Patterns** | Does it follow existing codebase patterns? |
| **Coupling** | Does it introduce unnecessary dependencies? |
| **Reversibility** | Can this be easily changed or rolled back? |

### 2.5 Protected Files Check

**MANDATORY: Check if the PR modifies any infrastructure or config files.**

Scan the PR's changed files list for these patterns:

```
Protected file patterns:
- .github/workflows/**     — CI/CD pipelines
- .github/**               — Any GitHub config
- .eslintrc*               — ESLint config
- eslint.config.*          — ESLint flat config
- .prettierrc*             — Prettier config
- prettier.config.*        — Prettier config
- tsconfig*.json           — TypeScript config
- .flake8                  — Python linter config
- pyproject.toml           — Python project config (may contain linter settings)
- Makefile                 — Build scripts
- Dockerfile*              — Container config
- docker-compose*.yml      — Container orchestration
- ecosystem.config.js      — PM2 config
- package.json             — Dependencies and scripts
- yarn.lock                — Dependency lock file
```

**If ANY protected files are changed, flag them prominently:**

```
[ALERT] PROTECTED FILES MODIFIED — Requires careful review

The following infrastructure/config files were changed in this PR:

| File | What Changed | Risk |
|------|-------------|------|
| `.github/workflows/deploy.yml` | {describe what changed} | CI/CD pipeline — can break deployments |
| `eslint.config.mjs` | {describe what changed} | Lint rules — can silently weaken code quality |
| `package.json` | {describe what changed} | Dependencies — check for security, necessity |

[WARN] These files affect ALL developers and the deployment pipeline.
   Review each change carefully and confirm it is intentional and necessary.
```

**For each protected file, answer:**
1. **Is this change necessary?** Does the feature actually require this config change?
2. **Is it correct?** Will it break CI, deployments, or other developers?
3. **Is it scoped?** Does it change only what's needed, or does it have side effects?
4. **Was it discussed?** Is this change mentioned in the plan doc or PR description?

**If a protected file was changed but NOT mentioned in the PR description:** Flag this as a critical issue. Config changes should never be silent.

### 2.6 Test Quality Review (MANDATORY)

**Every PR must include tests. Review test quality before reviewing code quality.**

#### 2.6.1 Test Existence & Documentation Check

| Check | How to Verify |
|-------|--------------|
| **Tests exist** | PR diff includes `.test.ts` files |
| **Tests match plan** | Compare tests to Test Strategy / Test Impact / Regression Test section in the plan/scope/fix doc |
| **Tests run** | CI passed the test step |
| **Testing section in PR** | PR body has a `## Testing` section with: tests written, TDD trail, test results, coverage gaps |
| **TDD trail is credible** | TDD trail describes what failed first, how it was made to pass, and any issues encountered |
| **Test results included** | PR body shows test output (suites passed, tests passed, time) |
| **Coverage gaps justified** | Any untested areas have a stated reason |

**If NO tests are included in the PR:** Flag as critical.

```
[CRITICAL] **Critical:** No tests included in this PR.
The plan doc defines test cases in the Test Strategy section.
These must be implemented before this PR can be approved.
```

**If tests exist but the Testing section is missing/empty:** Flag as warning.

```
[WARNING] **Warning:** Tests exist in the diff but the PR description's Testing section
is missing or incomplete. Document: what tests were written, TDD trail,
test results, and any coverage gaps.
```

#### 2.6.2 Test Quality Checklist

For each test file in the PR, evaluate:

| Check | Question | Red Flag |
|-------|----------|----------|
| **Tests behavior, not implementation** | Does the test assert on outputs/side effects, not internal details? | Testing that a specific private method was called |
| **Meaningful assertions** | Do assertions check real values, not just "toBeDefined"? | `expect(result).toBeDefined()` with nothing else |
| **Failure scenarios covered** | Are error/edge cases tested, not just happy path? | Only success scenarios tested |
| **Mocks are appropriate** | Are only external deps mocked, not the thing being tested? | Mocking the function under test |
| **Test names describe behavior** | Can you understand what's tested from the name alone? | `it('test 1')` or `it('should work')` |
| **Tests are independent** | Does each test set up its own state? No shared mutable state? | Tests that fail when run individually |
| **Assertions match plan doc** | Do the test cases align with what was planned? | Plan says "test X" but X isn't tested |

#### 2.6.3 Type-Specific Test Review

**Feature Tests:**
| Check | Question |
|-------|----------|
| **Coverage** | Is each sub-task from the plan doc covered by at least one test? |
| **Edge cases** | Are edge cases from the plan doc's Edge Cases section tested? |
| **Both paths** | Does each tested function have success AND failure tests? |
| **Mocking depth** | Are mocks realistic? Do they match actual data shapes? |

**Enhancement Tests:**
| Check | Question |
|-------|----------|
| **Changed behavior** | Are tests verifying the NEW behavior, not just existing? |
| **Existing tests updated** | Were existing tests updated to reflect the change? |
| **No broken tests** | Are existing tests still passing (not just deleted)? |
| **Regression safety** | Do tests protect the critical paths listed in scope doc? |

**Bug Fix Tests:**
| Check | Question |
|-------|----------|
| **Reproduces bug** | Does the test actually fail without the fix? (Check if `test:` commit precedes `fix:` commit) |
| **Asserts correct behavior** | Does the test assert on what SHOULD happen, not what was happening? |
| **Minimal scope** | Does the test target the root cause, not a broad integration test? |
| **Edge variants** | Are related edge cases tested (from fix doc's Edge Cases section)? |

#### 2.6.4 Test Anti-Patterns to Flag

| Anti-Pattern | Example | Why It's Bad |
|-------------|---------|-------------|
| **Always-passing test** | `expect(true).toBe(true)` | Provides zero safety |
| **Testing the mock** | Mocking the function then asserting the mock returns what you set | Proves nothing about real code |
| **Snapshot-only tests** | `expect(result).toMatchSnapshot()` with no other assertions | Snapshots rot — any change auto-approves |
| **Over-mocking** | Mocking 10+ modules to test one function | Sign of coupled design, fragile test |
| **Missing await** | `test('async', () => { someAsyncFn() })` — no await, no assertion on promise | Test always passes regardless |
| **Commented-out tests** | `// test('should handle error', ...)` | Incomplete coverage, pretends testing happened |

---

### 2.7 Gru Review Compliance (MANDATORY)

**Every PR must have a Gru Review Summary section. Check it.**

#### 2.7.1 Gru Section Exists

| Check | Verdict | Action |
|-------|---------|--------|
| `## Gru Review Summary` section present in PR body | PASS | Continue |
| Section missing entirely | WARNING | Flag: "PR is missing Gru Review Summary. Was Gru enabled during development?" |

#### 2.7.2 Trailer Verification

Independently verify that all commits in the PR have the `Gru-Reviewed:` trailer:

```bash
# Check all PR commits for Gru trailer
gh pr view {pr-number} --json commits --jq '.commits[].oid' | while read hash; do
  if ! git log -1 --format="%B" "$hash" | grep -q "Gru-Reviewed:"; then
    echo "MISSING: $hash"
  fi
done
```

| Check | Verdict | Action |
|-------|---------|--------|
| All commits have trailer | PASS | Note in review |
| Some commits missing trailer | CRITICAL | Flag: "X commit(s) bypassed Gru review (--no-verify). These need manual review." |
| No commits have trailer | CRITICAL | Flag: "No Gru review on any commit. Entire PR needs careful manual review." |

#### 2.7.3 Review Gru Findings

If the Gru Review Summary section reports findings:

| Finding Type | Review Action |
|-------------|--------------|
| All PASS | Acknowledge — Gru found no issues |
| CONDITIONAL_PASS with acknowledged quiz | Review the acknowledged items — are they acceptable risks? |
| BLOCK findings that were fixed | Verify the fix addressed the original finding |
| Bypass warning | Manually review the bypassed commits with extra scrutiny |

**Include Gru compliance in your review verdict:**

```markdown
### Gru Compliance
**Trailer check:** {All present / X missing}
**Review findings:** {Clean / Warnings acknowledged / Bypasses detected}
```

If commits are missing the Gru trailer, apply extra scrutiny to those specific commits during the Code Review step. These commits did not go through automated review.

#### 2.7.4 Slack Notification (MANDATORY)

**After completing the Gru compliance check, ALWAYS notify `#gru-reviews` on Slack.**

Post to Slack channel `C0AH2DH72KD` using the Slack MCP tools.

**If all commits have trailers and review is clean:**

```
[Gru] PR #{number} by {author} — All {N} commits Gru-reviewed. Clean.
```

**If commits are missing trailers:**

```
[Gru] PR #{number} by {author} — {N} commit(s) MISSING Gru review:
• {short_hash} — {commit message}
• {short_hash} — {commit message}
Bypassed commits flagged for manual review.
```

**If Gru section is missing from PR body:**

```
[Gru] PR #{number} by {author} — No Gru Review Summary in PR description. Gru may not have been active during development.
```

**If CONDITIONAL_PASS with acknowledged risks:**

```
[Gru] PR #{number} by {author} — {N} acknowledged risk(s) from Gru quiz:
• {commit}: {description of acknowledged risk}
Reviewer to verify these are acceptable.
```

This notification is non-negotiable. Every PR review posts its Gru compliance status to Slack so there is a persistent, searchable record outside of GitHub.

### 2.8 Type-Specific Review Focus

Based on detected task type, apply additional review criteria:

#### Feature Review
| Check | Question |
|-------|----------|
| **Completeness** | Are ALL sub-tasks from the plan doc implemented? |
| **Architecture** | Does the implementation match the planned architecture? |
| **New patterns** | Do new patterns introduced align with existing codebase? |
| **Scale** | Will this handle expected load? |
| **Observability** | Is there logging, monitoring, error tracking? |

#### Enhancement Review
| Check | Question |
|-------|----------|
| **Scope creep** | Does the PR change ONLY what the scope doc specifies? |
| **Backward compat** | Are existing API contracts preserved? |
| **Data migration** | If schema changed, is migration handled? |
| **Existing tests** | Do existing tests still pass? Were they updated? |
| **Impact radius** | Could this change break other features? |

#### Bug Fix Review
| Check | Question |
|-------|----------|
| **Root cause** | Does the fix address the ROOT cause, not just the symptom? |
| **Regression test** | Is there a test that would FAIL without this fix? |
| **Fix scope** | Is the fix minimal? No "while I'm here" changes? |
| **Related bugs** | Could the same root cause exist elsewhere? |
| **Rollback safety** | If this fix causes issues, can it be reverted cleanly? |

### 2.9 Env Var Audit (MANDATORY)

**Every PR that touches `.ts` files must pass env var compliance checks.**

Each app has a centralized `env.ts` file (`apps/{app}/src/constants/env.ts`) that:
- Validates required env vars at startup (`process.exit(1)` if missing)
- Exports typed constants for use throughout the app

**Rule: NEVER use `process.env` directly in application code. Always import from `@constants/env` or `../constants/env`.**

#### 2.9.1 Scan for Direct `process.env` Access

Search the PR diff for `process.env.` in `.ts` files:

```bash
gh pr diff {pr-number} | grep "^+" | grep -v "^+++" | grep "process\.env\." || echo "None found"
```

**Exclude from this check:**
- `env.ts` files themselves (they're the one place `process.env` is allowed)
- Test files (`*.test.ts`, `*.spec.ts`)
- Script files in `scripts/` directory

| Found | Verdict |
|-------|---------|
| No `process.env` in app code | [PASS] PASS |
| `process.env` in app code (not env.ts/tests) | [CRITICAL] CRITICAL — must import from env.ts instead |

```
[CRITICAL] **Critical:** Direct process.env access found:

| File | Line | Var | Fix |
|------|------|-----|-----|
| `services/payment.service.ts` | 23 | `process.env.STRIPE_KEY` | Import `STRIPE_KEY` from `@constants/env` |
| `config/redis.config.ts` | 8 | `process.env.REDIS_HOST` | Import `REDIS_HOST` from `@constants/env` |

All env vars must go through env.ts for startup validation and type safety.
```

#### 2.9.2 New Env Vars Registered

If the PR adds new env var usage (imports from env.ts):

1. **Check env.ts was updated** — the var must be both exported AND in the `requiredEnvVars` array
2. If exported but NOT in `requiredEnvVars`: Flag — the app won't crash on startup if this var is missing, it'll silently fail at runtime

```bash
# Check if new vars are in requiredEnvVars
gh pr diff {pr-number} -- 'apps/*/src/constants/env.ts'
```

| Check | Verdict |
|-------|---------|
| New var exported AND in `requiredEnvVars` | [PASS] PASS |
| New var exported but NOT in `requiredEnvVars` | [WARNING] WARNING — no startup validation |
| New var used but not in env.ts at all | [CRITICAL] CRITICAL — using process.env directly |

#### 2.9.3 Env Var Removal Check

If env vars were removed from env.ts:

```bash
# Check if removed vars are still imported elsewhere
# Get removed exports from env.ts diff, then search for imports
```

Flag if a removed var is still imported by other files — this will cause a build error or runtime crash.

#### 2.9.4 .env.example Sync

If new vars were added to env.ts:

| Check | Verdict |
|-------|---------|
| `.env.example` updated with new var | [PASS] PASS |
| `.env.example` not updated | [WARN] WARNING — other devs won't know this var exists |
| No `.env.example` exists for this app | [WARN] NOTE — recommend creating one |

#### 2.9.5 Include in Verdict

Add to the review output:

```markdown
### Env Compliance
**Direct process.env usage:** [PASS] None / [FAIL] {N} violations in {files}
**New vars registered in env.ts:** [PASS] All registered + validated / [FAIL] {N} missing from requiredEnvVars
**.env.example updated:** [PASS] Updated / [WARN] Not updated / [WARN] No .env.example exists
```

---

## Step 3: CODE REVIEW

**Only after design review passes, review the code quality.**

### 3.1 Bugs & Logic Errors

- Null/undefined access without checks
- Missing `await` on async operations
- Unhandled promise rejections
- Off-by-one errors in loops/pagination
- Race conditions in concurrent operations
- Incorrect boolean logic
- Missing return statements

### 3.2 Security (OWASP)

- **Auth/Authz**: Missing authentication or authorization checks on endpoints
- **Injection**: Unsanitized input in DB queries, command execution
- **XSS**: User input reflected without sanitization
- **Secrets**: Hardcoded credentials, API keys in code
- **Validation**: Missing input validation at API boundaries
- **Logging**: Sensitive data (passwords, tokens, PII) in logs

### 3.3 Torrent Conventions

**Routes:**
- [ ] Thin routes — HTTP concerns only, business logic in services
- [ ] ObjectIds validated with `validateObjectId()`
- [ ] Specific routes before parameterized (`/all` before `/:id`)
- [ ] Response format: `{ success, message, data/error }`

**Services:**
- [ ] Pure functions — no `req`/`res` objects
- [ ] All parameters and return values typed
- [ ] `.lean()` on read-only queries
- [ ] Descriptive error messages

**TypeScript:**
- [ ] No `any` type
- [ ] No `var`, `.then()` chains, or `require()`
- [ ] Proper import order (external → @torrent/db → aliases → relative)

### 3.4 Code Reuse

Search the codebase for:
- Similar functions that already exist
- Utilities that could replace inline code
- Services that could be extended instead of duplicated

```
[WARN] Duplicate: formatPhoneNumber() at line 45 already exists in @utils/phone.ts
   Suggestion: Import from @utils/phone instead of re-implementing
```

### 3.5 Error Handling

For Execution app code:
- [ ] Sentry error tracking on critical paths
- [ ] Cronitor monitoring on schedulers
- [ ] Structured logging with tags `[Module]`

For all code:
- [ ] try/catch around external API calls
- [ ] Meaningful error messages (not generic "Something went wrong")
- [ ] Errors thrown in services, caught in routes

### 3.6 Database

- [ ] Indexes exist for fields used in `.find()` filters
- [ ] `.select()` used to limit fields returned
- [ ] `.lean()` on read-only queries
- [ ] `findById()` instead of `findOne({ _id })` where applicable
- [ ] ObjectId validation before queries

---

## Step 4: VERDICT

### 4.1 Output Format

```markdown
## PR Review: {PR title}

**PR:** #{number} | **Author:** {author} | **Branch:** {branch} → {base branch}
**Task Type:** {Feature | Enhancement | Bug Fix}
**Linear:** {issue ID} | **Plan:** {plan doc path or "none"}

### PR Provenance
| Check | Status |
|-------|--------|
| **Created with /pr skill** | [PASS] Yes / [FAIL] No |
| **Gru reviewed** | [PASS] All {N} commits / [WARN] {N}/{M} commits / [FAIL] None |
| **Gru summary in PR body** | [PASS] Present / [FAIL] Missing |
| **Greptile reviewed** | [PASS] Yes ({N} findings) / [WARN] Pending / [FAIL] Not run |

---

### Design Review

**Plan Compliance:** [PASS] Matches plan / [WARN] Deviates / [FAIL] Contradicts
{Details if not compliant}

**Approach:** [PASS] Sound / [WARN] Concerns / [FAIL] Wrong approach
{Details if concerns}

**Decision Evaluation:**
| Decision | Verdict | Note |
|----------|---------|------|
| {decision} | [PASS]/[WARN]/[FAIL] | {note} |

---

### Test Quality

**Tests included:** [PASS] Yes / [FAIL] No
**Plan compliance:** [PASS] All planned test cases covered / [WARN] Partial / [FAIL] Missing

| Check | Verdict | Note |
|-------|---------|------|
| Tests behavior, not implementation | [PASS]/[WARN]/[FAIL] | {note} |
| Failure scenarios covered | [PASS]/[WARN]/[FAIL] | {note} |
| Mocks are appropriate | [PASS]/[WARN]/[FAIL] | {note} |
| Test names describe behavior | [PASS]/[WARN]/[FAIL] | {note} |
| Anti-patterns | [PASS] None / [WARN]/[FAIL] | {list any found} |

---

### Gru Compliance

**Trailer check:** [PASS] All {N} commits have Gru-Reviewed trailer / [FAIL] {N} commits missing trailer
**Review summary:** [PASS] Clean / [WARN] {N} warnings acknowledged / [FAIL] {N} bypasses detected
{If bypasses detected: list the commit hashes and their messages}

---

### Env Compliance

**Direct process.env usage:** [PASS] None / [FAIL] {N} violations in {files}
**New vars registered in env.ts:** [PASS] All registered + validated / [FAIL] {N} missing from requiredEnvVars
**.env.example updated:** [PASS] Updated / [WARN] Not updated / [WARN] No .env.example exists

---

### Code Review

**Severity Definitions — apply strictly. When in doubt, default to Warning.**

| Severity | Bar | Examples |
|----------|-----|----------|
| **Critical** | Will break prod, cause data loss/corruption, security vulnerability, or break existing consumers **at runtime** | Missing auth on public endpoint, silent data corruption, unhandled null on hot path, SQL injection |
| **Warning** | Should fix — code smell, future risk, minor data bloat, missing best practice, theoretical issues with low practical risk | Schema bloat, type-level mismatches with no runtime impact, missing `.lean()`, hardcoded values |
| **Suggestion** | Nice to have — type safety improvements, naming, docs, cleanup, DX | Better generics, rename for clarity, add JSDoc, use stricter type |

**Anti-pattern: Do NOT inflate severity based on theoretical worst-case when practical risk is near zero.** A finding that "could theoretically cause issues" but won't break anything in practice is a Warning, not a Critical. Over-escalating wastes reviewer time and dilutes trust in actual criticals.

#### Critical (Must fix — will break prod or corrupt data)
- `file:line` — {issue description}

#### Warning (Should fix — code quality or future risk)
- `file:line` — {issue description}

#### Suggestion (Nice to have — DX and polish)
- `file:line` — {suggestion}

#### Positive (Good patterns)
- `file:line` — {what's good}

---

### Greptile Cross-Reference

{If Greptile has not reviewed: "Greptile review not available for this PR."}

{If Greptile has reviewed:}

**Greptile summary:** {Greptile's overall assessment — include any charts, metrics, risk scores}

#### Confirmed by both (high confidence)
Issues flagged by BOTH this review and Greptile — highest confidence, definitely fix:
- `file:line` — {issue} (Greptile: "{Greptile's description}")

#### Greptile-only findings (review these)
Issues Greptile caught that this review did not — worth investigating:
- `file:line` — {Greptile's finding} — **Agree / Dismiss**: {your assessment}
  {If known false positive: "[HISTORY x{N}] Dismissed in PRs #{list}. Reason: {reason}. Recommend: Dismiss"}

#### Skill-only findings (Greptile missed)
Issues this review caught that Greptile did not — areas where codebase-specific rules add value:
- `file:line` — {your finding} (Greptile didn't flag this — likely requires domain context)

#### Greptile false positives
Greptile findings that are incorrect or not applicable:
- `file:line` — {Greptile's claim} — **Dismissed:** {why it's wrong}
  {If new dismissal: "[NEW] Will be recorded to false positive registry"}
  {If known pattern: "[KNOWN x{N}] Previously dismissed in PRs #{list}"}

---

### Verdict: {APPROVE / REQUEST CHANGES / NEEDS DISCUSSION}

{Summary — 1-2 sentences on overall assessment}

### Action Items
- [ ] {Specific thing to fix}
- [ ] {Specific thing to fix}
```

### 4.2 Verdict Criteria

| Verdict | When |
|---------|------|
| **APPROVE** | Design is sound, no critical issues, warnings are minor |
| **REQUEST CHANGES** | Critical issues found, or design approach is wrong |
| **NEEDS DISCUSSION** | Design decision needs team input, not just author's fix |

### 4.3 Present Findings to Reviewer — MANDATORY GATE

```
=== HALT ===
DO NOT PROCEED PAST THIS STEP WITHOUT EXPLICIT REVIEWER APPROVAL.
No GitHub comments. No Linear updates. Nothing.
```

After generating the full verdict from 4.1, present it to the reviewer in the chat. Walk through each section with them — this is a discussion, not a rubber stamp.

**The reviewer can:**

1. **Agree** with all findings — proceed to post
2. **Remove findings** they disagree with — "drop the import order warning, that's intentional"
3. **Adjust severity** — "that's not critical, make it a suggestion"
4. **Add findings** the skill missed — "also flag the missing null check on line 42"
5. **Change the verdict** — "I'd approve this despite the warnings"
6. **Ask questions** — "why did you flag this? explain your reasoning"
7. **Request deeper analysis** — "look at this function more carefully, I think there's a race condition"

**Present format:**

```
Here's my review of PR #{number}. Nothing has been posted yet — not a single comment.

{Full verdict output from 4.1}

---

Walk through this with me:
- Any findings to drop, adjust, or add?
- Agree with the verdict ({APPROVE/REQUEST CHANGES/NEEDS DISCUSSION})?
- When you're ready, tell me to post it.
```

**Approval rules:**

- The reviewer MUST explicitly say something like "post it", "looks good, submit", "go ahead", or clearly approve the findings
- Do NOT interpret silence, "ok", "sure", or ambiguous responses as approval. Ask: "Just to confirm — post this review to GitHub and Linear?"
- Do NOT interpret approval of the analysis as approval to post. The reviewer might say "good analysis" but still want to adjust before posting
- If in doubt, ask. Always ask.

**If the reviewer makes changes:**

1. Update the verdict output with their adjustments
2. Present the FULL updated version (not just the diff)
3. Ask for final confirmation on the updated version
4. Only proceed to 4.3.1 and 4.4 after explicit approval of the final version

**If the reviewer wants deeper analysis:**

1. Investigate what they asked about
2. Update findings based on new analysis
3. Present the updated verdict
4. Wait for approval again — the loop restarts

### 4.3.1 Record Greptile Dismissals

**After the reviewer approves findings, record any dismissed Greptile findings to the false positive registry.**

This step only runs if Greptile findings were present AND at least one was dismissed (by Claude's cross-reference or the reviewer's adjustments).

1. Collect all dismissed Greptile findings from:
   - Claude's cross-reference analysis (the "Greptile false positives" section)
   - Reviewer's adjustments in Step 4.3 (findings the reviewer dropped or overrode)
2. For each dismissal, invoke the greptile skill's record function (Mode 5.1):
   - Pass the finding category, description, PR number, and dismissal reason
   - The greptile skill will check if a matching pattern exists and create/update accordingly
3. If any pattern hits the escalation threshold (3+ dismissals), the greptile skill will prompt:
   - "Greptile has been wrong about {pattern} in {N} PRs. Create a suppression rule?"
   - If reviewer approves → suppression rule is created via `create_custom_context`
   - If reviewer declines → pattern stays in registry, no rule created

**If no Greptile findings were dismissed:** Skip this step entirely.

### 4.4 Submit Review on GitHub

**PREREQUISITE: Step 4.3 MUST have ended with explicit reviewer approval. If you cannot point to a specific message where the reviewer said to post, DO NOT PROCEED. Go back to 4.3.**

Use the GitHub MCP review tools in this order:

#### Step 1: Create a pending review

```
Use pull_request_review_write with method: "create"
- owner, repo, pull_number
- This creates a pending review (not yet visible to author)
```

#### Step 2: Add line-specific comments

For each Critical and Warning issue that the reviewer approved:

```
Use add_comment_to_pending_review:
- owner, repo, pull_number
- path: file path relative to repo root
- line: the line number in the new diff
- body: the review comment (use the format from 4.1)
```

**Comment format for line comments:**

| Severity | Prefix |
|----------|--------|
| Critical | `[CRITICAL] **Critical:** {description}` |
| Warning | `[WARNING] **Warning:** {description}` |
| Suggestion | `[SUGGESTION] **Suggestion:** {description}` |
| Positive | `[PASS] **Good:** {description}` |

#### Step 3: Submit the review

```
Use pull_request_review_write with method: "submit_pending"
- owner, repo, pull_number
- event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT"
- body: The full verdict summary from 4.1 (with reviewer's adjustments applied)
```

**Event mapping:**

| Verdict | GitHub Event |
|---------|-------------|
| APPROVE | `APPROVE` |
| REQUEST CHANGES | `REQUEST_CHANGES` |
| NEEDS DISCUSSION | `COMMENT` |

### 4.5 Update Linear

**Only after GitHub review is submitted (Step 4.4).**

Add a review comment to the parent issue:

```
Use create_comment on parent issue:
"PR #{number} reviewed — {verdict}. {1-line summary of findings}"
```

**Then update statuses based on verdict:**

| Verdict | Parent Issue | Sub-Issues |
|---------|-------------|------------|
| **APPROVE** | Stay In Review | No change (already Done) |
| **REQUEST CHANGES** | In Review → In Progress | No change |
| **NEEDS DISCUSSION** | No change | No change |

### 4.6 After APPROVE: Offer to Merge

If the verdict is APPROVE, ask the engineer if they want to merge the PR now.

```
Review posted. Want me to merge this PR?
```

**Wait for explicit confirmation.** Do NOT merge on ambiguous responses. The reviewer approved the *review*, not the *merge* — these are separate decisions.

If the reviewer explicitly says yes ("merge it", "yes merge", "go ahead and merge"):

1. Merge the PR using `gh pr merge {number} --squash` (or merge method the engineer prefers)
2. **IMMEDIATELY after merge — do NOT wait to be asked — update Linear:**

```
Use update_issue to move parent issue to "Done"
Use update_issue to move any remaining sub-issues to "Done"
```

**Fetch all sub-issues** using the parent issue ID to ensure none are missed:

```
Use get_issue on parent to get sub-issue IDs
For each sub-issue not already Done → move to Done
```

3. Then proceed to Step 6 (Post-Merge Deployment Monitoring) automatically.

[WARN] **The Linear update is NOT a separate step. It is part of the merge action. If you merge a PR, you MUST update Linear in the same turn. Never wait for the engineer to ask "is Linear updated?"**

---

## Step 5: RE-REVIEW (After Author Pushes Fixes)

**When the engineer asks to re-review a PR that was previously reviewed.**

### 5.1 Detect Re-Review

This step triggers when:
- Engineer says "re-review", "review again", "I've fixed the issues", "check the PR again"
- The PR was previously reviewed with REQUEST CHANGES verdict
- New commits have been pushed since the last review

### 5.2 Gather Changes Since Last Review

```bash
# Get the PR's review history to find your last review
gh api repos/{owner}/{repo}/pulls/{pr-number}/reviews --jq '.[] | {id, state, submitted_at, user}'

# Get commits since the last review
gh api repos/{owner}/{repo}/pulls/{pr-number}/commits --jq '.[] | {sha: .sha[:7], message: .commit.message, date: .commit.author.date}'

# Get the diff of only new commits (since last review)
# Find the SHA of the commit at last review time, then:
gh pr diff {pr-number}
```

### 5.3 Check Action Items

Go through each action item from the previous review:

```markdown
### Re-Review: Action Item Status

| # | Action Item | Status | Note |
|---|------------|--------|------|
| 1 | {item from previous review} | [PASS] Fixed / [WARN] Partially fixed / [FAIL] Not addressed | {details} |
| 2 | {item from previous review} | [PASS] Fixed / [WARN] Partially fixed / [FAIL] Not addressed | {details} |
```

### 5.4 Review New Changes

For new commits pushed as fixes:
1. **Verify fixes don't introduce new issues** — the fix itself could have bugs
2. **Check for scope creep** — author may have added unrelated changes
3. **Re-run type-specific checks** from Section 2.6 if the fix touches core logic

### 5.5 Re-Review Verdict

```markdown
## Re-Review: {PR title}

**PR:** #{number} | **Previous verdict:** REQUEST CHANGES
**New commits since review:** {count}

### Action Item Resolution
| # | Item | Status |
|---|------|--------|
| 1 | {item} | [PASS]/[WARN]/[FAIL] |

### New Issues Found
{Any new issues from the fix commits, or "None"}

### Verdict: {APPROVE / REQUEST CHANGES (again)}

{Summary}
```

### 5.6 Present Re-Review to Reviewer — MANDATORY GATE

```
=== HALT ===
Same rules as Step 4.3. Nothing gets posted without explicit reviewer approval.
```

Present the re-review verdict (from 5.5) to the reviewer. Walk through:
- Which action items are resolved vs still open
- Any new issues found in the fix commits
- The proposed verdict (APPROVE or REQUEST CHANGES again)

**Wait for explicit approval before posting.** Same rules as Step 4.3 — "post it", "submit", "go ahead", or clear approval required.

If the reviewer makes changes, update and re-present. Loop until approved.

### 5.7 Submit Re-Review on GitHub

**PREREQUISITE: Step 5.6 MUST have ended with explicit reviewer approval.**

Follow the same GitHub MCP workflow as Step 4.4:
1. Create pending review
2. Add line comments for any remaining or new issues
3. Submit with `APPROVE` or `REQUEST_CHANGES`

### 5.8 Update Linear

| Re-Review Verdict | Parent Issue |
|-------------------|-------------|
| **APPROVE** | Stay In Review (author merges) |
| **REQUEST CHANGES** | Stay In Progress |

Add a comment to the Linear issue:

```
"PR #{number} re-reviewed — {verdict}. {action items resolved: X/Y}"
```

---

## Step 6: POST-MERGE DEPLOYMENT MONITORING

**After the PR is merged to main, AUTOMATICALLY monitor the GitHub Actions deployment.**

This step runs immediately after merge + Linear update. Do NOT wait for the engineer to ask — proceed automatically.

### 6.1 Watch the GitHub Action

```bash
# Get the latest workflow run triggered by the merge commit
gh run list --branch main --limit 1 --json databaseId,status,conclusion,name,headSha

# Watch it until completion (polls every 30 seconds)
gh run watch {run-id}
```

### 6.2 On Success — Report

If the workflow succeeds:

```
[PASS] Deployment successful

Workflow: {workflow name}
Run: {run URL}
Commit: {sha}
Duration: {duration}

All apps are healthy and serving traffic.
```

Add a comment to the Linear parent issue:

```
Use create_comment: "[PASS] Deployed to production. Workflow run: {run URL}"
```

Move the parent issue to **Done** (if not already).

### 6.3 On Failure — Diagnose and Notify

If the workflow fails:

```bash
# Get the failed run details
gh run view {run-id} --json jobs

# Get logs from the failed job
gh run view {run-id} --log-failed
```

**Analyze the failure:**

| Failure Type | Common Cause | Remediation |
|-------------|-------------|-------------|
| Type check failed | Code that passed locally but fails in CI (missing dependency, env diff) | Fix type errors, push to main |
| Lint failed | Unlinted code got merged | Run `yarn lint:fix`, push to main |
| Build failed | Missing dependency, import error | Check `yarn build` output, fix and push |
| Deploy failed (SSH) | EC2 connectivity issue | Check EC2 status, retry workflow |
| Deploy failed (PM2) | App crash on startup | Check PM2 logs, likely env var or runtime error |
| Health check failed | App started but not responding | Check app logs for startup errors |
| Docker build failed | Dockerfile or dependency issue | Check Docker build logs |

**Report the failure:**

```
[FAIL] Deployment FAILED

Workflow: {workflow name}
Run: {run URL}
Failed job: {job name}
Failed step: {step name}

Error:
{relevant error output from logs — keep concise, max 20 lines}

Root cause: {your analysis}

Remediation:
1. {specific step to fix}
2. {specific step to fix}

[WARN] Main branch is currently broken. Fix urgently.
```

Add a comment to the Linear parent issue:

```
Use create_comment: "[FAIL] Deployment failed after merge. {1-line cause}. See workflow: {run URL}"
```

**Do NOT move the parent issue to Done if deployment failed.** Keep it in In Review until the fix is deployed.

### 6.4 If Fix is Needed

**MANDATORY: If the fix requires ANY AWS/cloud operation (SSM, EC2, S3, key management, instance access, etc.), you MUST invoke `/devops-guru` BEFORE running any AWS commands.** Do NOT run raw `aws` CLI commands or use `mcp__aws-mcp__aws___call_aws` directly — even for "quick" fixes like `chown` via SSM or restarting a service. The devops-guru skill provides safety guardrails, Notion audit logging, and Linear tracking that are non-negotiable.

```
INFRASTRUCTURE FIX DETECTED → STOP → Invoke /devops-guru → THEN fix

Examples of infrastructure fixes that REQUIRE /devops-guru:
- SSM commands to fix file permissions, restart services, check logs
- EC2 key pair creation, rotation, or deletion
- Security group modifications
- Instance stop/start/reboot
- ANY aws ssm send-command, aws ec2 *, aws s3 * commands
```

If the failure is caused by the merged code (NOT infrastructure):
1. Create a hotfix commit on main (or a hotfix branch if branch protection is on)
2. Push the fix
3. Monitor the new workflow run
4. Report success/failure again

If the failure is caused by infrastructure (permissions, connectivity, config):
1. **Invoke `/devops-guru`** — this is NOT optional
2. Follow devops-guru's safety tiers, Notion logging, and Linear tracking
3. Execute the fix through devops-guru's workflow
4. Re-run the failed deployment workflow
5. Monitor the new workflow run

---

## Reviewing Without a Plan Doc

If there's no plan doc:

1. **Read the PR description carefully** — this is your only context
2. **Ask the author for context if needed** — don't guess at intent
3. **Focus more heavily on design review** — without a plan, bad approaches are more likely
4. **Suggest creating a plan doc** for complex features: "This feature is complex enough to benefit from a plan doc. Consider using `/ideate` before implementing."

---

## Reviewing Agent-Written Code

Code written by AI agents has specific patterns to watch for:

| Pattern | What to Check |
|---------|--------------|
| **Over-engineering** | Agent added abstractions, utilities, or error handling that isn't needed |
| **Hallucinated imports** | Agent imported a function/module that doesn't exist |
| **Pattern mismatch** | Agent followed a different pattern than what the codebase uses |
| **Missing edge cases** | Agent handled the happy path but missed failure modes |
| **Verbose code** | Agent wrote 50 lines where 10 would do |
| **Incorrect types** | Agent guessed at types instead of checking schemas |

---

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Review code before design | Always evaluate approach first |
| "LGTM" without reading the diff | Read every changed line |
| Flag linting/formatting issues | Trust CI to handle these |
| Approve because "the agent wrote it" | Agent code needs MORE scrutiny, not less |
| Block on style preferences | Only block on bugs, security, or wrong approach |
| Review without reading plan doc | Always read the plan doc if it exists |

---

## Related Skills
- [[pr]] — reviews target pull requests
- [[linear]] — review status syncs to Linear
- [[implement]] — reviews check implementation quality
- [[ideate]] — enhancement reviews check scope compliance (ideate enhancement mode)
- [[gru]] — PR review verifies Gru compliance on all commits
- [[ship]] — release PRs benefit from combined diff analysis
- [[devops-guru]] — MANDATORY when deployment failures require infrastructure fixes (Step 6.4)

## Self-Improvement

After completing this skill, if you discovered:
- A review check that was missing
- A common agent-written code pattern to watch for
- A better way to structure review feedback

Then **automatically** invoke the `/improve` skill to:
1. Add the learning to `LEARNINGS.md` in this skill folder
2. Update `SKILL.md` if it's a core instruction change
3. Commit and push
4. Notify user to sync


---

# Accumulated Learnings

> Auto-merged from LEARNINGS.md. Apply these edge cases, patterns, and preferences when executing this skill.



## Edge Cases

- When reviewing agent-written code, pay extra attention to hallucinated imports and over-engineering.
- If no plan doc exists, the review should be more thorough on design decisions since there's no pre-approved architecture.
- **Post-merge Linear update must be automatic.** When you merge a PR, update Linear to Done in the SAME turn — never wait for the engineer to ask. This was a real failure: Claude merged PR #252 but left ENG-482 in "In Review" until the engineer noticed.
- **ALWAYS invoke /devops-guru for infrastructure fixes during deployment monitoring.** When Step 6 (Post-Merge Deployment Monitoring) detects a failure that requires AWS operations (SSM, EC2, key management, etc.), you MUST invoke /devops-guru before running any AWS commands. Real failure: PR #321 deploy failed due to seabird dist/ permissions (root:root). Claude ran raw `aws ssm send-command` and `aws ec2 create-key-pair` / `delete-key-pair` directly without devops-guru — no Notion audit trail, no Linear tracking, no safety tiers. The "quick fix" mindset during deployment urgency caused the skill to be bypassed entirely.

## User Preferences

_(None yet - will be populated as skill is used)_

## Patterns

- Use `gh pr diff {number}` to get the full diff without checking out the branch
- Use `gh pr view {number} --json title,body,headRefName,files` for PR metadata
- Linear MCP tools can fetch issue details for context without leaving Claude Code
- **Severity calibration — "critical" must mean "breaks prod or corrupts data."** Three-question checklist before labeling anything Critical:
  1. Will this break existing consumers **at runtime** (not just at the type level)?
  2. Does the failure mode corrupt data silently, or fail gracefully?
  3. Is there a safe pattern already in the codebase (easy follow-up)?
  If the answer is "no runtime break + graceful failure + easy fix exists" → it's a Warning, not Critical. **When in doubt between Critical and Warning, default to Warning.** Over-escalating wastes reviewer time and erodes trust in actual criticals.
  - PR #317: MongoDB array-index race conditions — "theoretically critical" but internal tool, graceful failure, `arrayFilters` already in codebase → Warning.
  - PR #311: Schema defaults polluting other channels (data bloat, not corruption), interface optionality change (existing code already handles it), type-level ObjectId distinction (no runtime impact) — all 3 flagged Critical, all 3 were actually Warning/Suggestion.
- **MongoDB concurrency pattern**: Read-index-then-$set-by-index is a known race condition pattern. But if `arrayFilters` (the safe alternative) already exists in the codebase, recommend migration as a follow-up rather than blocking. Only block if: high-concurrency endpoint, silent data corruption, or no graceful failure.
- **Unauthenticated webhook endpoints** — Any new webhook route MUST be flagged if it has zero authentication (no HMAC signature verification, no API key, no IP allowlist, no secret token in URL). Severity depends on blast radius: if an attacker needs internal DB state (e.g., a specific `vilpowerTemplateId`) to exploit it, it's a Warning with follow-up; if the endpoint accepts arbitrary payloads that mutate state freely, it's Critical. PR #318: Vilpower DLT callback had no auth but required knowing internal vilpowerTemplateId → Warning, not blocker.
- **Intra-PR duplicate logic** — Check if the same PR introduces the same logic in multiple files. Common pattern: a service does inline conversion AND the client it calls has a method for the same conversion that's never used. Flag as Warning — pick one location and delete the other. Dead code from day one is worse than dead code that accumulated over time. PR #318: variable conversion in `smsTemplateDlt.service.ts` duplicated `vilpower.client.ts:convertToVilpowerVariables()`.
- **`as unknown as Type` proliferation** — When a model wrapper returns generic Mongoose types and every consumer casts with `as unknown as X` (3+ times in a PR), flag as Suggestion. The fix is usually adding typed return helpers to the model wrapper. Not a blocker, but it signals a leaky abstraction that will spread.
