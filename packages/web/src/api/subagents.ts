export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface SubagentFile {
  name: string;
  content: string;
  scope: 'user' | 'project';
}

export interface SubagentDetails extends SubagentFile {
  name: string;
  description: string;
  prompt: string;
  tools?: string[];
  model?: string;
  enabled?: boolean;
}

export interface CreateSubagentParams {
  name: string;
  description: string;
  prompt: string;
  tools?: string[];
  model?: string;
  scope?: 'user' | 'project';
}

export const subagentsApi = {
  async getSubagents(scope: 'user' | 'project' = 'user'): Promise<ApiResponse<SubagentFile[]>> {
    const response = await fetch(`/api/subagents?scope=${scope}`);
    return response.json();
  },

  async getSubagentDetails(name: string, scope: 'user' | 'project' = 'user'): Promise<ApiResponse<SubagentDetails>> {
    const response = await fetch(`/api/subagents/details?name=${encodeURIComponent(name)}&scope=${scope}`);
    return response.json();
  },

  async createSubagent(params: CreateSubagentParams): Promise<ApiResponse<{ name: string; scope: 'user' | 'project' }>> {
    const response = await fetch('/api/subagents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return response.json();
  },

  async updateSubagent(params: CreateSubagentParams): Promise<ApiResponse<void>> {
    const response = await fetch('/api/subagents', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return response.json();
  },

  async deleteSubagent(name: string, scope: 'user' | 'project' = 'user'): Promise<ApiResponse<void>> {
    const response = await fetch(`/api/subagents?name=${encodeURIComponent(name)}&scope=${scope}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};
