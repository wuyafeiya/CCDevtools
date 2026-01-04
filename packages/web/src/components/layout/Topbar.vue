<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStatusStore } from '@/stores/status'
import {
  Search,
  Bell,
  Moon,
  Sun,
  ExternalLink,
  RefreshCw
} from 'lucide-vue-next'

const route = useRoute()
const statusStore = useStatusStore()

const pageTitle = computed(() => {
  const name = route.name as string
  return name || 'Overview'
})

const isDark = computed(() => document.documentElement.classList.contains('dark'))

function toggleTheme() {
  document.documentElement.classList.toggle('dark')
}

function refreshStatus() {
  statusStore.fetchStatus()
}
</script>

<template>
  <header class="h-14 flex items-center justify-between px-6 border-b border-border/50 bg-card/20 backdrop-blur-sm">
    <!-- Left: Page Title -->
    <div class="flex items-center gap-4">
      <h1 class="text-lg font-semibold tracking-tight">
        {{ pageTitle }}
      </h1>
      <div
        v-if="statusStore.model"
        class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span class="font-mono">{{ statusStore.model }}</span>
      </div>
    </div>

    <!-- Right: Actions -->
    <div class="flex items-center gap-1">
      <!-- Search -->
      <button
        class="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        title="Search (⌘K)"
      >
        <Search class="w-4 h-4" />
      </button>

      <!-- Refresh -->
      <button
        class="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        :class="{ 'animate-spin': statusStore.loading }"
        title="Refresh"
        @click="refreshStatus"
      >
        <RefreshCw class="w-4 h-4" />
      </button>

      <!-- Notifications -->
      <button
        class="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        title="Notifications"
      >
        <Bell class="w-4 h-4" />
        <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
      </button>

      <!-- Divider -->
      <div class="w-px h-5 bg-border mx-1" />

      <!-- Theme Toggle -->
      <button
        class="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        title="Toggle theme"
        @click="toggleTheme"
      >
        <Moon v-if="isDark" class="w-4 h-4" />
        <Sun v-else class="w-4 h-4" />
      </button>

      <!-- Open in Browser -->
      <a
        href="https://claude.ai"
        target="_blank"
        rel="noopener noreferrer"
        class="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        title="Open Claude"
      >
        <ExternalLink class="w-4 h-4" />
      </a>
    </div>
  </header>
</template>
