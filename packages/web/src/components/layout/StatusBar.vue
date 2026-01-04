<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useStatusStore } from '@/stores/status'
import {
  Cpu,
  Zap,
  Clock,
  Server,
  GitBranch
} from 'lucide-vue-next'

const statusStore = useStatusStore()

const contextPercent = computed(() => {
  if (!statusStore.contextUsage) return 0
  return statusStore.contextUsage.percentage
})

const contextColor = computed(() => {
  const pct = contextPercent.value
  if (pct < 50) return 'bg-emerald-500'
  if (pct < 80) return 'bg-amber-500'
  return 'bg-red-500'
})

// Simulated session time
const sessionTime = ref('00:00:00')
let startTime = Date.now()

onMounted(() => {
  statusStore.fetchStatus()

  setInterval(() => {
    const elapsed = Date.now() - startTime
    const hours = Math.floor(elapsed / 3600000)
    const mins = Math.floor((elapsed % 3600000) / 60000)
    const secs = Math.floor((elapsed % 60000) / 1000)
    sessionTime.value = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, 1000)
})
</script>

<template>
  <footer class="h-7 flex items-center justify-between px-4 text-[11px] border-t border-border/50 bg-card/30 font-mono">
    <!-- Left side -->
    <div class="flex items-center gap-4">
      <!-- Connection Status -->
      <div class="flex items-center gap-1.5">
        <div :class="['status-dot', statusStore.isConnected ? 'connected' : 'disconnected']" />
        <span class="text-muted-foreground">
          {{ statusStore.isConnected ? 'Connected' : 'Disconnected' }}
        </span>
      </div>

      <!-- Model -->
      <div class="flex items-center gap-1.5 text-muted-foreground">
        <Cpu class="w-3 h-3" />
        <span>{{ statusStore.model || 'Unknown' }}</span>
      </div>

      <!-- Context Usage -->
      <div class="flex items-center gap-1.5">
        <Zap class="w-3 h-3 text-muted-foreground" />
        <div class="flex items-center gap-1.5">
          <div class="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              :class="['h-full rounded-full transition-all duration-300', contextColor]"
              :style="{ width: `${contextPercent}%` }"
            />
          </div>
          <span class="text-muted-foreground tabular-nums">
            {{ contextPercent.toFixed(0) }}%
          </span>
        </div>
      </div>
    </div>

    <!-- Right side -->
    <div class="flex items-center gap-4">
      <!-- Session Time -->
      <div class="flex items-center gap-1.5 text-muted-foreground">
        <Clock class="w-3 h-3" />
        <span class="tabular-nums">{{ sessionTime }}</span>
      </div>

      <!-- MCP Servers -->
      <div
        v-if="statusStore.status?.mcpServers"
        class="flex items-center gap-1.5 text-muted-foreground"
      >
        <Server class="w-3 h-3" />
        <span>{{ statusStore.status.mcpServers }} MCP</span>
      </div>

      <!-- Version -->
      <div class="flex items-center gap-1.5 text-muted-foreground/60">
        <GitBranch class="w-3 h-3" />
        <span>v0.1.0</span>
      </div>
    </div>
  </footer>
</template>
