import type { FastifyPluginAsync } from 'fastify';
import { configService } from '../services/config.service.js';
import type { Settings, Hooks, Skill } from '@claude-devtools/shared';

/**
 * Configuration routes - CRUD operations for Claude config
 */
export const configRoutes: FastifyPluginAsync = async (fastify) => {
  // Settings endpoints
  fastify.get('/api/config/settings', async () => {
    const settings = await configService.getSettings();
    return {
      success: true,
      data: {
        global: settings || {},
        local: {}
      }
    };
  });

  fastify.put<{ Body: Settings }>('/api/config/settings', async (request, reply) => {
    try {
      await configService.updateSettings(request.body);
      return { success: true };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ success: false, error: 'Failed to update settings' });
    }
  });

  // MCP endpoints
  fastify.get('/api/config/mcp', async () => {
    const mcp = await configService.getMcp();
    return {
      success: true,
      data: mcp || { mcpServers: {} }
    };
  });

  // Hooks endpoints
  fastify.get('/api/config/hooks', async () => {
    const hooks = await configService.getHooks();
    return {
      success: true,
      data: hooks || {}
    };
  });

  fastify.put<{ Body: { hooks: Hooks } }>('/api/config/hooks', async (request, reply) => {
    try {
      await configService.updateHooks(request.body.hooks);
      return { success: true };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ success: false, error: 'Failed to update hooks' });
    }
  });

  // Skills endpoints
  fastify.get('/api/config/skills', async () => {
    const skills = await configService.getSkills();
    return {
      success: true,
      data: skills || []
    };
  });

  fastify.get<{ Params: { name: string } }>('/api/config/skills/:name', async (request, reply) => {
    const skill = await configService.getSkill(request.params.name);
    if (!skill) {
      return reply.code(404).send({ success: false, error: 'Skill not found' });
    }
    return { success: true, data: skill };
  });

  fastify.post<{ Body: { name: string; content: string } }>('/api/config/skills', async (request, reply) => {
    try {
      const { name, content } = request.body;
      const skill = await configService.createSkill({
        name,
        description: '',
        instructions: content
      });
      return reply.code(201).send({ success: true, data: skill });
    } catch (error) {
      fastify.log.error(error);
      const message = error instanceof Error ? error.message : 'Failed to create skill';
      return reply.code(500).send({ success: false, error: message });
    }
  });

  fastify.put<{
    Params: { name: string };
    Body: { content: string };
  }>('/api/config/skills/:name', async (request, reply) => {
    try {
      const skill = await configService.updateSkill(request.params.name, {
        instructions: request.body.content
      });
      return { success: true, data: skill };
    } catch (error) {
      fastify.log.error(error);
      const message = error instanceof Error ? error.message : 'Failed to update skill';
      return reply.code(500).send({ success: false, error: message });
    }
  });

  fastify.delete<{ Params: { name: string } }>('/api/config/skills/:name', async (request, reply) => {
    try {
      await configService.deleteSkill(request.params.name);
      return { success: true };
    } catch (error) {
      fastify.log.error(error);
      const message = error instanceof Error ? error.message : 'Failed to delete skill';
      return reply.code(500).send({ success: false, error: message });
    }
  });

  // Plugins endpoints
  fastify.get('/api/config/plugins', async () => {
    const plugins = await configService.getPlugins();
    return {
      success: true,
      data: plugins || []
    };
  });
};
