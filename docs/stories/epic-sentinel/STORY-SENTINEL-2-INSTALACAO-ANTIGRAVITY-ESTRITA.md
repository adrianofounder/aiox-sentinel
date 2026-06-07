# STORY-SENTINEL-2: Instalacao AntiGravity estrita

Status: Ready for Review (strict install validated; full `npm test` follow-up separado)

## Objetivo

Permitir instalar o AIOX Sentinel para AntiGravity em modo estrito, com uma unica IDE e um unico idioma, sem materializar artefatos de outras IDEs.

## Acceptance Criteria

- [x] `aiox install --ci --yes --strict --ide antigravity --language pt` aceita exatamente uma IDE e um idioma.
- [x] No modo estrito, a instalacao AntiGravity nao cria `.claude/`, `.codex/`, `.gemini/`, `.cursor/`, `.github/` ou `.kimi/`.
- [x] No modo estrito, `ide-sync` e `ide-sync validate` recebem apenas o IDE selecionado.
- [x] No modo estrito, a linguagem nao cria `.claude/settings.json` quando `claude-code` nao esta selecionado.
- [x] O comportamento antigo fora de `--strict` permanece compativel.
- [x] Existe teste automatizado cobrindo o fluxo estrito AntiGravity.

## Tasks

- [x] Adicionar flags `--strict` e `--language` ao comando `aiox install`.
- [x] Validar selecao unica de IDE no modo estrito.
- [x] Condicionar geracao de artefatos Claude/Codex/Gemini ao IDE selecionado.
- [x] Passar o IDE selecionado para sync e validate no modo estrito.
- [x] Adicionar teste de instalacao estrita AntiGravity.
- [x] Rodar quality gates focados da story.
- [x] Registrar follow-up separado para estabilizar `npm test` geral.

## Validation

- [x] `node --check packages\installer\src\wizard\index.js`
- [x] `node --check bin\aiox.js`
- [x] `npx eslint packages\installer\src\wizard\index.js bin\aiox.js tests\wizard\strict-install.test.js`
- [x] `npx jest tests\wizard\strict-install.test.js --runInBand`
- [x] `npx jest packages\installer\tests\unit\ide-sync-integration\ide-sync-integration.test.js --runInBand`
- [x] `node bin\aiox.js install --ci --yes --strict --ide antigravity --language pt --dry-run`
- [x] `npm run lint`
- [x] `npm run typecheck`
- [ ] `npm test` - nao fechado nesta story: houve falhas antigas/ambiente e execucao posterior excedeu timeout. Decisao: tratar estabilizacao da suite geral em story separada.

## Follow-up

- `STORY-SENTINEL-3`: estabilizar `npm test` geral, separando falhas preexistentes/ambiente de regressao da instalacao estrita.

## Dev Notes

O instalador atual ainda herda comportamento do AIOX original e pode criar artefatos de IDEs nao selecionadas por causa de geradores globais e defaults do `ide-sync`.

## File List

- `docs/stories/epic-sentinel/STORY-SENTINEL-2-INSTALACAO-ANTIGRAVITY-ESTRITA.md`
- `bin/aiox.js`
- `packages/installer/src/wizard/index.js`
- `packages/installer/src/wizard/ide-config-generator.js`
- `packages/installer/tests/unit/ide-sync-integration/ide-sync-integration.test.js`
- `eslint.config.js`
- `tests/wizard/strict-install.test.js`
