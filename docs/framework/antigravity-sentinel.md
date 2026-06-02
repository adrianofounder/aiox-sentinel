# AIOX Sentinel Para AntiGravity

## 1. Verificado

1. AntiGravity suporta hooks bloqueantes por decisoes de `PreToolUse`.
2. AntiGravity suporta hooks `PreInvocation`, `PostInvocation` e `Stop`.
3. Permissoes do AntiGravity avaliam conflitos com precedencia `Deny > Ask > Allow`.
4. AIOX ja possui workflow chains, persistencia de contexto, parsing de checklist e artefatos de handoff.
5. A integracao antiga do AntiGravity era majoritariamente textual e nao bloqueante.

## 2. Problema

1. AntiGravity pode sair do workflow AIOX ativo quando varios diretorios de motores estao no mesmo workspace.
2. AntiGravity pode misturar personas quando a ativacao de agente depende apenas de Markdown.
3. AntiGravity pode continuar sem checklist fisico completo.
4. AntiGravity pode continuar sem handoff fisico com proximo agente e proximo comando.

## 3. Comportamento-Alvo

1. Somente um motor AIOX fica ativo no workspace.
2. O agente ativo precisa corresponder ao agente esperado.
3. O comando ativo precisa corresponder ao comando esperado.
4. Checklist fisico precisa estar completo antes de uma etapa passar.
5. Handoff fisico precisa conter proximo agente e proximo comando antes do workflow continuar.
6. Todas as mensagens operacionais devem estar em PT-BR e numeradas.

## 4. Nucleo Sentinel Implementado

1. `.aiox-core/core/sentinel/engine-isolation-guard.js`
   Detecta diretorios de motores, valida um unico motor ativo, cria manifestos de backup por projeto, planeja isolamento em dry-run e aplica isolamento confirmado.

2. `.aiox-core/core/sentinel/checklist-evidence-gate.js`
   Bloqueia checklist ausente, itens nao marcados, checkbox malformado e itens `[N/A]` sem justificativa.

3. `.aiox-core/core/sentinel/handoff-gate.js`
   Bloqueia handoff ausente, consumido ou incompleto. Handoffs Sentinel precisam incluir `from_agent`, `to_agent`, `last_command`, `next_agent` e `next_command`.

4. `.aiox-core/core/sentinel/workflow-contract.js`
   Resolve passos de workflow a partir de dados no estilo `workflow-chains.yaml` e valida agente/comando esperado contra a invocacao atual.

5. `.aiox-core/core/sentinel/hud.js`
   Gera HUD fisico com passos, responsaveis, comando atual/esperado, proximo handoff e bloqueios.

6. `.aiox-core/core/sentinel/antigravity-hook.js`
   Avalia payloads AntiGravity de `PreInvocation`, `PreToolUse`, `PostInvocation` e `Stop`, retornando `allow` ou `deny`.

7. `.aiox-core/infrastructure/scripts/antigravity-sentinel-hook.js`
   Runner CLI do hook. Le JSON do stdin e escreve decisao JSON no stdout.

8. `.aiox-core/infrastructure/scripts/antigravity-sentinel-isolate.js`
   Runner CLI de isolamento. O padrao e dry-run; aplicacao real exige `--apply --confirm <project-id>`.

9. `packages/installer/src/wizard/ide-config-generator.js`
   Gera `.antigravity/hooks.json` e aponta `.antigravity/antigravity.json` para o runner Sentinel.

10. `.aiox-core/core/sentinel/state-writer.js`
    Monta e grava `.aiox/sentinel/state.json` a partir de handoffs do workflow runtime.

11. `.aiox-core/core/orchestration/context-manager.js`
    Persiste `next_agent`, `next_command`, metadados de comando e contrato Sentinel quando salva handoff de fase.

12. `.aiox-core/core/orchestration/checklist-runner.js`
    Suporta modo Sentinel. Itens manuais nao passam automaticamente quando o modo Sentinel esta ativo.

## 5. Contrato Dos Hooks

1. `PreInvocation`

```text
node .aiox-core/infrastructure/scripts/antigravity-sentinel-hook.js --event PreInvocation
```

2. `PreToolUse`

```text
node .aiox-core/infrastructure/scripts/antigravity-sentinel-hook.js --event PreToolUse
```

3. `PostInvocation`

```text
node .aiox-core/infrastructure/scripts/antigravity-sentinel-hook.js --event PostInvocation
```

4. `Stop`

```text
node .aiox-core/infrastructure/scripts/antigravity-sentinel-hook.js --event Stop
```

## 6. Condicoes De Bloqueio

1. Mais de um diretorio de motor ativo.
2. Diretorio do motor ativo ausente.
3. Estado Sentinel ausente.
4. `workflow_contract` ausente.
5. Agente atual diferente do agente esperado.
6. Comando atual diferente do comando esperado.
7. Hook de conclusao sem handoff completo.
8. Hook de conclusao sem checklist completo.

## 7. Contrato De Estado Sentinel

1. O hook le:

```text
.aiox/sentinel/state.json
```

2. Formato esperado:

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

3. Esse arquivo e escrito por `ContextManager.savePhaseOutput()` apos uma fase de workflow produzir handoff.

## 8. Contrato De Isolamento Fisico

1. Motores inativos precisam ser movidos para fora do workspace ativo antes de confiar no AntiGravity em modo autonomo.

2. Local planejado de backup:

```text
D:\.aiox-sentinel-backups\<project-id>\<timestamp>\<engine>
```

3. Campos do manifesto:
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

4. Arquivo marcador inativo:

```text
ENGINE_DISABLED.md
```

5. O conteudo do marcador nao contem o token `AIOX`.

## 9. CLI De Isolamento

1. Dry-run:

```text
node .aiox-core/infrastructure/scripts/antigravity-sentinel-isolate.js --project-root D:\aiox-sentinel
```

2. Aplicar:

```text
node .aiox-core/infrastructure/scripts/antigravity-sentinel-isolate.js --project-root D:\aiox-sentinel --apply --confirm <project-id>
```

3. A aplicacao:
   1. verifica se a confirmacao corresponde ao `project_id`;
   2. verifica se cada diretorio de motor origem existe;
   3. verifica se cada destino de backup ainda nao existe;
   4. move motores inativos para o backup por projeto;
   5. recria diretorios inativos somente com `ENGINE_DISABLED.md`;
   6. grava o manifesto no backup.

## 10. Instalacao No Projeto

1. Checklist concreto:

```text
docs/framework/antigravity-installation.md
```

## 11. Cobertura De Testes

1. Testes principais ficam em `tests/unit/sentinel/sentinel.test.js`.
2. Testes do gerador ficam em `tests/unit/wizard/ide-config-generator.test.js`.
3. A suite cobre isolamento, manifestos, checklist, handoff, agente incorreto, comando incorreto, HUD, runtime e hooks AntiGravity.
