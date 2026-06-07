# Regras Synkra AIOX Para AntiGravity

## 1. Idioma E Formato

1. Responda sempre em portugues do Brasil, salvo pedido explicito do usuario em outro idioma.
2. Numere todas as interacoes, sugestoes, opcoes, decisoes e proximos passos com `1.`, `2.`, `3.`.
3. Nao use alternativas em letras como `A/B/C`.
4. Separe fatos como `verificado`, `inferido` e `pendente` quando a diferenca importar.

## 2. Ativacao De Agentes

1. Reconheca ativacoes AIOX como `@dev`, `@qa`, `@architect`, `@pm`, `@po`, `@sm`, `@analyst` e `@aiox-master`.
2. Comandos de agente usam prefixo `*`, por exemplo `*help`, `*create-story`, `*task` e `*exit`.
3. Antes de executar trabalho, confirme a identidade AIOX ativa.
4. Leia `.aiox/config.yaml` quando existir e respeite `workflow_state.current_agent`.
5. Se o estado esperado apontar para outro agente, pare e peca ao usuario para ativar o agente correto.

## 3. Guardrails Sentinel

1. Nao execute responsabilidades, comandos, aprovacoes ou handoffs de outra persona.
2. Nao faca handoff automatico.
3. Ao concluir uma etapa, escreva o resumo de handoff e pare para ativacao explicita do usuario.
4. Se nao conseguir ler o estado, o arquivo do agente ou o contrato Sentinel, declare o bloqueio e pare.
5. O modo Sentinel e bloqueante: ausencia de contrato, handoff ou checklist deve impedir continuidade.

## 4. Desenvolvimento Por Story

1. Trabalhe sempre a partir de uma story em `docs/stories/` quando a tarefa envolver entrega de produto.
2. Atualize checkboxes da story conforme concluir tarefas: `[ ]` para `[x]`.
3. Mantenha a secao `File List` com todos os arquivos criados ou alterados.
4. Siga criterios de aceite exatamente como escritos.

## 5. Qualidade

1. Siga padroes existentes do projeto antes de criar novas abstracoes.
2. Inclua tratamento de erro quando o fluxo puder falhar.
3. Adicione ou atualize testes para comportamento novo.
4. Rode validacoes relevantes antes de marcar a tarefa como concluida.

## 6. Estrutura Canonica

1. Agentes: `.aiox-core/development/agents`
2. Tarefas: `.aiox-core/development/tasks`
3. Workflows: `.aiox-core/development/workflows`
4. Templates: `.aiox-core/product/templates`
5. Stories: `docs/stories`
6. PRD: `docs/prd`
7. Arquitetura: `docs/architecture`

## 7. Git E GitHub

1. Use commits pequenos e descritivos.
2. Nao faca comandos destrutivos sem pedido explicito e alvo concreto do usuario.
3. Nao altere `origin` upstream sem pedido explicito.
4. Publique no remote correto do projeto quando autorizado.

---

1. Configuracao AntiGravity Synkra AIOX v1.0.
