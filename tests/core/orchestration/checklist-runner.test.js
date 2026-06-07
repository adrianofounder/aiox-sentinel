'use strict';

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const ChecklistRunner = require('../../../.aiox-core/core/orchestration/checklist-runner');

describe('ChecklistRunner Sentinel mode', () => {
  let tempDir;
  let checklistDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aiox-checklist-'));
    checklistDir = path.join(tempDir, '.aiox-core', 'product', 'checklists');
    await fs.ensureDir(checklistDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('preserves default behavior for manual checklist items', async () => {
    await fs.writeFile(
      path.join(checklistDir, 'manual.md'),
      '- [ ] Manual verification item\n',
      'utf8',
    );
    const runner = new ChecklistRunner(tempDir);

    const result = await runner.run('manual', []);

    expect(result.passed).toBe(true);
    expect(result.items[0].message).toBe('Manual verification required');
  });

  it('blocks manual checklist items in Sentinel mode', async () => {
    await fs.writeFile(
      path.join(checklistDir, 'manual.md'),
      '- [ ] Manual verification item\n',
      'utf8',
    );
    const runner = new ChecklistRunner(tempDir, { sentinelMode: true });

    const result = await runner.run('manual', []);

    expect(result.passed).toBe(false);
    expect(result.sentinelMode).toBe(true);
    expect(result.items[0].message).toBe('Sentinel mode requires deterministic validation evidence');
  });

  it('allows deterministic validation in Sentinel mode', async () => {
    await fs.writeFile(path.join(tempDir, 'artifact.md'), 'ready', 'utf8');
    await fs.writeFile(
      path.join(checklistDir, 'deterministic.md'),
      [
        '```yaml',
        'pre-conditions:',
        '  - "[ ] Artifact exists":',
        '      validation: "file exists"',
        '      blocker: true',
        '```',
      ].join('\n'),
      'utf8',
    );
    const runner = new ChecklistRunner(tempDir, { sentinelMode: true });

    const result = await runner.run('deterministic', 'artifact.md');

    expect(result.passed).toBe(true);
  });
});
