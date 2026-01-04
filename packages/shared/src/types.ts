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
  mcpServers?: Record<string, MCPServer>
  hooks?: HooksConfig
  skills?: Record<string, Skill>
  plugins?: Record<string, Plugin>
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
  enabled?: boolean
  metadata?: Record<string, unknown>
}

/**
 * Plugin Definition
 */
export interface Plugin {
  name: string
  version: string
  enabled?: boolean
  config?: Record<string, unknown>
  skills?: Record<string, Skill>
}

// ============================================================================
// Runtime & Monitoring Types
// ============================================================================

/**
 * Context Usage Statistics
 */
export interface ContextUsage {
  totalTokens: number
  inputTokens: number
  outputTokens: number
  cacheReadTokens?: number
  cacheCreationTokens?: number
  timestamp: number
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

/**
 * DevTools Status Information
 */
export interface DevToolsStatus {
  connected: boolean
  sessionId?: string
  startTime?: number
  totalMessages?: number
  totalToolCalls?: number
  currentContextUsage?: ContextUsage
  lastActivity?: number
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
