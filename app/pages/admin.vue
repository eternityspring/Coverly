<script setup lang="ts">
definePageMeta({ middleware: 'admin' })
useHead({ title: '用户管理 · Coverly' })
const { user } = useUser()
const searchInput = ref('')
const search = ref('')
const page = ref(1)
interface ManagedUser { id: string; name: string; email: string; emailVerified: boolean; createdAt: string; role: 'admin' | 'user' }
const { data, status, error, refresh } = await useFetch<{ users: ManagedUser[]; total: number; page: number; pageSize: number }>('/api/admin/users', {
  query: { page, search },
})
const totalPages = computed(() => Math.max(1, Math.ceil((data.value?.total || 0) / (data.value?.pageSize || 25))))
function searchUsers() { page.value = 1; search.value = searchInput.value.trim() }
function formatDate(value: string) { return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) }
</script>

<template>
  <div class="admin-page">
    <header class="admin-header">
      <NuxtLink to="/" class="admin-brand"><Icon name="lucide:palette" /> Coverly</NuxtLink>
      <span class="admin-label">管理后台</span>
      <NuxtLink to="/" class="btn"><Icon name="lucide:arrow-left" /> 返回编辑器</NuxtLink>
    </header>
    <main class="admin-main">
      <div class="admin-heading"><div><h1>用户管理</h1><p>查看已注册用户及账号状态。</p></div><span class="admin-account">{{ user?.email }}</span></div>
      <section class="admin-card">
        <div class="admin-toolbar">
          <div class="admin-count">{{ search ? '搜索结果' : '注册用户' }} <strong>{{ data?.total ?? '—' }}</strong> 人</div>
          <form class="admin-search" @submit.prevent="searchUsers">
            <label class="sr-only" for="user-search">搜索昵称或邮箱</label>
            <input id="user-search" v-model="searchInput" type="search" maxlength="100" placeholder="搜索昵称或邮箱" />
            <button class="btn primary" :disabled="status === 'pending'">搜索</button>
          </form>
          <button class="btn" :disabled="status === 'pending'" @click="refresh()"><Icon name="lucide:refresh-cw" /> 刷新</button>
        </div>
        <div v-if="error" class="admin-state" role="alert"><p>用户列表加载失败，请稍后重试。</p><button class="btn" @click="refresh()">重试</button></div>
        <div v-else-if="status === 'pending'" class="admin-state" role="status">正在加载用户…</div>
        <div v-else-if="!data?.users.length" class="admin-state">{{ search ? '没有找到匹配的用户。' : '还没有注册用户。' }}</div>
        <div v-else class="admin-table-wrap">
          <table><thead><tr><th scope="col">用户</th><th scope="col">邮箱</th><th scope="col">角色</th><th scope="col">邮箱验证</th><th scope="col">注册时间</th></tr></thead>
            <tbody><tr v-for="item in data.users" :key="item.id"><td><span class="admin-avatar">{{ (item.name || item.email).charAt(0).toUpperCase() }}</span>{{ item.name || '未设置昵称' }}</td><td>{{ item.email }}</td><td><span class="admin-badge" :class="{ administrator: item.role === 'admin' }">{{ item.role === 'admin' ? '管理员' : '普通用户' }}</span></td><td><span :class="item.emailVerified ? 'verified' : 'unverified'">{{ item.emailVerified ? '已验证' : '未验证' }}</span></td><td>{{ formatDate(item.createdAt) }}</td></tr></tbody>
          </table>
        </div>
        <footer v-if="data" class="admin-pagination"><span>第 {{ page }} / {{ totalPages }} 页 · 每页 {{ data.pageSize }} 人</span><div><button class="btn" :disabled="page <= 1 || status === 'pending'" @click="page--">上一页</button><button class="btn" :disabled="page >= totalPages || status === 'pending'" @click="page++">下一页</button></div></footer>
      </section>
    </main>
  </div>
</template>

<style scoped>
.admin-page { height: 100dvh; overflow: auto; background: var(--bg); }
.admin-header { display: flex; align-items: center; gap: 18px; height: 64px; padding: 0 32px; border-bottom: 1px solid var(--border); background: var(--panel); }
.admin-header > .btn { margin-left: auto; }
.admin-brand { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 20px; color: var(--text); text-decoration: none; }
.admin-brand .iconify { color: var(--accent); }.admin-label { color: var(--text-dim); font-size: 14px; }
.admin-main { max-width: 1240px; margin: 0 auto; padding: 40px 32px; }
.admin-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 28px; }
h1 { margin: 0 0 8px; font-size: 28px; letter-spacing: -.04em; }.admin-heading p { margin: 0; color: var(--text-dim); font-size: 14px; }.admin-account { color: var(--text-dim); font-size: 13px; }
.admin-card { background: var(--panel); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; box-shadow: var(--shadow); }
.admin-toolbar { display: flex; align-items: center; gap: 12px; padding: 20px; flex-wrap: wrap; }.admin-count { margin-right: auto; color: var(--text-dim); font-size: 14px; }.admin-count strong { color: var(--text); font-size: 22px; margin: 0 4px; }
.admin-search { display: flex; gap: 8px; }.admin-search input { width: 260px; padding: 9px 12px; border: 1px solid var(--border-strong); border-radius: 8px; color: var(--text); background: var(--panel); }.admin-search input:focus { outline: 2px solid var(--accent-soft); border-color: var(--accent); }
.admin-table-wrap { overflow-x: auto; }table { border-collapse: collapse; width: 100%; font-size: 14px; text-align: left; white-space: nowrap; }th { color: var(--text-dim); font-size: 12px; font-weight: 600; background: var(--panel-2); }th, td { padding: 16px 20px; border-bottom: 1px solid var(--border); }tbody tr:last-child td { border-bottom: 0; }.admin-avatar { display: inline-grid; place-items: center; width: 30px; height: 30px; margin-right: 10px; border-radius: 50%; background: var(--accent-soft); color: var(--accent); font-weight: 600; }
.admin-badge { border-radius: 5px; padding: 4px 8px; background: var(--bg); color: var(--text-dim); font-size: 12px; }.administrator { background: var(--accent-soft); color: var(--accent); }.verified { color: #16845c; }.unverified { color: var(--text-dim); }
.admin-state { padding: 64px 20px; text-align: center; color: var(--text-dim); }.admin-state .btn { margin: 12px auto 0; }.admin-pagination { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-top: 1px solid var(--border); color: var(--text-dim); font-size: 13px; }.admin-pagination > div { display: flex; gap: 8px; }.btn:disabled { opacity: .5; cursor: default; }.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media(max-width: 720px) { .admin-header { padding: 0 16px; }.admin-main { padding: 24px 16px; }.admin-heading { align-items: flex-start; flex-direction: column; }.admin-search { width: 100%; order: 3; }.admin-search input { width: 100%; min-width: 0; }.admin-pagination { gap: 12px; flex-wrap: wrap; } }
</style>
