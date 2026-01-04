import type { FastifyInstance, FastifyReply } from 'fastify';
import { ConfigService } from '../services/config-file.service.js';
import type { ClaudeCodeSettings, ConfigScope } from '@claude-devtools/shared';

export async function exportRoutes(fastify: FastifyInstance) {
  const configService = new ConfigService();

  fastify.get<{ Querystring: { scope?: ConfigScope } }>('/api/settings/export', async (request, reply) => {
    try {
      const { scope } = request.query;
      const settings = await configService.loadSettings(scope);

      reply.type('application/json');
      reply.send({
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        scope: scope || 'merged',
        settings,
      });
    } catch (error) {
      reply.code(500);
      reply.send({
        success: false,
        error: (error as Error).message,
        timestamp: Date.now(),
      });
    }
  });

  fastify.post<{ Querystring: { scope?: ConfigScope } }>('/api/settings/import', async (request, reply) => {
    try {
      const { scope = 'user' } = request.query;
      const body = request.body as any;

      if (!body.settings) {
        reply.code(400);
        return {
          success: false,
          error: 'No settings provided in import',
          timestamp: Date.now(),
        };
      }

      const settings = body.settings as ClaudeCodeSettings;
      await configService.saveSettings(scope, settings);

      return {
        success: true,
        message: `Settings imported to ${scope} scope`,
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

  fastify.get('/api/settings/export/all', async (request, reply) => {
    try {
      const scopes: ConfigScope[] = ['user', 'project', 'local'];
      const exportData: any = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        scopes: {},
      };

      for (const scope of scopes) {
        try {
          const settings = await configService.loadSettings(scope);
          exportData.scopes[scope] = settings;
        } catch {
          exportData.scopes[scope] = null;
        }
      }

      reply.type('application/json');
      reply.send(exportData);
    } catch (error) {
      reply.code(500);
      reply.send({
        success: false,
        error: (error as Error).message,
        timestamp: Date.now(),
      });
    }
  });
}
