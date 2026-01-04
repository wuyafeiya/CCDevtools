<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router'
import {
  LayoutDashboard,
  Settings,
  Layers,
  Clock,
  Wrench,
  Terminal,
  Sparkles
} from 'lucide-vue-next'

const route = useRoute()

const navItems = [
  { path: '/', name: 'Overview', icon: LayoutDashboard },
  { path: '/config', name: 'Config', icon: Settings },
  { path: '/context', name: 'Context', icon: Layers },
  { path: '/timeline', name: 'Timeline', icon: Clock },
  { path: '/tools', name: 'Tools', icon: Wrench },
]

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <aside class="w-56 h-full flex flex-col border-r border-border/50 bg-card/30">
    <!-- Logo Section -->
    <div class="h-14 flex items-center gap-2.5 px-4 border-b border-border/50">
      <div class="relative">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center glow-primary">
          <Terminal class="w-4 h-4 text-white" />
        </div>
        <Sparkles class="absolute -top-1 -right-1 w-3 h-3 text-primary animate-pulse" />
      </div>
      <div class="flex flex-col">
        <span class="text-sm font-semibold tracking-tight">Claude</span>
        <span class="text-[10px] text-muted-foreground font-medium -mt-0.5">DevTools</span>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
      <RouterLink
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :class="['sidebar-nav-item', { active: isActive(item.path) }]"
      >
        <component
          :is="item.icon"
          :class="[
            'w-4 h-4 transition-colors',
            isActive(item.path) ? 'text-primary' : 'text-muted-foreground'
          ]"
        />
        <span>{{ item.name }}</span>
      </RouterLink>
    </nav>

    <!-- Footer -->
    <div class="p-3 border-t border-border/50">
      <div class="px-3 py-2 rounded-lg bg-muted/30">
        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <div class="status-dot connected" />
          <span>Connected</span>
        </div>
        <div class="mt-1.5 text-[10px] text-muted-foreground/70 font-mono">
          v0.1.0
        </div>
      </div>
    </div>
  </aside>
</template>
