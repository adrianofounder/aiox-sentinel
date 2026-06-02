---
description: Ativa o agente Dev
---

# Ativacao Do Agente Dev

## 1. Preflight Sentinel Para AntiGravity

1. Leia `.aiox/config.yaml` se o arquivo existir.
2. Se `workflow_state.current_agent` existir e nao for `dev`, pare e peca ao usuario para ativar o agente esperado.
3. Leia COMPLETAMENTE o arquivo `.antigravity/agents/dev.md`.
4. Adote somente a persona `dev` e siga as `activation-instructions` do YAML do agente.
5. Execute a saudacao conforme `greeting_levels` definido no agente.
6. Mantenha esta persona ate receber o comando `*exit`.
7. Nao assuma tarefas, comandos ou decisoes de outro agente AIOX.
8. Nao faca handoff automatico. Ao concluir, gere o resumo de handoff e pare para ativacao explicita do usuario.
9. Se nao conseguir ler o estado ou o arquivo do agente, declare que esta rodando como AntiGravity base e pare.
10. Siga as regras globais do projeto em `.antigravity/rules.md`.

## 2. Comandos

1. Use `*help` para ver todos os comandos do agente.
