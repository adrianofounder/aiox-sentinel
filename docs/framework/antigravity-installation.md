# AntiGravity Sentinel Installation

## Verified Project Files

1. Open this folder as the only AntiGravity project folder:

```text
D:\aiox-sentinel
```

2. Project configuration:

```text
D:\aiox-sentinel\.antigravity\antigravity.json
```

3. Project rules:

```text
D:\aiox-sentinel\.antigravity\rules.md
```

4. Project hooks:

```text
D:\aiox-sentinel\.antigravity\hooks.json
```

5. AntiGravity agent files:

```text
D:\aiox-sentinel\.antigravity\agents
```

6. AntiGravity workflow activation files:

```text
D:\aiox-sentinel\.agent\workflows
```

## Required AntiGravity Settings

1. Project folders:

```text
D:\aiox-sentinel
```

2. Non-workspace access:

```text
Deny
```

3. Terminal auto execution:

```text
Request Review
```

4. Active engine:

```text
antigravity
```

5. Inactive engine directories must stay marker-only:

```text
D:\aiox-sentinel\.codex\ENGINE_DISABLED.md
D:\aiox-sentinel\.claude\ENGINE_DISABLED.md
D:\aiox-sentinel\.cursor\ENGINE_DISABLED.md
D:\aiox-sentinel\.gemini\ENGINE_DISABLED.md
```

## Hook Command

1. `PreInvocation`

```text
node ".aiox-core/infrastructure/scripts/antigravity-sentinel-hook.js" --event PreInvocation
```

2. `PreToolUse`

```text
node ".aiox-core/infrastructure/scripts/antigravity-sentinel-hook.js" --event PreToolUse
```

3. `PostInvocation`

```text
node ".aiox-core/infrastructure/scripts/antigravity-sentinel-hook.js" --event PostInvocation
```

4. `Stop`

```text
node ".aiox-core/infrastructure/scripts/antigravity-sentinel-hook.js" --event Stop
```

## Blocking Mode

1. Missing `.aiox/sentinel/state.json` blocks.
2. Missing `workflow_contract` blocks.
3. Wrong agent blocks.
4. Wrong command blocks.
5. Missing handoff blocks.
6. Missing checklist evidence blocks.
7. Unchecked checklist items block.
8. `[N/A]` checklist items without `justificativa:` or `reason:` block.

## Physical Backup Location

1. Inactive engine backups are stored outside the workspace:

```text
D:\.aiox-sentinel-backups\aiox-sentinel-227e927de7ad
```

2. Latest manifest:

```text
D:\.aiox-sentinel-backups\aiox-sentinel-227e927de7ad\latest-manifest.json
```
