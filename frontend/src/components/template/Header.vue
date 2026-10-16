<template>
    <header class="header">
        <button class="toggle" type="button" @click="toggleMenu" v-if="!hideToggle"
            :aria-expanded="isMenuVisible" aria-label="Alternar menu de categorias">
            <MenuIcon :size="20" />
        </button>
        <router-link class="brand" to="/">
            <span class="brand-mark"><img src="/favicon.svg" alt="" /></span>
            <span class="brand-copy">
                <strong>{{ title }}</strong>
                <small>Seu espaço de conhecimento</small>
            </span>
        </router-link>
        <UserDropdown v-if="!hideUserDropdown" />
    </header>
</template>

<script>
import UserDropdown from './UserDropdown.vue'
import { Menu as MenuIcon } from '@lucide/vue'
import { useAppStore } from '@/config/store'

export default {
    name: 'Header',
    components: { UserDropdown, MenuIcon },
    props: {
        title: String,
        hideToggle: Boolean,
        hideUserDropdown: Boolean
    },
    computed: {
        isMenuVisible() {
            return useAppStore().isMenuVisible
        }
    },
    methods: {
        toggleMenu() {
            useAppStore().toggleMenu()
        }
    }
}
</script>

<style>
    .header {
        grid-area: header;
        position: sticky;
        top: 0;
        z-index: 30;
        padding: 0 28px;
        background: rgba(255, 255, 255, 0.94);
        border-bottom: 1px solid var(--color-border);
        display: flex;
        justify-content: space-between;
        align-items: center;
        backdrop-filter: blur(14px);
    }

    .brand {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        color: #172033;
        text-decoration: none;
    }

    .brand-mark {
        width: 42px;
        height: 42px;
        display: grid;
        place-items: center;
        color: white;
        background: linear-gradient(135deg, #5869e8, #394ac2);
        border-radius: 13px;
        box-shadow: 0 6px 14px rgba(66, 85, 212, 0.2);
    }

    .brand-mark img { width:42px; height:42px; border-radius:13px; }

    .brand-copy {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .brand-copy strong {
        font-size: 0.96rem;
        line-height: 1.2;
    }

    .brand-copy small {
        color: var(--color-muted);
        font-size: 0.74rem;
    }

    header.header > .toggle {
        width: 40px;
        height: 40px;
        display: grid;
        place-items: center;
        margin-right: 14px;
        color: #475467;
        background: #f4f6fb;
        border: 1px solid var(--color-border);
        border-radius: 11px;
    }

    @media (max-width: 767.98px) {
        .header {
            padding: 0 16px;
        }

        .brand {
            margin-right: auto;
        }

        .brand-copy small {
            display: none;
        }
    }
</style>
