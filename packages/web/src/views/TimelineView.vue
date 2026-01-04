<script setup lang="ts">
import { ref } from 'vue'
import {
  Clock,
  User,
  Bot,
  Wrench,
  AlertCircle,
  ChevronDown,
  Search
} from 'lucide-vue-next'

const filterType = ref('all')
const searchQuery = ref('')
const expandedId = ref<string | null>(null)

const filters = [
  { id: 'all', label: 'All' },
  { id: 'user', label: 'User' },
  { id: 'assistant', label: 'Assistant' },
  { id: 'tool', label: 'Tools' },
  { id: 'system', label: 'System' },
]

// Placeholder timeline data
const timelineEvents = ref([
  {
    id: '1',
    type: 'user',
    timestamp: Date.now() - 300000,
    content: 'Create a new Vue component for the dashboard',
    tokens: 15
  },
  {
    id: '2',
    type: 'tool',
    timestamp: Date.now() - 290000,
    toolName: 'Read',
    toolInput: { file: '/src/components/Dashboard.vue' },
    duration: 45
  },
  {
    id: '3',
    type: 'assistant',
    timestamp: Date.now() - 280000,
    content: 'I\'ll create a new Dashboard component with the following features...',
    tokens: 150
  },
  {
    id: '4',
    type: 'tool',
    timestamp: Date.now() - 270000,
    toolName: 'Write',
    toolInput: { file: '/src/components/Dashboard.vue' },
    duration: 120
  },
  {
    id: '5',
    type: 'system',
    timestamp: Date.now() - 260000,
    content: 'Context compacted: 5000 tokens freed',
    level: 'info'
  },
])

const getEventIcon = (type: string) => {
  switch (type) {
    case 'user': return User
    case 'assistant': return Bot
    case 'tool': return Wrench
    case 'system': return AlertCircle
    default: return Clock
  }
}

const getEventColor = (type: string) => {
  switch (type) {
    case 'user': return 'bg-blue-500/10 text-blue-400 border-blue-500/30'
    case 'assistant': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    case 'tool': return 'bg-purple-500/10 text-purple-400 border-purple-500/30'
    case 'system': return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    default: return 'bg-muted text-muted-foreground'
  }
}

const formatTime = (ts: number) => {
  const date = new Date(ts)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const formatRelative = (ts: number) => {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  return `${hours}h ago`
}

const toggleExpand = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Timeline</h2>
        <p class="text-muted-foreground mt-1">Track conversation events and tool calls</p>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="flex flex-col sm:flex-row gap-4">
      <!-- Filter Tabs -->
      <div class="flex gap-1 p-1 rounded-lg bg-muted/30">
        <button
          v-for="filter in filters"
          :key="filter.id"
          :class="[
            'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
            filterType === filter.id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          ]"
          @click="filterType = filter.id"
        >
          {{ filter.label }}
        </button>
      </div>

      <!-- Search -->
      <div class="relative flex-1 max-w-xs">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search events..."
          class="w-full pl-9 pr-4 py-2 rounded-lg bg-muted/30 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
    </div>

    <!-- Timeline -->
    <div class="relative">
      <!-- Timeline Line -->
      <div class="absolute left-5 top-0 bottom-0 w-px bg-border/50" />

      <!-- Events -->
      <div class="space-y-4">
        <div
          v-for="event in timelineEvents"
          :key="event.id"
          class="relative pl-12"
        >
          <!-- Event Icon -->
          <div
            :class="[
              'absolute left-0 w-10 h-10 rounded-full border-2 flex items-center justify-center',
              getEventColor(event.type)
            ]"
          >
            <component :is="getEventIcon(event.type)" class="w-4 h-4" />
          </div>

          <!-- Event Card -->
          <div class="glass-card p-4">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <span class="font-medium capitalize">{{ event.type }}</span>
                <span v-if="event.toolName" class="text-sm text-muted-foreground">
                  • {{ event.toolName }}
                </span>
              </div>
              <div class="flex items-center gap-3 text-xs text-muted-foreground">
                <span v-if="event.tokens" class="font-mono">{{ event.tokens }} tokens</span>
                <span v-if="event.duration" class="font-mono">{{ event.duration }}ms</span>
                <span :title="formatTime(event.timestamp)">{{ formatRelative(event.timestamp) }}</span>
              </div>
            </div>

            <p v-if="event.content" class="mt-2 text-sm text-muted-foreground line-clamp-2">
              {{ event.content }}
            </p>

            <!-- Tool Details (expandable) -->
            <div v-if="event.toolInput" class="mt-3">
              <button
                class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                @click="toggleExpand(event.id)"
              >
                <ChevronDown :class="['w-4 h-4 transition-transform', { 'rotate-180': expandedId === event.id }]" />
                {{ expandedId === event.id ? 'Hide' : 'Show' }} details
              </button>
              <div
                v-if="expandedId === event.id"
                class="mt-2 p-3 rounded bg-muted/30 font-mono text-xs overflow-x-auto"
              >
                <pre>{{ JSON.stringify(event.toolInput, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="timelineEvents.length === 0" class="text-center py-12">
      <Clock class="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
      <p class="text-muted-foreground">No events recorded yet</p>
      <p class="text-sm text-muted-foreground/70 mt-1">Events will appear here as you interact with Claude</p>
    </div>
  </div>
</template>
