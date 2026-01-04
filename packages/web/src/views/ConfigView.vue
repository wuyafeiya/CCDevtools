<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { settingsApi, type ConfigStatus } from '@/api/settings'
import { mcpApi, type MCPServerTestResult } from '@/api/mcp'
import { subagentsApi, type SubagentFile, type SubagentDetails, type CreateSubagentParams } from '@/api/subagents'
import { skillsApi, type Skill, type CreateSkillParams } from '@/api/skills'
import { validationApi, type ConfigValidationResult } from '@/api/validation'
import {
  Settings,
  Shield,
  Lock,
  Brain,
  Cpu,
  Zap,
  Server,
  User,
  Puzzle,
  MoreVertical,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Info,
  Play,
  Edit,
  X,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  FileCode
} from 'lucide-vue-next'

import type { ClaudeCodeSettings, ConfigScope, PermissionRule, MCPServer } from '@claude-devtools/shared'

type TabId = 'overview' | 'permissions' | 'sandbox' | 'model' | 'env' | 'hooks' | 'mcp' | 'subagents' | 'plugins' | 'skills' | 'advanced'

const activeTab = ref<TabId>('overview')
const selectedScope = ref<ConfigScope>('user')
const loading = ref(false)
const saving = ref(false)

const configStatus = ref<ConfigStatus | null>(null)
const settings = ref<ClaudeCodeSettings>({})
const permissions = ref<PermissionRule[]>([])
const newPermission = ref({ rule: '', type: 'allow' as 'allow' | 'ask' | 'deny' })
const showPermissionForm = ref(false)

const mcpServers = ref<Record<string, MCPServer>>({})
const showMcpForm = ref(false)
const editingMcpServer = ref<{ name: string; server: MCPServer } | null>(null)
const mcpForm = ref({
  name: '',
  command: '',
  args: [] as string[],
  env: {} as Record<string, string>,
  disabled: false,
})
const testingMcpServer = ref<Record<string, { status: string; result?: MCPServerTestResult }>>({})
const subagents = ref<SubagentFile[]>([])
const showSubagentForm = ref(false)
const editingSubagent = ref<SubagentDetails | null>(null)
const subagentForm = ref<CreateSubagentParams>({
  name: '',
  description: '',
  prompt: '',
  tools: [],
  model: '',
  scope: 'user',
})
const selectedSubagentScope = ref<'user' | 'project'>('user')
const newToolInput = ref('')
const validationResults = ref<ConfigValidationResult | null>(null)
const isValidating = ref(false)
const showImportDialog = ref(false)
const importedSettings = ref<ClaudeCodeSettings | null>(null)
const skills = ref<Skill[]>([])
const showSkillForm = ref(false)
const editingSkill = ref<any>(null)
const skillForm = ref<CreateSkillParams>({
  name: '',
  description: '',
  prompt: '',
  instructions: '',
  enabled: true,
  metadata: {},
  scope: 'user',
})
const selectedSkillScope = ref<'user' | 'project'>('user')

const tools = computed(() => subagentForm.value.tools || [])

const tabs = [
  { id: 'overview' as TabId, label: 'Overview', icon: Info },
  { id: 'permissions' as TabId, label: 'Permissions', icon: Shield },
  { id: 'sandbox' as TabId, label: 'Sandbox', icon: Lock },
  { id: 'model' as TabId, label: 'Model & AI', icon: Brain },
  { id: 'env' as TabId, label: 'Environment', icon: Cpu },
  { id: 'hooks' as TabId, label: 'Hooks', icon: Zap },
  { id: 'mcp' as TabId, label: 'MCP Servers', icon: Server },
  { id: 'subagents' as TabId, label: 'Subagents', icon: User },
  { id: 'skills' as TabId, label: 'Skills', icon: FileCode },
  { id: 'plugins' as TabId, label: 'Plugins', icon: Puzzle },
  { id: 'advanced' as TabId, label: 'Advanced', icon: Settings },
]

const scopeOptions: { value: ConfigScope; label: string; description: string }[] = [
  { value: 'enterprise', label: 'Enterprise', description: 'Managed by organization' },
  { value: 'user', label: 'User', description: 'Your personal settings' },
  { value: 'project', label: 'Project', description: 'Shared with team' },
  { value: 'local', label: 'Local', description: 'Local overrides' },
]

function updateSandboxNetworkSetting(key: string, value: string | number | string[]) {
  settings.value.sandbox = settings.value.sandbox || {}
  settings.value.sandbox.network = settings.value.sandbox.network || {}
  ;(settings.value.sandbox.network as any)[key] = value
}

function parseUnixSockets(value: string): string[] {
  return value.split('\n').filter((s) => s.trim())
}

function updateAttributionSetting(key: string, value: string) {
  settings.value.attribution = settings.value.attribution || {}
  ;(settings.value.attribution as any)[key] = value
}

async function loadData() {
  loading.value = true
  try {
    const [statusResponse, settingsResponse, permissionsResponse, mcpResponse, subagentsResponse, skillsResponse] = await Promise.all([
      settingsApi.getStatus(),
      settingsApi.getSettings(),
      settingsApi.getPermissions(),
      mcpApi.getServers(selectedScope.value),
      subagentsApi.getSubagents('user'),
      skillsApi.getSkills('user'),
    ])

    if (statusResponse.success) configStatus.value = statusResponse.data || null
    if (settingsResponse.success) settings.value = settingsResponse.data || {}
    if (permissionsResponse.success) permissions.value = permissionsResponse.data || []
    if (mcpResponse.success) mcpServers.value = mcpResponse.data || {}
    if (subagentsResponse.success) subagents.value = subagentsResponse.data || []
    if (skillsResponse.success) skills.value = skillsResponse.data || []
  } catch (e) {
    console.error('Failed to load config:', e)
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  saving.value = true
  try {
    const response = await settingsApi.saveSettings(selectedScope.value, settings.value)
    if (response.success) {
      alert('Settings saved successfully!')
      await loadData()
    } else {
      alert('Failed to save: ' + response.error)
    }
  } catch (e) {
    console.error('Failed to save settings:', e)
    alert('Failed to save settings')
  } finally {
    saving.value = false
  }
}

async function addPermission() {
  if (!newPermission.value.rule.trim()) return

  try {
    const response = await settingsApi.addPermission(newPermission.value.rule, newPermission.value.type)
    if (response.success) {
      newPermission.value.rule = ''
      showPermissionForm.value = false
      await loadData()
    }
  } catch (e) {
    console.error('Failed to add permission:', e)
  }
}

async function removePermission(rule: string) {
  try {
    const response = await settingsApi.removePermission(rule)
    if (response.success) {
      await loadData()
    }
  } catch (e) {
    console.error('Failed to remove permission:', e)
  }
}

async function loadMcpServers() {
  try {
    const response = await mcpApi.getServers(selectedScope.value)
    if (response.success) {
      mcpServers.value = response.data || {}
    }
  } catch (e) {
    console.error('Failed to load MCP servers:', e)
  }
}

async function saveMcpServer() {
  try {
    const server: MCPServer = {
      command: mcpForm.value.command,
      args: mcpForm.value.args,
      env: mcpForm.value.env,
      disabled: mcpForm.value.disabled,
    }

    let response
    if (editingMcpServer.value) {
      response = await mcpApi.updateServer(editingMcpServer.value.name, server, selectedScope.value)
    } else {
      response = await mcpApi.addServer(mcpForm.value.name, server, selectedScope.value)
    }

    if (response.success) {
      showMcpForm.value = false
      editingMcpServer.value = null
      mcpForm.value = { name: '', command: '', args: [], env: {}, disabled: false }
      await loadMcpServers()
    } else {
      alert('Failed to save MCP server: ' + response.error)
    }
  } catch (e) {
    console.error('Failed to save MCP server:', e)
    alert('Failed to save MCP server')
  }
}

async function deleteMcpServer(name: string) {
  if (!confirm(`Are you sure you want to delete MCP server "${name}"?`)) {
    return
  }

  try {
    const response = await mcpApi.deleteServer(name, selectedScope.value)
    if (response.success) {
      await loadMcpServers()
    } else {
      alert('Failed to delete MCP server: ' + response.error)
    }
  } catch (e) {
    console.error('Failed to delete MCP server:', e)
    alert('Failed to delete MCP server')
  }
}

async function testMcpServer(name: string) {
  const server = mcpServers.value[name]
  if (!server) return

  testingMcpServer.value[name] = { status: 'testing' }

  try {
    const response = await mcpApi.testServer(name, server)
    if (response.data) {
      testingMcpServer.value[name] = {
        status: 'done',
        result: response.data,
      }
    }
  } catch (e) {
    console.error('Failed to test MCP server:', e)
    testingMcpServer.value[name] = { status: 'error', result: { name, status: 'error', latency: 0, error: 'Failed to test server', timestamp: Date.now() } }
  }
}

function editMcpServer(name: string) {
  const server = mcpServers.value[name]
  if (!server) return

  editingMcpServer.value = { name, server }
  mcpForm.value = {
    name,
    command: server.command,
    args: server.args || [],
    env: server.env || {},
    disabled: server.disabled || false,
  }
  showMcpForm.value = true
}

function closeMcpForm() {
  showMcpForm.value = false
  editingMcpServer.value = null
  mcpForm.value = { name: '', command: '', args: [], env: {}, disabled: false }
}

async function loadSubagents() {
  try {
    const response = await subagentsApi.getSubagents(selectedSubagentScope.value)
    if (response.success) {
      subagents.value = response.data || []
    }
  } catch (e) {
    console.error('Failed to load subagents:', e)
  }
}

async function saveSubagent() {
  try {
    const params: CreateSubagentParams = {
      name: subagentForm.value.name,
      description: subagentForm.value.description,
      prompt: subagentForm.value.prompt,
      tools: subagentForm.value.tools,
      model: subagentForm.value.model || undefined,
      scope: subagentForm.value.scope,
    }

    let response
    if (editingSubagent.value) {
      response = await subagentsApi.updateSubagent(params)
    } else {
      response = await subagentsApi.createSubagent(params)
    }

    if (response.success) {
      showSubagentForm.value = false
      editingSubagent.value = null
      subagentForm.value = {
        name: '',
        description: '',
        prompt: '',
        tools: [],
        model: '',
        scope: 'user',
      }
      await loadSubagents()
    } else {
      alert('Failed to save subagent: ' + response.error)
    }
  } catch (e) {
    console.error('Failed to save subagent:', e)
    alert('Failed to save subagent')
  }
}

async function deleteSubagent(name: string, scope: 'user' | 'project') {
  if (!confirm(`Are you sure you want to delete subagent "${name}"?`)) {
    return
  }

  try {
    const response = await subagentsApi.deleteSubagent(name, scope)
    if (response.success) {
      await loadSubagents()
    } else {
      alert('Failed to delete subagent: ' + response.error)
    }
  } catch (e) {
    console.error('Failed to delete subagent:', e)
    alert('Failed to delete subagent')
  }
}

async function editSubagent(name: string, scope: 'user' | 'project') {
  try {
    const response = await subagentsApi.getSubagentDetails(name, scope)
    if (response.success && response.data) {
      editingSubagent.value = response.data
      subagentForm.value = {
        name: response.data.name,
        description: response.data.description,
        prompt: response.data.prompt,
        tools: response.data.tools || [],
        model: response.data.model || '',
        scope: response.data.scope,
      }
      showSubagentForm.value = true
    }
  } catch (e) {
    console.error('Failed to load subagent details:', e)
    alert('Failed to load subagent details')
  }
}

function closeSubagentForm() {
  showSubagentForm.value = false
  editingSubagent.value = null
  subagentForm.value = {
    name: '',
    description: '',
    prompt: '',
    tools: [],
    model: '',
    scope: 'user',
  }
}

async function validateCurrentSettings() {
  isValidating.value = true
  validationResults.value = null

  try {
    const response = await validationApi.validateSettings(settings.value)
    if (response.data) {
      validationResults.value = response.data
    }
  } catch (e) {
    console.error('Failed to validate settings:', e)
    alert('Failed to validate settings')
  } finally {
    isValidating.value = false
  }
}

watch(() => settings.value, () => {
  validateCurrentSettings()
}, { deep: true, immediate: false })

async function exportSettings(scope?: ConfigScope) {
  try {
    const response = await settingsApi.exportSettings(scope)
    const blob = new Blob([JSON.stringify(await response.json(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `claude-settings${scope ? `-${scope}` : ''}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('Failed to export settings:', e)
    alert('Failed to export settings')
  }
}

async function exportAllSettings() {
  try {
    const response = await settingsApi.exportAllSettings()
    const blob = new Blob([JSON.stringify(await response.json(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `claude-settings-all-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('Failed to export all settings:', e)
    alert('Failed to export all settings')
  }
}

async function importSettings(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  try {
    const content = await file.text()
    const imported = JSON.parse(content)
    importedSettings.value = imported.settings || imported
    showImportDialog.value = true
  } catch (e) {
    console.error('Failed to import settings:', e)
    alert('Failed to parse settings file')
  }

  (event.target as HTMLInputElement).value = ''
}

async function confirmImport() {
  if (!importedSettings.value) return

  try {
    const response = await settingsApi.importSettings(importedSettings.value, selectedScope.value)
    if (response.success) {
      showImportDialog.value = false
      importedSettings.value = null
      await loadData()
    } else {
      alert('Failed to import settings: ' + response.error)
    }
  } catch (e) {
    console.error('Failed to import settings:', e)
    alert('Failed to import settings')
  }
}

function cancelImport() {
  showImportDialog.value = false
  importedSettings.value = null
}

async function loadSkills() {
  try {
    const response = await skillsApi.getSkills(selectedSkillScope.value)
    if (response.success) {
      skills.value = response.data || []
    }
  } catch (e) {
    console.error('Failed to load skills:', e)
  }
}

async function saveSkill() {
  try {
    let response
    if (editingSkill.value) {
      response = await skillsApi.updateSkill(skillForm.value)
    } else {
      response = await skillsApi.createSkill(skillForm.value)
    }

    if (response.success) {
      showSkillForm.value = false
      editingSkill.value = null
      skillForm.value = {
        name: '',
        description: '',
        prompt: '',
        instructions: '',
        enabled: true,
        metadata: {},
        scope: 'user',
      }
      await loadSkills()
    } else {
      alert('Failed to save skill: ' + response.error)
    }
  } catch (e) {
    console.error('Failed to save skill:', e)
    alert('Failed to save skill')
  }
}

async function deleteSkill(name: string, scope: 'user' | 'project') {
  if (!confirm(`Are you sure you want to delete skill "${name}"?`)) {
    return
  }

  try {
    const response = await skillsApi.deleteSkill(name, scope)
    if (response.success) {
      await loadSkills()
    } else {
      alert('Failed to delete skill: ' + response.error)
    }
  } catch (e) {
    console.error('Failed to delete skill:', e)
    alert('Failed to delete skill')
  }
}

async function editSkill(name: string, scope: 'user' | 'project') {
  try {
    const response = await skillsApi.getSkillDetails(name, scope)
    if (response.success && response.data) {
      editingSkill.value = response.data
      skillForm.value = {
        name: response.data.name,
        description: response.data.description,
        prompt: response.data.prompt,
        instructions: response.data.instructions,
        enabled: response.data.enabled !== false,
        metadata: response.data.metadata || {},
        scope: response.data.scope || 'user',
      }
      showSkillForm.value = true
    }
  } catch (e) {
    console.error('Failed to load skill details:', e)
    alert('Failed to load skill details')
  }
}

function closeSkillForm() {
  showSkillForm.value = false
  editingSkill.value = null
  skillForm.value = {
    name: '',
    description: '',
    prompt: '',
    instructions: '',
    enabled: true,
    metadata: {},
    scope: 'user',
  }
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Configuration</h2>
        <p class="text-muted-foreground mt-1">Manage Claude Code settings and preferences</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          @click="loadData"
          :disabled="loading"
        >
          <RefreshCw :class="['w-4 h-4', { 'animate-spin': loading }]" />
          Refresh
        </button>
        <button
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          @click="saveSettings"
          :disabled="saving"
        >
          <Save class="w-4 h-4" />
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
        <div
          v-if="validationResults"
          :class="[
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
            validationResults.valid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          ]"
        >
          <component
            :is="validationResults.valid ? CheckCircle : XCircle"
            class="w-4 h-4"
          />
          {{ validationResults.valid ? 'Valid' : `${validationResults.errors.filter(e => e.severity === 'error').length} Error${validationResults.errors.filter(e => e.severity === 'error').length > 1 ? 's' : ''}` }}
          <span v-if="validationResults.errors.some(e => e.severity === 'warning')" class="text-yellow-400 ml-2">
            {{ validationResults.errors.filter(e => e.severity === 'warning').length }} Warning{{ validationResults.errors.filter(e => e.severity === 'warning').length > 1 ? 's' : '' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Scope Selector -->
    <div class="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
      <div class="flex items-center gap-2">
        <Shield class="w-5 h-5 text-primary" />
        <span class="font-medium">Configuration Scope:</span>
      </div>
      <div class="flex gap-2">
        <button
          v-for="scope in scopeOptions"
          :key="scope.value"
          :class="[
            'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
            selectedScope === scope.value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          ]"
          @click="selectedScope = scope.value"
        >
          {{ scope.label }}
        </button>
      </div>
      <span class="text-sm text-muted-foreground">{{ scopeOptions.find(s => s.value === selectedScope)?.description }}</span>
    </div>

    <!-- Tabs -->
    <div class="flex flex-wrap gap-1 p-1 rounded-lg bg-muted/30">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="[
          'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all',
          activeTab === tab.id
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        ]"
        @click="activeTab = tab.id"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Content -->
    <div class="glass-card p-6">
      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'" class="space-y-6">
        <h3 class="text-lg font-semibold">Configuration Status</h3>
        
        <div class="grid gap-4">
          <div v-for="(status, scope) in configStatus" :key="scope" class="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div class="flex items-center gap-3">
              <div :class="['w-2 h-2 rounded-full', status.exists ? 'bg-emerald-500' : 'bg-muted-foreground']" />
              <span class="font-medium capitalize">{{ scope }}</span>
            </div>
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{{ status.exists ? 'Configured' : 'Not configured' }}</span>
              <span class="opacity-50">|</span>
              <code class="text-xs">{{ status.path }}</code>
            </div>
          </div>
        </div>

        <div class="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <h4 class="font-semibold mb-2">Configuration Precedence</h4>
          <p class="text-sm text-muted-foreground">
            Settings are merged with the following precedence (highest first):
          </p>
          <ol class="mt-2 space-y-1 text-sm">
            <li v-for="(scope, idx) in scopeOptions" :key="scope.value" class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{{ idx + 1 }}</span>
              <span>{{ scope.label }}</span>
              <span class="text-muted-foreground">- {{ scope.description }}</span>
            </li>
          </ol>
        </div>

        <div class="mt-6 p-4 rounded-lg bg-muted/30">
          <h4 class="font-semibold mb-3">Import / Export</h4>
          <div class="grid gap-3">
            <div class="flex gap-2">
              <button
                class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                @click="exportSettings()"
              >
                <Download class="w-4 h-4" />
                Export Current
              </button>
              <button
                class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                @click="exportAllSettings()"
              >
                <Download class="w-4 h-4" />
                Export All
              </button>
            </div>
            <label class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer">
              <Upload class="w-4 h-4" />
              Import Settings
              <input
                type="file"
                accept=".json"
                class="hidden"
                @change="importSettings"
              />
            </label>
          </div>
        </div>
      </div>

      <!-- Permissions Tab -->
      <div v-else-if="activeTab === 'permissions'" class="space-y-6">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Permission Rules</h3>
          <button
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            @click="showPermissionForm = !showPermissionForm"
          >
            <Plus class="w-4 h-4" />
            Add Rule
          </button>
        </div>

        <div v-if="showPermissionForm" class="p-4 rounded-lg bg-muted/30 space-y-4">
          <div class="grid gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Rule Type</label>
              <div class="flex gap-2">
                <button
                  v-for="type in ['allow', 'ask', 'deny']"
                  :key="type"
                  :class="[
                    'px-3 py-1.5 rounded-md text-sm font-medium capitalize',
                    newPermission.type === type
                      ? type === 'allow' ? 'bg-emerald-500' : type === 'ask' ? 'bg-amber-500' : 'bg-red-500'
                      : 'bg-muted text-muted-foreground'
                  ]"
                  @click="newPermission.type = type as any"
                >
                  {{ type }}
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Rule Pattern</label>
              <input
                v-model="newPermission.rule"
                type="text"
                placeholder='e.g., Bash(npm run:*), Read(./.env)'
                class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              />
              <p class="text-xs text-muted-foreground mt-1">
                Examples: Bash(git:*), Read(./.env), WebFetch(*), Edit(./src/**)
              </p>
            </div>
            <button
              class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              @click="addPermission"
            >
              Add Permission Rule
            </button>
          </div>
        </div>

        <div v-if="permissions.length === 0" class="text-center py-12 text-muted-foreground">
          <Shield class="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No permission rules configured</p>
          <p class="text-sm">Add rules above to control Claude's access to tools and files</p>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="perm in permissions"
            :key="perm.original"
            :class="[
              'flex items-center justify-between p-3 rounded-lg',
              perm.type === 'allow' ? 'bg-emerald-500/10 border border-emerald-500/20' :
              perm.type === 'ask' ? 'bg-amber-500/10 border border-amber-500/20' :
              'bg-red-500/10 border border-red-500/20'
            ]"
          >
            <div class="flex items-center gap-3">
              <span :class="[
                'px-2 py-1 rounded text-xs font-bold capitalize',
                perm.type === 'allow' ? 'bg-emerald-500 text-white' :
                perm.type === 'ask' ? 'bg-amber-500 text-white' :
                'bg-red-500 text-white'
              ]">{{ perm.type }}</span>
              <code class="text-sm">{{ perm.original }}</code>
            </div>
            <button
              class="p-2 rounded-lg hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
              @click="removePermission(perm.original)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Sandbox Tab -->
      <div v-else-if="activeTab === 'sandbox'" class="space-y-6">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Sandbox Configuration</h3>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div>
              <p class="font-medium">Enable Sandbox</p>
              <p class="text-sm text-muted-foreground">Isolate bash commands from filesystem and network</p>
            </div>
            <button
              :class="[
                'w-12 h-6 rounded-full transition-colors relative',
                settings.sandbox?.enabled ? 'bg-primary' : 'bg-muted'
              ]"
              @click="settings.sandbox = { ...settings.sandbox, enabled: !settings.sandbox?.enabled }"
            >
              <span
                :class="[
                  'absolute top-1 w-4 h-4 rounded-full bg-background transition-all',
                  settings.sandbox?.enabled ? 'left-7' : 'left-1'
                ]"
              />
            </button>
          </div>

          <div v-if="settings.sandbox?.enabled" class="space-y-4">
            <div class="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div>
                <p class="font-medium">Auto-approve if Sandboxed</p>
                <p class="text-sm text-muted-foreground">Automatically approve bash commands when sandboxed</p>
              </div>
              <button
                :class="[
                  'w-12 h-6 rounded-full transition-colors relative',
                  settings.sandbox?.autoAllowBashIfSandboxed ? 'bg-primary' : 'bg-muted'
                ]"
                @click="settings.sandbox = { ...settings.sandbox, autoAllowBashIfSandboxed: !settings.sandbox?.autoAllowBashIfSandboxed }"
              >
                <span
                  :class="[
                    'absolute top-1 w-4 h-4 rounded-full bg-background transition-all',
                    settings.sandbox?.autoAllowBashIfSandboxed ? 'left-7' : 'left-1'
                  ]"
                />
              </button>
            </div>

            <div class="p-4 rounded-lg bg-muted/30">
              <p class="font-medium mb-2">Excluded Commands</p>
              <p class="text-sm text-muted-foreground mb-3">Commands that should run outside the sandbox</p>
              <textarea
                v-model="settings.sandbox.excludedCommands"
                placeholder="docker&#10;git"
                class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                rows="4"
              />
              <p class="text-xs text-muted-foreground mt-1">One command per line</p>
            </div>

            <div class="p-4 rounded-lg bg-muted/30">
              <p class="font-medium mb-3">Network Settings</p>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-medium">Allow Local Binding</p>
                    <p class="text-sm text-muted-foreground">Allow binding to localhost ports (macOS only)</p>
                  </div>
                  <button
                    :class="[
                      'w-12 h-6 rounded-full transition-colors relative',
                      settings.sandbox?.network?.allowLocalBinding ? 'bg-primary' : 'bg-muted'
                    ]"
                    @click="settings.sandbox = { ...settings.sandbox, network: { ...settings.sandbox?.network, allowLocalBinding: !settings.sandbox?.network?.allowLocalBinding } }"
                  >
                    <span
                      :class="[
                        'absolute top-1 w-4 h-4 rounded-full bg-background transition-all',
                        settings.sandbox?.network?.allowLocalBinding ? 'left-7' : 'left-1'
                      ]"
                    />
                  </button>
                </div>

                <div class="grid gap-3">
                  <div>
                    <label class="block text-sm font-medium mb-2">Unix Sockets</label>
                    <textarea
                      :value="(settings.sandbox?.network?.allowUnixSockets || []).join('\n')"
                      @input="updateSandboxNetworkSetting('allowUnixSockets', parseUnixSockets(($event.target as HTMLTextAreaElement).value))"
                      placeholder="/var/run/docker.sock&#10;~/.ssh/agent-socket"
                      class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-2">HTTP Proxy Port</label>
                    <input
                      :value="settings.sandbox?.network?.httpProxyPort"
                      @input="updateSandboxNetworkSetting('httpProxyPort', parseInt(($event.target as HTMLInputElement).value))"
                      type="number"
                      placeholder="8080"
                      class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-2">SOCKS Proxy Port</label>
                    <input
                      :value="settings.sandbox?.network?.socksProxyPort"
                      @input="updateSandboxNetworkSetting('socksProxyPort', parseInt(($event.target as HTMLInputElement).value))"
                      type="number"
                      placeholder="8081"
                      class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Hooks Tab -->
      <div v-else-if="activeTab === 'hooks'" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold">Hooks Configuration</h3>
            <p class="text-sm text-muted-foreground">Configure custom commands to run before/after tool executions</p>
          </div>
        </div>

        <div class="space-y-4">
          <div class="p-4 rounded-lg bg-muted/30">
            <div class="flex items-center justify-between mb-3">
              <div>
                <p class="font-medium">Disable All Hooks</p>
                <p class="text-sm text-muted-foreground">Disable all hooks globally</p>
              </div>
              <button
                :class="[
                  'w-12 h-6 rounded-full transition-colors relative',
                  settings.disableAllHooks ? 'bg-primary' : 'bg-muted'
                ]"
                @click="settings.disableAllHooks = !settings.disableAllHooks"
              >
                <span
                  :class="[
                    'absolute top-1 w-4 h-4 rounded-full bg-background transition-all',
                    settings.disableAllHooks ? 'left-7' : 'left-1'
                  ]"
                />
              </button>
            </div>
          </div>

          <div class="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <h4 class="font-semibold mb-2">Available Hook Types</h4>
            <ul class="text-sm space-y-1 text-muted-foreground">
              <li><code class="bg-muted px-1 rounded">SessionStart</code> - Runs when a new session starts</li>
              <li><code class="bg-muted px-1 rounded">SessionEnd</code> - Runs when a session ends</li>
              <li><code class="bg-muted px-1 rounded">PreToolUse</code> - Runs before a tool is used</li>
              <li><code class="bg-muted px-1 rounded">PostToolUse</code> - Runs after a tool is used</li>
              <li><code class="bg-muted px-1 rounded">ResponseBefore</code> - Runs before sending a response</li>
              <li><code class="bg-muted px-1 rounded">ResponseAfter</code> - Runs after sending a response</li>
            </ul>
          </div>

          <div class="p-4 rounded-lg bg-muted/30">
            <p class="font-medium mb-3">Configure Hooks</p>
            <p class="text-sm text-muted-foreground">
              Configure hooks in your <code class="bg-muted px-1 rounded">settings.json</code> file:
            </p>
            <pre class="mt-3 p-4 rounded-lg bg-background border border-border font-mono text-xs overflow-x-auto">{
  "hooks": {
    "SessionStart": [{
      "matcher": "startup",
      "hooks": [{
        "type": "command",
        "command": "echo 'Starting session'"
      }]
    }],
    "PreToolUse": {
      "Bash": "echo 'About to run bash command'"
    }
  }
}</pre>
          </div>
        </div>
      </div>

      <!-- Model & AI Tab -->
      <div v-else-if="activeTab === 'model'" class="space-y-6">
        <h3 class="text-lg font-semibold">Model & AI Configuration</h3>

        <div class="space-y-4">
          <div class="p-4 rounded-lg bg-muted/30">
            <label class="block text-sm font-medium mb-2">Default Model</label>
            <input
              v-model="settings.model"
              type="text"
              placeholder="claude-sonnet-4-5-20250929"
              class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            />
            <p class="text-xs text-muted-foreground mt-1">
              Default model alias or full model name to use for sessions
            </p>
          </div>

          <div class="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div>
              <p class="font-medium">Always Enable Extended Thinking</p>
              <p class="text-sm text-muted-foreground">Enable extended thinking for all sessions by default</p>
            </div>
            <button
              :class="[
                'w-12 h-6 rounded-full transition-colors relative',
                settings.alwaysThinkingEnabled ? 'bg-primary' : 'bg-muted'
              ]"
              @click="settings.alwaysThinkingEnabled = !settings.alwaysThinkingEnabled"
            >
              <span
                :class="[
                  'absolute top-1 w-4 h-4 rounded-full bg-background transition-all',
                  settings.alwaysThinkingEnabled ? 'left-7' : 'left-1'
                ]"
              />
            </button>
          </div>

          <div class="p-4 rounded-lg bg-muted/30">
            <label class="block text-sm font-medium mb-2">Output Style</label>
            <input
              v-model="settings.outputStyle"
              type="text"
              placeholder="Explanatory"
              class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            />
            <p class="text-xs text-muted-foreground mt-1">
              Output style to adjust the system prompt (e.g., "Explanatory", "Concise")
            </p>
          </div>
        </div>
      </div>

      <!-- Environment Tab -->
      <div v-else-if="activeTab === 'env'" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold">Environment Variables</h3>
            <p class="text-sm text-muted-foreground">Manage environment variables for Claude Code sessions</p>
          </div>
        </div>

        <div class="p-4 rounded-lg bg-muted/30">
          <div class="flex items-center justify-between mb-3">
            <p class="font-medium">Environment Variables</p>
            <button
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              @click="settings.env = { ...(settings.env || {}), '': '' }"
            >
              <Plus class="w-4 h-4" />
              Add Variable
            </button>
          </div>

          <div v-if="!settings.env || Object.keys(settings.env).length === 0" class="text-center py-8 text-muted-foreground">
            <Cpu class="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p class="text-sm">No environment variables configured</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="(value, key) in settings.env"
              :key="key"
              class="flex items-center gap-3 p-3 rounded-lg bg-background border border-border"
            >
              <input
                :value="key"
                @input="(e) => { const newEnv = { ...settings.env }; delete newEnv[key]; newEnv[(e.target as HTMLInputElement).value] = value; settings.env = newEnv; }"
                type="text"
                placeholder="VARIABLE_NAME"
                class="flex-1 px-2 py-1 rounded bg-muted border-0 focus:outline-none font-mono text-sm"
              />
              <span class="text-muted-foreground">=</span>
              <input
                :value="value"
                @input="(e) => { settings.env = { ...settings.env, [key]: (e.target as HTMLInputElement).value }; }"
                type="text"
                placeholder="value"
                class="flex-1 px-2 py-1 rounded bg-muted border-0 focus:outline-none font-mono text-sm"
              />
              <button
                class="p-2 rounded-lg hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
                @click="settings.env = { ...settings.env }; delete settings.env[key]"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div class="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <h4 class="font-semibold mb-2">Common Environment Variables</h4>
          <ul class="text-sm space-y-1 text-muted-foreground">
            <li><code class="bg-muted px-1 rounded">CLAUDE_CODE_ENABLE_TELEMETRY</code> - Enable telemetry</li>
            <li><code class="bg-muted px-1 rounded">OTEL_METRICS_EXPORTER</code> - OpenTelemetry exporter</li>
            <li><code class="bg-muted px-1 rounded">ANTHROPIC_MODEL</code> - Default model</li>
            <li><code class="bg-muted px-1 rounded">CLAUDE_CONFIG_DIR</code> - Custom config directory</li>
          </ul>
        </div>
      </div>

      <!-- MCP Servers Tab -->
      <div v-else-if="activeTab === 'mcp'" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold">MCP Servers</h3>
            <p class="text-sm text-muted-foreground">Configure Model Context Protocol servers</p>
          </div>
          <button
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            @click="showMcpForm = true; loadMcpServers()"
          >
            <Plus class="w-4 h-4" />
            Add Server
          </button>
        </div>

        <div class="grid gap-4">
          <div class="p-4 rounded-lg bg-muted/30">
            <div class="flex items-center justify-between mb-3">
              <p class="font-medium">Enable All Project MCP Servers</p>
              <button
                :class="[
                  'w-12 h-6 rounded-full transition-colors relative',
                  settings.enableAllProjectMcpServers ? 'bg-primary' : 'bg-muted'
                ]"
                @click="settings.enableAllProjectMcpServers = !settings.enableAllProjectMcpServers"
              >
                <span
                  :class="[
                    'absolute top-1 w-4 h-4 rounded-full bg-background transition-all',
                    settings.enableAllProjectMcpServers ? 'left-7' : 'left-1'
                  ]"
                />
              </button>
            </div>
          </div>

          <div v-if="Object.keys(mcpServers).length === 0" class="text-center py-12 text-muted-foreground">
            <Server class="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No MCP servers configured</p>
            <p class="text-sm">Click "Add Server" to get started</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="(server, name) in mcpServers"
              :key="name"
              class="p-4 rounded-lg bg-muted/30"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-3">
                    <div
                      :class="[
                        'w-2 h-2 rounded-full',
                        server.disabled ? 'bg-gray-500' : 'bg-emerald-500'
                      ]"
                    />
                    <span class="font-medium">{{ name }}</span>
                    <span
                      v-if="server.disabled"
                      class="px-2 py-0.5 rounded text-xs bg-gray-500/20 text-gray-400"
                    >
                      Disabled
                    </span>
                  </div>
                  <code class="block mt-2 text-sm">{{ server.command }} {{ (server.args || []).join(' ') }}</code>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    :class="[
                      'p-2 rounded-lg transition-colors',
                      testingMcpServer[name]?.status === 'testing'
                        ? 'animate-spin text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    ]"
                    @click="testMcpServer(name)"
                    :disabled="testingMcpServer[name]?.status === 'testing'"
                    :title="testingMcpServer[name]?.status === 'testing' ? 'Testing...' : 'Test connection'"
                  >
                    <Play class="w-4 h-4" />
                  </button>
                  <button
                    class="p-2 rounded-lg hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
                    @click="editMcpServer(name)"
                  >
                    <Edit class="w-4 h-4" />
                  </button>
                  <button
                    class="p-2 rounded-lg hover:bg-background transition-colors text-muted-foreground hover:text-red-500"
                    @click="deleteMcpServer(name)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div
                v-if="testingMcpServer[name]?.result"
                class="mt-3 p-3 rounded-lg text-sm"
                :class="[
                  testingMcpServer[name].result?.status === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                    : 'bg-red-500/10 border border-red-500/20'
                ]"
              >
                <div class="flex items-center gap-2">
                  <component
                    :is="testingMcpServer[name].result?.status === 'success' ? CheckCircle : XCircle"
                    :class="[
                      'w-4 h-4',
                      testingMcpServer[name].result?.status === 'success' ? 'text-emerald-500' : 'text-red-500'
                    ]"
                  />
                  <span>
                    {{ testingMcpServer[name].result?.status === 'success' ? 'Connected' : 'Connection failed' }}
                  </span>
                  <span class="text-muted-foreground ml-2">
                    {{ testingMcpServer[name].result?.latency }}ms
                  </span>
                </div>
                <div v-if="testingMcpServer[name].result?.error" class="mt-2 text-xs text-muted-foreground">
                  {{ testingMcpServer[name].result.error }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="showMcpForm"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          @click.self="closeMcpForm"
        >
          <div class="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div class="flex items-center justify-between mb-6">
              <h4 class="text-lg font-semibold">{{ editingMcpServer ? 'Edit' : 'Add' }} MCP Server</h4>
              <button
                class="p-2 rounded-lg hover:bg-muted transition-colors"
                @click="closeMcpForm"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-2">Server Name</label>
                <input
                  v-model="mcpForm.name"
                  type="text"
                  placeholder="my-mcp-server"
                  class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  :disabled="editingMcpServer !== null"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Command</label>
                <input
                  v-model="mcpForm.command"
                  type="text"
                  placeholder="npx"
                  class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Arguments</label>
                <textarea
                  v-model="mcpForm.args"
                  placeholder="-y&#10;@anthropic-ai/mcp-server-filesystem&#10;/path/to/directory"
                  class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  rows="4"
                  @input="mcpForm.args = ($event.target as HTMLTextAreaElement).value.split('\n').filter(s => s.trim())"
                />
                <p class="text-xs text-muted-foreground mt-1">One argument per line</p>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Environment Variables</label>
                <textarea
                  :value="Object.entries(mcpForm.env).map(([k, v]) => `${k}=${v}`).join('\n')"
                  placeholder="API_KEY=your-key&#10;DEBUG=true"
                  class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  rows="4"
                  @input="mcpForm.env = ($event.target as HTMLTextAreaElement).value.split('\n').filter(s => s.trim()).reduce((acc, line) => {
                    const [key, ...valueParts] = line.split('=')
                    if (key) acc[key.trim()] = valueParts.join('=').trim()
                    return acc
                  }, {} as Record<string, string>)"
                />
                <p class="text-xs text-muted-foreground mt-1">Format: KEY=value (one per line)</p>
              </div>

              <div class="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div>
                  <p class="font-medium">Disabled</p>
                  <p class="text-sm text-muted-foreground">Disable this MCP server</p>
                </div>
                <button
                  :class="[
                    'w-12 h-6 rounded-full transition-colors relative',
                    mcpForm.disabled ? 'bg-primary' : 'bg-muted'
                  ]"
                  @click="mcpForm.disabled = !mcpForm.disabled"
                >
                  <span
                    :class="[
                      'absolute top-1 w-4 h-4 rounded-full bg-background transition-all',
                      mcpForm.disabled ? 'left-7' : 'left-1'
                    ]"
                  />
                </button>
              </div>

              <div class="flex justify-end gap-3">
                <button
                  class="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  @click="closeMcpForm"
                >
                  Cancel
                </button>
                <button
                  class="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  @click="saveMcpServer"
                >
                  {{ editingMcpServer ? 'Update' : 'Add' }} Server
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Subagents Tab -->
      <div v-else-if="activeTab === 'subagents'" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold">Subagents</h3>
            <p class="text-sm text-muted-foreground">Manage custom AI subagents for specialized tasks</p>
          </div>
          <button
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            @click="showSubagentForm = true; loadSubagents()"
          >
            <Plus class="w-4 h-4" />
            Create Subagent
          </button>
        </div>

        <div class="flex items-center gap-2 mb-4">
          <button
            :class="[
              'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              selectedSubagentScope === 'user' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            ]"
            @click="selectedSubagentScope = 'user'; loadSubagents()"
          >
            User Subagents
          </button>
          <button
            :class="[
              'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              selectedSubagentScope === 'project' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            ]"
            @click="selectedSubagentScope = 'project'; loadSubagents()"
          >
            Project Subagents
          </button>
        </div>

        <div v-if="subagents.length === 0" class="text-center py-12 text-muted-foreground">
          <User class="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No subagents found</p>
          <p class="text-sm">Click "Create Subagent" to get started</p>
        </div>

        <div v-else class="grid gap-3">
          <div
            v-for="subagent in subagents"
            :key="`${subagent.scope}-${subagent.name}`"
            class="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="font-medium">{{ subagent.name }}</span>
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-xs',
                      subagent.scope === 'user' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                    ]"
                  >
                    {{ subagent.scope }}
                  </span>
                </div>
                <p class="text-sm text-muted-foreground mb-2">
                  {{ subagent.content.split('---')[2]?.split('\n')[0]?.trim() || 'No description' }}
                </p>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded bg-muted text-xs">
                    {{ subagent.scope }}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-1">
                <button
                  class="p-2 rounded-lg hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
                  @click="editSubagent(subagent.name, subagent.scope)"
                  title="Edit"
                >
                  <Edit class="w-4 h-4" />
                </button>
                <button
                  class="p-2 rounded-lg hover:bg-background transition-colors text-muted-foreground hover:text-red-500"
                  @click="deleteSubagent(subagent.name, subagent.scope)"
                  title="Delete"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="showSubagentForm"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          @click.self="closeSubagentForm"
        >
          <div class="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div class="flex items-center justify-between mb-6">
              <h4 class="text-lg font-semibold">{{ editingSubagent ? 'Edit' : 'Create' }} Subagent</h4>
              <button
                class="p-2 rounded-lg hover:bg-muted transition-colors"
                @click="closeSubagentForm"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-2">Scope</label>
                <div class="flex gap-2">
                  <button
                    :class="[
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                      subagentForm.scope === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                    ]"
                    @click="subagentForm.scope = 'user'"
                    :disabled="editingSubagent !== null"
                  >
                    User
                  </button>
                  <button
                    :class="[
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                      subagentForm.scope === 'project' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                    ]"
                    @click="subagentForm.scope = 'project'"
                    :disabled="editingSubagent !== null"
                  >
                    Project
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Name</label>
                <input
                  v-model="subagentForm.name"
                  type="text"
                  placeholder="code-reviewer"
                  class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  :disabled="editingSubagent !== null"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Description</label>
                <input
                  v-model="subagentForm.description"
                  type="text"
                  placeholder="Expert code reviewer"
                  class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Prompt</label>
                <textarea
                  v-model="subagentForm.prompt"
                  placeholder="You are a senior code reviewer. Focus on code quality, security, and best practices."
                  class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  rows="6"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Model (optional)</label>
                <input
                  v-model="subagentForm.model"
                  type="text"
                  placeholder="sonnet"
                  class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Tools (optional)</label>
                <div class="flex flex-wrap gap-2 mb-2">
                  <span
                    v-for="tool in tools"
                    :key="tool"
                    class="px-2 py-1 rounded bg-primary/20 text-primary text-xs flex items-center gap-1"
                  >
                    {{ tool }}
                    <button
                      class="hover:text-red-500"
                      @click="subagentForm.tools = tools.filter((t: string) => t !== tool)"
                    >
                      <X class="w-3 h-3" />
                    </button>
                  </span>
                </div>
                <div class="flex gap-2">
                  <input
                    v-model="newToolInput"
                    type="text"
                    placeholder="Add tool..."
                    class="flex-1 px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                    @keyup.enter="if (newToolInput) { subagentForm.tools = tools.concat(newToolInput); newToolInput = '' }"
                  />
                  <button
                    class="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    @click="if (newToolInput) { subagentForm.tools = tools.concat(newToolInput); newToolInput = '' }"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div class="flex justify-end gap-3">
                <button
                  class="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  @click="closeSubagentForm"
                >
                  Cancel
                </button>
                <button
                  class="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  @click="saveSubagent"
                >
                  {{ editingSubagent ? 'Update' : 'Create' }} Subagent
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Plugins Tab -->
      <div v-else-if="activeTab === 'plugins'" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold">Plugins</h3>
            <p class="text-sm text-muted-foreground">Manage plugins and marketplaces</p>
          </div>
        </div>

        <div class="grid gap-4">
          <div class="p-4 rounded-lg bg-muted/30">
            <p class="font-medium mb-3">Enabled Plugins</p>
            <div v-if="!settings.enabledPlugins || Object.keys(settings.enabledPlugins).length === 0" class="text-center py-4 text-muted-foreground">
              <p class="text-sm">No plugins enabled</p>
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="(enabled, name) in settings.enabledPlugins"
                :key="name"
                class="flex items-center justify-between p-3 rounded-lg bg-background"
              >
                <span class="text-sm">{{ name }}</span>
                <button
                  :class="[
                    'px-2 py-1 rounded text-xs font-medium',
                    enabled ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
                  ]"
                  @click="settings.enabledPlugins = { ...settings.enabledPlugins, [name]: !enabled }"
                >
                  {{ enabled ? 'Enabled' : 'Disabled' }}
                </button>
              </div>
            </div>
          </div>

          <div class="p-4 rounded-lg bg-muted/30">
            <p class="font-medium mb-3">Marketplaces</p>
            <p class="text-sm text-muted-foreground mb-2">
              Additional plugin sources in <code class="bg-muted px-1 rounded">settings.json</code>:
            </p>
            <pre class="p-4 rounded-lg bg-background border border-border font-mono text-xs overflow-x-auto">{
  "extraKnownMarketplaces": {
    "acme-tools": {
      "source": "github",
      "repo": "acme-corp/claude-plugins"
    }
  }
}</pre>
          </div>
        </div>
      </div>

      <!-- Advanced Tab -->
      <div v-else-if="activeTab === 'advanced'" class="space-y-6">
        <h3 class="text-lg font-semibold">Advanced Configuration</h3>

        <div class="space-y-4">
          <div class="p-4 rounded-lg bg-muted/30">
            <label class="block text-sm font-medium mb-2">Cleanup Period (Days)</label>
            <input
              v-model.number="settings.cleanupPeriodDays"
              type="number"
              :min="0"
              placeholder="30"
              class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            />
            <p class="text-xs text-muted-foreground mt-1">
              Sessions inactive longer than this will be deleted at startup (0 = delete all)
            </p>
          </div>

          <div class="p-4 rounded-lg bg-muted/30">
            <label class="block text-sm font-medium mb-2">API Key Helper</label>
            <input
              v-model="settings.apiKeyHelper"
              type="text"
              placeholder="/bin/generate_temp_api_key.sh"
              class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            />
            <p class="text-xs text-muted-foreground mt-1">
              Custom script to generate auth value for API requests
            </p>
          </div>

          <div class="p-4 rounded-lg bg-muted/30">
            <label class="block text-sm font-medium mb-2">Otel Headers Helper</label>
            <input
              v-model="settings.otelHeadersHelper"
              type="text"
              placeholder="/bin/generate_otel_headers.sh"
              class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            />
            <p class="text-xs text-muted-foreground mt-1">
              Script to generate dynamic OpenTelemetry headers
            </p>
          </div>

          <div class="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <h4 class="font-semibold mb-2">Attribution Settings</h4>
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium mb-2">Commit Attribution</label>
                <textarea
                  :value="settings.attribution?.commit"
                  @input="updateAttributionSetting('commit', ($event.target as HTMLTextAreaElement).value)"
                  placeholder="🤖 Generated with Claude Code"
                  class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  rows="2"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">Pull Request Attribution</label>
                <textarea
                  :value="settings.attribution?.pr"
                  @input="updateAttributionSetting('pr', ($event.target as HTMLTextAreaElement).value)"
                  placeholder="🤖 Generated with Claude Code"
                  class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  rows="2"
                />
              </div>
            </div>
          </div>

          <div class="p-4 rounded-lg bg-muted/30">
            <label class="block text-sm font-medium mb-2">Company Announcements</label>
            <textarea
              v-model="settings.companyAnnouncements"
              placeholder="Welcome to Acme Corp!"
              class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              rows="4"
            />
            <p class="text-xs text-muted-foreground mt-1">
              Announcements to display at startup (one per line)
            </p>
          </div>
        </div>
      </div>

      <!-- Skills Tab -->
      <div v-else-if="activeTab === 'skills'" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold">Skills</h3>
            <p class="text-sm text-muted-foreground">Manage custom Claude skills for specialized tasks</p>
          </div>
          <button
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            @click="showSkillForm = true; loadSkills()"
          >
            <Plus class="w-4 h-4" />
            Create Skill
          </button>
        </div>

        <div class="flex items-center gap-2 mb-4">
          <button
            :class="[
              'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              selectedSkillScope === 'user' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            ]"
            @click="selectedSkillScope = 'user'; loadSkills()"
          >
            User Skills
          </button>
          <button
            :class="[
              'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              selectedSkillScope === 'project' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            ]"
            @click="selectedSkillScope = 'project'; loadSkills()"
          >
            Project Skills
          </button>
        </div>

        <div v-if="skills.length === 0" class="text-center py-12 text-muted-foreground">
          <FileCode class="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No skills found</p>
          <p class="text-sm">Click "Create Skill" to get started</p>
        </div>

        <div v-else class="grid gap-3">
          <div
            v-for="skill in skills"
            :key="skill.name"
            class="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <span class="font-medium">{{ skill.name }}</span>
                  <span
                    v-if="skill.enabled !== false"
                    class="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400"
                  >
                    Enabled
                  </span>
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-xs',
                      skill.scope === 'user' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                    ]"
                  >
                    User
                  </span>
                </div>
                <p class="text-sm text-muted-foreground">{{ skill.description }}</p>
                <p v-if="skill.filePath" class="text-xs text-muted-foreground mt-2 font-mono">{{ skill.filePath }}</p>
              </div>
              <div class="flex items-center gap-1">
                <button
                  class="p-2 rounded-lg hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
                  @click="editSkill(skill.name, skill.scope === 'user' ? 'user' : 'project')"
                  title="Edit"
                >
                  <Edit class="w-4 h-4" />
                </button>
                <button
                  class="p-2 rounded-lg hover:bg-background transition-colors text-muted-foreground hover:text-red-500"
                  @click="deleteSkill(skill.name, skill.scope === 'user' ? 'user' : 'project')"
                  title="Delete"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="showSkillForm"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          @click.self="closeSkillForm"
        >
          <div class="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div class="flex items-center justify-between mb-6">
              <h4 class="text-lg font-semibold">{{ editingSkill ? 'Edit' : 'Create' }} Skill</h4>
              <button
                class="p-2 rounded-lg hover:bg-muted transition-colors"
                @click="closeSkillForm"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-2">Scope</label>
                <div class="flex gap-2">
                  <button
                    :class="[
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                      skillForm.scope === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                    ]"
                    @click="skillForm.scope = 'user'"
                    :disabled="editingSkill !== null"
                  >
                    User
                  </button>
                  <button
                    :class="[
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                      skillForm.scope === 'project' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                    ]"
                    @click="skillForm.scope = 'project'"
                    :disabled="editingSkill !== null"
                  >
                    Project
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Name</label>
                <input
                  v-model="skillForm.name"
                  type="text"
                  placeholder="my-skill"
                  class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  :disabled="editingSkill !== null"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Description</label>
                <input
                  v-model="skillForm.description"
                  type="text"
                  placeholder="Description of what this skill does"
                  class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Prompt</label>
                <textarea
                  v-model="skillForm.prompt"
                  placeholder="Instructions for how to use this skill..."
                  class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  rows="4"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2">Instructions</label>
                <textarea
                  v-model="skillForm.instructions"
                  placeholder="Step-by-step instructions..."
                  class="w-full px-3 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  rows="4"
                />
              </div>

              <div class="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div>
                  <p class="font-medium">Enabled</p>
                  <p class="text-sm text-muted-foreground">Enable this skill by default</p>
                </div>
                <button
                  :class="[
                    'w-12 h-6 rounded-full transition-colors relative',
                    skillForm.enabled ? 'bg-primary' : 'bg-muted'
                  ]"
                  @click="skillForm.enabled = !skillForm.enabled"
                >
                  <span
                    :class="[
                      'absolute top-1 w-4 h-4 rounded-full bg-background transition-all',
                      skillForm.enabled ? 'left-7' : 'left-1'
                    ]"
                  />
                </button>
              </div>

              <div class="flex justify-end gap-3">
                <button
                  class="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  @click="closeSkillForm"
                >
                  Cancel
                </button>
                <button
                  class="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  @click="saveSkill"
                >
                  {{ editingSkill ? 'Update' : 'Create' }} Skill
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Other tabs placeholder -->
      <div v-else class="text-center py-12 text-muted-foreground">
        <MoreVertical class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>{{ tabs.find(t => t.id === activeTab)?.label }} configuration</p>
        <p class="text-sm mt-2">This section is coming soon</p>
      </div>
    </div>

    <div
      v-if="showImportDialog"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="cancelImport"
    >
      <div class="bg-background rounded-lg shadow-xl w-full max-w-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-lg font-semibold">Import Settings</h4>
          <button
            class="p-2 rounded-lg hover:bg-muted transition-colors"
            @click="cancelImport"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="mb-4">
          <p class="text-sm text-muted-foreground mb-2">
            Import settings to <strong>{{ selectedScope }}</strong> scope
          </p>
          <div class="p-3 rounded-lg bg-muted/30 max-h-64 overflow-y-auto">
            <pre class="text-xs font-mono">{{ JSON.stringify(importedSettings, null, 2) }}</pre>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button
            class="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            @click="cancelImport"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            @click="confirmImport"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  </div>
</template>