'use strict';

const fs = require('fs');
const yaml = require('js-yaml');

const REQUIRED_HANDOFF_FIELDS = Object.freeze([
  'from_agent',
  'to_agent',
  'last_command',
  'next_agent',
  'next_command',
]);

function loadHandoff(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  if (filePath.endsWith('.json')) {
    return JSON.parse(content);
  }
  return yaml.load(content);
}

function validateHandoffGate(options = {}) {
  const raw = options.handoff || loadHandoff(options.filePath);
  const handoff = raw && raw.handoff ? raw.handoff : raw;

  if (!handoff) {
    return {
      decision: 'deny',
      reason: '1. Artefato de handoff ausente',
      missing: REQUIRED_HANDOFF_FIELDS,
    };
  }

  const missing = REQUIRED_HANDOFF_FIELDS.filter((field) => !handoff[field]);
  if (missing.length > 0) {
    return {
      decision: 'deny',
      reason: `1. Artefato de handoff sem campos obrigatorios: ${missing.join(', ')}`,
      missing,
      handoff,
    };
  }

  if (handoff.consumed === true) {
    return {
      decision: 'deny',
      reason: '1. Artefato de handoff ja foi consumido',
      missing: [],
      handoff,
    };
  }

  return {
    decision: 'allow',
    reason: '1. Artefato de handoff completo',
    missing: [],
    handoff,
  };
}

module.exports = {
  REQUIRED_HANDOFF_FIELDS,
  loadHandoff,
  validateHandoffGate,
};
