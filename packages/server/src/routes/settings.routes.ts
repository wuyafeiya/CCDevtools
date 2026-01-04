import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ConfigService } from '../services/config-file.service.js';
import { PermissionService } from '../services/permission.service.js';
import type { ClaudeCodeSettings, ConfigScope } from '@claude-devtools/shared';

interface GetConfigParams {
  scope?: ConfigScope;
}

interface UpdateConfigBody {
  scope: ConfigScope;
  settings: ClaudeCodeSettings;
}

interface CheckPermissionBody {
  tool: string;
  args?: Record<string, unknown>;
}

export async function settingsRoutes(fastify: FastifyInstance) {
  const configService = new ConfigService();

  fastify.get('/api/settings/status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const status = await configService.getAllConfigStatus();
      return {
        success: true,
        data: status,
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

  fastify.get<{ Querystring: GetConfigParams }>('/api/settings', async (request, reply) => {
    try {
      const { scope } = request.query;
      const settings = await configService.loadSettings(scope);
      return {
        success: true,
        data: settings,
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

  fastify.post<{ Body: UpdateConfigBody }>('/api/settings', async (request, reply) => {
    try {
      const { scope, settings } = request.body;
      await configService.saveSettings(scope, settings);
      return {
        success: true,
        message: `Settings saved to ${scope} scope`,
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

  fastify.delete<{ Querystring: { scope: ConfigScope } }>('/api/settings', async (request, reply) => {
    try {
      const { scope } = request.query;
      await configService.deleteConfigFile(scope);
      return {
        success: true,
        message: `Settings deleted from ${scope} scope`,
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

  fastify.get('/api/settings/permissions', async (request, reply) => {
    try {
      const settings = await configService.loadSettings();
      const permissionService = new PermissionService(settings);
      const rules = permissionService.getRules();
      return {
        success: true,
        data: rules,
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

  fastify.post<{ Body: CheckPermissionBody }>('/api/settings/permissions/check', async (request, reply) => {
    try {
      const { tool, args = {} } = request.body;
      const settings = await configService.loadSettings();
      const permissionService = new PermissionService(settings);
      const result = permissionService.checkPermission(tool as any, args);
      return {
        success: true,
        data: result,
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

  fastify.post<{ Body: { rule: string; type: 'allow' | 'ask' | 'deny' } }>('/api/settings/permissions', async (request, reply) => {
    try {
      const { rule, type } = request.body;
      const settings = await configService.loadSettings('user');
      const permissionService = new PermissionService(settings);
      permissionService.parsePermissionRule(rule, type);
      
      const newRule = permissionService.parsePermissionRule(rule, type);
      if (newRule) {
        permissionService.addRule(newRule);
      }

      const permissions = permissionService.exportRules();
      await configService.saveSettings('user', { ...settings, permissions });

      return {
        success: true,
        message: 'Permission rule added',
        data: newRule,
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

  fastify.delete<{ Querystring: { rule: string } }>('/api/settings/permissions', async (request, reply) => {
    try {
      const { rule } = request.query;
      const settings = await configService.loadSettings('user');
      const permissionService = new PermissionService(settings);
      permissionService.removeRule(rule);
      
      const permissions = permissionService.exportRules();
      await configService.saveSettings('user', { ...settings, permissions });

      return {
        success: true,
        message: 'Permission rule removed',
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

  fastify.get('/api/settings/env', async (request, reply) => {
    try {
      const settings = await configService.loadSettings();
      return {
        success: true,
        data: settings.env || {},
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

  fastify.post<{ Body: { scope: ConfigScope; env: Record<string, string> } }>('/api/settings/env', async (request, reply) => {
    try {
      const { scope, env } = request.body;
      const settings = await configService.loadSettings(scope);
      await configService.saveSettings(scope, { ...settings, env });
      return {
        success: true,
        message: 'Environment variables saved',
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