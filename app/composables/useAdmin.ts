export function useAdmin() {
  const { user, authEnabled } = useUser()
  const isAdmin = ref(false)
  if (authEnabled && import.meta.client) {
    watch(() => user.value?.id, async (id, _previous, onCleanup) => {
      isAdmin.value = false
      if (!id) return
      const controller = new AbortController()
      onCleanup(() => controller.abort())
      try {
        const result = await $fetch<{ isAdmin: boolean }>('/api/admin/me', { signal: controller.signal })
        if (!controller.signal.aborted) isAdmin.value = result.isAdmin
      } catch { /* The account menu stays ordinary when access is denied. */ }
    }, { immediate: true })
  }
  return { isAdmin }
}
