import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DevToolsStatus, ContextUsage } from '@claude-devtools/shared'
import { api } from '@/api'

/**
 * Status Store
 * Manages the current DevTools connection status and runtime information
 */
export const useStatusStore = defineStore('status', () => {
  // State
  const status = ref<DevToolsStatus | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const isConnected = computed(() => status.value?.connected ?? false)

  const model = computed(() => status.value?.model ?? 'Claude Opus 4.5')

  const contextUsage = computed((): ContextUsage | null => {
    return status.value?.currentContextUsage ?? status.value?.context ?? null
  })

  const sessionId = computed(() => status.value?.sessionId ?? null)

  const startTime = computed(() => status.value?.startTime ?? null)

  const totalMessages = computed(() => status.value?.totalMessages ?? 0)

  const totalToolCalls = computed(() => status.value?.totalToolCalls ?? 0)

  const lastActivity = computed(() => status.value?.lastActivity ?? null)

  // Actions
  async function fetchStatus() {
    loading.value = true
    error.value = null

    try {
      status.value = await api.getStatus()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  function reset() {
    status.value = null
    loading.value = false
    error.value = null
  }

  return {
    // State
    status,
    loading,
    error,

    // Computed
    isConnected,
    model,
    contextUsage,
    sessionId,
    startTime,
    totalMessages,
    totalToolCalls,
    lastActivity,

    // Actions
    fetchStatus,
    reset
  }
})

export default useStatusStore
