import type { FastifyPluginAsync } from 'fastify';
import { configService } from '../services/config.service.js';
import type { DevToolsStatus, ContextUsage } from '@claude-devtools/shared';

/**
 * Status routes - DevTools status endpoint
 */
export const statusRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/status', async () => {
    const settings = await configService.getSettings();
    const mcp = await configService.getMcp();
    const hooks = await configService.getHooks();

    // Calculate MCP server count
    const mcpServerCount = mcp ? Object.keys(mcp.mcpServers || {}).length : 0;

    // Calculate active hooks count
    let activeHooksCount = 0;
    if (hooks) {
      for (const hookType of Object.values(hooks)) {
        if (Array.isArray(hookType)) {
          activeHooksCount += hookType.filter(h => h.enabled !== false).length;
        }
      }
    }

    // Mock context usage for now (will be real data from Claude CLI later)
    const context: ContextUsage = {
      used: 15000,
      total: 200000,
      percentage: 7.5,
      breakdown: {
        system: 5000,
        memory: 2000,
        conversation: 8000
      }
    };

    const status: DevToolsStatus = {
      connected: true,
      model: settings?.model || 'claude-sonnet-4-20250514',
      context,
      mcpServers: mcpServerCount,
      activeHooks: activeHooksCount,
      sessionId: 'dev-session',
      startTime: Date.now() - 300000, // 5 minutes ago
      totalMessages: 12,
      totalToolCalls: 8,
      lastActivity: Date.now()
    };

    return {
      success: true,
      data: status
    };
  });
};
