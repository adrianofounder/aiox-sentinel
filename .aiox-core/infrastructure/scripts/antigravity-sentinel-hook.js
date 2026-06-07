#!/usr/bin/env node
'use strict';

const { evaluateAntiGravityHook } = require('../../core/sentinel/antigravity-hook');

function parseEvent(argv = process.argv.slice(2)) {
  const index = argv.findIndex((arg) => arg === '--event');
  return index >= 0 ? argv[index + 1] : null;
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    const payload = input.trim() ? JSON.parse(input) : {};
    const result = evaluateAntiGravityHook(payload, {
      event: parseEvent(),
    });
    process.stdout.write(JSON.stringify(result));
  } catch (error) {
    process.stdout.write(JSON.stringify({
      decision: 'deny',
      reason: `1. Hook do AIOX Sentinel falhou: ${error.message}`,
    }));
  }
});
