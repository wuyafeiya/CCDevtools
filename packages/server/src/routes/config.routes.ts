import type { FastifyPluginAsync } from 'fastify';
import { configService } from '../services/config.service.js';
import type { Settings, Hooks, Skill } from '@claude-devtools/shared';

/**
 * Configuration routes - CRUD operations for Claude config
 */
export const configRoutes: FastifyPluginAsync = async (fastify) => {
  // Settings endpoints
  fastify.get('/api/config/settings', async (request, reply) => {
    try {
      const settings = await configService.getSettings();
      if (!settings) {
        return reply.code(404).send({ error: 'Settings not found' });
      }
      return settings;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to read settings' });
    }
  });

  fastify.put<{ Body: Settings }>('/api/config/settings', async (request, reply) => {
    try {
      await configService.updateSettings(request.body);
      return { success: true };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update settings' });
    }
  });

  // MCP endpoints
  fastify.get('/api/config/mcp', async (request, reply) => {
    try {
      const mcp = await configService.getMcp();
      if (!mcp) {
        return reply.code(404).send({ error: 'MCP config not found' });
      }
      return mcp;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to read MCP config' });
    }
  });

  // Hooks endpoints
  fastify.get('/api/config/hooks', async (request, reply) => {
    try {
      const hooks = await configService.getHooks();
      if (!hooks) {
        return reply.code(404).send({ error: 'Hooks not found' });
      }
      return hooks;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to read hooks' });
    }
  });

  fastify.put<{ Body: Hooks }>('/api/config/hooks', async (request, reply) => {
    try {
      await configService.updateHooks(request.body);
      return { success: true };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update hooks' });
    }
  });

  // Skills endpoints
  fastify.get('/api/config/skills', async (request, reply) => {
    try {
      const skills = await configService.getSkills();
      return skills;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to read skills' });
    }
  });

  fastify.get<{ Params: { name: string } }>('/api/config/skills/:name', async (request, reply) => {
    try {
      const skill = await configService.getSkill(request.params.name);
      if (!skill) {
        return reply.code(404).send({ error: 'Skill not found' });
      }
      return skill;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to read skill' });
    }
  });

  fastify.post<{ Body: Omit<Skill, 'filePath'> }>('/api/config/skills', async (request, reply) => {
    try {
      const skill = await configService.createSkill(request.body);
      return reply.code(201).send(skill);
    } catch (error) {
      fastify.log.error(error);
      const message = error instanceof Error ? error.message : 'Failed to create skill';
      return reply.code(500).send({ error: message });
    }
  });

  fastify.put<{
    Params: { name: string };
    Body: Partial<Omit<Skill, 'name' | 'filePath'>>;
  }>('/api/config/skills/:name', async (request, reply) => {
    try {
      const skill = await configService.updateSkill(request.params.name, request.body);
      return skill;
    } catch (error) {
      fastify.log.error(error);
      const message = error instanceof Error ? error.message : 'Failed to update skill';
      return reply.code(500).send({ error: message });
    }
  });

  fastify.delete<{ Params: { name: string } }>('/api/config/skills/:name', async (request, reply) => {
    try {
      await configService.deleteSkill(request.params.name);
      return { success: true };
    } catch (error) {
      fastify.log.error(error);
      const message = error instanceof Error ? error.message : 'Failed to delete skill';
      return reply.code(500).send({ error: message });
    }
  });

  // Plugins endpoints
  fastify.get('/api/config/plugins', async (request, reply) => {
    try {
      const plugins = await configService.getPlugins();
      return plugins;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to read plugins' });
    }
  });
};
