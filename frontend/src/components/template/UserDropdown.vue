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
    .user-dropdown { position: relative; }

    .user-button {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 5px 9px 5px 13px;
        color: #344054;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: 999px;
        box-shadow: var(--shadow-sm);
        cursor: pointer;
        list-style: none;
        transition: border-color 140ms ease;
    }

    .user-button::-webkit-details-marker { display: none; }

    .user-button:hover,
    .user-dropdown[open] .user-button { border-color: #c9c9f3; }

    .user-name {
        max-width: 180px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 0.87rem;
        font-weight: 600;
    }

    .user-avatar {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        color: #fff;
        background: linear-gradient(135deg, #7272ec, #4747c2);
        border-radius: 50%;
        font-size: 0.76rem;
        font-weight: 700;
    }

    .user-dropdown-content {
        position: absolute;
        top: calc(100% + 10px);
        right: 0;
        z-index: 40;
        min-width: 200px;
        padding: 6px;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-md);
    }

    .user-dropdown-content a,
    .user-dropdown-content button {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        color: #344054;
        background: transparent;
        border: 0;
        border-radius: 9px;
        text-align: left;
        text-decoration: none;
        font-size: 0.87rem;
        font-weight: 500;
    }

    .user-dropdown-content a:hover,
    .user-dropdown-content button:hover {
        color: var(--color-primary-dark);
        background: var(--color-primary-soft);
    }

    @media (max-width: 520px) { .user-name { display: none; } .user-button { padding-left: 6px; } }
</style>
