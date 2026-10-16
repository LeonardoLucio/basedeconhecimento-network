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
        <p v-if="!error && filteredTree.length === 0" class="tree-filter-empty">
            {{ treeFilter ? 'Nenhuma categoria encontrada.' : 'Ainda não há categorias.' }}
        </p>
        <p v-if="error" class="tree-filter-empty">{{ error }}</p>
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
import { mapState } from 'pinia'
import { useAppStore } from '@/config/store'
import { baseApiUrl } from '@/global'
import axios from 'axios'
import CategoryTreeNode from './CategoryTreeNode.vue'
import { Search } from '@lucide/vue'

export default {
    name: 'Menu',
    components: { CategoryTreeNode, Search },
    data: function() {
        return {
            treeFilter: '',
            treeData: [],
            error: null
        }
    },
    computed: {
        ...mapState(useAppStore, ['isMenuVisible']),
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
                ? filterNodes(this.treeData)
                : this.treeData
        }
    },
    methods: {
        async getTreeData() {
            try {
                const response = await axios.get(`${baseApiUrl}/categories/tree`)
                this.treeData = response.data
            } catch (error) {
                this.error = 'Não foi possível carregar as categorias.'
                console.error('Falha ao carregar categorias:', error)
            }
        },
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
    mounted() {
        this.getTreeData()
    }
}
</script>

<style>
    .menu {
        grid-area: menu;
        position: sticky;
        top: 72px;
        z-index: 20;
        height: calc(100vh - 72px);
        padding: 24px 16px;
        overflow: hidden;
        background: #172033;
        display: flex;
        flex-direction: column;
        transition: transform 180ms ease;
    }

    .menu-heading {
        display: grid;
        gap: 14px;
        padding: 0 8px 18px;
        color: #98a2b3;
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.12em;
    }

    .home-link {
        padding: 10px 12px;
        color: #fff;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        font-size: 0.9rem;
        letter-spacing: 0;
    }

    .category-tree {
        list-style: none;
        padding-left: 0;
        margin: 8px 0 0;
        overflow-y: auto;
        scrollbar-color: #475467 transparent;
        scrollbar-width: thin;
    }

    .menu a,
    .menu a:hover {
        color: #fff;
        text-decoration: none;
    }

    .menu .tree-node.selected > .tree-content,
    .menu .tree-node .tree-content:hover {
        background-color: rgba(255, 255, 255, 0.2);
    }

    .menu .menu-filter {
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 0 12px;
        height: 42px;
        color: #98a2b3;
        background: #222e43;
        border: 1px solid #344054;
        border-radius: 10px;
    }

    .menu .menu-filter:focus-within {
        border-color: #8793f2;
        box-shadow: 0 0 0 3px rgba(135, 147, 242, 0.16);
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

    .menu input::placeholder {
        color: #98a2b3;
    }

    .tree-filter-empty {
        color: #c4cbd6;
        font-size: 0.85rem;
        margin: 18px 8px;
    }

    @media (max-width: 767.98px) {
        .menu {
            position: fixed;
            inset: 64px auto 0 0;
            width: min(290px, calc(100vw - 52px));
            height: calc(100dvh - 64px);
            transform: translateX(-100%);
            box-shadow: 12px 0 32px rgba(16, 24, 40, 0.18);
        }
    }
</style>
