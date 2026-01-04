import type { FastifyPluginAsync } from 'fastify';

/**
 * Status routes - health check endpoint
 */
export const statusRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/status', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    };
  });
};
