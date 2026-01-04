import type { ClaudeCodeSettings } from '@claude-devtools/shared';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface ConfigValidationResult {
  valid: boolean;
  errors: Array<{ path: string; message: string; severity: 'error' | 'warning' }>;
}

export const validationApi = {
  async validateSettings(settings: ClaudeCodeSettings): Promise<ApiResponse<ConfigValidationResult>> {
    const response = await fetch('/api/settings/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    });
    return response.json();
  },
};
