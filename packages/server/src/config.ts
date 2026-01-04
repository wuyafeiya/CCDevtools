import os from 'os';
import path from 'path';

/**
 * Server configuration
 */
export const config = {
  port: parseInt(process.env.PORT || '5200', 10),
  host: process.env.HOST || 'localhost',

  // Claude configuration directory paths
  claudeDir: path.join(os.homedir(), 'Library', 'Application Support', 'Claude'),

  get settingsPath() {
    return path.join(this.claudeDir, 'settings.json');
  },

  get mcpPath() {
    return path.join(this.claudeDir, 'claude_desktop_config.json');
  },

  get hooksPath() {
    return path.join(this.claudeDir, 'hooks.json');
  },

  get skillsDir() {
    return path.join(this.claudeDir, 'skills');
  },

  get pluginsDir() {
    return path.join(this.claudeDir, 'plugins');
  },
};
