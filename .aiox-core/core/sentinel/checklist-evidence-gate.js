'use strict';

const fs = require('fs');

const CHECKBOX_PATTERN = /^[-*]\s*\[(?<status>x|X| |N\/A|n\/a|na|NA)\]\s*(?<text>.*)$/gm;

function validateChecklistEvidence(options = {}) {
  const { content, filePath } = options;
  const source = typeof content === 'string'
    ? content
    : filePath && fs.existsSync(filePath)
      ? fs.readFileSync(filePath, 'utf8')
      : null;

  if (!source) {
    return block('Checklist evidence is missing', []);
  }

  const items = [];
  let match;
  while ((match = CHECKBOX_PATTERN.exec(source)) !== null) {
    const status = match.groups.status.toUpperCase();
    const text = match.groups.text.trim();
    const item = {
      status,
      text,
      passed: status === 'X' || status === 'N/A' || status === 'NA',
      justification: extractNaJustification(text),
    };
    items.push(item);
  }

  if (items.length === 0) {
    return block('Checklist evidence has no well-formed checkbox items', items);
  }

  const unchecked = items.filter((item) => item.status === ' ');
  if (unchecked.length > 0) {
    return block(`Checklist has unchecked items: ${unchecked.length}`, items);
  }

  const unjustifiedNa = items.filter(
    (item) => (item.status === 'N/A' || item.status === 'NA') && !item.justification,
  );
  if (unjustifiedNa.length > 0) {
    return block(`Checklist has N/A items without justification: ${unjustifiedNa.length}`, items);
  }

  return {
    decision: 'allow',
    reason: 'Checklist evidence is complete',
    items,
  };
}

function extractNaJustification(text) {
  const match = text.match(/(?:justificativa|justification|reason|motivo)\s*:\s*(\S.+)$/i);
  return match ? match[1].trim() : null;
}

function block(reason, items) {
  return {
    decision: 'deny',
    reason,
    items,
  };
}

module.exports = {
  validateChecklistEvidence,
};
