import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';
import type {
  Settings,
  MCPConfig,
  Hooks,
  Skill,
  Plugin,
} from '@claude-devtools/shared';

/**
 * Service for managing Claude Code CLI configuration files
 */
export class ConfigService {
  /**
   * Read and parse a JSON file
   */
  private async readJSON<T>(filePath: string): Promise<T | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Write JSON to a file
   */
  private async writeJSON<T>(filePath: string, data: T): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Get Claude settings from settings.json
   */
  async getSettings(): Promise<Settings | null> {
    return this.readJSON<Settings>(config.settingsPath);
  }

  /**
   * Update Claude settings
   */
  async updateSettings(settings: Settings): Promise<void> {
    const current = await this.getSettings() || {};
    await this.writeJSON(config.settingsPath, { ...current, ...settings });
  }

  /**
   * Get MCP configuration from .mcp.json
   */
  async getMcp(): Promise<MCPConfig | null> {
    const mcp = await this.readJSON<MCPConfig>(config.mcpPath);
    return mcp || { mcpServers: {} };
  }

  /**
   * Get hooks configuration (from settings.json hooks field)
   */
  async getHooks(): Promise<Hooks | null> {
    const settings = await this.getSettings();
    return (settings as any)?.hooks || null;
  }

  /**
   * Update hooks configuration
   */
  async updateHooks(hooks: Hooks): Promise<void> {
    const settings = await this.getSettings() || {};
    (settings as any).hooks = hooks;
    await this.writeJSON(config.settingsPath, settings);
  }

  /**
   * Get all skills from ~/.claude/skills directory
   * Each skill is a directory containing SKILL.md
   */
  async getSkills(): Promise<Skill[]> {
    try {
      const entries = await fs.readdir(config.skillsDir, { withFileTypes: true });
      const skills: Skill[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillPath = path.join(config.skillsDir, entry.name);
          const skillFile = path.join(skillPath, 'SKILL.md');

          try {
            const content = await fs.readFile(skillFile, 'utf-8');

            // Parse frontmatter if exists
            let name = entry.name;
            let description = '';
            let instructions = content;

            // Check for YAML frontmatter
            if (content.startsWith('---')) {
              const endIndex = content.indexOf('---', 3);
              if (endIndex !== -1) {
                const frontmatter = content.substring(3, endIndex).trim();
                instructions = content.substring(endIndex + 3).trim();

                // Parse simple YAML
                const lines = frontmatter.split('\n');
                for (const line of lines) {
                  const match = line.match(/^(\w+):\s*(.+)$/);
                  if (match) {
                    const [, key, value] = match;
                    if (key === 'name') name = value.trim();
                    if (key === 'description') description = value.trim();
                  }
                }
              }
            }

            skills.push({
              name,
              description,
              instructions,
              enabled: true,
              filePath: skillFile,
              path: skillPath,
            });
          } catch {
            // Skip if SKILL.md doesn't exist
            continue;
          }
        }
      }

      return skills;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get a specific skill by name
   */
  async getSkill(name: string): Promise<Skill | null> {
    const skills = await this.getSkills();
    return skills.find(s => s.name === name) || null;
  }

  /**
   * Create a new skill
   */
  async createSkill(skill: Omit<Skill, 'filePath' | 'path'>): Promise<Skill> {
    const skillDir = path.join(config.skillsDir, skill.name);
    const skillFile = path.join(skillDir, 'SKILL.md');

    await fs.mkdir(skillDir, { recursive: true });

    const content = `---
name: ${skill.name}
description: ${skill.description || ''}
---

${skill.instructions || ''}`;

    await fs.writeFile(skillFile, content, 'utf-8');

    return {
      ...skill,
      filePath: skillFile,
      path: skillDir,
    };
  }

  /**
   * Update an existing skill
   */
  async updateSkill(name: string, updates: Partial<Omit<Skill, 'name' | 'filePath' | 'path'>>): Promise<Skill> {
    const skill = await this.getSkill(name);
    if (!skill || !skill.filePath) {
      throw new Error(`Skill ${name} not found`);
    }

    const updated = { ...skill, ...updates };

    const content = `---
name: ${updated.name}
description: ${updated.description || ''}
---

${updated.instructions || ''}`;

    await fs.writeFile(skill.filePath, content, 'utf-8');

    return updated;
  }

  /**
   * Delete a skill
   */
  async deleteSkill(name: string): Promise<void> {
    const skill = await this.getSkill(name);
    if (!skill || !skill.path) {
      throw new Error(`Skill ${name} not found`);
    }

    await fs.rm(skill.path, { recursive: true });
  }

  /**
   * Get all plugins from installed_plugins.json
   */
  async getPlugins(): Promise<Plugin[]> {
    try {
      const installedPath = path.join(config.pluginsDir, 'installed_plugins.json');
      const data = await this.readJSON<{
        version: number;
        plugins: Record<string, Array<{
          scope: string;
          projectPath?: string;
          installPath: string;
          version: string;
          installedAt: string;
          lastUpdated: string;
          isLocal: boolean;
        }>>;
      }>(installedPath);

      if (!data?.plugins) return [];

      const plugins: Plugin[] = [];

      for (const [pluginId, installations] of Object.entries(data.plugins)) {
        const [name] = pluginId.split('@');
        const latestInstall = installations[0];

        if (latestInstall) {
          plugins.push({
            name: pluginId,
            version: latestInstall.version,
            description: `Installed at ${latestInstall.scope} scope`,
            enabled: true,
            path: latestInstall.installPath,
          });
        }
      }

      return plugins;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }
}

export const configService = new ConfigService();
