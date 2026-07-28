import { authClient } from '~/utils/auth-client'

export function useUser() {
  const authEnabled = useRuntimeConfig().public.authEnabled as boolean

  // With no database there is no user system at all — report "signed out, done
  // loading" rather than calling an endpoint that isn't there (see CLAUDE.md).
  if (!authEnabled) {
    return { user: computed(() => null), isPending: computed(() => false), authEnabled }
  }

  const session = authClient.useSession()
  const user = computed(() => session.value.data?.user ?? null)
  const isPending = computed(() => session.value.isPending)
  return { user, isPending, authEnabled }
}
