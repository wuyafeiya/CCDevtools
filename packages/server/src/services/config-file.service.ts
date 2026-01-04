import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import type { ClaudeCodeSettings, ConfigScope } from '@claude-devtools/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ConfigService {
  private claudeDir: string;
  private projectDir: string;

  constructor(projectDir: string = process.cwd()) {
    this.claudeDir = path.join(os.homedir(), '.claude');
    this.projectDir = projectDir;
  }

  async getConfigFile(scope: ConfigScope): Promise<string | null> {
    const configPaths = this.getConfigPaths();
    const configPath = configPaths[scope];

    if (!configPath) {
      return null;
    }

    try {
      const content = await fs.readFile(configPath, 'utf-8');
      return content;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async writeConfigFile(scope: ConfigScope, content: string): Promise<void> {
    const configPaths = this.getConfigPaths();
    const configPath = configPaths[scope];

    if (!configPath) {
      throw new Error(`Cannot write to ${scope} scope`);
    }

    const dir = path.dirname(configPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(configPath, content, 'utf-8');
  }

  async loadSettings(scope?: ConfigScope): Promise<ClaudeCodeSettings> {
    if (scope) {
      return this.loadSettingsForScope(scope);
    }

    const allSettings = await Promise.all(
      (['enterprise', 'user', 'project', 'local'] as ConfigScope[]).map(s =>
        this.loadSettingsForScope(s)
      )
    );

    return this.mergeSettings(...allSettings);
  }

  async loadSettingsForScope(scope: ConfigScope): Promise<ClaudeCodeSettings> {
    const content = await this.getConfigFile(scope);
    
    if (!content) {
      return {};
    }

    try {
      return JSON.parse(content);
    } catch (error) {
      console.error(`Failed to parse ${scope} settings:`, error);
      return {};
    }
  }

  async saveSettings(scope: ConfigScope, settings: ClaudeCodeSettings): Promise<void> {
    const content = JSON.stringify(settings, null, 2);
    await this.writeConfigFile(scope, content);
  }

  private mergeSettings(...settings: ClaudeCodeSettings[]): ClaudeCodeSettings {
    const merged: ClaudeCodeSettings = {};

    for (const setting of settings) {
      Object.assign(merged, setting);
    }

    return merged;
  }

  getConfigPaths(): Record<ConfigScope, string> {
    const platform = os.platform();
    const homedir = os.homedir();

    let enterpriseConfigDir: string;
    if (platform === 'darwin') {
      enterpriseConfigDir = path.join('/', 'Library', 'Application Support', 'ClaudeCode');
    } else if (platform === 'win32') {
      enterpriseConfigDir = path.join('C:', 'Program Files', 'ClaudeCode');
    } else {
      enterpriseConfigDir = '/etc/claude-code';
    }

    return {
      enterprise: path.join(enterpriseConfigDir, 'managed-settings.json'),
      user: path.join(this.claudeDir, 'settings.json'),
      project: path.join(this.projectDir, '.claude', 'settings.json'),
      local: path.join(this.projectDir, '.claude', 'settings.local.json'),
    };
  }

  async getAllConfigStatus(): Promise<Record<ConfigScope, { exists: boolean; path: string }>> {
    const paths = this.getConfigPaths();
    const status: Record<ConfigScope, { exists: boolean; path: string }> = {} as any;

    for (const [scope, configPath] of Object.entries(paths)) {
      try {
        await fs.access(configPath);
        status[scope as ConfigScope] = { exists: true, path: configPath };
      } catch {
        status[scope as ConfigScope] = { exists: false, path: configPath };
      }
    }

    return status;
  }

  async deleteConfigFile(scope: ConfigScope): Promise<void> {
    const configPaths = this.getConfigPaths();
    const configPath = configPaths[scope];

    if (!configPath) {
      throw new Error(`Cannot delete ${scope} scope`);
    }

    try {
      await fs.unlink(configPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
}