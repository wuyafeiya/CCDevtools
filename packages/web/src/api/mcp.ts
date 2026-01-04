import type { MCPServer, ConfigScope } from '@claude-devtools/shared';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface MCPServerTestResult {
  name: string;
  status: 'success' | 'error' | 'timeout' | 'unknown';
  latency: number;
  error?: string;
  timestamp: number;
}

export const mcpApi = {
  async getServers(scope?: ConfigScope): Promise<ApiResponse<Record<string, MCPServer>>> {
    const url = scope ? `/api/mcp/servers?scope=${scope}` : '/api/mcp/servers';
    const response = await fetch(url);
    return response.json();
  },

  async addServer(name: string, server: MCPServer, scope: ConfigScope = 'user'): Promise<ApiResponse<void>> {
    const response = await fetch('/api/mcp/servers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, server, scope }),
    });
    return response.json();
  },

  async updateServer(name: string, server: MCPServer, scope: ConfigScope = 'user'): Promise<ApiResponse<void>> {
    const response = await fetch('/api/mcp/servers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, server, scope }),
    });
    return response.json();
  },

  async deleteServer(name: string, scope: ConfigScope = 'user'): Promise<ApiResponse<void>> {
    const response = await fetch(`/api/mcp/servers?name=${encodeURIComponent(name)}&scope=${scope}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  async testServer(name: string, server: MCPServer): Promise<ApiResponse<MCPServerTestResult>> {
    const response = await fetch('/api/mcp/servers/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, server }),
    });
    return response.json();
  },

  async getServerDetails(name: string, scope?: ConfigScope): Promise<ApiResponse<{ name: string; server: MCPServer }>> {
    const url = scope ? `/api/mcp/servers/details?name=${encodeURIComponent(name)}&scope=${scope}` : `/api/mcp/servers/details?name=${encodeURIComponent(name)}`;
    const response = await fetch(url);
    return response.json();
  },
};
