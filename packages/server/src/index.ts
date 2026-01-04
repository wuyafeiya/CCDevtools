import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import staticPlugin from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';
import { config } from './config.js';
import { statusRoutes } from './routes/status.routes.js';
import { configRoutes } from './routes/config.routes.js';
import { settingsRoutes } from './routes/settings.routes.js';
import { mcpRoutes } from './routes/mcp.routes.js';
import { subagentsRoutes } from './routes/subagents.routes.js';
import { validationRoutes } from './routes/validation.routes.js';
import { exportRoutes } from './routes/export.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main Fastify server
 */
async function start() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  // Register plugins
  await fastify.register(cors, {
    origin: true, // Allow all origins in development
  });

  await fastify.register(websocket);

  // Register routes
  await fastify.register(statusRoutes);
  await fastify.register(configRoutes);
  await fastify.register(settingsRoutes);
  await fastify.register(mcpRoutes);
  await fastify.register(subagentsRoutes);
  await fastify.register(validationRoutes);
  await fastify.register(exportRoutes);

  // WebSocket endpoint for real-time config updates
  fastify.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (connection, req) => {
      fastify.log.info('WebSocket client connected');

      // Watch Claude config directory for changes
      const watcher = chokidar.watch(config.claudeDir, {
        persistent: true,
        ignoreInitial: true,
        depth: 2,
      });

      watcher.on('all', (event, filePath) => {
        fastify.log.debug({ event, filePath }, 'File changed');

        // Send update notification to client
        connection.socket.send(
          JSON.stringify({
            type: 'config-update',
            event,
            path: filePath,
            timestamp: new Date().toISOString(),
          })
        );
      });

      connection.socket.on('message', (message: Buffer) => {
        fastify.log.debug({ message: message.toString() }, 'Received message');

        // Echo back for now (can add command handling later)
        connection.socket.send(
          JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString(),
          })
        );
      });

      connection.socket.on('close', () => {
        fastify.log.info('WebSocket client disconnected');
        watcher.close();
      });

      connection.socket.on('error', (error: Error) => {
        fastify.log.error(error, 'WebSocket error');
        watcher.close();
      });
    });
  });

  // Serve static files in production (from extension build)
  if (process.env.NODE_ENV === 'production') {
    const publicPath = path.join(__dirname, '../../extension/dist');
    await fastify.register(staticPlugin, {
      root: publicPath,
      prefix: '/',
    });

    // Fallback to index.html for SPA routing
    fastify.setNotFoundHandler((request, reply) => {
      reply.sendFile('index.html');
    });
  }

  // Start server
  try {
    await fastify.listen({ port: config.port, host: config.host });
    fastify.log.info(`Server listening on http://${config.host}:${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nGracefully shutting down...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nGracefully shutting down...');
  process.exit(0);
});

start();
