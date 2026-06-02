#!/usr/bin/env node
'use strict';

const { evaluatePreToolUse } = require('../../core/sentinel/antigravity-hook');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    const payload = input.trim() ? JSON.parse(input) : {};
    const result = evaluatePreToolUse(payload);
    process.stdout.write(JSON.stringify(result));
  } catch (error) {
    process.stdout.write(JSON.stringify({
      decision: 'deny',
      reason: `AIOX Sentinel hook failed: ${error.message}`,
    }));
  }
});
