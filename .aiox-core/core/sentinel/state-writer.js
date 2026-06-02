'use strict';

const fs = require('fs-extra');
const path = require('path');

const SENTINEL_STATE_RELATIVE_PATH = path.join('.aiox', 'sentinel', 'state.json');

function normalizeAgent(agent) {
  if (!agent) return null;
  const value = String(agent);
  return value.startsWith('@') ? value : `@${value}`;
}

function normalizeCommand(command) {
  if (!command) return null;
  const value = String(command).trim();
  return value.startsWith('*') ? value : `*${value}`;
}

function buildSentinelState(options = {}) {
  const {
    activeEngine = 'antigravity',
    workflowId,
    phase,
    currentAgent,
    currentCommand,
    expectedAgent,
    expectedCommand,
    handoffPath = null,
    handoff = null,
    generatedAt = new Date().toISOString(),
  } = options;

  return {
    version: '1.0.0',
    active_engine: activeEngine,
    workflow_id: workflowId || null,
    generated_at: generatedAt,
    workflow_contract: {
      phase: phase || null,
      current_agent: normalizeAgent(currentAgent),
      current_command: normalizeCommand(currentCommand),
      expected_agent: normalizeAgent(expectedAgent),
      expected_command: normalizeCommand(expectedCommand),
      handoff_path: handoffPath,
    },
    handoff,
  };
}

async function writeSentinelState(projectRoot, state) {
  const filePath = path.join(projectRoot, SENTINEL_STATE_RELATIVE_PATH);
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeJson(filePath, state, { spaces: 2 });
  return filePath;
}

module.exports = {
  SENTINEL_STATE_RELATIVE_PATH,
  buildSentinelState,
  normalizeAgent,
  normalizeCommand,
  writeSentinelState,
};
