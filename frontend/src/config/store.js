import { createPinia, defineStore } from 'pinia'
import axios from 'axios'

export const useAppStore = defineStore('app', {
    state: () => ({
        isMenuVisible: false,
        user: null
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
        }
    }
})

export default createPinia()
