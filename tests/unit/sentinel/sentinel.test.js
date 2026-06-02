'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  DISABLED_MARKER_NAME,
  applyEngineIsolation,
  buildExpectedContractFromHandoff,
  buildIsolationManifest,
  generateWorkflowHud,
  getDisabledMarkerContent,
  planEngineIsolation,
  resolveWorkflowStep,
  validateChecklistEvidence,
  validateEngineIsolation,
  validateExpectedInvocation,
  validateHandoffGate,
  evaluatePreToolUse,
} = require('../../../.aiox-core/core/sentinel');

function makeTempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aiox-sentinel-test-'));
}

function mkdir(projectRoot, dir) {
  fs.mkdirSync(path.join(projectRoot, dir), { recursive: true });
}

describe('AIOX Sentinel', () => {
  describe('Engine Isolation Guard', () => {
    test('blocks when multiple engine directories are active', () => {
      const projectRoot = makeTempProject();
      mkdir(projectRoot, '.antigravity');
      mkdir(projectRoot, '.codex');

      const result = validateEngineIsolation({ projectRoot, activeEngine: 'antigravity' });

      expect(result.decision).toBe('deny');
      expect(result.reason).toContain('Multiple active engine directories');
      expect(result.inactiveActiveEngines).toEqual(['codex']);
    });

    test('allows active engine when inactive engine is marker-only', () => {
      const projectRoot = makeTempProject();
      mkdir(projectRoot, '.antigravity');
      mkdir(projectRoot, '.codex');
      fs.writeFileSync(
        path.join(projectRoot, '.codex', DISABLED_MARKER_NAME),
        getDisabledMarkerContent('antigravity'),
      );

      const result = validateEngineIsolation({ projectRoot, activeEngine: 'antigravity' });

      expect(result.decision).toBe('allow');
    });

    test('builds project-scoped backup manifest for inactive engines', () => {
      const projectRoot = makeTempProject();
      mkdir(projectRoot, '.antigravity');
      mkdir(projectRoot, '.claude');
      mkdir(projectRoot, '.gemini');

      const manifest = buildIsolationManifest({
        projectRoot,
        activeEngine: 'antigravity',
        remote: 'https://github.com/SynkraAI/aiox-core.git',
        timestamp: '2026-06-02T10:00:00.000Z',
      });

      expect(manifest.project_id).toContain(path.basename(projectRoot).toLowerCase());
      expect(manifest.active_engine).toBe('antigravity');
      expect(manifest.moved_engines.map((entry) => entry.engine)).toEqual(['claude', 'gemini']);
      expect(manifest.moved_engines[0].backup_path).toContain(manifest.project_id);
    });

    test('inactive marker content does not contain the AIOX token', () => {
      const content = getDisabledMarkerContent('antigravity');

      expect(content).not.toContain('AIOX');
      expect(content).toContain('Active engine: antigravity');
    });

    test('dry-run plan does not move inactive engine directories', () => {
      const projectRoot = makeTempProject();
      const backupRoot = path.join(makeTempProject(), 'backups');
      mkdir(projectRoot, '.antigravity');
      mkdir(projectRoot, '.codex');
      fs.writeFileSync(path.join(projectRoot, '.codex', 'settings.json'), '{}');

      const result = planEngineIsolation({
        projectRoot,
        backupRoot,
        activeEngine: 'antigravity',
        timestamp: '2026-06-02T10:00:00.000Z',
      });

      expect(result.dry_run).toBe(true);
      expect(result.summary.engines_to_move).toEqual(['codex']);
      expect(fs.existsSync(path.join(projectRoot, '.codex', 'settings.json'))).toBe(true);
    });

    test('apply requires exact project id confirmation', () => {
      const projectRoot = makeTempProject();
      mkdir(projectRoot, '.antigravity');
      mkdir(projectRoot, '.codex');

      expect(() => applyEngineIsolation({
        projectRoot,
        activeEngine: 'antigravity',
        confirmProjectId: 'wrong-project',
      })).toThrow('requires explicit confirmation');
    });

    test('apply moves inactive engine to backup and leaves marker only', () => {
      const projectRoot = makeTempProject();
      const backupRoot = path.join(makeTempProject(), 'backups');
      mkdir(projectRoot, '.antigravity');
      mkdir(projectRoot, '.codex');
      fs.writeFileSync(path.join(projectRoot, '.codex', 'settings.json'), '{}');
      const plan = planEngineIsolation({
        projectRoot,
        backupRoot,
        activeEngine: 'antigravity',
        timestamp: '2026-06-02T10:00:00.000Z',
      });

      const result = applyEngineIsolation({
        projectRoot,
        backupRoot,
        activeEngine: 'antigravity',
        timestamp: '2026-06-02T10:00:00.000Z',
        confirmProjectId: plan.manifest.project_id,
      });

      const moved = result.manifest.moved_engines[0];
      expect(result.dry_run).toBe(false);
      expect(fs.existsSync(path.join(moved.backup_path, 'settings.json'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, '.codex', DISABLED_MARKER_NAME))).toBe(true);
      expect(fs.readdirSync(path.join(projectRoot, '.codex'))).toEqual([DISABLED_MARKER_NAME]);
      expect(fs.existsSync(result.manifest_path)).toBe(true);
    });
  });

  describe('Checklist Evidence Gate', () => {
    test('blocks missing checklist evidence', () => {
      const result = validateChecklistEvidence();

      expect(result.decision).toBe('deny');
      expect(result.reason).toContain('missing');
    });

    test('blocks unchecked checklist item', () => {
      const result = validateChecklistEvidence({
        content: '- [x] Implemented\n- [ ] Tested\n',
      });

      expect(result.decision).toBe('deny');
      expect(result.reason).toContain('unchecked');
    });

    test('blocks N/A without justification', () => {
      const result = validateChecklistEvidence({
        content: '- [x] Implemented\n- [N/A] Browser validation\n',
      });

      expect(result.decision).toBe('deny');
      expect(result.reason).toContain('without justification');
    });

    test('allows complete checklist with justified N/A', () => {
      const result = validateChecklistEvidence({
        content: '- [x] Implemented\n- [N/A] Browser validation justificativa: backend-only change\n',
      });

      expect(result.decision).toBe('allow');
    });
  });

  describe('Handoff Gate', () => {
    test('blocks missing handoff artifact', () => {
      const result = validateHandoffGate();

      expect(result.decision).toBe('deny');
      expect(result.missing).toContain('next_agent');
      expect(result.missing).toContain('next_command');
    });

    test('blocks handoff without next agent and next command', () => {
      const result = validateHandoffGate({
        handoff: {
          from_agent: '@dev',
          to_agent: '@qa',
          last_command: '*develop story-1',
        },
      });

      expect(result.decision).toBe('deny');
      expect(result.missing).toEqual(['next_agent', 'next_command']);
    });

    test('allows complete unconsumed handoff', () => {
      const result = validateHandoffGate({
        handoff: {
          from_agent: '@dev',
          to_agent: '@qa',
          last_command: '*develop story-1',
          next_agent: '@qa',
          next_command: '*review story-1',
          consumed: false,
        },
      });

      expect(result.decision).toBe('allow');
    });
  });

  describe('Workflow Contract', () => {
    const chains = {
      workflows: [
        {
          id: 'sdc',
          name: 'Story Development Cycle',
          chain: [
            { step: 1, agent: '@sm', command: '*draft' },
            { step: 2, agent: '@po', command: '*validate-story-draft {story-id}' },
            { step: 3, agent: '@dev', command: '*develop {story-id}' },
          ],
        },
      ],
    };

    test('resolves current and next workflow step', () => {
      const result = resolveWorkflowStep(chains, {
        workflowId: 'sdc',
        agent: '@po',
        command: '*validate-story-draft story-1',
      });

      expect(result.step.agent).toBe('@po');
      expect(result.nextStep.agent).toBe('@dev');
    });

    test('blocks wrong agent', () => {
      const result = validateExpectedInvocation({
        expectedAgent: '@qa',
        expectedCommand: '*review story-1',
        actualAgent: '@dev',
        actualCommand: '*review story-1',
      });

      expect(result.decision).toBe('deny');
      expect(result.reason).toContain('agent mismatch');
    });

    test('blocks wrong command', () => {
      const result = validateExpectedInvocation({
        expectedAgent: '@qa',
        expectedCommand: '*review story-1',
        actualAgent: '@qa',
        actualCommand: '*develop story-1',
      });

      expect(result.decision).toBe('deny');
      expect(result.reason).toContain('command mismatch');
    });

    test('builds expected contract from complete handoff', () => {
      const contract = buildExpectedContractFromHandoff({
        from_agent: '@dev',
        last_command: '*develop story-1',
        next_agent: '@qa',
        next_command: '*review story-1',
      });

      expect(contract.expected_agent).toBe('@qa');
      expect(contract.expected_command).toBe('*review story-1');
    });
  });

  describe('Workflow Visibility HUD', () => {
    test('lists all steps, responsible agents, current command and blockers', () => {
      const hud = generateWorkflowHud({
        workflow: {
          id: 'sdc',
          name: 'Story Development Cycle',
          chain: [
            { step: 1, agent: '@sm', command: '*draft', task: 'create-next-story.md' },
            { step: 2, agent: '@po', command: '*validate-story-draft {story-id}' },
          ],
        },
        expectedAgent: '@po',
        expectedCommand: '*validate-story-draft {story-id}',
        currentAgent: '@po',
        currentCommand: '*validate-story-draft story-1',
        nextAgent: '@dev',
        nextCommand: '*develop story-1',
        checklistStatus: 'allow',
        handoffStatus: 'allow',
        blockers: ['none'],
      });

      expect(hud).toContain('Story Development Cycle');
      expect(hud).toContain('@sm *draft');
      expect(hud).toContain('[>] 2. @po *validate-story-draft');
      expect(hud).toContain('Next: @dev *develop story-1');
    });
  });

  describe('AntiGravity Hook', () => {
    test('allows non-command tool when engine isolation and workflow contract pass', () => {
      const projectRoot = makeTempProject();
      mkdir(projectRoot, '.antigravity');

      const result = evaluatePreToolUse({
        toolCall: {
          name: 'view_file',
          args: {
            AbsolutePath: path.join(projectRoot, 'README.md'),
          },
        },
        workspacePaths: [projectRoot],
      }, {
        projectRoot,
        state: {
          active_engine: 'antigravity',
          workflow_contract: {
            current_agent: '@qa',
            expected_agent: '@qa',
            expected_command: '*review story-1',
          },
        },
      });

      expect(result.decision).toBe('allow');
    });

    test('denies run_command when command does not match workflow contract', () => {
      const projectRoot = makeTempProject();
      mkdir(projectRoot, '.antigravity');

      const result = evaluatePreToolUse({
        toolCall: {
          name: 'run_command',
          args: {
            CommandLine: 'npm test && *develop story-1',
          },
        },
        workspacePaths: [projectRoot],
      }, {
        projectRoot,
        state: {
          active_engine: 'antigravity',
          workflow_contract: {
            current_agent: '@qa',
            expected_agent: '@qa',
            expected_command: '*review story-1',
          },
        },
      });

      expect(result.decision).toBe('deny');
      expect(result.reason).toContain('command mismatch');
    });
  });
});
