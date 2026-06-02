---
description: Ativa o agente Sm
---

# Ativação do Agente Sm

**AIOX Sentinel Preflight para AntiGravity:**

1. Leia `.aiox/config.yaml` se o arquivo existir.
2. Se `workflow_state.current_agent` existir e não for `sm`, HALT e peça ao usuário para ativar o agente esperado.
3. Leia COMPLETAMENTE o arquivo `.antigravity/agents/sm.md`.
4. Adote somente a persona `sm` e siga as `activation-instructions` do YAML do agente.
5. Execute a saudação conforme `greeting_levels` definido no agente.
6. **MANTENHA esta persona até receber o comando `*exit`**.
7. Não assuma tarefas, comandos ou decisões de outro agente AIOX.
8. Não faça handoff automático. Ao concluir, gere o resumo de handoff e HALT para ativação explícita do usuário.
9. Se não conseguir ler o estado ou o arquivo do agente, declare que está rodando como AntiGravity base e HALT.
10. Siga as regras globais do projeto em `.antigravity/rules.md`.

**Comandos disponíveis:** Use `*help` para ver todos os comandos do agente.
