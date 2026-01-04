import os from 'os';
import path from 'path';

/**
 * Server configuration
 */
export const config = {
  port: parseInt(process.env.PORT || '5200', 10),
  host: process.env.HOST || 'localhost',

  // Claude Code CLI configuration directory (~/.claude)
  claudeDir: path.join(os.homedir(), '.claude'),

  get settingsPath() {
    return path.join(this.claudeDir, 'settings.json');
  },

  get settingsLocalPath() {
    return path.join(this.claudeDir, 'settings.local.json');
  },

  get mcpPath() {
    return path.join(this.claudeDir, '.mcp.json');
  },

  get hooksPath() {
    // Hooks are in settings.json under "hooks" key
    return this.settingsPath;
  },

  get skillsDir() {
    return path.join(this.claudeDir, 'skills');
  },

  get pluginsDir() {
    return path.join(this.claudeDir, 'plugins');
  },
};
