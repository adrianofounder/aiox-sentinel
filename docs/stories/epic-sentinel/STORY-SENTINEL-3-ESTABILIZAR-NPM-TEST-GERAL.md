# STORY-SENTINEL-3: Estabilizar npm test geral

Status: Draft

## Objetivo

Mapear e estabilizar a execucao completa de `npm test` no repo, separando falhas preexistentes/ambiente de regressao real.

## Contexto

Durante a validacao da instalacao AntiGravity estrita, os testes focados passaram, `npm run lint` passou e `npm run typecheck` passou. A suite geral `npm test` nao fechou: primeiro por falhas antigas/ambiente e depois por timeout.

## Acceptance Criteria

- [ ] `npm test` executa ate o fim em ambiente local documentado.
- [ ] Falhas preexistentes/ambiente sao catalogadas com causa, dono e proxima acao.
- [ ] Regressao ligada a `install --strict --ide antigravity --language pt`, se existir, e corrigida.
- [ ] A story Sentinel 2 pode referenciar evidencia clara do status da suite geral.

## Tasks

- [ ] Reproduzir `npm test` com timeout controlado e capturar as primeiras falhas.
- [ ] Classificar falhas como ambiente, preexistente ou regressao.
- [ ] Corrigir apenas regressao relacionada ao instalador estrito.
- [ ] Documentar pendencias que nao pertencem ao instalador estrito.

## Validation

- [ ] `npm test`

## File List

- `docs/stories/epic-sentinel/STORY-SENTINEL-3-ESTABILIZAR-NPM-TEST-GERAL.md`
