/**
 * Claude DevTools - Shared Type Definitions
 * This file contains all TypeScript types used across the application
 */

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Claude CLI settings from claude_desktop_config.json
 */
export interface ClaudeSettings {
  model?: string
  theme?: 'dark' | 'light' | 'system'
  verbose?: boolean
  notifications?: boolean
  mcpServers?: Record<string, MCPServer>
  hooks?: HooksConfig
  skills?: Record<string, Skill>
  plugins?: Record<string, Plugin>
  allowedTools?: string[]
  blockedTools?: string[]
  trustedTools?: string[]
  additionalDirectories?: string[]
}

/**
 * MCP (Model Context Protocol) Server Configuration
 */
export interface MCPServer {
  command: string
  args?: string[]
  env?: Record<string, string>
  disabled?: boolean
}

/**
 * Complete MCP Configuration
 */
export interface MCPConfig {
  mcpServers: Record<string, MCPServer>
}

/**
 * Hooks Configuration
 */
export interface HooksConfig {
  'prompt:before'?: HookEntry[]
  'prompt:after'?: HookEntry[]
  'tool:before'?: HookEntry[]
  'tool:after'?: HookEntry[]
  'response:before'?: HookEntry[]
  'response:after'?: HookEntry[]
}

/**
 * Individual Hook Entry
 */
export interface HookEntry {
  type: 'script' | 'command'
  path?: string
  command?: string
  args?: string[]
  enabled?: boolean
}

/**
 * Skill Definition
 */
export interface Skill {
  name: string
  description: string
  prompt?: string
  instructions?: string
  enabled?: boolean
  metadata?: Record<string, unknown>
  filePath?: string
  path?: string
}

/**
 * Plugin Definition
 */
export interface Plugin {
  name: string
  version: string
  description?: string
  enabled?: boolean
  config?: Record<string, unknown>
  skills?: Record<string, Skill>
  path?: string
}

// Type aliases for backward compatibility
export type Settings = ClaudeSettings
export type Hooks = HooksConfig

// ============================================================================
// Runtime & Monitoring Types
// ============================================================================

/**
 * Context Usage Statistics
 */
export interface ContextUsage {
  used: number
  total: number
  percentage: number
  breakdown: {
    system: number
    memory: number
    conversation: number
  }
  totalTokens?: number
  inputTokens?: number
  outputTokens?: number
  cacheReadTokens?: number
  cacheCreationTokens?: number
  timestamp?: number
}

/**
 * DevTools Status Information
 */
export interface DevToolsStatus {
  connected: boolean
  model?: string
  sessionId?: string
  startTime?: number
  totalMessages?: number
  totalToolCalls?: number
  currentContextUsage?: ContextUsage
  context?: ContextUsage
  mcpServers?: number
  activeHooks?: number
  lastActivity?: number
}

/**
 * Tool Call Information
 */
export interface ToolCall {
  id: string
  name: string
  input: Record<string, unknown>
  timestamp: number
  status?: 'pending' | 'success' | 'error'
  output?: unknown
  error?: string
  duration?: number
}

/**
 * Timeline Event Types
 */
export type TimelineEventType =
  | 'message'
  | 'tool_call'
  | 'tool_result'
  | 'context_update'
  | 'error'
  | 'config_change'
  | 'session_start'
  | 'session_end'

/**
 * Timeline Event
 */
export interface TimelineEvent {
  id: string
  type: TimelineEventType
  timestamp: number
  data: unknown
  metadata?: Record<string, unknown>
}

// ============================================================================
// API & Communication Types
// ============================================================================

/**
 * Generic API Response Wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  timestamp: number
}

/**
 * WebSocket Event Types
 */
export type WSEventType =
  | 'init'
  | 'config_changed'
  | 'tool_call'
  | 'tool_result'
  | 'context_update'
  | 'timeline_event'
  | 'log'
  | 'error'
  | 'status_update'

/**
 * WebSocket Message Structure
 */
export interface WSMessage<T = unknown> {
  type: WSEventType
  payload: T
  timestamp: number
  sessionId?: string
}

/**
 * Configuration Changed Payload
 */
export interface ConfigChangedPayload {
  type: 'mcp' | 'hooks' | 'skills' | 'plugins'
  changes: {
    added?: string[]
    modified?: string[]
    removed?: string[]
  }
  config: ClaudeSettings
}

/**
 * Log Message Payload
 */
export interface LogMessagePayload {
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  source?: string
  data?: unknown
}

// ============================================================================
// MCP-Specific Types
// ============================================================================

/**
 * MCP Server Status
 */
export interface MCPServerStatus {
  name: string
  connected: boolean
  lastPing?: number
  error?: string
  tools?: MCPTool[]
  resources?: MCPResource[]
}

/**
 * MCP Tool Definition
 */
export interface MCPTool {
  name: string
  description?: string
  inputSchema?: Record<string, unknown>
}

/**
 * MCP Resource Definition
 */
export interface MCPResource {
  uri: string
  name: string
  description?: string
  mimeType?: string
}

// ============================================================================
// Skill & Plugin Runtime Types
// ============================================================================

/**
 * Skill Execution Context
 */
export interface SkillExecutionContext {
  skillName: string
  args?: string[]
  metadata?: Record<string, unknown>
  timestamp: number
}

/**
 * Skill Execution Result
 */
export interface SkillExecutionResult {
  success: boolean
  output?: string
  error?: string
  duration: number
  metadata?: Record<string, unknown>
}

/**
 * Plugin Runtime Info
 */
export interface PluginRuntimeInfo {
  name: string
  version: string
  loaded: boolean
  error?: string
  skillsCount?: number
}

// ============================================================================
// Session & History Types
// ============================================================================

/**
 * Conversation Message
 */
export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  toolCalls?: ToolCall[]
  contextUsage?: ContextUsage
}

/**
 * Session Information
 */
export interface SessionInfo {
  id: string
  startTime: number
  endTime?: number
  messageCount: number
  toolCallCount: number
  totalTokens: number
  projectPath?: string
}

// ============================================================================
// File System & Config Types
// ============================================================================

/**
 * Configuration File Path Info
 */
export interface ConfigFilePath {
  path: string
  exists: boolean
  readable: boolean
  writable: boolean
}

/**
 * Configuration Validation Result
 */
export interface ConfigValidationResult {
  valid: boolean
  errors?: ConfigValidationError[]
  warnings?: ConfigValidationWarning[]
}

/**
 * Configuration Validation Error
 */
export interface ConfigValidationError {
  path: string
  message: string
  type: 'syntax' | 'schema' | 'runtime'
}

/**
 * Configuration Validation Warning
 */
export interface ConfigValidationWarning {
  path: string
  message: string
  suggestion?: string
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * DevTools Panel State
 */
export interface DevToolsPanelState {
  activeTab: 'timeline' | 'config' | 'tools' | 'context' | 'logs'
  filters: {
    eventTypes?: TimelineEventType[]
    search?: string
    dateRange?: [number, number]
  }
  sortBy?: 'timestamp' | 'type' | 'relevance'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Config Editor State
 */
export interface ConfigEditorState {
  modified: boolean
  validationStatus?: ConfigValidationResult
  activeSection?: 'mcp' | 'hooks' | 'skills' | 'plugins'
}

// ============================================================================
// Configuration Scopes & Hierarchies
// ============================================================================

/**
 * Configuration scope levels in order of precedence
 */
export type ConfigScope = 'enterprise' | 'user' | 'project' | 'local'

/**
 * Configuration file location for each scope
 */
export interface ConfigScopeInfo {
  scope: ConfigScope
  location: string
  sharedWithTeam: boolean
  precedence: number
}

/**
 * Complete settings structure following Claude Code's settings.json format
 */
export interface ClaudeCodeSettings {
  // Permissions
  permissions?: {
    allow?: string[]
    ask?: string[]
    deny?: string[]
    additionalDirectories?: string[]
    defaultMode?: 'plan' | 'acceptEdits' | 'bypassPermissions'
    disableBypassPermissionsMode?: 'disable'
  }

  // Sandbox settings
  sandbox?: SandboxSettings

  // Environment variables
  env?: Record<string, string>

  // Model configuration
  model?: string
  alwaysThinkingEnabled?: boolean

  // Attribution settings
  attribution?: {
    commit?: string
    pr?: string
  }

  // Hooks configuration
  hooks?: HooksConfig

  // Plugin settings
  enabledPlugins?: Record<string, boolean>
  extraKnownMarketplaces?: Record<string, MarketplaceSource>
  strictKnownMarketplaces?: StrictMarketplaceSource[]

  // Enterprise settings
  apiKeyHelper?: string
  otelHeadersHelper?: string
  awsAuthRefresh?: string
  awsCredentialExport?: string

  // MCP server settings
  mcpServers?: Record<string, MCPServer>
  enableAllProjectMcpServers?: boolean
  enabledMcpjsonServers?: string[]
  disabledMcpjsonServers?: string[]
  allowedMcpServers?: AllowedMcpServer[]
  deniedMcpServers?: DeniedMcpServer[]

  // Status line and file suggestion
  statusLine?: {
    type: 'command'
    command: string
  }
  fileSuggestion?: {
    type: 'command'
    command: string
  }

  // Output style
  outputStyle?: string

  // Authentication
  forceLoginMethod?: 'claudeai' | 'console'
  forceLoginOrgUUID?: string

  // Company announcements
  companyAnnouncements?: string[]

  // Cleanup
  cleanupPeriodDays?: number

  // Hooks control
  disableAllHooks?: boolean
  allowManagedHooksOnly?: boolean
}

/**
 * Sandbox configuration
 */
export interface SandboxSettings {
  enabled?: boolean
  autoAllowBashIfSandboxed?: boolean
  excludedCommands?: string[]
  allowUnsandboxedCommands?: boolean
  network?: {
    allowUnixSockets?: string[]
    allowLocalBinding?: boolean
    httpProxyPort?: number
    socksProxyPort?: number
  }
  enableWeakerNestedSandbox?: boolean
}

/**
 * Marketplace source configuration
 */
export interface MarketplaceSource {
  source: MarketplaceSourceType
  repo?: string
  url?: string
  ref?: string
  path?: string
  package?: string
}

export type MarketplaceSourceType = 'github' | 'git' | 'url' | 'npm' | 'file' | 'directory'

/**
 * Strict marketplace source for enterprise restrictions
 */
export type StrictMarketplaceSource =
  | { source: 'github'; repo: string; ref?: string; path?: string }
  | { source: 'git'; url: string; ref?: string; path?: string }
  | { source: 'url'; url: string; headers?: Record<string, string> }
  | { source: 'npm'; package: string }
  | { source: 'file'; path: string }
  | { source: 'directory'; path: string }

/**
 * Allowed MCP server configuration
 */
export interface AllowedMcpServer {
  serverName: string
}

/**
 * Denied MCP server configuration
 */
export interface DeniedMcpServer {
  serverName: string
}

// ============================================================================
// Permission System Types
// ============================================================================

/**
 * Permission rule types
 */
export type PermissionRuleType = 'allow' | 'ask' | 'deny'

/**
 * Tool names that can be permission-controlled
 */
export type ToolName = 'Bash' | 'Read' | 'Edit' | 'Write' | 'WebFetch' | 'WebSearch' | 'NotebookEdit' | 'SlashCommand' | 'Skill'

/**
 * Parsed permission rule
 */
export interface PermissionRule {
  type: PermissionRuleType
  tool?: ToolName
  pattern?: string
  original: string
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean
  ask?: boolean
  reason?: string
  rule?: PermissionRule
}

// ============================================================================
// CLI Configuration Types
// ============================================================================

/**
 * CLI flag configuration
 */
export interface CLIFlags {
  model?: string
  agent?: string
  permissionMode?: 'plan' | 'acceptEdits' | 'bypassPermissions'
  continue?: boolean
  resume?: string
  debug?: string
  verbose?: boolean
  print?: boolean
  outputFormat?: 'text' | 'json' | 'stream-json'
  maxTurns?: number
  systemPrompt?: string
  appendSystemPrompt?: string
  allowedTools?: string[]
  disallowedTools?: string[]
  tools?: string | string[]
  dangerouslySkipPermissions?: boolean
}

// ============================================================================
// Monitoring & Observability Types
// ============================================================================

/**
 * OpenTelemetry configuration
 */
export interface OtelConfig {
  headersHelper?: string
  metricsExporter?: string
  debounceMs?: number
}

/**
 * Usage statistics
 */
export interface UsageStats {
  totalRequests: number
  totalTokens: number
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheCreationTokens: number
  cost?: number
  timestamp: number
}

// ============================================================================
// Session & Workspace Types
// ============================================================================

/**
 * Workspace information
 */
export interface Workspace {
  id: string
  name: string
  path: string
  lastAccessed: number
  sessionId?: string
}

/**
 * Session context
 */
export interface SessionContext {
  id: string
  workspaceId?: string
  startTime: number
  lastActivity: number
  model?: string
  permissionMode?: string
  totalTurns: number
  toolCalls: number
}
