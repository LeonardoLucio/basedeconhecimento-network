import { createPinia, defineStore } from 'pinia'
import axios from 'axios'
import { baseApiUrl } from '@/global'

export const useAppStore = defineStore('app', {
    state: () => ({
        isMenuVisible: false,
        user: null,
        categoryTree: [],
        categoryTreeError: null
    }),
    actions: {
        toggleMenu(isVisible) {
            if (!this.user) {
                this.isMenuVisible = false
                return
            }

            this.isMenuVisible = isVisible === undefined
                ? !this.isMenuVisible
                : isVisible
        },
        setUser(user) {
            this.user = user
            this.isMenuVisible = Boolean(user)
            if (user) {
                axios.defaults.headers.common.Authorization = `bearer ${user.token}`
            } else {
                delete axios.defaults.headers.common.Authorization
            }
        },
        async loadCategoryTree() {
            try {
                const response = await axios.get(`${baseApiUrl}/categories/tree`)
                this.categoryTree = response.data
                this.categoryTreeError = null
            } catch (error) {
                this.categoryTreeError = 'Falha ao carregar as categorias.'
                console.error('Falha ao carregar categorias:', error)
            }
        }
    }
})

export default createPinia()
