import type {
  ApiResponse,
  DevToolsStatus,
  ClaudeSettings,
  MCPConfig,
  MCPServerStatus,
  HooksConfig,
  Skill,
  Plugin
} from '@claude-devtools/shared'

/**
 * Base API URL - defaults to localhost:3000
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Generic request function with error handling
 */
async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
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
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    }
  }
}

/**
 * API Client
 */
export const api = {
  /**
   * Get current DevTools status
   */
  async getStatus(): Promise<ApiResponse<DevToolsStatus>> {
    return request<DevToolsStatus>('/api/status')
  },

  /**
   * Get current Claude settings
   */
  async getSettings(): Promise<ApiResponse<ClaudeSettings>> {
    return request<ClaudeSettings>('/api/settings')
  },

  /**
   * Update Claude settings
   */
  async updateSettings(settings: Partial<ClaudeSettings>): Promise<ApiResponse<ClaudeSettings>> {
    return request<ClaudeSettings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    })
  },

  /**
   * Get MCP server configuration
   */
  async getMcp(): Promise<ApiResponse<MCPConfig>> {
    return request<MCPConfig>('/api/mcp')
  },

  /**
   * Get MCP server status
   */
  async getMcpStatus(): Promise<ApiResponse<MCPServerStatus[]>> {
    return request<MCPServerStatus[]>('/api/mcp/status')
  },

  /**
   * Get hooks configuration
   */
  async getHooks(): Promise<ApiResponse<HooksConfig>> {
    return request<HooksConfig>('/api/hooks')
  },

  /**
   * Update hooks configuration
   */
  async updateHooks(hooks: HooksConfig): Promise<ApiResponse<HooksConfig>> {
    return request<HooksConfig>('/api/hooks', {
      method: 'PUT',
      body: JSON.stringify(hooks)
    })
  },

  /**
   * Get all skills
   */
  async getSkills(): Promise<ApiResponse<Record<string, Skill>>> {
    return request<Record<string, Skill>>('/api/skills')
  },

  /**
   * Get a specific skill
   */
  async getSkill(name: string): Promise<ApiResponse<Skill>> {
    return request<Skill>(`/api/skills/${encodeURIComponent(name)}`)
  },

  /**
   * Create a new skill
   */
  async createSkill(name: string, skill: Skill): Promise<ApiResponse<Skill>> {
    return request<Skill>('/api/skills', {
      method: 'POST',
      body: JSON.stringify({ name, ...skill })
    })
  },

  /**
   * Update an existing skill
   */
  async updateSkill(name: string, skill: Partial<Skill>): Promise<ApiResponse<Skill>> {
    return request<Skill>(`/api/skills/${encodeURIComponent(name)}`, {
      method: 'PUT',
      body: JSON.stringify(skill)
    })
  },

  /**
   * Delete a skill
   */
  async deleteSkill(name: string): Promise<ApiResponse<void>> {
    return request<void>(`/api/skills/${encodeURIComponent(name)}`, {
      method: 'DELETE'
    })
  },

  /**
   * Get all plugins
   */
  async getPlugins(): Promise<ApiResponse<Record<string, Plugin>>> {
    return request<Record<string, Plugin>>('/api/plugins')
  }
}

export default api
