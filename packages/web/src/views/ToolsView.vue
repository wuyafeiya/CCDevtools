<script setup lang="ts">
import { ref } from 'vue'
import {
  Wrench,
  Server,
  Check,
  X,
  Clock,
  TrendingUp,
  Search,
  ChevronRight,
  RefreshCw
} from 'lucide-vue-next'

const activeTab = ref('tools')

const tabs = [
  { id: 'tools', label: 'Tool Calls', icon: Wrench },
  { id: 'mcp', label: 'MCP Status', icon: Server },
]

// Placeholder tool call data
const toolCalls = ref([
  {
    id: '1',
    name: 'Read',
    input: { file: '/src/App.vue' },
    status: 'success',
    duration: 45,
    timestamp: Date.now() - 60000
  },
  {
    id: '2',
    name: 'Glob',
    input: { pattern: '**/*.vue' },
    status: 'success',
    duration: 120,
    timestamp: Date.now() - 55000
  },
  {
    id: '3',
    name: 'Write',
    input: { file: '/src/components/Header.vue' },
    status: 'success',
    duration: 85,
    timestamp: Date.now() - 50000
  },
  {
    id: '4',
    name: 'Bash',
    input: { command: 'npm run build' },
    status: 'error',
    duration: 2500,
    timestamp: Date.now() - 45000
  },
  {
    id: '5',
    name: 'Edit',
    input: { file: '/src/main.ts' },
    status: 'pending',
    timestamp: Date.now() - 1000
  },
])

// Placeholder MCP server data
const mcpServers = ref([
  { name: 'filesystem', status: 'connected', tools: 5, resources: 2 },
  { name: 'postgres', status: 'connected', tools: 8, resources: 3 },
  { name: 'memory', status: 'error', tools: 0, resources: 0, error: 'Connection timeout' },
])

const searchQuery = ref('')
const loading = ref(false)

const stats = [
  { label: 'Total Calls', value: '24', trend: '+5' },
  { label: 'Success Rate', value: '92%', trend: '+2%' },
  { label: 'Avg Duration', value: '85ms', trend: '-12ms' },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'success':
    case 'connected':
      return 'text-emerald-400 bg-emerald-400/10'
    case 'error':
    case 'disconnected':
      return 'text-red-400 bg-red-400/10'
    case 'pending':
      return 'text-amber-400 bg-amber-400/10'
    default:
      return 'text-muted-foreground bg-muted'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'success':
    case 'connected':
      return Check
    case 'error':
    case 'disconnected':
      return X
    case 'pending':
      return Clock
    default:
      return Clock
  }
}

const formatTime = (ts: number) => {
  const date = new Date(ts)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Tools & MCP</h2>
        <p class="text-muted-foreground mt-1">Monitor tool usage and MCP server status</p>
      </div>
      <button
        class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        :disabled="loading"
      >
        <RefreshCw :class="['w-4 h-4', { 'animate-spin': loading }]" />
        Refresh
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="glass-card p-4"
      >
        <p class="text-sm text-muted-foreground">{{ stat.label }}</p>
        <div class="flex items-baseline gap-2 mt-1">
          <span class="text-2xl font-bold tabular-nums">{{ stat.value }}</span>
          <span class="flex items-center gap-1 text-xs text-emerald-400">
            <TrendingUp class="w-3 h-3" />
            {{ stat.trend }}
          </span>
        </div>
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
      <!-- Tool Calls Tab -->
      <div v-if="activeTab === 'tools'" class="space-y-4">
        <!-- Search -->
        <div class="relative max-w-xs">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search tool calls..."
            class="w-full pl-9 pr-4 py-2 rounded-lg bg-muted/30 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <!-- Tool Calls List -->
        <div class="space-y-2">
          <div
            v-for="call in toolCalls"
            :key="call.id"
            class="flex items-center justify-between p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
          >
            <div class="flex items-center gap-4">
              <div :class="['p-2 rounded-lg', getStatusColor(call.status)]">
                <component :is="getStatusIcon(call.status)" class="w-4 h-4" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-medium font-mono">{{ call.name }}</span>
                  <span v-if="call.status === 'pending'" class="px-2 py-0.5 rounded text-xs bg-amber-400/20 text-amber-400">
                    Running
                  </span>
                </div>
                <p class="text-sm text-muted-foreground font-mono truncate max-w-md">
                  {{ JSON.stringify(call.input) }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-4 text-sm text-muted-foreground">
              <span v-if="call.duration" class="font-mono tabular-nums">{{ call.duration }}ms</span>
              <span class="font-mono tabular-nums">{{ formatTime(call.timestamp) }}</span>
              <ChevronRight class="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      <!-- MCP Status Tab -->
      <div v-else-if="activeTab === 'mcp'" class="space-y-4">
        <div v-if="mcpServers.length === 0" class="text-center py-12 text-muted-foreground">
          <Server class="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No MCP servers configured</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="server in mcpServers"
            :key="server.name"
            class="p-4 rounded-lg bg-muted/20"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div :class="['p-2 rounded-lg', getStatusColor(server.status)]">
                  <component :is="getStatusIcon(server.status)" class="w-4 h-4" />
                </div>
                <div>
                  <span class="font-medium">{{ server.name }}</span>
                  <p v-if="server.error" class="text-sm text-red-400">{{ server.error }}</p>
                </div>
              </div>
              <div class="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{{ server.tools }} tools</span>
                <span>{{ server.resources }} resources</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
