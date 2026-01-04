<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api'
import {
  Settings,
  Server,
  Zap,
  FileCode,
  Puzzle,
  ChevronRight,
  Save,
  RefreshCw
} from 'lucide-vue-next'

import type { ClaudeSettings, MCPServer, HooksConfig, Skill, Plugin } from '@claude-devtools/shared'

const activeTab = ref('settings')

const tabs = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'mcp', label: 'MCP Servers', icon: Server },
  { id: 'hooks', label: 'Hooks', icon: Zap },
  { id: 'skills', label: 'Skills', icon: FileCode },
  { id: 'plugins', label: 'Plugins', icon: Puzzle },
]

const settings = ref<ClaudeSettings>({})
const mcpServers = ref<Record<string, MCPServer>>({})
const hooks = ref<HooksConfig>({})
const skills = ref<Skill[]>([])
const plugins = ref<Plugin[]>([])
const loading = ref(false)

async function loadData() {
  loading.value = true
  try {
    const [settingsData, mcpData, hooksData, skillsData, pluginsData] = await Promise.all([
      api.getSettings(),
      api.getMcp(),
      api.getHooks(),
      api.getSkills(),
      api.getPlugins(),
    ])
    settings.value = settingsData?.global || {}
    mcpServers.value = mcpData?.mcpServers || {}
    hooks.value = hooksData || {}
    skills.value = skillsData || []
    plugins.value = pluginsData || []
  } catch (e) {
    console.error('Failed to load config:', e)
  } finally {
    loading.value = false
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
        <p class="text-muted-foreground mt-1">Manage Claude Code settings and integrations</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          @click="loadData"
        >
          <RefreshCw :class="['w-4 h-4', { 'animate-spin': loading }]" />
          Refresh
        </button>
        <button
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Save class="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 p-1 rounded-lg bg-muted/30">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="[
          'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
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
      <!-- Settings Tab -->
      <div v-if="activeTab === 'settings'" class="space-y-4">
        <h3 class="text-lg font-semibold">Global Settings</h3>
        <div class="grid gap-4">
          <div class="flex items-center justify-between py-3 border-b border-border/50">
            <div>
              <p class="font-medium">Model</p>
              <p class="text-sm text-muted-foreground">Default AI model for Claude Code</p>
            </div>
            <code class="px-3 py-1 rounded bg-muted font-mono text-sm">
              {{ settings.model || 'claude-sonnet-4-20250514' }}
            </code>
          </div>
          <div class="flex items-center justify-between py-3 border-b border-border/50">
            <div>
              <p class="font-medium">Theme</p>
              <p class="text-sm text-muted-foreground">Interface theme preference</p>
            </div>
            <code class="px-3 py-1 rounded bg-muted font-mono text-sm">
              {{ settings.theme || 'system' }}
            </code>
          </div>
          <div class="flex items-center justify-between py-3 border-b border-border/50">
            <div>
              <p class="font-medium">Verbose Mode</p>
              <p class="text-sm text-muted-foreground">Show detailed output</p>
            </div>
            <span :class="['px-2 py-1 rounded text-xs font-medium', settings.verbose ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted text-muted-foreground']">
              {{ settings.verbose ? 'Enabled' : 'Disabled' }}
            </span>
          </div>
        </div>
      </div>

      <!-- MCP Tab -->
      <div v-else-if="activeTab === 'mcp'" class="space-y-4">
        <h3 class="text-lg font-semibold">MCP Servers</h3>
        <div v-if="Object.keys(mcpServers).length === 0" class="text-center py-12 text-muted-foreground">
          <Server class="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No MCP servers configured</p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="(_server, name) in mcpServers"
            :key="name"
            class="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 rounded-full bg-emerald-500" />
              <span class="font-medium">{{ name }}</span>
            </div>
            <ChevronRight class="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      <!-- Hooks Tab -->
      <div v-else-if="activeTab === 'hooks'" class="space-y-4">
        <h3 class="text-lg font-semibold">Hooks Configuration</h3>
        <div v-if="Object.keys(hooks).length === 0" class="text-center py-12 text-muted-foreground">
          <Zap class="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hooks configured</p>
        </div>
        <div v-else class="space-y-4">
          <div v-for="(entries, hookType) in hooks" :key="hookType">
            <h4 class="text-sm font-medium text-muted-foreground mb-2">{{ hookType }}</h4>
            <div class="space-y-2">
              <div
                v-for="(entry, idx) in entries"
                :key="idx"
                class="p-3 rounded-lg bg-muted/30 font-mono text-sm"
              >
                {{ entry }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Skills Tab -->
      <div v-else-if="activeTab === 'skills'" class="space-y-4">
        <h3 class="text-lg font-semibold">Skills</h3>
        <div v-if="skills.length === 0" class="text-center py-12 text-muted-foreground">
          <FileCode class="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No skills found</p>
        </div>
        <div v-else class="grid gap-3">
          <div
            v-for="skill in skills"
            :key="skill.name"
            class="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div class="flex items-center gap-3">
              <FileCode class="w-5 h-5 text-primary" />
              <span class="font-medium">{{ skill.name }}</span>
            </div>
            <ChevronRight class="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      <!-- Plugins Tab -->
      <div v-else-if="activeTab === 'plugins'" class="space-y-4">
        <h3 class="text-lg font-semibold">Plugins</h3>
        <div v-if="plugins.length === 0" class="text-center py-12 text-muted-foreground">
          <Puzzle class="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No plugins installed</p>
        </div>
        <div v-else class="grid gap-3">
          <div
            v-for="plugin in plugins"
            :key="plugin.name"
            class="flex items-center justify-between p-4 rounded-lg bg-muted/30"
          >
            <div class="flex items-center gap-3">
              <Puzzle class="w-5 h-5 text-purple-400" />
              <span class="font-medium">{{ plugin.name }}</span>
            </div>
            <span class="text-xs text-muted-foreground">Installed</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
