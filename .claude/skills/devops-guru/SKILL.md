---
description: "MANDATORY for ANY AWS or cloud operation. Trigger on: aws, ec2, s3, instances, buckets, secrets, cloud, infrastructure, deploy, ssm, iam, lambda, cloudwatch, logs, security groups, VPC, route53, SES, secrets manager, parameter store, describe instances, list instances, check instances. Provides safety guardrails, Notion audit logging, and Linear issue tracking. Even simple read queries (list instances, check S3) MUST go through this skill. Not for application code changes (use /implement)."
---

# DevOps Guru

Guided AWS cloud operations with safety guardrails, structured audit logging on Notion, and automated Linear issue tracking.

## Context

Learnings from previous usage (edge cases, patterns, preferences) are auto-merged into this file during sync. To add new learnings, edit the source `LEARNINGS.md` in this skill's folder in the minions repo.

## Core Principles

```
1. SAFETY FIRST      - Classify every action by risk tier before executing
2. AUDIT EVERYTHING  - Every AWS action logged to Notion with timestamps
3. CONFIRM BEFORE DESTROY - Never run RED/BLACK tier actions without explicit confirmation
4. LINEAR TRACKS WORK - Automated issue creation and status updates
5. REGION LOCKED     - Default ap-south-1, require explicit override for other regions
```

---

## AWS MCP Tools Reference

The agent has access to these AWS MCP tools:

| Tool | Risk | Description |
|------|------|-------------|
| `search_documentation` | SAFE | Search AWS docs by topic |
| `read_documentation` | SAFE | Fetch AWS doc page as markdown |
| `recommend` | SAFE | Get related doc recommendations |
| `list_regions` | SAFE | List all AWS regions |
| `get_regional_availability` | SAFE | Check service availability in regions |
| `suggest_aws_commands` | SAFE | Get CLI command suggestions |
| `retrieve_agent_sop` | SAFE | Get step-by-step AWS procedures |
| `call_aws` | **DANGEROUS** | Execute ANY AWS CLI command — unrestricted |

**CRITICAL:** `call_aws` has NO built-in safety. It can create, modify, or delete ANY AWS resource. ALL guardrails in this skill exist because this tool has none.

---

## Operation Risk Tiers

Every AWS operation MUST be classified before execution.

### GREEN — Read-Only (No confirmation needed)

```
Allowed actions:
- describe-*, list-*, get-*, head-*
- Any read/query/lookup operation
- Checking status, logs, metrics
- Searching resources

Examples:
- aws ec2 describe-instances
- aws s3 ls
- aws logs get-log-events
- aws cloudwatch get-metric-data
- aws ssm get-parameter
```

### YELLOW — Write/Modify (Single confirmation required)

```
Allowed actions:
- create-*, put-*, update-*, tag-*, start-*
- Modifying configurations, tags, parameters
- Starting instances, creating resources
- Updating security group rules

Examples:
- aws ec2 start-instances
- aws ssm put-parameter
- aws s3 cp (upload)
- aws secretsmanager update-secret
- aws ec2 authorize-security-group-ingress

Confirmation format:
"[WARN] YELLOW: About to [action]. This will [effect]. Proceed?"
```

### RED — Destructive/Dangerous (Double confirmation required)

```
Allowed actions (ONLY with double confirmation):
- delete-*, terminate-*, remove-*, stop-*, deregister-*
- Modifying IAM policies/roles
- Changing VPC/subnet/routing
- Modifying production database settings
- Scaling down resources

Examples:
- aws ec2 terminate-instances
- aws ec2 stop-instances
- aws s3 rm (delete objects)
- aws iam delete-role
- aws rds modify-db-instance

Double confirmation format:
"[CRITICAL] RED: About to [action]. This will [irreversible effect]."
"Type 'CONFIRM [action]' to proceed."
```

### BLACK — Forbidden (NEVER execute)

```
ABSOLUTELY PROHIBITED:
- Deleting VPCs, subnets, or route tables in production
- Removing IAM users or root-level policies
- Deleting S3 buckets (especially with --force)
- Deleting RDS/DocumentDB clusters or snapshots
- Modifying account-level settings
- Any action with --force or --no-preserve on production resources
- Creating or modifying billing/cost allocation
- Disabling CloudTrail or GuardDuty
- Modifying KMS key policies
- Any cross-account operations without explicit authorization

Response: "🚫 BLACK: This operation is forbidden. [reason]. Manual AWS Console action required."
```

---

## Safety Guardrards

### Region Lock

```
DEFAULT REGION: ap-south-1 (Mumbai)
ALLOWED REGIONS: ap-south-1

To operate in a different region:
1. Engineer must explicitly state the region
2. Confirm: "You're requesting an operation in [region]. Our default is ap-south-1. Confirm?"
3. Log the region override in Notion audit
```

### Service Allowlist

Only these AWS services are permitted without special authorization:

```
ALLOWED SERVICES:
- ec2          - Compute instances
- s3           - Object storage
- ssm          - Systems Manager (parameter store, run command)
- secretsmanager - Secrets management
- cloudwatch   - Monitoring and logs
- logs         - CloudWatch Logs
- rds          - Relational databases (if applicable)
- iam          - Identity (READ ONLY by default, writes are RED tier)
- route53      - DNS
- acm          - Certificates
- lambda       - Serverless functions
- sqs          - Message queues
- sns          - Notifications
- ses          - Email
- cloudfront   - CDN
- ecr          - Container registry
- ecs          - Container service
- elasticache  - Caching

RESTRICTED (require explicit authorization):
- organizations, billing, cost-explorer
- kms (key management)
- guardduty, securityhub, config
- Any service not listed above
```

### Naming & Tagging Rules

All created resources MUST have:

```
Required tags:
  - Environment: dev | staging | prod
  - Project: riverline
  - ManagedBy: devops-guru
  - CreatedBy: [developer name]
  - CreatedAt: [ISO timestamp]

Naming convention:
  - Format: {project}-{env}-{service}-{purpose}
  - Example: riverline-prod-ec2-api-server
```

### Cost Guardrails

```
BEFORE creating any resource, state:
1. Estimated monthly cost
2. Whether it's covered by free tier
3. On-demand vs reserved pricing comparison (if applicable)

PROHIBITED without explicit approval:
- Any instance type larger than t3.xlarge
- Any RDS instance larger than db.t3.large
- S3 storage classes other than Standard or Intelligent-Tiering
- NAT Gateways (expensive, propose alternatives first)
- Elastic IPs beyond what's already allocated
```

---

## Notion Audit Database

All operations are logged to a Notion database for audit trail.

### Database Location

```
Notion Page: Minions DevOps Guru Logs
URL: https://www.notion.so/riverline/Minions-DevOps-Guru-Logs-313eedaaab8580399124e034153883fc
Page ID: 313eedaaab8580399124e034153883fc
```

**Database ID:** `866befeb97764ff2a729b49d216ac284`
**Data Source ID:** `1ea349d4-ca3d-4111-b533-a28d120624e8`

### Database Schema

| Property | Type | Description |
|----------|------|-------------|
| Entry | title | Short description of the action |
| Action Type | select | `read`, `create`, `modify`, `delete`, `troubleshoot`, `deploy` |
| Risk Tier | select | `GREEN`, `YELLOW`, `RED` |
| Service | select | AWS service name (e.g., `ec2`, `s3`, `ssm`) |
| Command | rich_text | The exact AWS CLI command executed |
| Result | select | `success`, `failed`, `skipped`, `blocked` |
| Developer | rich_text | Name of the developer requesting the action |
| Instance | select | `torrent-prod`, `seabird-prod`, `dev`, `other` |
| Details | rich_text | Output summary, error messages, or notes |
| Linear Issue | url | Link to associated Linear issue (if any) |
| Timestamp | date | When the action was executed (include time) |

### Logging Rules

1. **Log BEFORE executing** YELLOW and RED tier operations (Result: `pending`)
2. **Update AFTER executing** with actual result
3. **Log GREEN operations** in batches — group related reads into one entry
4. **Never skip logging** — even failed or blocked operations must be logged
5. **Keep Details concise** — truncate command output to first 500 chars

### How to Log

```
Use mcp__notion__notion-create-pages with:
  parent: { "data_source_id": "1ea349d4-ca3d-4111-b533-a28d120624e8" }
  properties:
    "Entry": "Short description"
    "Action Type": "read" | "create" | "modify" | "delete" | "troubleshoot" | "deploy"
    "Risk Tier": "GREEN" | "YELLOW" | "RED"
    "Service": "ec2" | "s3" | "ssm" | etc.
    "Command": "aws ec2 describe-instances ..."
    "Result": "success" | "failed" | "skipped" | "blocked" | "pending"
    "Developer": "Name"
    "Instance": "torrent-prod" | "seabird-prod" | "dev" | "other"
    "Details": "Output summary or error"
    "Linear Issue": "https://linear.app/riverline/issue/ENG-XXX"
    "date:Timestamp:start": "2026-02-26T10:30:00+05:30"
    "date:Timestamp:is_datetime": 1
```

---

## Linear Integration

Every non-trivial operation gets a Linear issue for tracking.

### When to Create Issues

| Scenario | Create Issue? |
|----------|--------------|
| Quick read/lookup (GREEN) | No |
| Single resource modification (YELLOW) | Yes — if it's a planned change |
| Multi-step operation | Always |
| Troubleshooting session | Always |
| Deployment/scaling | Always |
| Any RED tier operation | Always |

### Issue Creation

Use Linear MCP `create_issue`:

```
Title: [DevOps] {action description}
Team: Engineering
Label: DevOps
Priority: {based on urgency — ask if unclear}
Description:
  ## Operation
  {What is being done and why}

  ## Resources Affected
  {List of AWS resources, instance IDs, etc.}

  ## Risk Assessment
  Tier: {GREEN/YELLOW/RED}
  Region: {region}
  Estimated Impact: {description}

  ## Steps
  - [ ] {step 1}
  - [ ] {step 2}

  ## Rollback Plan
  {How to undo if something goes wrong}
```

### Status Workflow

```
Todo → In Progress → Done (or Canceled)
```

- **Todo**: Issue created, operation planned
- **In Progress**: Operation is being executed
- **Done**: Operation completed successfully, verified
- **Canceled**: Operation was aborted or not needed

### Automated Status Updates

1. **Create issue** → status: `Todo`
2. **Start executing** → update to `In Progress`
3. **After completion** → ASK the engineer: "Operation complete. Shall I mark the Linear issue as Done?"
4. **On engineer confirmation** → update to `Done`
5. **If operation fails/aborted** → ASK: "Operation failed/was stopped. Mark as Canceled?"

**NEVER auto-close issues.** Always ask the engineer first.

### Link to Notion

After creating the Linear issue, include the issue URL in the Notion audit log entry's `Linear Issue` property.

---

## Workflow

### Phase 0: PREFLIGHT (BLOCKING)

**This phase MUST pass before ANY AWS operation is executed.**

```
1. Test Notion MCP authentication:
   - Call mcp__notion__notion-fetch with id "313eedaaab8580399124e034153883fc"
   - If it returns successfully → proceed to Phase 1
   - If it returns "requires re-authorization (token expired)" → BLOCK

2. If Notion MCP is not authenticated:
   - DO NOT execute any AWS commands
   - Tell the engineer: "Notion MCP token is expired. Run /mcp to re-authorize
     the Notion server before I can proceed. Audit logging is mandatory —
     no AWS operations without it."
   - STOP and wait for re-authorization
   - After re-auth, re-run the preflight check
```

**Why this is non-negotiable:** The entire point of this skill is the audit trail. Running AWS operations without logging them defeats the purpose and creates untracked infrastructure changes.

### Phase 1: CONTEXT

Before any operation:

```
1. Ask: "What do you need to do?" (if not already clear)
2. Identify the developer name (for audit trail)
3. Determine: which AWS resources are involved?
4. Check: is this a known SOP? (use retrieve_agent_sop to check)
```

### Phase 2: CLASSIFY

```
1. Classify the operation tier (GREEN/YELLOW/RED/BLACK)
2. Check service is in the allowlist
3. Verify region (default ap-south-1)
4. Estimate cost impact (if creating resources)
5. Present the plan to the engineer:
   "I'll run [commands] in [region]. Risk tier: [tier]. [cost estimate if applicable]"
```

### Phase 3: PLAN & TRACK

For non-trivial operations:

```
1. Create Linear issue with full details
2. Log the planned operation to Notion (Result: pending)
3. Present step-by-step plan
4. Get engineer confirmation
```

### Phase 4: EXECUTE

```
1. Update Linear issue to "In Progress"
2. Execute commands one at a time
3. Log each command result to Notion
4. If any command fails:
   - Stop execution
   - Log the failure
   - Present error and suggest fixes
   - Do NOT continue without engineer approval
```

### Phase 5: VERIFY & CLOSE

```
1. Verify the operation succeeded (run describe/list commands)
2. Log final status to Notion
3. Ask engineer: "Operation complete. Results: [summary]. Mark Linear issue as Done?"
4. On confirmation: update Linear issue status
5. Present final summary
```

---

## Emergency Procedures

### If Something Goes Wrong

```
1. STOP all operations immediately
2. Log the error to Notion with full details
3. Present: "[ALERT] Error occurred: [description]. No further actions taken."
4. Suggest rollback steps (but do NOT execute without confirmation)
5. Update Linear issue with error details
```

### Rollback Protocol

```
For EVERY YELLOW/RED operation, before executing:
1. Document the current state (describe the resource before changes)
2. Document the rollback command
3. Log both to Notion

If rollback is needed:
1. Present the rollback plan
2. Get explicit confirmation
3. Execute rollback
4. Verify rollback succeeded
5. Log everything
```

---

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Run multiple write commands without pausing | Execute one at a time, verify each |
| Skip Notion logging for "quick" operations | Log everything — no exceptions |
| Auto-close Linear issues | Always ask the engineer first |
| Assume the region | Confirm ap-south-1 or ask |
| Run `call_aws` without classifying tier first | Always classify, then execute |
| Use `--force` or `--no-preserve` flags | Find safer alternatives |
| Create resources without tags | Always tag per naming rules |
| Estimate costs without checking | Use AWS pricing docs or suggest_aws_commands |

---

## Quick Reference Card

```
┌──────────────────────────────────────────────────┐
│              DEVOPS GURU QUICK REF                │
├──────────────────────────────────────────────────┤
│ GREEN  = Read only     → Just do it + batch log  │
│ YELLOW = Write/modify  → Confirm once + log      │
│ RED    = Destructive   → Double confirm + log     │
│ BLACK  = Forbidden     → Refuse + explain why     │
├──────────────────────────────────────────────────┤
│ Region: ap-south-1 (always confirm)              │
│ Tags: Environment, Project, ManagedBy, CreatedBy │
│ Notion: Log EVERY action                         │
│ Linear: Create for non-trivial ops               │
├──────────────────────────────────────────────────┤
│ Notion Page ID: 313eedaaab8580399124e034153883fc │
│ Notion Data Source: 1ea349d4-ca3d-4111-b533-a28d │
│ Linear Team: Engineering                         │
│ Linear Label: DevOps (27aaa05d-92d0-4433-...)    │
└──────────────────────────────────────────────────┘
```

---

## Related Skills

- [[linear]] — issue creation and status management conventions
- [[improve]] — update this skill when new patterns are discovered
- [[env]] — environment variable changes that may accompany infra changes
- [[pr-review]] — deployment monitoring (Step 6) can trigger infrastructure fixes that MUST go through this skill

## Self-Improvement

After completing this skill, if you discovered:
- A new safety rule that should always be enforced
- A service that should be added/removed from the allowlist
- A better audit logging pattern
- A common operation that needs a specific procedure

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

_(None yet - will be populated as skill is used)_


---

# Accumulated Learnings

> Auto-merged from LEARNINGS.md. Apply these edge cases, patterns, and preferences when executing this skill.



## Edge Cases

### ALWAYS invoke /devops-guru for ANY cloud/AWS task (2026-02-26)

This skill MUST be invoked for **every** AWS or cloud-related operation, no matter how small — including simple read queries like `describe-instances` or `s3 ls`. The audit trail only works if it's used 100% of the time. Never bypass the skill to "just quickly run" an AWS command directly.

**Discovered when:** A simple "list EC2 instances" query was run directly via AWS MCP without invoking the skill, skipping the audit trail entirely.

### AWS operations triggered from OTHER skills must still invoke /devops-guru (2026-03-04)

When another skill's workflow leads to AWS operations (e.g., /pr-review's deployment monitoring detects a failure that needs SSM fixes), /devops-guru MUST still be invoked. The most dangerous bypass scenario is when AWS ops feel like "quick side tasks" within a larger workflow — urgency and context drift cause the skill to be skipped entirely.

**Discovered when:** /pr-review's Step 6 (deployment monitoring) detected a seabird deploy failure (dist/ owned by root). Claude ran 10+ raw AWS commands (SSM send-command for chown, EC2 create-key-pair, delete-key-pair, describe-instances) without invoking /devops-guru. Result: SSH key rotation with zero audit trail, zero Linear tracking, zero safety tier classification. A RED-tier operation (key pair deletion) was executed without any confirmation gate.

## User Preferences

### NEVER use Elastic IPs — use public IPs instead (2026-03-03)

Jayanth strongly prefers using auto-assigned public IPs (`--associate-public-ip-address`) over Elastic IPs. EIPs have account limits (default 5), cost money when unattached, and are overkill for most use cases. Only consider EIPs if the user explicitly asks for a static IP that survives stop/start cycles.

**Discovered when:** Tried to allocate an EIP for the svg-animator instance, hit the AddressLimitExceeded error, and wasted time investigating existing EIPs when a simple public IP was all that was needed.

## Patterns

- Notion audit page: `313eedaaab8580399124e034153883fc` (Minions DevOps Guru Logs)
- Notion audit database data source ID: `1ea349d4-ca3d-4111-b533-a28d120624e8`
- Linear DevOps label ID: `27aaa05d-92d0-4433-849e-7a898192f22e`
- Notion create-database uses SQL-style schema string: `("Col" TYPE, ...)` with TITLE, SELECT('a','b'), RICH_TEXT, URL, DATE types
- Default region: `ap-south-1` (Mumbai)
- Linear team: Engineering, label: DevOps
- All created resources must be tagged with Environment, Project, ManagedBy, CreatedBy, CreatedAt
