<template>
    <aside class="menu" v-show="isMenuVisible">
        <div class="menu-heading">
            <span>NAVEGAÇÃO</span>
            <router-link to="/" class="home-link">Visão geral</router-link>
        </div>
        <label class="menu-filter">
            <Search :size="17" aria-hidden="true" />
            <input type="search" placeholder="Buscar categoria..."
                v-model="treeFilter" class="filter-field" aria-label="Buscar categoria">
        </label>
        <p v-if="!categoryTreeError && filteredTree.length === 0" class="tree-filter-empty">
            {{ treeFilter ? 'Nenhuma categoria encontrada.' : user && !user.admin
                ? 'Nenhuma categoria foi liberada para seu usuário.'
                : 'Ainda não há categorias.' }}
        </p>
        <p v-if="categoryTreeError" class="tree-filter-empty">{{ categoryTreeError }}</p>
        <ul v-else class="category-tree">
            <CategoryTreeNode
                v-for="node in filteredTree"
                :key="node.id"
                :node="node"
                @select="onNodeSelect"
            />
        </ul>
    </aside>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { useAppStore } from '@/config/store'
import CategoryTreeNode from './CategoryTreeNode.vue'
import { Search } from '@lucide/vue'

export default {
    name: 'Menu',
    components: { CategoryTreeNode, Search },
    data: function() {
        return {
            treeFilter: ''
        }
    },
    computed: {
        ...mapState(useAppStore, ['isMenuVisible', 'user', 'categoryTree', 'categoryTreeError']),
        filteredTree() {
            const filterNodes = nodes => nodes.reduce((matches, node) => {
                const children = filterNodes(node.children || [])
                const matchesFilter = node.name
                    .toLowerCase()
                    .includes(this.treeFilter.trim().toLowerCase())
                if (matchesFilter || children.length) {
                    matches.push({ ...node, children })
                }
                return matches
            }, [])

            return this.treeFilter.trim()
                ? filterNodes(this.categoryTree)
                : this.categoryTree
        }
    },
    methods: {
        ...mapActions(useAppStore, ['loadCategoryTree']),
        onNodeSelect(node) {
            this.$router.push({
                name: 'articlesByCategory',
                params: { id: node.id }
            })

            if(window.matchMedia('(max-width: 767.98px)').matches) {
                useAppStore().toggleMenu(false)
            }
        }
    },
    watch: {
        user(user) {
            if (user) this.loadCategoryTree()
        }
    },
    mounted() {
        if (this.user) this.loadCategoryTree()
    }
}
</script>

<style>
    .menu {
        grid-area: menu;
        position: sticky;
        top: var(--header-height);
        z-index: 20;
        height: calc(100vh - var(--header-height));
        padding: 24px 16px;
        overflow: hidden;
        background:
            radial-gradient(420px 260px at 0% 0%, rgba(91, 91, 214, 0.28), transparent 70%),
            linear-gradient(180deg, #151c33 0%, #0f1526 100%);
        display: flex;
        flex-direction: column;
        transition: transform 180ms ease;
    }

    .menu-heading {
        display: grid;
        gap: 14px;
        padding: 0 8px 18px;
        color: #8d97b3;
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.14em;
    }

    .home-link {
        padding: 11px 13px;
        color: #fff;
        background: rgba(255, 255, 255, 0.09);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 11px;
        font-size: 0.9rem;
        font-weight: 600;
        letter-spacing: 0;
        transition: background-color 140ms ease;
    }

    .home-link:hover { background: rgba(255, 255, 255, 0.15); }

    .category-tree {
        list-style: none;
        padding: 0 4px 0 0;
        margin: 12px 0 0;
        overflow-y: auto;
        scrollbar-color: #3b4560 transparent;
        scrollbar-width: thin;
    }

    .menu a,
    .menu a:hover { color: #fff; text-decoration: none; }

    .menu .menu-filter {
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 0 12px;
        height: 42px;
        color: #8d97b3;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 11px;
    }

    .menu .menu-filter:focus-within {
        border-color: #9a9af0;
        box-shadow: 0 0 0 3px rgba(154, 154, 240, 0.2);
    }

    .menu input {
        min-width: 0;
        color: #fff;
        font-size: 0.85rem;
        border: 0;
        outline: 0;
        width: 100%;
        background: transparent;
    }

    .menu input::placeholder { color: #8d97b3; }

    .tree-filter-empty { color: #aab3c9; font-size: 0.85rem; margin: 18px 8px; }

    @media (max-width: 767.98px) {
        .menu {
            position: fixed;
            inset: 64px auto 0 0;
            width: min(300px, calc(100vw - 52px));
            height: calc(100dvh - 64px);
            transform: translateX(-100%);
            box-shadow: 12px 0 32px rgba(16, 24, 40, 0.25);
        }
    }
</style>
