import type { 
  PermissionRule, 
  PermissionCheckResult, 
  PermissionRuleType, 
  ToolName,
  ClaudeCodeSettings 
} from '@claude-devtools/shared';

export class PermissionService {
  private rules: PermissionRule[] = [];

  constructor(settings: ClaudeCodeSettings = {}) {
    this.parseRules(settings);
  }

  private parseRules(settings: ClaudeCodeSettings): void {
    const permissions = settings.permissions || {};

    if (permissions.allow) {
      this.parseRuleArray('allow', permissions.allow);
    }

    if (permissions.ask) {
      this.parseRuleArray('ask', permissions.ask);
    }

    if (permissions.deny) {
      this.parseRuleArray('deny', permissions.deny);
    }
  }

  private parseRuleArray(type: PermissionRuleType, rules: string[]): void {
    for (const rule of rules) {
      const parsed = this.parsePermissionRule(rule, type);
      if (parsed) {
        this.rules.push(parsed);
      }
    }
  }

  parsePermissionRule(rule: string, type: PermissionRuleType): PermissionRule | null {
    const toolPattern = /^([A-Za-z]+)\((.*)\)$/;
    const match = rule.match(toolPattern);

    if (match) {
      const tool = match[1] as ToolName;
      const pattern = match[2];

      return {
        type,
        tool,
        pattern,
        original: rule,
      };
    }

    return {
      type,
      original: rule,
    };
  }

  checkPermission(
    tool: ToolName,
    args: Record<string, unknown> = {}
  ): PermissionCheckResult {
    const result: PermissionCheckResult = {
      allowed: true,
    };

    for (const rule of this.rules) {
      if (this.ruleMatches(rule, tool, args)) {
        switch (rule.type) {
          case 'deny':
            return {
              allowed: false,
              reason: 'Denied by permission rule',
              rule,
            };
          case 'ask':
            return {
              allowed: true,
              ask: true,
              reason: 'Requires confirmation',
              rule,
            };
          case 'allow':
            return {
              allowed: true,
              rule,
            };
        }
      }
    }

    return result;
  }

  private ruleMatches(
    rule: PermissionRule,
    tool: ToolName,
    args: Record<string, unknown>
  ): boolean {
    if (rule.tool && rule.tool !== tool) {
      return false;
    }

    if (rule.pattern) {
      return this.patternMatches(rule.pattern, tool, args);
    }

    return true;
  }

  private patternMatches(
    pattern: string,
    tool: ToolName,
    args: Record<string, unknown>
  ): boolean {
    if (tool === 'Bash') {
      const command = args.command as string || '';
      return this.matchBashPattern(pattern, command);
    }

    if (tool === 'Read' || tool === 'Edit' || tool === 'Write') {
      const filePath = args.filePath as string || args.path as string || '';
      return this.matchPathPattern(pattern, filePath);
    }

    if (tool === 'WebFetch') {
      const url = args.url as string || '';
      return pattern.includes(url) || url.includes(pattern);
    }

    return true;
  }

  private matchBashPattern(pattern: string, command: string): boolean {
    if (pattern.endsWith(':*')) {
      const prefix = pattern.slice(0, -2);
      return command.startsWith(prefix);
    }

    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(command);
    }

    return command === pattern;
  }

  private matchPathPattern(pattern: string, filePath: string): boolean {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(filePath);
    }

    return filePath === pattern;
  }

  getRules(): PermissionRule[] {
    return [...this.rules];
  }

  addRule(rule: PermissionRule): void {
    this.rules.push(rule);
  }

  removeRule(original: string): boolean {
    const index = this.rules.findIndex(r => r.original === original);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  clearRules(): void {
    this.rules = [];
  }

  exportRules(): ClaudeCodeSettings['permissions'] {
    const allow = this.rules
      .filter(r => r.type === 'allow')
      .map(r => r.original);

    const ask = this.rules
      .filter(r => r.type === 'ask')
      .map(r => r.original);

    const deny = this.rules
      .filter(r => r.type === 'deny')
      .map(r => r.original);

    return { allow, ask, deny };
  }
}