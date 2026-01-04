import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ConfigService } from '../services/config-file.service.js';
import fs from 'fs/promises';
import path from 'path';
import type { Skill, ConfigScope } from '@claude-devtools/shared';

interface CreateSkillBody {
  name: string;
  description: string;
  prompt?: string;
  instructions?: string;
  enabled?: boolean;
  metadata?: Record<string, unknown>;
  scope?: 'user' | 'project';
}

interface UpdateSkillBody extends CreateSkillBody {
  name: string;
}

export async function skillsRoutes(fastify: FastifyInstance) {
  const configService = new ConfigService();

  fastify.get<{ Querystring: { scope?: 'user' | 'project' } }>('/api/skills', async (request, reply) => {
    try {
      const { scope = 'user' } = request.query;
      const skillsDir = getSkillsDir(scope);

      try {
        await fs.access(skillsDir);
      } catch {
        return {
          success: true,
          data: [],
          timestamp: Date.now(),
        };
      }

      const files = await fs.readdir(skillsDir);
      const skills: Skill[] = [];

      for (const file of files) {
        if (file.endsWith('.json') || file.endsWith('.md')) {
          const filePath = path.join(skillsDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const skillName = file.replace(/\.(json|md)$/, '');

          let skill: Skill;
          if (file.endsWith('.json')) {
            skill = JSON.parse(content);
          } else {
            skill = parseSkillMarkdown(content, skillName);
          }

          skills.push({
            ...skill,
            filePath,
            path: skillsDir,
          });
        }
      }

      return {
        success: true,
        data: skills,
        timestamp: Date.now(),
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: (error as Error).message,
        timestamp: Date.now(),
      };
    }
  });

  fastify.get<{ Querystring: { name: string; scope?: 'user' | 'project' } }>('/api/skills/details', async (request, reply) => {
    try {
      const { name, scope = 'user' } = request.query;
      const skillsDir = getSkillsDir(scope);
      
      const jsonPath = path.join(skillsDir, `${name}.json`);
      const mdPath = path.join(skillsDir, `${name}.md`);

      let content: string;
      let filePath: string;
      let format: 'json' | 'md';

      try {
        await fs.access(jsonPath);
        content = await fs.readFile(jsonPath, 'utf-8');
        filePath = jsonPath;
        format = 'json';
      } catch {
        try {
          await fs.access(mdPath);
          content = await fs.readFile(mdPath, 'utf-8');
          filePath = mdPath;
          format = 'md';
        } catch {
          reply.code(404);
          return {
            success: false,
            error: `Skill "${name}" not found`,
            timestamp: Date.now(),
          };
        }
      }

      let skill: Skill;
      if (format === 'json') {
        skill = JSON.parse(content);
      } else {
        skill = parseSkillMarkdown(content, name);
      }

       return {
        success: true,
        data: {
          ...skill,
          filePath,
          format,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: (error as Error).message,
        timestamp: Date.now(),
      };
    }
  });

  fastify.post<{ Body: CreateSkillBody }>('/api/skills', async (request, reply) => {
    try {
      const { name, description, prompt, instructions, enabled = true, metadata, scope = 'user' } = request.body;

      const skillsDir = getSkillsDir(scope);
      await fs.mkdir(skillsDir, { recursive: true });

       const filePath = path.join(skillsDir, `${name}.json`);
       
       const skillData: Omit<Skill, 'name'> = {
         description,
         prompt,
         instructions,
         enabled,
         metadata,
       };
 
       await fs.writeFile(filePath, JSON.stringify(skillData, null, 2), 'utf-8');

      return {
        success: true,
        message: `Skill "${name}" created`,
        data: {
          name,
          scope,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: (error as Error).message,
        timestamp: Date.now(),
      };
    }
  });

  fastify.put<{ Body: UpdateSkillBody }>('/api/skills', async (request, reply) => {
    try {
      const { name, description, prompt, instructions, enabled, metadata, scope = 'user' } = request.body;

      const skillsDir = getSkillsDir(scope);
      const filePath = path.join(skillsDir, `${name}.json`);

      try {
        await fs.access(filePath);
      } catch {
        reply.code(404);
        return {
          success: false,
          error: `Skill "${name}" not found`,
          timestamp: Date.now(),
        };
      }

      const skill: Skill = {
        name,
        description,
        prompt,
        instructions,
        enabled,
        metadata,
      };

      await fs.writeFile(filePath, JSON.stringify(skill, null, 2), 'utf-8');

      return {
        success: true,
        message: `Skill "${name}" updated`,
        timestamp: Date.now(),
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: (error as Error).message,
        timestamp: Date.now(),
      };
    }
  });

  fastify.delete<{ Querystring: { name: string; scope?: 'user' | 'project' } }>('/api/skills', async (request, reply) => {
    try {
      const { name, scope = 'user' } = request.query;
      const skillsDir = getSkillsDir(scope);
      
      const jsonPath = path.join(skillsDir, `${name}.json`);
      const mdPath = path.join(skillsDir, `${name}.md`);

      let filePath: string | null = null;

      try {
        await fs.access(jsonPath);
        filePath = jsonPath;
      } catch {
        try {
          await fs.access(mdPath);
          filePath = mdPath;
        } catch {
          reply.code(404);
          return {
            success: false,
            error: `Skill "${name}" not found`,
            timestamp: Date.now(),
          };
        }
      }

      if (filePath) {
        await fs.unlink(filePath);
      }

      return {
        success: true,
        message: `Skill "${name}" deleted`,
        timestamp: Date.now(),
      };
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: (error as Error).message,
        timestamp: Date.now(),
      };
    }
  });
}

function getSkillsDir(scope: 'user' | 'project'): string {
  const homedir = require('os').homedir();
  
  if (scope === 'user') {
    return path.join(homedir, '.claude', 'skills');
  } else {
    return path.join(process.cwd(), '.claude', 'skills');
  }
}

function parseSkillMarkdown(content: string, name: string): Skill {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  
  if (!frontmatterMatch) {
    return {
      name,
      description: content.trim().split('\n')[0] || '',
      enabled: true,
    };
  }

  const frontmatter = frontmatterMatch[1];
  const instructions = content.replace(frontmatterMatch[0], '').trim();

  const lines = frontmatter.split('\n');
  const parsed: any = {};

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      const key = match[1];
      let value: string | string[] | boolean | number | undefined = match[2].trim();
      
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map((v: string) => v.trim().replace(/['"]/g, ''));
      } else if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value === 'true' || value === 'false') {
        value = value === 'true';
      } else if (!isNaN(Number(value))) {
        value = Number(value);
      }

      parsed[key] = value;
    }
  }

  return {
    name,
    description: parsed.description || '',
    instructions,
    enabled: parsed.enabled !== false,
    metadata: parsed.metadata || {},
  };
}
