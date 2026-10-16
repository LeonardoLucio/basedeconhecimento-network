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
        gap: 8px;
        padding: 6px;
        background: #eaedf4;
        border: 0;
        border-radius: 12px;
    }

    .admin-pages-tabs .nav-link {
        padding: 9px 16px;
        color: #667085;
        border: 0;
        border-radius: 9px;
        font-size: 0.88rem;
        font-weight: 600;
    }

    .admin-pages-tabs .nav-link.active {
        color: #172033;
        background: #fff;
        box-shadow: 0 2px 6px rgba(16, 24, 40, 0.08);
    }

    .admin-panel {
        padding: clamp(16px, 3vw, 28px);
        background: #fff;
        border: 1px solid var(--color-border);
        border-radius: 16px;
        box-shadow: 0 4px 14px rgba(16, 24, 40, 0.04);
    }
</style>
