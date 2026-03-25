---
description: "Execute and implement dev tasks — implement, build it, start working, execute, let's code, work on this. Reads plan docs, adapts to feature/enhancement/bug fix. Uses TDD and worktrees. Not for planning or PRs."
---

# Implement

Execute development tasks — features, enhancements, and bug fixes — by reading plan docs and adapting strategy to task type.

## Context

Learnings from previous usage (edge cases, patterns, preferences) are auto-merged into this file during sync. To add new learnings, edit the source `LEARNINGS.md` in this skill's folder in the minions repo.

## Core Principles

```
1. EVIDENCE BEFORE CLAIMS - Never claim work is done without verification
2. TEST FIRST             - No production code without a failing test first
3. ROOT CAUSE             - If something breaks, understand why before fixing
4. TYPE-AWARE             - Adapt execution strategy to the task type
```

## Workflow Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   DETECT    │ ──▶ │  RESEARCH   │ ──▶ │   EXECUTE   │ ──▶ │  FINALIZE   │
│             │     │             │     │             │     │             │
│ • Plan doc  │     │ • Explore   │     │ • Worktree  │     │ • Verify    │
│ • Task type │     │ • Questions │     │ • TDD       │     │ • Commit    │
│ • Context   │     │ • Patterns  │     │ • Parallel  │     │ • PR        │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

---

## MANDATORY: Skill Check Before Every Task

**Before starting ANY task, check for relevant skills:**

1. Search available skills in the Skill tool's "Available skills" list
2. Use Explore subagent to search `~/Desktop/Riverline/minions/skills/` for skills
3. If a skill exists for the task, USE IT instead of doing manually

| Task Type | Skill to Use |
|-----------|--------------|
| Planning a feature | `/ideate` |
| Scoping an enhancement | `/enhance` |
| Debugging errors | `/debug` |
| Creating queues/workers | `/queue` (if available) |
| Adding env variables | `/env` (if available) |
| Committing code | `/commit` |
| Opening a PR | `/pr` |
| Reviewing code / PR | `/pr-review` |
| Linear issue operations | `/linear` |
| Dev trail logging (torrent) | `/logs` (auto-activates during Execute) |

**This is MANDATORY, not a suggestion.**

---

## Phase 0: DETECT

**Goal:** Determine task type and load context from plan doc.

### 0.1 Find the Plan/Scope Doc

```bash
ls docs/ideates/
```

If a plan doc exists for this task, read it and extract:
- **`Type:` field** → Feature / Enhancement / Bug Fix
- Tasks/sub-tasks
- Files to create/modify
- Linear issue ID
- Architecture decisions (for features)
- Backward compatibility notes (for enhancements)
- Root cause + fix description (for bug fixes)

### 0.2 Detect Task Type

Use this priority order:

1. **Plan doc `Type:` field** (most reliable)
2. **Branch name prefix:** `feature/` → Feature, `enhance/` → Enhancement, `fix/` → Bug Fix
3. **Ask the developer** if neither works

### 0.3 Adapt Strategy

| Aspect | Feature | Enhancement | Bug Fix |
|--------|---------|-------------|---------|
| **Worktree** | Always | If >3 files | If >3 files |
| **TDD** | Full RED-GREEN-REFACTOR | Tests for changed behavior | Regression test FIRST |
| **Research** | Full codebase exploration | Focused on affected area | Root cause already known |
| **Plan doc** | From /ideate (heavy) | From /enhance (light) | From /debug (fix doc) |
| **Subagents** | Parallel for independent tasks | Rarely needed | No |
| **Verification** | Full build + quality + test | Full build + quality + test | Full + regression verify |

### 0.4 Skip Research + Plan if Doc Exists

**If a plan/scope doc exists:**
1. The thinking has already been done — don't redo it
2. Use the doc's tasks as your task breakdown
3. Read linked Linear issues for additional context
4. **Skip Phase 1 (Research)** — go straight to Phase 2 (Execute)

**If no plan doc exists:** Proceed with Phase 1.

---

## Phase 1: RESEARCH

**Goal:** Gather all information needed before coding. Skip if plan doc exists.

### 1.1 Understand the Request

- What exactly does the user want?
- What problem does this solve?
- What are the success criteria?

### 1.2 Explore the Codebase

Use the Explore agent to understand:

```
Architecture:
- Which app/module does this belong in?
- Existing similar features to reference
- Database schemas involved
- Services that might be reusable

Patterns:
- How are similar things structured?
- What validation patterns exist?
- How is error handling done?

Dependencies:
- External APIs or services needed
- Shared packages
- Environment variables required
```

### 1.3 Brainstorm When Requirements Unclear

**If requirements are ambiguous, use collaborative design:**

1. **One question at a time** — don't overwhelm
2. **Multiple choice preferred** — use AskUserQuestion with options
3. **Present 2-3 approaches** with trade-offs
4. **Lead with recommendation** and explain why

### 1.4 Ask Clarifying Questions

Use AskUserQuestion for:
- Ambiguous requirements
- Business logic edge cases
- Priority and scope decisions

### 1.5 Research Output

Document findings:
- Files to create/modify
- Patterns to follow (with file references)
- Dependencies needed
- Open questions resolved

---

## Phase 2: EXECUTE

**Goal:** Complete all tasks using TDD, git worktree, and parallel execution.

### 2.1 Setup Git Worktree

**Never work on main branch. Always use a worktree (for features and large changes).**

```bash
# 1. Pull latest
git fetch origin main
git checkout main
git pull origin main

# 2. Create worktree (if branch doesn't exist yet)
git worktree add ../{repo-name}-{task-name} -b {branch-prefix}/{task-name}
cd ../{repo-name}-{task-name}

# If branch already exists (from /ideate, /enhance, or /debug):
git worktree add ../{repo-name}-{task-name} {existing-branch}
cd ../{repo-name}-{task-name}
```

**For small changes (1-3 files):** Working on the existing branch without a worktree is acceptable.

### 2.2 TDD: Test-Driven Development

**The Iron Law: No production code without a failing test first.**

**Source of test cases:** Read the Test Strategy / Test Impact / Regression Test section from the plan/scope/fix doc. These were defined during planning — do NOT reinvent them.

```
For EACH task:
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│   RED   │ ──▶ │ VERIFY  │ ──▶ │ COMMIT  │ ──▶ │  GREEN  │ ──▶ │ COMMIT  │
│         │     │   RED   │     │  TEST   │     │         │     │  IMPL   │
│ Write   │     │ Watch   │     │         │     │ Minimal │     │         │
│ test    │     │ fail    │     │ test:   │     │ code    │     │ feat:   │
└─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘
                                                      │
                                                      ▼
                                                ┌─────────┐
                                                │REFACTOR │
                                                │         │
                                                │ Clean   │
                                                │ up      │
                                                └─────────┘
```

### 2.2.1 The Two-Commit Pattern (MANDATORY)

**Each task produces TWO commits in this order:**

```bash
# Commit 1: The failing test (RED)
git add {test-file}
git commit -m "test: add failing test for {task description}"

# Commit 2: The implementation (GREEN)
git add {source-files}
git commit -m "feat|fix|enhance: {task description}"
```

**This is non-negotiable.** The two-commit pattern:
- Proves tests were written BEFORE code (auditable in git history)
- Makes TDD compliance verifiable during PR review
- Creates a clear trail: `test:` commit always precedes its `feat:` commit

**After refactoring** (if needed), amend the implementation commit or add a third commit. Tests must still pass.

### 2.2.2 RED — Write Failing Test

Use the test cases from the plan/scope/fix doc:

```typescript
test('creates user with valid email', async () => {
  const result = await createUser({ email: 'test@example.com' })
  expect(result.id).toBeDefined()
  expect(result.email).toBe('test@example.com')
})
```

**Run it. It MUST fail.** If it passes, you're testing existing behavior — rewrite the test.

Use the `/test` skill (if available for this repo) for test conventions, file locations, and mocking patterns.

### 2.2.3 GREEN — Write Minimal Code

Write the **minimum production code** to make the test pass. Nothing more.

### 2.2.4 REFACTOR — Clean Up

Improve code structure while keeping tests green. Run tests after every change.

### 2.2.5 TDD Strict Rules

**Wrote code before the test?**
- DELETE IT. Start over.
- The test must come first to drive the design.

**Test passes on first run?**
- You're testing existing behavior, not new behavior.
- FIX THE TEST to actually test the new functionality.

### 2.2.6 Test Coverage Requirements

Every task must test BOTH success AND failure scenarios:

```typescript
// Success scenario
test('creates user with valid email', async () => { ... })

// Failure scenario — EQUALLY IMPORTANT
test('throws error for invalid email', async () => { ... })

// Edge case (from plan doc's Edge Cases section)
test('handles empty input gracefully', async () => { ... })
```

### 2.2.7 Mock External Dependencies

Isolate tests from external systems:
- Third-party APIs
- External services
- Time-sensitive operations (use fake timers)
- Database models (mock Mongoose methods)
- Queue operations (mock BullMQ)

### 2.2.8 Task-Type-Specific TDD

**For Features:** Full RED-GREEN-REFACTOR for every service function. Each sub-task from the plan doc gets its own test → commit → implement → commit cycle.

**For Enhancements:** Write tests for the CHANGED behavior. Update existing tests that cover the modified area. Use the scope doc's "Existing Tests to Update" section.

**For Bug Fixes:** The regression test was already defined in the fix doc. Write it FIRST — it must fail without the fix:

```
1. Write test for the bug → Run → FAIL (bug confirmed) → commit "test: ..."
2. Implement the fix → Run → PASS (bug fixed) → commit "fix: ..."
3. REVERT the fix temporarily
4. Run test → MUST FAIL (proves test catches the bug)
5. Restore fix → PASS
```

### 2.2.9 Trail Logging (/logs Integration)

**For torrent repos only:** When writing service functions, route handlers, queue processors, or business logic, automatically add structured trail logs following the `/logs` skill.

**Setup at start of Execute phase:**
1. Determine TRACE_ID for this feature (phone, loanId, etc. — context-dependent)
2. Determine FEATURE_NAME from plan doc or branch name (UPPER_SNAKE_CASE)
3. Create log session directory: `logs/{developer}/{feature}/{timestamp}/`

**While writing code:**
- Add trail logs using format: `[TRACE_ID][FEATURE][fn][file][EVENT] message`
- Log the full dev trail: ENTRY, DATA, BRANCH, LOOP, TRANSFORM, CALL, TRANSFER, CHECKPOINT
- **MANDATORY:** Every catch block and error path gets an `[ERROR]` log
- Log what tells a story — skip trivial assignments and type checks

**See `/logs` skill for full event vocabulary, examples, and rules.**

### 2.3 Check for Relevant Skills Before Each Task

Before starting any task:
1. Check if a skill exists for this task type
2. If skill exists → invoke it
3. If no skill → proceed with TDD

### 2.4 Execution Strategy

```
Parallel execution where possible:
- Independent service tasks → parallel subagents
- Independent test tasks → parallel subagents
- Schema must complete before services
- Services must complete before routes
```

### 2.5 Use Subagents for Parallel Work

Launch multiple Task agents simultaneously:
- Each agent handles one atomic task
- Agents follow TDD independently
- Results combined at the end

### 2.6 Pause and Ask When Doubtful

**If uncertain about any implementation detail:**
- STOP and ask the developer
- Use AskUserQuestion with specific options
- Do NOT guess or assume

---

## Phase 3: FINALIZE

**Goal:** Verify everything works, then present options.

### 3.1 Final Verification (MANDATORY)

Run your repo's build and quality checks. All must pass before proceeding.

**Critical Rule:** If you haven't run the verification command **in this message**, you cannot claim it passes. Claims require evidence from the current context.

Never use:
- "Should work now"
- "Looks correct"
- "Probably passes"
- "Tests passed earlier" (must pass NOW)

### 3.0.1 Trail Log Merge (/logs Integration)

**For torrent repos only:** Before committing or opening a PR, trigger trail log cleanup:

1. Ask the engineer: "Feature working? Want to merge trail logs?"
2. If yes: activate `/logs` merge mode
   - Scan all trail logs in files changed on the branch
   - Categorize: auto-keep (ERROR, TRANSFER, CHECKPOINT), auto-remove (EXIT, CALL, DATA, BRANCH, LOOP), review (ENTRY, TRANSFORM, custom)
   - Present summary table to engineer
   - Engineer approves/adjusts
   - Strip dev logs, keep prod logs
3. After merge: proceed to verification and PR

**See `/logs` skill for full merge process, rules, and summary format.**

### 3.1.1 Cleanup Development Artifacts

**Before committing, DELETE temporary files created during development:**

| Artifact Type | When to Delete |
|---------------|----------------|
| One-off scripts | After feature complete |
| Data migration scripts | After migration runs |
| Debug test files | After debugging complete |
| Temporary utilities | After they served purpose |

### 3.2 Regression Test Verification (Bug Fixes Only)

When fixing a bug, verify your test actually catches it:

```
1. Write test for the bug → Run → PASS (with fix)
2. REVERT the fix temporarily
3. Run test again → MUST FAIL
4. Restore fix → Run → PASS
```

If test passes with AND without the fix, it doesn't test the right thing.

### 3.3 Characterization Tests (For Refactoring)

**Before refactoring ANY existing code, create characterization tests first:**

1. Write tests that pass with CURRENT code
2. Run tests to confirm they pass
3. Refactor the code
4. Tests must still pass (behavior preserved)

### 3.4 When Developer Says "Done"

Present options using AskUserQuestion:

| Option | Description |
|--------|-------------|
| **Create PR** | Push branch, create PR with `/pr` skill (Recommended) |
| **Keep Working** | Keep worktree, continue later |
| **Discard** | Delete worktree and branch |

### 3.5 Option: Create PR (Recommended)

Use the `/pr` skill which:
1. Detects task type from plan doc
2. Creates PR with type-specific description
3. Links to plan doc and Linear issues
4. Updates Linear statuses

### 3.6 Option: Discard

**Confirm first** — require typed "discard" confirmation.

```bash
cd ~/Desktop/Riverline/{repo}
git worktree remove ../{worktree-name} --force
git branch -D {branch-name}
```

---

## Quick Reference

### TDD Quick Reference
| Phase | Action | Verify |
|-------|--------|--------|
| RED | Write failing test | Test fails for expected reason |
| GREEN | Write minimal code | Test passes |
| REFACTOR | Clean up | Tests still pass |

### Task Type Quick Reference
| Type | Entry Point | Plan Doc | Branch Prefix | PR Emphasis |
|------|-------------|----------|---------------|-------------|
| Feature | /ideate | Heavy (plan doc) | `feature/` | Architecture, decisions, diagrams |
| Enhancement | /enhance | Light (scope doc) | `enhance/` | What changed, backward compat |
| Bug Fix | /debug | Fix doc | `fix/` | Root cause, regression test |

### Related Skills (MANDATORY to check)
- `/ideate` — for feature planning
- `/enhance` — for enhancement scoping
- `/debug` — for bug diagnosis
- `/commit` — for committing changes
- `/pr` — for opening PRs
- `/pr-review` — for code review
- `/linear` — for Linear operations

---

## Related Skills
- [[ideate]] — features start with planning
- [[ideate]] — enhancements start with scoping (ideate enhancement mode)
- [[debug]] — bug fixes start with diagnosis
- [[pr]] — implementation ships via PRs
- [[explore]] — understand codebase before implementing


## Self-Improvement

After completing this skill, if you discovered:
- A missing step in the workflow
- A better execution approach
- A task-type adaptation that was missing

Then **automatically** invoke the `/improve` skill to update this skill.


---

# Accumulated Learnings

> Auto-merged from LEARNINGS.md. Apply these edge cases, patterns, and preferences when executing this skill.



## Edge Cases

### NEVER Skip Skill Workflow Before Writing Code (2026-02-20)

When a user asks to implement a feature, enhancement, or bug fix, **ALWAYS** use the appropriate minion skill FIRST before writing any code:
- `/enhance` for improvements to existing features
- `/ideate` for new features
- `/debug` for bug fixes

Do **NOT** skip the skill workflow even if the task seems straightforward. The skill generates a scope/plan/fix doc that guides implementation and ensures proper research, edge case consideration, and test planning.

**Discovered when:** Code was directly implemented (a model switch from Gemini to Claude Sonnet 4.6 and prompt replacement for call disposition) without using `/enhance` then `/implement`, violating the mandatory workflow. The correct flow was `/enhance` → `/implement`.

**Rule:** If the task involves changing code, the entry-point skill (`/enhance`, `/ideate`, or `/debug`) MUST run first. Only after the scope/plan/fix doc is produced should `/implement` be invoked.

### NEVER Add Arbitrary Limits (Critical Mistake)

When implementing features, **NEVER** add hardcoded limits, batch sizes, or caps unless the user explicitly requests them.

**Bad:**
```typescript
const eligible = await getEligibleCustomersForTeam(teamId, 100)
```

**Good:**
```typescript
const eligible = await getEligibleCustomersForTeam(teamId)
```

**Rule:** If you think a limit is needed, ASK the user first.

### Worktree Merge Limitation

Can't checkout `main` in a worktree when `main` is already checked out in the main repo.

**Solution:** Go to the main repo directory to merge:
```bash
cd ~/Desktop/Riverline/{repo}  # Main repo, not worktree
git checkout main
git merge feature/my-feature
git push origin main
```

### Interface Wrapper Patterns

Service functions often return wrapped objects, not raw documents. Check the return type interface:

```typescript
// Wrong - accessing directly
eligible[0]._id  // undefined!

// Right - access nested
eligible[0].customer._id
```

### Schema Validation Surprises

When creating test data, required fields can cause unexpected validation failures. Always read the full schema and provide all required fields, even in tests.

### Test Data Design for Cumulative Limits

When testing cumulative limits with intermediate limits, either directly set the final state or simulate multiple iterations.

## User Preferences

### UI Loading States
- Never use skeleton loaders that replace content
- Use transparent overlays with small spinners
- Keep components stuck to the page

## Patterns

- Plan docs live at `docs/ideates/{name}.md` in the repo
- Feature branches: `feature/{issue-id}-{name}`
- Enhancement branches: `enhance/{issue-id}-{name}`
- Fix branches: `fix/{issue-id}-{name}`
- TDD cycle: RED → VERIFY RED → GREEN → REFACTOR
- Characterization tests before refactoring existing code
- Regression test verification: revert fix, verify test fails

### Route-Service Separation (Clean Architecture)

Routes should NEVER call models directly. All database operations go through services.

| Layer | Responsibility |
|-------|----------------|
| **Routes** | HTTP concerns only: parsing, formatting, validation, status codes |
| **Services** | Business logic and ALL database operations |

### Parallel Agent Conflict Resolution

When merging code from parallel agents:
1. Check for duplicate functionality
2. Check for conflicting implementations
3. Ensure integration points connect
4. Run full test suite after merge
