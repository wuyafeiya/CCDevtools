import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ConfigService } from '../services/config-file.service.js';
import fs from 'fs/promises';
import path from 'path';
import type { Skill, ConfigScope } from '@claude-devtools/shared';

interface SubagentFile {
  name: string;
  content: string;
  scope: 'user' | 'project';
}

interface CreateSubagentBody {
  name: string;
  description: string;
  prompt: string;
  tools?: string[];
  model?: string;
  scope?: 'user' | 'project';
}

interface UpdateSubagentBody {
  name: string;
  description: string;
  prompt: string;
  tools?: string[];
  model?: string;
  scope?: 'user' | 'project';
}

export async function subagentsRoutes(fastify: FastifyInstance) {
  const configService = new ConfigService();

  fastify.get<{ Querystring: { scope?: 'user' | 'project' } }>('/api/subagents', async (request, reply) => {
    try {
      const { scope = 'user' } = request.query;
      const agentsDir = getAgentsDir(scope);

      try {
        await fs.access(agentsDir);
      } catch {
        return {
          success: true,
          data: [],
          timestamp: Date.now(),
        };
      }

      const files = await fs.readdir(agentsDir);
      const subagents: SubagentFile[] = [];

      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(agentsDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const name = file.replace('.md', '');

          subagents.push({
            name,
            content,
            scope,
          });
        }
      }

      return {
        success: true,
        data: subagents,
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

  fastify.get<{ Querystring: { name: string; scope?: 'user' | 'project' } }>('/api/subagents/details', async (request, reply) => {
    try {
      const { name, scope = 'user' } = request.query;
      const agentsDir = getAgentsDir(scope);
      const filePath = path.join(agentsDir, `${name}.md`);

      const content = await fs.readFile(filePath, 'utf-8');

      const parsed = parseSubagentMarkdown(content);

      return {
        success: true,
        data: {
          name,
          ...parsed,
          content,
          scope,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        reply.code(404);
        return {
          success: false,
          error: `Subagent "${name}" not found`,
          timestamp: Date.now(),
        };
      }
      reply.code(500);
      return {
        success: false,
        error: (error as Error).message,
        timestamp: Date.now(),
      };
    }
  });

  fastify.post<{ Body: CreateSubagentBody }>('/api/subagents', async (request, reply) => {
    try {
      const { name, description, prompt, tools = [], model, scope = 'user' } = request.body;

      const agentsDir = getAgentsDir(scope);
      await fs.mkdir(agentsDir, { recursive: true });

      const markdown = generateSubagentMarkdown({
        name,
        description,
        prompt,
        tools,
        model,
      });

      const filePath = path.join(agentsDir, `${name}.md`);
      await fs.writeFile(filePath, markdown, 'utf-8');

      return {
        success: true,
        message: `Subagent "${name}" created`,
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

  fastify.put<{ Body: UpdateSubagentBody }>('/api/subagents', async (request, reply) => {
    try {
      const { name, description, prompt, tools = [], model, scope = 'user' } = request.body;

      const agentsDir = getAgentsDir(scope);
      const filePath = path.join(agentsDir, `${name}.md`);

      try {
        await fs.access(filePath);
      } catch {
        reply.code(404);
        return {
          success: false,
          error: `Subagent "${name}" not found`,
          timestamp: Date.now(),
        };
      }

      const markdown = generateSubagentMarkdown({
        name,
        description,
        prompt,
        tools,
        model,
      });

      await fs.writeFile(filePath, markdown, 'utf-8');

      return {
        success: true,
        message: `Subagent "${name}" updated`,
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

  fastify.delete<{ Querystring: { name: string; scope?: 'user' | 'project' } }>('/api/subagents', async (request, reply) => {
    try {
      const { name, scope = 'user' } = request.query;
      const agentsDir = getAgentsDir(scope);
      const filePath = path.join(agentsDir, `${name}.md`);

      try {
        await fs.access(filePath);
      } catch {
        reply.code(404);
        return {
          success: false,
          error: `Subagent "${name}" not found`,
          timestamp: Date.now(),
        };
      }

      await fs.unlink(filePath);

      return {
        success: true,
        message: `Subagent "${name}" deleted`,
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

function getAgentsDir(scope: 'user' | 'project'): string {
  const homedir = require('os').homedir();
  
  if (scope === 'user') {
    return path.join(homedir, '.claude', 'agents');
  } else {
    return path.join(process.cwd(), '.claude', 'agents');
  }
}

function parseSubagentMarkdown(content: string) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  
  if (!frontmatterMatch) {
    return {
      description: '',
      prompt: content.trim(),
      tools: [],
      model: undefined,
    };
  }

  const frontmatter = frontmatterMatch[1];
  const prompt = content.replace(frontmatterMatch[0], '').trim();

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
    name: parsed.name || '',
    description: parsed.description || '',
    prompt,
    tools: parsed.tools || [],
    model: parsed.model,
    enabled: parsed.enabled !== false,
  };
}

function generateSubagentMarkdown({
  name,
  description,
  prompt,
  tools = [],
  model,
}: {
  name: string;
  description: string;
  prompt: string;
  tools?: string[];
  model?: string;
}): string {
  const lines = ['---'];

  lines.push(`name: ${name}`);
  lines.push(`description: ${description}`);

  if (model) {
    lines.push(`model: ${model}`);
  }

  if (tools.length > 0) {
    lines.push(`tools: [${tools.map(t => `"${t}"`).join(', ')}]`);
  }

  lines.push('---');
  lines.push('');
  lines.push(prompt.trim());

  return lines.join('\n');
}
