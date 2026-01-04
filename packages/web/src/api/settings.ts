import type { ClaudeCodeSettings, ConfigScope, PermissionRule } from '@claude-devtools/shared';

const API_BASE = 'http://localhost:3000/api';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface ConfigStatus {
  enterprise: { exists: boolean; path: string };
  user: { exists: boolean; path: string };
  project: { exists: boolean; path: string };
  local: { exists: boolean; path: string };
}

export const settingsApi = {
  async getStatus(): Promise<ApiResponse<ConfigStatus>> {
    const response = await fetch(`${API_BASE}/settings/status`);
    return response.json();
  },

  async exportSettings(scope?: ConfigScope): Promise<Response> {
    const url = scope ? `${API_BASE}/settings/export?scope=${scope}` : `${API_BASE}/settings/export`;
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json() as ApiResponse;
      throw new Error(error.error || 'Failed to export settings');
    }
    return response;
  },

  async exportAllSettings(): Promise<Response> {
    const response = await fetch(`${API_BASE}/settings/export/all`);
    if (!response.ok) {
      const error = await response.json() as ApiResponse;
      throw new Error(error.error || 'Failed to export all settings');
    }
    return response;
  },

  async importSettings(settings: ClaudeCodeSettings, scope: ConfigScope = 'user'): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE}/settings/import?scope=${scope}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    });
    return response.json();
  },

  async getSettings(scope?: ConfigScope): Promise<ApiResponse<ClaudeCodeSettings>> {
    const url = scope ? `${API_BASE}/settings?scope=${scope}` : `${API_BASE}/settings`;
    const response = await fetch(url);
    return response.json();
  },

  async saveSettings(scope: ConfigScope, settings: ClaudeCodeSettings): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope, settings }),
    });
    return response.json();
  },

  async deleteSettings(scope: ConfigScope): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE}/settings?scope=${scope}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  async getPermissions(): Promise<ApiResponse<PermissionRule[]>> {
    const response = await fetch(`${API_BASE}/settings/permissions`);
    return response.json();
  },

  async checkPermission(tool: string, args?: Record<string, unknown>): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE}/settings/permissions/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, args }),
    });
    return response.json();
  },

  async addPermission(rule: string, type: 'allow' | 'ask' | 'deny'): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE}/settings/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rule, type }),
    });
    return response.json();
  },

  async removePermission(rule: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE}/settings/permissions?rule=${encodeURIComponent(rule)}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  async getEnv(): Promise<ApiResponse<Record<string, string>>> {
    const response = await fetch(`${API_BASE}/settings/env`);
    return response.json();
  },

  async saveEnv(scope: ConfigScope, env: Record<string, string>): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE}/settings/env`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope, env }),
    });
    return response.json();
  },
};
