# AIOX Sentinel for AntiGravity

## Verified

1. AntiGravity supports blocking hooks through `PreToolUse` decisions.
2. AntiGravity supports `PreInvocation`, `PostInvocation` and `Stop` hooks.
3. AntiGravity permissions evaluate conflicts as `Deny > Ask > Allow`.
4. AIOX already has workflow chains, context persistence, checklist parsing and handoff artifacts.
5. The current soft AntiGravity integration only adds textual guardrails.

## Problem

AntiGravity can drift from the active AIOX workflow when multiple engine directories are present in the same workspace or when agent activation is handled only by Markdown instructions.

The target behavior is deterministic:

1. Only one AIOX engine is active in the workspace.
2. The active agent must match the expected agent.
3. The active command must match the expected command.
4. Checklist evidence must be complete before a step can pass.
5. Handoff evidence must include the next agent and next command before a workflow can continue.

## Implemented Sentinel Core

The deterministic implementation lives in `.aiox-core/core/sentinel/`.

1. `engine-isolation-guard.js`
   Detects active engine directories, validates one active engine, builds project-scoped backup manifests, plans dry-run isolation and applies confirmed isolation.

2. `checklist-evidence-gate.js`
   Blocks missing checklist evidence, unchecked items, malformed checkbox evidence and `[N/A]` items without justification.

3. `handoff-gate.js`
   Blocks missing, consumed or incomplete handoff artifacts. Sentinel handoffs must include `from_agent`, `to_agent`, `last_command`, `next_agent` and `next_command`.

4. `workflow-contract.js`
   Resolves workflow steps from `workflow-chains.yaml`-style data and validates expected agent/command against the actual invocation.

5. `hud.js`
   Generates a physical workflow visibility HUD with all steps, responsible agents, current/expected command, next handoff and blockers.

6. `antigravity-hook.js`
   Evaluates AntiGravity `PreToolUse` payloads and returns `allow`, `ask` or `deny`.

7. `.aiox-core/infrastructure/scripts/antigravity-sentinel-hook.js`
   CLI hook runner that reads AntiGravity hook JSON from stdin and writes the hook decision JSON to stdout.

8. `.aiox-core/infrastructure/scripts/antigravity-sentinel-isolate.js`
   CLI isolation runner. Defaults to dry-run and only applies backup/move when `--apply --confirm <project-id>` is provided.

9. `packages/installer/src/wizard/ide-config-generator.js`
   Generates `.antigravity/hooks.json` and points `.antigravity/antigravity.json` at the Sentinel hook runner.

10. `.aiox-core/core/sentinel/state-writer.js`
    Builds and writes `.aiox/sentinel/state.json` from runtime workflow handoffs.

11. `.aiox-core/core/orchestration/context-manager.js`
    Persists `next_agent`, `next_command`, command metadata and the Sentinel state contract whenever a phase handoff is saved.

12. `.aiox-core/core/orchestration/checklist-runner.js`
    Supports Sentinel mode. Manual checklist items no longer pass automatically when Sentinel mode is enabled.

## Hook Contract

AntiGravity `PreToolUse` should call:

```text
node .aiox-core/infrastructure/scripts/antigravity-sentinel-hook.js
```

The hook blocks when:

1. More than one engine directory is active.
2. The active engine directory is missing.
3. Sentinel state is present and the current agent does not match the expected agent.
4. Sentinel state is present and the current command does not match the expected command.

When Sentinel state is missing, the hook returns `ask` instead of silently allowing execution.

## Sentinel State Contract

The hook reads:

```text
.aiox/sentinel/state.json
```

Expected shape:

```json
{
  "active_engine": "antigravity",
  "workflow_contract": {
    "current_agent": "@qa",
    "expected_agent": "@qa",
    "expected_command": "*review {story-id}"
  }
}
```

This file is written by `ContextManager.savePhaseOutput()` after a workflow phase produces a handoff.

## Physical Isolation Contract

Inactive engines must be moved outside the active workspace before AntiGravity is trusted to run autonomously.

Planned backup location:

```text
D:\.aiox-sentinel-backups\<project-id>\<timestamp>\<engine>
```

Manifest fields:

1. `project_id`
2. `project_name`
3. `project_root`
4. `project_root_hash`
5. `remote`
6. `active_engine`
7. `moved_engines[].engine`
8. `moved_engines[].original_path`
9. `moved_engines[].backup_path`
10. `moved_engines[].marker_path`

Inactive marker file:

```text
ENGINE_DISABLED.md
```

The marker content intentionally does not contain the token `AIOX`.

## Isolation CLI

Dry-run:

```text
node .aiox-core/infrastructure/scripts/antigravity-sentinel-isolate.js --project-root D:\aiox-sentinel
```

Apply:

```text
node .aiox-core/infrastructure/scripts/antigravity-sentinel-isolate.js --project-root D:\aiox-sentinel --apply --confirm <project-id>
```

The apply path:

1. Verifies confirmation matches `project_id`.
2. Verifies every source engine directory exists.
3. Verifies every backup destination does not already exist.
4. Moves inactive engine directories to the project-scoped backup folder.
5. Recreates inactive engine directories with only `ENGINE_DISABLED.md`.
6. Writes the manifest to the backup folder.

## Pending

1. Execute real engine isolation only after explicit user confirmation naming concrete targets.
2. Validate AntiGravity end-to-end in an isolated workspace after engine directories are moved.

## Test Coverage

Tests live in `tests/unit/sentinel/sentinel.test.js`.

Covered gates:

1. Multiple active engines block.
2. Marker-only inactive engine passes.
3. Backup manifest includes project identity and backup paths.
4. Inactive marker content does not contain `AIOX`.
5. Dry-run plan does not move inactive engines.
6. Apply requires exact project id confirmation.
7. Apply moves inactive engines to backup and leaves marker only.
8. Missing checklist blocks.
9. Unchecked checklist blocks.
10. `[N/A]` without justification blocks.
11. Complete checklist passes.
12. Missing handoff blocks.
13. Handoff without `next_agent` and `next_command` blocks.
14. Complete handoff passes.
15. Wrong agent blocks.
16. Wrong command blocks.
17. HUD lists workflow steps and next handoff.
18. Runtime handoff includes `next_agent` and `next_command`.
19. Runtime writes `.aiox/sentinel/state.json`.
20. ChecklistRunner Sentinel mode blocks manual auto-pass.
