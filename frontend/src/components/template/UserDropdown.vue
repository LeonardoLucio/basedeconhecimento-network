<template>
    <details class="user-dropdown">
        <summary class="user-button">
            <span class="user-name">{{ user.name }}</span>
            <span class="user-avatar" aria-hidden="true">{{ initials }}</span>
            <ChevronDown :size="16" aria-hidden="true" />
        </summary>
        <div class="user-dropdown-content">
            <router-link v-if="user.admin" to="/admin">
                <Settings :size="16" aria-hidden="true" /> Administração
            </router-link>
            <button type="button" @click="logout">
                <LogOut :size="16" aria-hidden="true" /> Sair
            </button>
        </div>
    </details>
</template>

<script>
import { mapState } from 'pinia'
import { useAppStore } from '@/config/store'
import { userKey } from '@/global'
import { ChevronDown, LogOut, Settings } from '@lucide/vue'

export default {
    name: 'UserDropdown',
    components: { ChevronDown, LogOut, Settings },
    computed: {
        ...mapState(useAppStore, ['user']),
        initials() {
            return this.user.name
                .split(/\s+/)
                .slice(0, 2)
                .map(part => part.charAt(0).toUpperCase())
                .join('')
        }
    },
    methods: {
        logout() {
            localStorage.removeItem(userKey)
            useAppStore().setUser(null)
            this.$router.push({ name: 'auth' })
        }
    }
}
</script>

<style>
    .user-dropdown {
        position: relative;
    }

    .user-button {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 5px 8px 5px 12px;
        color: #344054;
        border-radius: 12px;
        cursor: pointer;
        list-style: none;
    }

    .user-button::-webkit-details-marker {
        display: none;
    }

    .user-button:hover,
    .user-dropdown[open] .user-button {
        background: #f4f6fb;
    }

    .user-name {
        max-width: 180px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 0.87rem;
        font-weight: 600;
    }

    .user-avatar {
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        color: var(--color-primary);
        background: #e9ecff;
        border-radius: 50%;
        font-size: 0.78rem;
        font-weight: 700;
    }

    .user-dropdown-content {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        z-index: 40;
        min-width: 190px;
        padding: 6px;
        background: #fff;
        border: 1px solid var(--color-border);
        border-radius: 12px;
        box-shadow: 0 12px 28px rgba(16, 24, 40, 0.14);
    }

    .user-dropdown-content a,
    .user-dropdown-content button {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        color: #344054;
        background: transparent;
        border: 0;
        border-radius: 8px;
        text-align: left;
        text-decoration: none;
        font-size: 0.87rem;
    }

    .user-dropdown-content a:hover,
    .user-dropdown-content button:hover {
        color: #172033;
        background: #f4f6fb;
    }

    @media (max-width: 520px) {
        .user-name {
            display: none;
        }
    }
</style>
