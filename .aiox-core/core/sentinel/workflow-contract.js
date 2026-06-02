'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function loadWorkflowChains(projectRoot, chainsPath) {
  const filePath = chainsPath || path.join(projectRoot, '.aiox-core', 'data', 'workflow-chains.yaml');
  return yaml.load(fs.readFileSync(filePath, 'utf8'));
}

function commandBase(command) {
  return String(command || '').trim().split(/\s+/)[0];
}

function resolveWorkflowStep(chains, criteria = {}) {
  const { workflowId, agent, command } = criteria;
  const workflows = Array.isArray(chains?.workflows) ? chains.workflows : [];
  const candidates = workflowId ? workflows.filter((workflow) => workflow.id === workflowId) : workflows;

  for (const workflow of candidates) {
    for (let index = 0; index < workflow.chain.length; index += 1) {
      const step = workflow.chain[index];
      if (agent && step.agent !== agent) continue;
      if (command && commandBase(step.command) !== commandBase(command)) continue;
      return {
        workflow,
        step,
        stepIndex: index,
        nextStep: workflow.chain[index + 1] || null,
      };
    }
  }

  return null;
}

function validateExpectedInvocation(options = {}) {
  const {
    expectedAgent,
    expectedCommand,
    actualAgent,
    actualCommand,
  } = options;
  const errors = [];

  if (!expectedAgent) errors.push('expected_agent ausente');
  if (!expectedCommand) errors.push('expected_command ausente');
  if (!actualAgent) errors.push('actual_agent ausente');
  if (!actualCommand) errors.push('actual_command ausente');

  if (expectedAgent && actualAgent && expectedAgent !== actualAgent) {
    errors.push(`agente incorreto: esperado ${expectedAgent}, recebido ${actualAgent}`);
  }

  if (expectedCommand && actualCommand && commandBase(expectedCommand) !== commandBase(actualCommand)) {
    errors.push(`comando incorreto: esperado ${commandBase(expectedCommand)}, recebido ${commandBase(actualCommand)}`);
  }

  if (errors.length > 0) {
    return {
      decision: 'deny',
      reason: `1. ${errors.join('; ')}`,
      errors,
    };
  }

  return {
    decision: 'allow',
    reason: '1. Invocacao do workflow corresponde ao agente e comando esperados',
    errors: [],
  };
}

function buildExpectedContractFromHandoff(handoff) {
  if (!handoff) {
    return null;
  }
  return {
    expected_agent: handoff.next_agent || handoff.to_agent || null,
    expected_command: handoff.next_command || null,
    previous_agent: handoff.from_agent || null,
    previous_command: handoff.last_command || null,
  };
}

module.exports = {
  buildExpectedContractFromHandoff,
  commandBase,
  loadWorkflowChains,
  resolveWorkflowStep,
  validateExpectedInvocation,
};
