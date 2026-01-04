<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useStatusStore } from '@/stores/status'
import {
  Settings,
  Layers,
  Server,
  Zap,
  Clock,
  Wrench,
  TrendingUp,
  ArrowRight
} from 'lucide-vue-next'

const statusStore = useStatusStore()

onMounted(() => {
  statusStore.fetchStatus()
})

const stats = ref([
  { label: 'MCP Servers', value: '0', icon: Server, color: 'text-blue-400' },
  { label: 'Active Hooks', value: '0', icon: Zap, color: 'text-amber-400' },
  { label: 'Context Used', value: '0%', icon: Layers, color: 'text-emerald-400' },
  { label: 'Tool Calls', value: '0', icon: Wrench, color: 'text-purple-400' },
])

const quickActions = [
  { label: 'Configure Settings', icon: Settings, path: '/config', description: 'Manage Claude settings and preferences' },
  { label: 'View Context', icon: Layers, path: '/context', description: 'Inspect current context usage' },
  { label: 'Timeline', icon: Clock, path: '/timeline', description: 'View conversation timeline' },
  { label: 'Tools', icon: Wrench, path: '/tools', description: 'Monitor tool calls and MCP' },
]
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex items-start justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Welcome to DevTools</h2>
        <p class="text-muted-foreground mt-1">Monitor and manage your Claude Code session</p>
      </div>
      <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
        <TrendingUp class="w-4 h-4" />
        <span>Active Session</span>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="glass-card p-4 group hover:border-primary/30 transition-colors"
      >
        <div class="flex items-center justify-between">
          <div :class="['p-2 rounded-lg bg-muted/50', stat.color]">
            <component :is="stat.icon" class="w-4 h-4" />
          </div>
          <span class="text-2xl font-bold tabular-nums">{{ stat.value }}</span>
        </div>
        <p class="text-sm text-muted-foreground mt-3">{{ stat.label }}</p>
      </div>
    </div>

    <!-- Quick Actions -->
    <div>
      <h3 class="text-lg font-semibold mb-4">Quick Actions</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <RouterLink
          v-for="action in quickActions"
          :key="action.path"
          :to="action.path"
          class="glass-card p-4 flex items-center gap-4 group hover:border-primary/30 transition-all"
        >
          <div class="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            <component :is="action.icon" class="w-5 h-5" />
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-medium">{{ action.label }}</h4>
            <p class="text-sm text-muted-foreground truncate">{{ action.description }}</p>
          </div>
          <ArrowRight class="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </RouterLink>
      </div>
    </div>

    <!-- System Info -->
    <div class="glass-card p-5">
      <h3 class="text-lg font-semibold mb-4">System Information</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span class="text-muted-foreground">Model</span>
          <p class="font-mono font-medium mt-1">{{ statusStore.model || 'Loading...' }}</p>
        </div>
        <div>
          <span class="text-muted-foreground">Status</span>
          <p class="font-medium mt-1 flex items-center gap-2">
            <span :class="['w-2 h-2 rounded-full', statusStore.isConnected ? 'bg-emerald-500' : 'bg-red-500']" />
            {{ statusStore.isConnected ? 'Connected' : 'Disconnected' }}
          </p>
        </div>
        <div>
          <span class="text-muted-foreground">DevTools Version</span>
          <p class="font-mono font-medium mt-1">v0.1.0</p>
        </div>
        <div>
          <span class="text-muted-foreground">Platform</span>
          <p class="font-medium mt-1">macOS</p>
        </div>
      </div>
    </div>
  </div>
</template>
