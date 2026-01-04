<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useStatusStore } from '@/stores/status'
import {
  Layers,
  Brain,
  MessageSquare,
  Database,
  AlertTriangle,
  Info
} from 'lucide-vue-next'

const statusStore = useStatusStore()

onMounted(() => {
  statusStore.fetchStatus()
})

const contextData = computed(() => {
  const ctx = statusStore.contextUsage
  if (!ctx) {
    return {
      used: 0,
      total: 200000,
      percentage: 0,
      breakdown: { system: 0, memory: 0, conversation: 0 }
    }
  }
  return ctx
})

const usageLevel = computed(() => {
  const pct = contextData.value.percentage
  if (pct < 50) return { label: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-400' }
  if (pct < 80) return { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-400' }
  return { label: 'High', color: 'text-red-400', bg: 'bg-red-400' }
})

const breakdownItems = computed(() => [
  {
    label: 'System Prompt',
    value: contextData.value.breakdown.system,
    icon: Brain,
    color: 'text-blue-400',
    bg: 'bg-blue-400'
  },
  {
    label: 'Memory',
    value: contextData.value.breakdown.memory,
    icon: Database,
    color: 'text-purple-400',
    bg: 'bg-purple-400'
  },
  {
    label: 'Conversation',
    value: contextData.value.breakdown.conversation,
    icon: MessageSquare,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400'
  },
])

const formatTokens = (n: number) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-2xl font-bold tracking-tight">Context Inspector</h2>
      <p class="text-muted-foreground mt-1">Monitor token usage and context window utilization</p>
    </div>

    <!-- Main Usage Card -->
    <div class="glass-card p-6">
      <div class="flex items-start justify-between mb-6">
        <div>
          <h3 class="text-lg font-semibold">Context Window Usage</h3>
          <p class="text-sm text-muted-foreground mt-1">
            {{ formatTokens(contextData.used) }} / {{ formatTokens(contextData.total) }} tokens
          </p>
        </div>
        <div :class="['flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium', usageLevel.color]"
             :style="{ backgroundColor: `color-mix(in srgb, currentColor 15%, transparent)` }">
          <span :class="['w-2 h-2 rounded-full', usageLevel.bg]" />
          {{ usageLevel.label }} Usage
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="relative h-4 rounded-full bg-muted overflow-hidden mb-6">
        <div
          :class="['h-full rounded-full transition-all duration-500', usageLevel.bg]"
          :style="{ width: `${contextData.percentage}%` }"
        />
        <!-- Markers -->
        <div class="absolute top-0 left-1/2 w-px h-full bg-border/50" />
        <div class="absolute top-0 left-[80%] w-px h-full bg-border/50" />
      </div>

      <!-- Percentage Labels -->
      <div class="flex justify-between text-xs text-muted-foreground mb-8">
        <span>0%</span>
        <span>50%</span>
        <span>80%</span>
        <span>100%</span>
      </div>

      <!-- Breakdown -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="item in breakdownItems"
          :key="item.label"
          class="p-4 rounded-lg bg-muted/30"
        >
          <div class="flex items-center gap-2 mb-3">
            <component :is="item.icon" :class="['w-4 h-4', item.color]" />
            <span class="text-sm font-medium">{{ item.label }}</span>
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold tabular-nums">{{ formatTokens(item.value) }}</span>
            <span class="text-sm text-muted-foreground">tokens</span>
          </div>
          <div class="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              :class="['h-full rounded-full', item.bg]"
              :style="{ width: `${(item.value / contextData.total) * 100}%` }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Info Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="glass-card p-5">
        <div class="flex items-start gap-3">
          <div class="p-2 rounded-lg bg-blue-500/10">
            <Info class="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h4 class="font-semibold">About Context Window</h4>
            <p class="text-sm text-muted-foreground mt-1">
              The context window determines how much information Claude can consider at once.
              Keeping usage below 80% helps maintain response quality.
            </p>
          </div>
        </div>
      </div>

      <div class="glass-card p-5">
        <div class="flex items-start gap-3">
          <div class="p-2 rounded-lg bg-amber-500/10">
            <AlertTriangle class="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h4 class="font-semibold">Context Optimization Tips</h4>
            <p class="text-sm text-muted-foreground mt-1">
              Use /compact to summarize conversation history. Clear irrelevant context
              with /clear to free up tokens for new interactions.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
