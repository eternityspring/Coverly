export default defineNuxtRouteMiddleware(async () => {
  if (!useRuntimeConfig().public.authEnabled) return navigateTo('/')
  try {
    await $fetch('/api/admin/me')
  } catch (error: any) {
    const status = error?.statusCode || error?.response?.status
    if (status === 401) return navigateTo('/login?redirect=/admin')
    if (status === 403) throw createError({ statusCode: 403, message: '你没有访问管理页面的权限' })
    throw createError({ statusCode: 503, message: '管理页面暂时无法加载，请稍后重试' })
  }
})
