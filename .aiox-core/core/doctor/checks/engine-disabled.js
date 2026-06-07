const path = require('path');
const fs = require('fs');

function hasDisabledMarker(markerPath) {
  if (!fs.existsSync(markerPath)) return false;

  try {
    const content = fs.readFileSync(markerPath, 'utf8');
    return /ENGINE_DISABLED|Inactive engine|Active engine|Motor ativo|disabled/i.test(content);
  } catch {
    return true;
  }
}

function isClaudeDisabled(context) {
  const claudeDir = path.join(context.projectRoot, '.claude');
  const antigravityConfig = path.join(context.projectRoot, '.antigravity', 'antigravity.json');

  return hasDisabledMarker(path.join(claudeDir, 'ENGINE_DISABLED.md')) ||
    (!fs.existsSync(claudeDir) && fs.existsSync(antigravityConfig));
}

function disabledResult(checkName, engineName = 'Claude Code') {
  return {
    check: checkName,
    status: 'PASS',
    message: `${engineName} disabled by ENGINE_DISABLED.md`,
    fixCommand: null,
  };
}

module.exports = {
  hasDisabledMarker,
  isClaudeDisabled,
  disabledResult,
};
