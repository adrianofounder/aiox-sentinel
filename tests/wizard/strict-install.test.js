'use strict';

const mockCommandSync = jest.fn().mockResolvedValue();
const mockCommandValidate = jest.fn().mockResolvedValue();
const mockRequireAioxCoreModule = jest.fn((...parts) => {
  const modulePath = parts.join('/');

  if (modulePath.includes('ide-sync/index')) {
    return {
      commandSync: mockCommandSync,
      commandValidate: mockCommandValidate,
    };
  }

  throw new Error(`Unexpected AIOX core module load: ${modulePath}`);
});

jest.mock('inquirer', () => ({
  prompt: jest.fn(),
}));

jest.mock('fs-extra', () => ({
  pathExists: jest.fn().mockResolvedValue(false),
  existsSync: jest.fn().mockReturnValue(false),
  ensureDir: jest.fn().mockResolvedValue(),
  readFile: jest.fn(),
  readFileSync: jest.fn(),
  writeFile: jest.fn().mockResolvedValue(),
}));

jest.mock('../../packages/installer/src/utils/package-paths', () => ({
  requireAioxCoreModule: mockRequireAioxCoreModule,
  resolveAioxCorePath: jest.fn((...parts) => parts.join('/')),
}));

jest.mock('../../packages/installer/src/wizard/feedback', () => ({
  showWelcome: jest.fn(),
  showCompletion: jest.fn(),
  showCancellation: jest.fn(),
}));

jest.mock('../../packages/installer/src/wizard/ide-config-generator', () => ({
  generateIDEConfigs: jest.fn().mockResolvedValue({
    success: true,
    files: ['.antigravity/rules.md', '.agent/workflows/dev.md'],
  }),
  showSuccessSummary: jest.fn(),
  copySkillFiles: jest.fn(),
  generateCodexSkills: jest.fn(),
  copyExtraCommandFiles: jest.fn(),
}));

jest.mock('../../packages/installer/src/config/configure-environment', () => ({
  configureEnvironment: jest.fn().mockResolvedValue({
    envCreated: true,
    envExampleCreated: true,
    coreConfigCreated: true,
    gitignoreUpdated: false,
    errors: [],
  }),
}));

jest.mock('../../packages/installer/src/installer/aiox-core-installer', () => ({
  installAioxCore: jest.fn().mockResolvedValue({
    success: true,
    installedFiles: [],
    installedFolders: ['agents', 'tasks', 'workflows', 'templates'],
    errors: [],
  }),
  hasPackageJson: jest.fn().mockResolvedValue(false),
}));

jest.mock('../../packages/installer/src/installer/dependency-installer', () => ({
  detectPackageManager: jest.fn().mockReturnValue('npm'),
  installDependencies: jest.fn(),
}));

jest.mock('../../packages/installer/src/wizard/validation', () => ({
  validateInstallation: jest.fn().mockResolvedValue({
    valid: true,
    errors: [],
    warnings: [],
  }),
  displayValidationReport: jest.fn().mockResolvedValue(),
  provideTroubleshooting: jest.fn().mockResolvedValue(),
}));

const {
  generateIDEConfigs,
  copySkillFiles,
  generateCodexSkills,
  copyExtraCommandFiles,
} = require('../../packages/installer/src/wizard/ide-config-generator');
const { configureEnvironment } = require('../../packages/installer/src/config/configure-environment');
const { runWizard } = require('../../packages/installer/src/wizard/index');

describe('strict AntiGravity install', () => {
  let logSpy;
  let warnSpy;
  let errorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    logSpy = jest.spyOn(console, 'log').mockImplementation();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('uses only AntiGravity artifacts and passes the selected IDE to sync', async () => {
    const result = await runWizard({
      quiet: true,
      ci: true,
      yes: true,
      strict: true,
      ide: 'antigravity',
      language: 'pt',
      skipPro: true,
    });

    expect(result.selectedIDEs).toEqual(['antigravity']);
    expect(result.strictIde).toBe('antigravity');
    expect(result.language).toBe('pt');

    expect(generateIDEConfigs).toHaveBeenCalledWith(
      ['antigravity'],
      expect.objectContaining({
        strict: true,
        strictIde: 'antigravity',
        language: 'pt',
      }),
      expect.objectContaining({
        ci: true,
        yes: true,
      }),
    );

    expect(copySkillFiles).not.toHaveBeenCalled();
    expect(generateCodexSkills).not.toHaveBeenCalled();
    expect(copyExtraCommandFiles).not.toHaveBeenCalled();

    expect(mockCommandSync).toHaveBeenCalledWith({ quiet: true, ide: 'antigravity' });
    expect(mockCommandValidate).toHaveBeenCalledWith({ quiet: true, ide: 'antigravity' });

    expect(result.settingsSkipped).toBe('strict-non-claude');
    expect(result.languageSettingsSkipped).toBe('strict-non-claude');
    expect(result.codexSkillsStatus).toBe('skipped');
    expect(result.llmRoutingResult).toEqual({
      success: true,
      skipped: true,
      reason: 'strict-non-claude',
    });

    expect(configureEnvironment).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedIDEs: ['antigravity'],
      }),
    );

    const loadedModules = mockRequireAioxCoreModule.mock.calls.map((call) => call.join('/'));
    expect(loadedModules).toEqual(['.aiox-core/infrastructure/scripts/ide-sync/index']);
  });

  it('rejects strict mode when more than one IDE is selected', async () => {
    await expect(
      runWizard({
        quiet: true,
        strict: true,
        selectedIDEs: ['antigravity', 'codex'],
        language: 'pt',
        skipPro: true,
      }),
    ).rejects.toThrow('Strict install requires exactly one IDE');
  });
});
