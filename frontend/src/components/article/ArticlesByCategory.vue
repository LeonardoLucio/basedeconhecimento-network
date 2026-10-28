<template>
    <div class="articles-by-category">
        <PageTitle :icon="Folder"
            :main="category.name || 'Artigos da categoria'" sub="Categoria" />
        <div v-if="error" class="article-list-state" role="alert">{{ error }}</div>
        <ul v-else-if="articles.length">
            <li v-for="article in articles" :key="article.id">
                <ArticleItem :article="article" />
            </li>
        </ul>
        <div v-else-if="loading" class="article-list-state" role="status">
            Carregando artigos...
        </div>
        <div v-else class="article-list-state">Nenhum artigo encontrado nesta categoria.</div>
        <div class="load-more">
            <button v-if="loadMore"
                class="btn btn-lg btn-outline-primary"
                :disabled="loading"
                @click="getArticles">Carregar mais artigos</button>
        </div>
    </div>
</template>

<script>
import { baseApiUrl, showError } from '@/global'
import axios from 'axios'
import PageTitle from '../template/PageTitle.vue'
import ArticleItem from './ArticleItem.vue'
import { Folder } from '@lucide/vue'
import { markRaw } from 'vue'

export default {
    name: 'ArticlesByCategory',
    components: { PageTitle, ArticleItem },
    data: function() {
        return {
            category: {},
            articles: [],
            page: 1,
            loadMore: true,
            loading: false,
            error: null,
            Folder: markRaw(Folder)
        }
    },
    methods: {
        async getCategory(id) {
            try {
                const res = await axios.get(`${baseApiUrl}/categories/${id}`)
                this.category = res.data
                return true
            } catch (error) {
                this.error = 'Não foi possível carregar esta categoria.'
                showError(error)
                return false
            }
        },
        async getArticles() {
            if (this.loading || !this.loadMore) return
            this.loading = true
            try {
                const res = await axios.get(
                    `${baseApiUrl}/categories/${this.category.id}/articles?page=${this.page}`
                )
                this.articles = this.articles.concat(res.data)
                this.page++

                if (res.data.length === 0) this.loadMore = false
            } catch (error) {
                this.error = 'Não foi possível carregar os artigos.'
                showError(error)
            } finally {
                this.loading = false
            }
        },
        async loadCategory(id) {
            this.category = {}
            this.articles = []
            this.page = 1
            this.loadMore = true
            this.error = null
            const categoryLoaded = await this.getCategory(id)
            if (!categoryLoaded) return
            await this.getArticles()
        }
    },
    watch: {
        '$route.params.id'(id) {
            this.category.id = id
            this.loadCategory(id)
        }
    },
    mounted() {
        this.category.id = this.$route.params.id
        this.loadCategory(this.$route.params.id)
    }
}
</script>

<style>
    .articles-by-category ul { list-style-type: none; padding: 0; margin: 0; }

    .articles-by-category .load-more {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 25px;
    }

    .article-list-state {
        padding: 28px;
        color: var(--color-muted);
        text-align: center;
        background: var(--color-surface);
        border: 1px dashed #cfd3e2;
        border-radius: var(--radius-md);
    }
</style>
