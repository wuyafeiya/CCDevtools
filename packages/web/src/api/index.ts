import type {
  DevToolsStatus,
  ClaudeSettings,
  MCPConfig,
  MCPServerStatus,
  HooksConfig,
  Skill,
  Plugin
} from '@claude-devtools/shared'

/**
 * Base API URL - use relative path to leverage Vite proxy
 */
const API_BASE_URL = '/api'

/**
 * Generic request function that unwraps API response
 */
async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()

  // Handle wrapped API response format
  if (data && typeof data === 'object' && 'success' in data) {
    if (!data.success) {
      throw new Error(data.error || 'Request failed')
    }
    return data.data as T
  }

  return data as T
}

/**
 * API Client
 */
export const api = {
  /**
   * Get current DevTools status
   */
  getStatus: () => request<DevToolsStatus>('/status'),

  /**
   * Get current Claude settings
   */
  getSettings: () => request<{ global: ClaudeSettings; local: ClaudeSettings }>('/config/settings'),

  /**
   * Update Claude settings
   */
  updateSettings: (settings: Partial<ClaudeSettings>) =>
    request<void>('/config/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    }),

  /**
   * Get MCP server configuration
   */
  getMcp: () => request<MCPConfig>('/config/mcp'),

  /**
   * Get MCP server status
   */
  getMcpStatus: () => request<MCPServerStatus[]>('/mcp/status'),

  /**
   * Get hooks configuration
   */
  getHooks: () => request<HooksConfig>('/config/hooks'),

  /**
   * Update hooks configuration
   */
  updateHooks: (hooks: HooksConfig) =>
    request<void>('/config/hooks', {
      method: 'PUT',
      body: JSON.stringify({ hooks })
    }),

  /**
   * Get all skills
   */
  getSkills: () => request<Skill[]>('/config/skills'),

  /**
   * Get a specific skill
   */
  getSkill: (name: string) =>
    request<Skill>(`/config/skills/${encodeURIComponent(name)}`),

  /**
   * Create a new skill
   */
  createSkill: (name: string, content: string) =>
    request<void>('/config/skills', {
      method: 'POST',
      body: JSON.stringify({ name, content })
    }),

  /**
   * Update an existing skill
   */
  updateSkill: (name: string, content: string) =>
    request<void>(`/config/skills/${encodeURIComponent(name)}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    }),

  /**
   * Delete a skill
   */
  deleteSkill: (name: string) =>
    request<void>(`/config/skills/${encodeURIComponent(name)}`, {
      method: 'DELETE'
    }),

  /**
   * Get all plugins
   */
  getPlugins: () => request<Plugin[]>('/config/plugins')
}

export default api
