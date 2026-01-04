import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ConfigService } from '../services/config-file.service.js';
import type { MCPServer, ConfigScope } from '@claude-devtools/shared';

interface MCPServerBody {
  name: string;
  server: MCPServer;
  scope?: ConfigScope;
}

interface TestMCPServerBody {
  name: string;
  server: MCPServer;
}

export async function mcpRoutes(fastify: FastifyInstance) {
  const configService = new ConfigService();

  fastify.get<{ Querystring: { scope?: ConfigScope } }>('/api/mcp/servers', async (request, reply) => {
    try {
      const { scope } = request.query;
      const settings = await configService.loadSettings(scope);
      
      const mcpServers: Record<string, MCPServer> = {};
      
      if (settings.mcpServers) {
        Object.assign(mcpServers, settings.mcpServers);
      }
      
      return {
        success: true,
        data: mcpServers,
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

  fastify.post<{ Body: MCPServerBody }>('/api/mcp/servers', async (request, reply) => {
    try {
      const { name, server, scope = 'user' } = request.body;
      
      const settings = await configService.loadSettings(scope);
      settings.mcpServers = settings.mcpServers || {};
      settings.mcpServers[name] = server;
      
      await configService.saveSettings(scope, settings);
      
      return {
        success: true,
        message: `MCP server "${name}" saved`,
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

  fastify.put<{ Body: MCPServerBody }>('/api/mcp/servers', async (request, reply) => {
    try {
      const { name, server, scope = 'user' } = request.body;
      
      const settings = await configService.loadSettings(scope);
      if (!settings.mcpServers || !settings.mcpServers[name]) {
        reply.code(404);
        return {
          success: false,
          error: `MCP server "${name}" not found`,
          timestamp: Date.now(),
        };
      }
      
      settings.mcpServers[name] = server;
      await configService.saveSettings(scope, settings);
      
      return {
        success: true,
        message: `MCP server "${name}" updated`,
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

  fastify.delete<{ Querystring: { name: string; scope?: ConfigScope } }>('/api/mcp/servers', async (request, reply) => {
    try {
      const { name, scope = 'user' } = request.query;
      
      const settings = await configService.loadSettings(scope);
      if (!settings.mcpServers || !settings.mcpServers[name]) {
        reply.code(404);
        return {
          success: false,
          error: `MCP server "${name}" not found`,
          timestamp: Date.now(),
        };
      }
      
      delete settings.mcpServers[name];
      await configService.saveSettings(scope, settings);
      
      return {
        success: true,
        message: `MCP server "${name}" deleted`,
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

  fastify.post<{ Body: TestMCPServerBody }>('/api/mcp/servers/test', async (request, reply) => {
    try {
      const { name, server } = request.body;
      
      const startTime = Date.now();
      let connectionStatus = 'unknown';
      let errorMessage: string | undefined;
      
      try {
        const { spawn } = await import('child_process');
        
        return new Promise((resolve) => {
          const args = server.args || [];
          const env = { ...process.env, ...(server.env || {}) };
          
          const child = spawn(server.command, args, {
            env,
            timeout: 5000,
          });
          
          let stdout = '';
          let stderr = '';
          
          child.stdout?.on('data', (data: Buffer) => {
            stdout += data.toString();
          });
          
          child.stderr?.on('data', (data: Buffer) => {
            stderr += data.toString();
          });
          
          const timeout = setTimeout(() => {
            child.kill();
            resolve({
              success: false,
              data: {
                name,
                status: 'timeout',
                latency: Date.now() - startTime,
                error: 'Connection timed out',
                timestamp: Date.now(),
              },
            });
          }, 5000);
          
          child.on('close', (code, signal) => {
            clearTimeout(timeout);
            
            if (signal === 'SIGTERM' || signal === 'SIGKILL') {
              connectionStatus = 'timeout';
              errorMessage = 'Connection timed out';
            } else if (code === 0) {
              connectionStatus = 'success';
            } else {
              connectionStatus = 'error';
              errorMessage = stderr || `Process exited with code ${code}`;
            }
            
            resolve({
              success: connectionStatus === 'success',
              data: {
                name,
                status: connectionStatus,
                latency: Date.now() - startTime,
                error: errorMessage,
                timestamp: Date.now(),
              },
            });
          });
          
          child.on('error', (err: Error) => {
            clearTimeout(timeout);
            resolve({
              success: false,
              data: {
                name,
                status: 'error',
                latency: Date.now() - startTime,
                error: err.message,
                timestamp: Date.now(),
              },
            });
          });
        });
      } catch (error) {
        return {
          success: false,
          data: {
            name,
            status: 'error',
            latency: Date.now() - startTime,
            error: (error as Error).message,
            timestamp: Date.now(),
          },
        };
      }
    } catch (error) {
      reply.code(500);
      return {
        success: false,
        error: (error as Error).message,
        timestamp: Date.now(),
      };
    }
  });

  fastify.get<{ Querystring: { name: string; scope?: ConfigScope } }>('/api/mcp/servers/details', async (request, reply) => {
    try {
      const { name, scope } = request.query;
      
      const settings = await configService.loadSettings(scope);
      
      if (!settings.mcpServers || !settings.mcpServers[name]) {
        reply.code(404);
        return {
          success: false,
          error: `MCP server "${name}" not found`,
          timestamp: Date.now(),
        };
      }
      
      return {
        success: true,
        data: {
          name,
          server: settings.mcpServers[name],
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
}
