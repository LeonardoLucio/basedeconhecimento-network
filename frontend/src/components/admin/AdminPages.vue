<template>
    <div class="admin-pages">
        <PageTitle :icon="Settings" main="Administração"
            sub="Gerencie artigos, categorias e usuários" />
        <div class="admin-pages-tabs">
            <ul class="nav nav-tabs mb-3" role="tablist">
                <li v-for="tab in tabs" :key="tab.id" class="nav-item" role="presentation">
                    <button
                        class="nav-link"
                        :class="{ active: activeTab === tab.id }"
                        type="button"
                        role="tab"
                        :aria-selected="activeTab === tab.id"
                        :aria-controls="`admin-panel-${tab.id}`"
                        @click="activeTab = tab.id"
                    >{{ tab.label }}</button>
                </li>
            </ul>
            <section :id="`admin-panel-${activeTab}`" class="admin-panel" role="tabpanel">
                <ArticleAdmin v-if="activeTab === 'articles'" />
                <CategoryAdmin v-else-if="activeTab === 'categories'" />
                <UserAdmin v-else />
            </section>
        </div>
    </div>
</template>

<script>
import PageTitle from '../template/PageTitle.vue'
import ArticleAdmin from './ArticleAdmin.vue'
import CategoryAdmin from './CategoryAdmin.vue'
import UserAdmin from './UserAdmin.vue'
import { Settings } from '@lucide/vue'
import { markRaw } from 'vue'

export default {
    name: 'AdminPages',
    components: { PageTitle, ArticleAdmin, CategoryAdmin, UserAdmin },
    data() {
        return {
            activeTab: 'articles',
            Settings: markRaw(Settings),
            tabs: [
                { id: 'articles', label: 'Artigos' },
                { id: 'categories', label: 'Categorias' },
                { id: 'users', label: 'Usuários' }
            ]
        }
    }
}
</script>

<style>
    .admin-pages-tabs .nav-tabs {
        display: inline-flex;
        gap: 4px;
        padding: 5px;
        background: #e9ebf5;
        border: 0;
        border-radius: 13px;
    }

    .admin-pages-tabs .nav-link {
        padding: 9px 20px;
        color: #667085;
        border: 0;
        border-radius: 9px;
        font-size: 0.88rem;
        font-weight: 600;
        transition: color 140ms ease, background-color 140ms ease;
    }

    .admin-pages-tabs .nav-link:hover { color: var(--color-ink); }

    .admin-pages-tabs .nav-link.active {
        color: var(--color-primary-dark);
        background: var(--color-surface);
        box-shadow: var(--shadow-sm);
    }

    .admin-panel {
        padding: clamp(16px, 3vw, 30px);
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
    }

    .admin-form-heading {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        margin-bottom: 22px;
        padding: 18px 22px;
        border: 1px solid #dcdcf7;
        border-radius: var(--radius-md);
        background: linear-gradient(120deg, #f0f0ff, #ffffff 70%);
    }
    .admin-form-heading h3 { margin: 0; color: var(--color-ink); font-size: 1.1rem; font-weight: 700; letter-spacing: -0.02em; }
    .admin-form-heading p { margin: 5px 0 0; color: var(--color-muted); font-size: .87rem; }
    .admin-mode-badge { padding: 6px 12px; border-radius: 999px; color: var(--color-primary-dark); background: var(--color-primary-soft); font-size: .78rem; font-weight: 700; white-space: nowrap; }

    .admin-confirm-backdrop { position: fixed; inset: 0; z-index: 1200; display: grid; place-items: center; padding: 20px; background: rgba(16, 24, 40, .55); backdrop-filter: blur(3px); }
    .admin-confirm-dialog { width: min(100%, 440px); padding: 26px; border: 1px solid var(--color-border); border-radius: 18px; background: var(--color-surface); box-shadow: var(--shadow-lg); }
    .admin-confirm-dialog h3 { margin: 0 0 8px; font-size: 1.15rem; font-weight: 700; }
    .admin-confirm-dialog p { color: var(--color-muted); }
    .admin-confirm-dialog > div { display: flex; justify-content: flex-end; gap: 10px; }
</style>
