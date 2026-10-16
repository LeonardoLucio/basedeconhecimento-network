import { createRouter, createWebHistory } from 'vue-router'

import Home from '@/components/home/Home.vue'
import AdminPages from '@/components/admin/AdminPages.vue'
import ArticlesByCategory from '@/components/article/ArticlesByCategory.vue'
import ArticleById from '@/components/article/ArticleById.vue'
import Auth from '@/components/auth/Auth.vue'
import ChangePassword from '@/components/auth/ChangePassword.vue'

import { userKey } from '@/global'

const routes = [{
    name: 'home',
    path: '/',
    component: Home
}, {
    name: 'adminPages',
    path: '/admin',
    component: AdminPages,
    meta: { requiresAdmin: true }
}, {
    name: 'articlesByCategory',
    path: '/categories/:id/articles',
    component: ArticlesByCategory
}, {
    name: 'articleById',
    path: '/articles/:id',
    component: ArticleById
}, {
    name: 'auth',
    path: '/auth',
    component: Auth
}, {
    name: 'changePassword',
    path: '/change-password',
    component: ChangePassword
}]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach(to => {
    let user
    try {
        user = JSON.parse(localStorage.getItem(userKey))
    } catch {
        localStorage.removeItem(userKey)
    }

    if (user?.mustChangePassword && to.name !== 'changePassword') {
        return { name: 'changePassword' }
    }
    if (to.name === 'changePassword') {
        return user?.mustChangePassword ? true : { name: 'auth' }
    }
    if (to.matched.some(record => record.meta.requiresAdmin) && !user?.admin) {
        return { path: '/' }
    }
    return true
})

export default router
