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
 * Service for managing Claude configuration files
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
   * Get Claude settings
   */
  async getSettings(): Promise<Settings | null> {
    return this.readJSON<Settings>(config.settingsPath);
  }

  /**
   * Update Claude settings
   */
  async updateSettings(settings: Settings): Promise<void> {
    await this.writeJSON(config.settingsPath, settings);
  }

  /**
   * Get MCP configuration
   */
  async getMcp(): Promise<MCPConfig | null> {
    return this.readJSON<MCPConfig>(config.mcpPath);
  }

  /**
   * Get hooks configuration
   */
  async getHooks(): Promise<Hooks | null> {
    return this.readJSON<Hooks>(config.hooksPath);
  }

  /**
   * Update hooks configuration
   */
  async updateHooks(hooks: Hooks): Promise<void> {
    await this.writeJSON(config.hooksPath, hooks);
  }

  /**
   * Get all skills
   */
  async getSkills(): Promise<Skill[]> {
    try {
      const entries = await fs.readdir(config.skillsDir, { withFileTypes: true });
      const skills: Skill[] = [];

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.skill')) {
          const skillPath = path.join(config.skillsDir, entry.name);
          const content = await fs.readFile(skillPath, 'utf-8');

          // Parse skill file (YAML-like format with --- separators)
          const parts = content.split('---').map(p => p.trim()).filter(Boolean);
          let metadata: any = {};
          let instructions = '';

          if (parts.length >= 1) {
            // First part is metadata (YAML)
            const metadataText = parts[0];
            // Simple YAML parser for basic fields
            const lines = metadataText.split('\n');
            for (const line of lines) {
              const match = line.match(/^(\w+):\s*(.+)$/);
              if (match) {
                const [, key, value] = match;
                metadata[key] = value.trim().replace(/^["']|["']$/g, '');
              }
            }
          }

          if (parts.length >= 2) {
            // Second part is instructions
            instructions = parts[1];
          }

          skills.push({
            name: metadata.name || entry.name.replace('.skill', ''),
            description: metadata.description || '',
            instructions: instructions,
            enabled: metadata.enabled !== 'false',
            filePath: skillPath,
          });
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
  async createSkill(skill: Omit<Skill, 'filePath'>): Promise<Skill> {
    await fs.mkdir(config.skillsDir, { recursive: true });

    const fileName = `${skill.name}.skill`;
    const filePath = path.join(config.skillsDir, fileName);

    // Check if skill already exists
    try {
      await fs.access(filePath);
      throw new Error(`Skill ${skill.name} already exists`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    // Create skill file content
    const content = `name: ${skill.name}
description: ${skill.description}
enabled: ${skill.enabled !== false}
---
${skill.instructions}`;

    await fs.writeFile(filePath, content, 'utf-8');

    return {
      ...skill,
      filePath,
    };
  }

  /**
   * Update an existing skill
   */
  async updateSkill(name: string, updates: Partial<Omit<Skill, 'name' | 'filePath'>>): Promise<Skill> {
    const skill = await this.getSkill(name);
    if (!skill) {
      throw new Error(`Skill ${name} not found`);
    }

    const updated = {
      ...skill,
      ...updates,
    };

    // Update skill file content
    const content = `name: ${updated.name}
description: ${updated.description}
enabled: ${updated.enabled}
---
${updated.instructions}`;

    if (!skill.filePath) {
      throw new Error(`Skill ${name} has no file path`);
    }
    await fs.writeFile(skill.filePath, content, 'utf-8');

    return updated;
  }

  /**
   * Delete a skill
   */
  async deleteSkill(name: string): Promise<void> {
    const skill = await this.getSkill(name);
    if (!skill) {
      throw new Error(`Skill ${name} not found`);
    }
    if (!skill.filePath) {
      throw new Error(`Skill ${name} has no file path`);
    }

    await fs.unlink(skill.filePath);
  }

  /**
   * Get all plugins
   */
  async getPlugins(): Promise<Plugin[]> {
    try {
      const entries = await fs.readdir(config.pluginsDir, { withFileTypes: true });
      const plugins: Plugin[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pluginPath = path.join(config.pluginsDir, entry.name);
          const manifestPath = path.join(pluginPath, 'manifest.json');

          try {
            const manifest = await this.readJSON<any>(manifestPath);
            if (manifest) {
              plugins.push({
                name: manifest.name || entry.name,
                version: manifest.version || '0.0.0',
                description: manifest.description || '',
                enabled: manifest.enabled !== false,
                path: pluginPath,
              });
            }
          } catch {
            // Skip invalid plugins
            continue;
          }
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
