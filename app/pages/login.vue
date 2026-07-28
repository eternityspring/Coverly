<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { authClient } from '~/utils/auth-client'

const route = useRoute()
const config = useRuntimeConfig().public
const { user, isPending, authEnabled } = useUser()

const mode = ref<'signin' | 'signup'>('signin')
const name = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const busy = ref(false)
const googleBusy = ref(false)
const errorMsg = ref('')

const isSignup = computed(() => mode.value === 'signup')

function safeRedirect(path: unknown): string {
  const s = String(path || '/')
  return s.startsWith('/') && !s.startsWith('//') ? s : '/'
}

if (user.value) await navigateTo(safeRedirect(route.query.redirect))

if (import.meta.client) {
  watch([user, isPending], () => {
    if (!isPending.value && user.value) navigateTo(safeRedirect(route.query.redirect))
  })
}

function switchMode() {
  mode.value = isSignup.value ? 'signin' : 'signup'
  errorMsg.value = ''
}

async function submit() {
  if (!email.value || !password.value) {
    errorMsg.value = '请输入邮箱和密码'
    return
  }
  if (isSignup.value && password.value.length < 8) {
    errorMsg.value = '密码至少 8 位'
    return
  }
  busy.value = true
  errorMsg.value = ''
  const redirect = safeRedirect(route.query.redirect)
  try {
    const res = isSignup.value
      ? await authClient.signUp.email({
          email: email.value,
          password: password.value,
          name: name.value || email.value.split('@')[0],
        })
      : await authClient.signIn.email({ email: email.value, password: password.value })

    if (res.error) {
      errorMsg.value = signInError(res.error.code)
      return
    }
    window.location.href = redirect
  } catch {
    errorMsg.value = isSignup.value ? '注册失败，请重试' : '登录失败，请重试'
  } finally {
    busy.value = false
  }
}

function signInError(code?: string) {
  if (code === 'INVALID_EMAIL_OR_PASSWORD') return '邮箱或密码错误'
  if (code === 'USER_ALREADY_EXISTS') return '该邮箱已注册，直接登录即可'
  return isSignup.value ? '注册失败，请重试' : '登录失败，请重试'
}

// Google runs in a popup so the editor tab keeps its state; the callback page
// pings back over BroadcastChannel, with session polling as the fallback.
async function signInGoogle() {
  googleBusy.value = true
  errorMsg.value = ''
  const redirect = safeRedirect(route.query.redirect)

  const w = 480
  const h = 640
  const left = Math.round(window.screenX + window.outerWidth / 2 - w / 2)
  const top = Math.round(window.screenY + window.outerHeight / 2 - h / 2)
  const popup = window.open('about:blank', 'google-login', `width=${w},height=${h},left=${left},top=${top}`)

  if (!popup) {
    errorMsg.value = '弹窗被浏览器拦截，请允许此站点弹出窗口后重试'
    googleBusy.value = false
    return
  }

  let authUrl: string | undefined
  try {
    const res = await $fetch<{ url?: string }>('/api/auth/sign-in/social', {
      method: 'POST',
      body: {
        provider: 'google',
        callbackURL: window.location.origin + '/auth/popup-callback',
        disableRedirect: true,
      },
    })
    authUrl = res?.url
  } catch (e) {
    console.error('[login] failed to fetch Google auth URL', e)
  }

  if (!authUrl) {
    popup.close()
    errorMsg.value = '获取登录地址失败，请重试'
    googleBusy.value = false
    return
  }

  popup.location.href = authUrl

  const channel = new BroadcastChannel('auth')
  const finish = async () => {
    const sess = await authClient.getSession()
    if (!sess.data?.user) return
    clearInterval(timer)
    clearTimeout(giveUp)
    channel.close()
    try {
      popup.close()
    } catch {
      /* COOP-detached popup */
    }
    window.location.href = redirect
  }
  channel.onmessage = (e) => {
    if (e.data?.type === 'success') finish()
  }

  const timer = setInterval(finish, 1500)
  const giveUp = setTimeout(() => {
    clearInterval(timer)
    channel.close()
    googleBusy.value = false
  }, 3 * 60 * 1000)
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <NuxtLink to="/" class="auth-brand">
        <span class="logo"><Icon name="lucide:palette" /></span>
        <span>Coverly</span>
      </NuxtLink>

      <!-- No database configured — the user system is switched off entirely. -->
      <template v-if="!authEnabled">
        <h1>用户系统未启用</h1>
        <p class="auth-sub">这个部署没有配置数据库，编辑器的全部功能仍然可用。</p>
        <NuxtLink to="/" class="auth-btn primary">返回编辑器</NuxtLink>
      </template>

      <template v-else>
        <h1>{{ isSignup ? '注册' : '登录' }}</h1>
        <p class="auth-sub">登录后可以使用更多模板。</p>

        <button
          v-if="config.googleEnabled"
          class="auth-btn google"
          :disabled="googleBusy"
          @click="signInGoogle"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {{ googleBusy ? '跳转中…' : 'Google 登录' }}
        </button>

        <div v-if="config.googleEnabled" class="auth-sep"><span>或</span></div>

        <p v-if="errorMsg" class="auth-error">{{ errorMsg }}</p>

        <form class="auth-form" @submit.prevent="submit">
          <input v-if="isSignup" v-model="name" type="text" placeholder="昵称（可留空）" autocomplete="nickname" />
          <input v-model="email" type="email" placeholder="邮箱地址" autocomplete="email" />
          <div class="auth-pw">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="密码"
              :autocomplete="isSignup ? 'new-password' : 'current-password'"
            />
            <button type="button" tabindex="-1" :title="showPassword ? '隐藏密码' : '显示密码'" @click="showPassword = !showPassword">
              <Icon :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'" />
            </button>
          </div>
          <button type="submit" class="auth-btn primary" :disabled="busy">
            {{ busy ? '处理中…' : isSignup ? '注册' : '登录' }}
          </button>
        </form>

        <p class="auth-switch">
          {{ isSignup ? '已经有账号了？' : '还没有账号？' }}
          <button type="button" @click="switchMode">{{ isSignup ? '去登录' : '去注册' }}</button>
        </p>
      </template>
    </div>
  </div>
</template>
