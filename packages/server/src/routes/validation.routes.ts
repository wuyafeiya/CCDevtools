import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { ClaudeCodeSettings } from '@claude-devtools/shared';

interface ValidateConfigBody {
  settings: ClaudeCodeSettings;
}

interface ConfigValidationResult {
  valid: boolean;
  errors: Array<{ path: string; message: string; severity: 'error' | 'warning' }>;
}

export async function validationRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: ValidateConfigBody }>('/api/settings/validate', async (request, reply) => {
    try {
      const { settings } = request.body;
      const result = validateSettings(settings);

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
}

function validateSettings(settings: ClaudeCodeSettings): ConfigValidationResult {
  const errors: Array<{ path: string; message: string; severity: 'error' | 'warning' }> = [];

  if (!settings) {
    return { valid: false, errors: [{ path: '', message: 'Settings object is empty', severity: 'error' }] };
  }

  validatePermissions(settings, errors);
  validateSandbox(settings, errors);
  validateMcpServers(settings, errors);
  validateEnvironment(settings, errors);
  validateHooks(settings, errors);
  validatePlugins(settings, errors);

  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
  };
}

function validatePermissions(settings: ClaudeCodeSettings, errors: Array<any>): void {
  const permissions = settings.permissions;
  if (!permissions) return;

  if (permissions.allow && permissions.deny) {
    const denyPatterns = permissions.deny.filter(rule => {
      for (const allow of permissions.allow || []) {
        if (areRulesConflict(allow, rule)) {
          return true;
        }
      }
      return false;
    });

    for (const conflict of denyPatterns) {
      errors.push({
        path: 'permissions',
        message: `Permission rule "${conflict}" conflicts with allow rules`,
        severity: 'warning',
      });
    }
  }

  if (permissions.defaultMode && !['plan', 'acceptEdits', 'bypassPermissions'].includes(permissions.defaultMode)) {
    errors.push({
      path: 'permissions.defaultMode',
      message: `Invalid default mode: ${permissions.defaultMode}`,
      severity: 'error',
    });
  }
}

function validateSandbox(settings: ClaudeCodeSettings, errors: Array<any>): void {
  const sandbox = settings.sandbox;
  if (!sandbox) return;

  if (sandbox.network) {
    if (sandbox.network.httpProxyPort && (sandbox.network.httpProxyPort < 1 || sandbox.network.httpProxyPort > 65535)) {
      errors.push({
        path: 'sandbox.network.httpProxyPort',
        message: 'HTTP proxy port must be between 1 and 65535',
        severity: 'error',
      });
    }

    if (sandbox.network.socksProxyPort && (sandbox.network.socksProxyPort < 1 || sandbox.network.socksProxyPort > 65535)) {
      errors.push({
        path: 'sandbox.network.socksProxyPort',
        message: 'SOCKS proxy port must be between 1 and 65535',
        severity: 'error',
      });
    }
  }
}

function validateMcpServers(settings: ClaudeCodeSettings, errors: Array<any>): void {
  const mcpServers = settings.mcpServers;
  if (!mcpServers) return;

  for (const [name, server] of Object.entries(mcpServers)) {
    if (!server.command || server.command.trim() === '') {
      errors.push({
        path: `mcpServers.${name}.command`,
        message: `MCP server "${name}" has no command specified`,
        severity: 'error',
      });
    }
  }
}

function validateEnvironment(settings: ClaudeCodeSettings, errors: Array<any>): void {
  const env = settings.env;
  if (!env) return;

  for (const [key] of Object.keys(env)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      errors.push({
        path: `env.${key}`,
        message: `Invalid environment variable name: ${key}`,
        severity: 'error',
      });
    }
  }
}

function validateHooks(settings: ClaudeCodeSettings, errors: Array<any>): void {
  const hooks = settings.hooks;
  if (!hooks) return;

  const validHookTypes = ['prompt:before', 'prompt:after', 'tool:before', 'tool:after', 'response:before', 'response:after'];

  for (const [hookType] of Object.keys(hooks)) {
    if (!validHookTypes.includes(hookType)) {
      errors.push({
        path: `hooks.${hookType}`,
        message: `Unknown hook type: ${hookType}`,
        severity: 'warning',
      });
    }
  }
}

function validatePlugins(settings: ClaudeCodeSettings, errors: Array<any>): void {
  const enabledPlugins = settings.enabledPlugins;
  if (!enabledPlugins) return;

  for (const [pluginName, enabled] of Object.entries(enabledPlugins)) {
    if (typeof enabled !== 'boolean') {
      errors.push({
        path: `enabledPlugins.${pluginName}`,
        message: `Plugin "${pluginName}" must be a boolean`,
        severity: 'error',
      });
    }
  }
}

function areRulesConflict(allow: string, deny: string): boolean {
  const allowTool = allow.split('(')[0];
  const denyTool = deny.split('(')[0];

  if (allowTool !== denyTool) return false;

  const allowPattern = allow.match(/\((.*)\)/)?.[1] || '';
  const denyPattern = deny.match(/\((.*)\)/)?.[1] || '';

  if (allowPattern === '*' || denyPattern === '*') return true;

  if (denyPattern.includes('*') && allowPattern.includes('*')) {
    const allowPrefix = allowPattern.replace('*', '');
    const denyPrefix = denyPattern.replace('*', '');
    return denyPrefix.startsWith(allowPrefix) || allowPrefix.startsWith(denyPrefix);
  }

  return allowPattern === denyPattern;
}
