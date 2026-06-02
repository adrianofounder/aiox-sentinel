# Instalacao Do AntiGravity Sentinel

## 1. Arquivos Verificados Do Projeto

1. Abra esta pasta como a unica pasta do projeto AntiGravity:

```text
D:\aiox-sentinel
```

2. Configuracao do projeto:

```text
D:\aiox-sentinel\.antigravity\antigravity.json
```

3. Regras do projeto:

```text
D:\aiox-sentinel\.antigravity\rules.md
```

4. Hooks do projeto:

```text
D:\aiox-sentinel\.antigravity\hooks.json
```

5. Agentes AntiGravity:

```text
D:\aiox-sentinel\.antigravity\agents
```

6. Arquivos de ativacao de workflow:

```text
D:\aiox-sentinel\.agent\workflows
```

## 2. Configuracoes Obrigatorias No AntiGravity

1. Pastas do projeto:

```text
D:\aiox-sentinel
```

2. Acesso fora do workspace:

```text
Deny
```

3. Execucao automatica de terminal:

```text
Request Review
```

4. Motor ativo:

```text
antigravity
```

5. Diretorios de motores inativos devem permanecer somente com marcador:

```text
D:\aiox-sentinel\.codex\ENGINE_DISABLED.md
D:\aiox-sentinel\.claude\ENGINE_DISABLED.md
D:\aiox-sentinel\.cursor\ENGINE_DISABLED.md
D:\aiox-sentinel\.gemini\ENGINE_DISABLED.md
```

## 3. Comandos Dos Hooks

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

## 4. Modo Bloqueante

1. Ausencia de `.aiox/sentinel/state.json` bloqueia.
2. Ausencia de `workflow_contract` bloqueia.
3. Agente incorreto bloqueia.
4. Comando incorreto bloqueia.
5. Handoff ausente bloqueia.
6. Evidencia de checklist ausente bloqueia.
7. Item de checklist nao marcado bloqueia.
8. Item `[N/A]` sem `justificativa:` ou `reason:` bloqueia.

## 5. Local Do Backup Fisico

1. Backups de motores inativos ficam fora do workspace:

```text
D:\.aiox-sentinel-backups\aiox-sentinel-227e927de7ad
```

2. Manifesto mais recente:

```text
D:\.aiox-sentinel-backups\aiox-sentinel-227e927de7ad\latest-manifest.json
```
