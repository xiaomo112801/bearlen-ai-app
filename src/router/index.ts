/// <reference types="@uni-helper/vite-plugin-uni-pages/client" />
import { useAuthStore } from '@/store/authStore'
import { pages, subPackages } from 'virtual:uni-pages'

/** 与路由表 path 一致；鉴权重定向须用 path + query（@wot-ui/router 对 name 导航未合并 query） */
export const LOGIN_PATH = '/pages/login/index'

function generateRoutes() {
  const routes = pages.map((page) => {
    const newPath = `/${page.path}`
    return { ...page, path: newPath }
  })
  if (subPackages && subPackages.length > 0) {
    subPackages.forEach((subPackage) => {
      const subRoutes = subPackage.pages.map((page: any) => {
        const newPath = `/${subPackage.root}/${page.path}`
        return { ...page, path: newPath }
      })
      routes.push(...subRoutes)
    })
  }
  return routes
}

const router = createRouter({
  routes: generateRoutes(),
})

const LOGIN_ROUTE_NAME = 'login'

function isLoginRoute(to: { name?: string; path?: string }) {
  const p = to.path || ''
  return to.name === LOGIN_ROUTE_NAME || p === LOGIN_PATH || p.endsWith('pages/login/index')
}

function buildLoginRedirectQuery(to: { fullPath?: string; path?: string }) {
  const raw = (to.fullPath || to.path || '').trim()
  if (!raw)
    return undefined
  return { redirect: encodeURIComponent(raw.startsWith('/') ? raw : `/${raw}`) }
}

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  if (isLoginRoute(to)) {
    if (auth.isLoggedIn) {
      next({ name: 'service' })
      return
    }
    next()
    return
  }

  if (!auth.isLoggedIn) {
    const q = buildLoginRedirectQuery(to)
    next({
      path: LOGIN_PATH,
      ...(q ? { query: q } : {}),
    })
    return
  }

  next()
})

router.afterEach(() => {})

export default router
