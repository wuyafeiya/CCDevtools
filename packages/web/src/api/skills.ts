import type { Skill } from '@claude-devtools/shared';

export type { Skill };

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface CreateSkillParams {
  name: string;
  description: string;
  prompt?: string;
  instructions?: string;
  enabled?: boolean;
  metadata?: Record<string, unknown>;
  scope?: 'user' | 'project';
}

export const skillsApi = {
  async getSkills(scope: 'user' | 'project' = 'user'): Promise<ApiResponse<Skill[]>> {
    const response = await fetch(`/api/skills?scope=${scope}`);
    return response.json();
  },

  async getSkillDetails(name: string, scope: 'user' | 'project' = 'user'): Promise<ApiResponse<any>> {
    const response = await fetch(`/api/skills/details?name=${encodeURIComponent(name)}&scope=${scope}`);
    return response.json();
  },

  async createSkill(params: CreateSkillParams): Promise<ApiResponse<{ name: string; scope: 'user' | 'project' }>> {
    const response = await fetch('/api/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return response.json();
  },

  async updateSkill(params: CreateSkillParams): Promise<ApiResponse<void>> {
    const response = await fetch('/api/skills', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return response.json();
  },

  async deleteSkill(name: string, scope: 'user' | 'project' = 'user'): Promise<ApiResponse<void>> {
    const response = await fetch(`/api/skills?name=${encodeURIComponent(name)}&scope=${scope}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};
