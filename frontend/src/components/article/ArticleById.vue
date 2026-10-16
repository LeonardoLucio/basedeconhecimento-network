<template>
    <div class="article-by-id">
        <PageTitle :icon="FileText" :main="article.name || 'Carregando artigo...'"
            :sub="article.description" />
        <div v-if="error" class="article-state" role="alert">{{ error }}</div>
        <div v-else-if="loading" class="article-state" role="status">Carregando artigo...</div>
        <template v-else>
            <article class="article-content" v-html="safeContent"></article>
            <section v-if="article.attachments?.length" class="article-attachments">
                <h2><Paperclip :size="19" /> Arquivos originais</h2>
                <ul>
                    <li v-for="attachment in article.attachments" :key="attachment.id">
                        <FileText :size="18" aria-hidden="true" />
                        <span>{{ attachment.originalName }}</span>
                        <small>{{ formatSize(attachment.size) }}</small>
                        <button class="btn btn-outline-primary btn-sm" type="button"
                            @click="downloadAttachment(attachment)">
                            <Download :size="15" /> Baixar
                        </button>
                    </li>
                </ul>
            </section>
        </template>
    </div>
</template>

<script>
import 'highlight.js/styles/monokai-sublime.css'
import hljs from 'highlight.js/lib/common'
import DOMPurify from 'dompurify'
import { nextTick, markRaw } from 'vue'
import axios from 'axios'
import PageTitle from '../template/PageTitle.vue'
import { Download, FileText, Paperclip } from '@lucide/vue'
import { baseApiUrl, showError } from '@/global'
import { getProtectedArticleImageUrl } from '@/utils/articleImages'

export default {
    name: 'ArticleById',
    components: { PageTitle, Download, FileText, Paperclip },
    computed: {
        safeContent() {
            const sanitized = DOMPurify.sanitize(this.article.content || '', {
                USE_PROFILES: { html: true },
                FORBID_TAGS: ['style', 'iframe', 'form', 'input', 'button', 'svg', 'math'],
                FORBID_ATTR: ['srcset']
            })
            const documentContent = new DOMParser().parseFromString(sanitized, 'text/html')
            documentContent.querySelectorAll('img[src]').forEach(image => {
                const protectedUrl = getProtectedArticleImageUrl(image.getAttribute('src'))
                if (!protectedUrl) return
                image.dataset.protectedSrc = protectedUrl
                image.removeAttribute('src')
            })
            return documentContent.body.innerHTML
        }
    },
    data: function() {
        return {
            article: {},
            loading: true,
            error: null,
            imageObjectUrls: [],
            FileText: markRaw(FileText)
        }
    },
    methods: {
        async loadArticle(id) {
            this.loading = true
            this.error = null
            this.releaseImageUrls()
            try {
                const res = await axios.get(`${baseApiUrl}/articles/${id}`)
                this.article = res.data
                this.article.content = this.article.content?.replaceAll(
                    'http://localhost:4000', baseApiUrl
                ) || ''
            } catch (error) {
                this.error = 'Não foi possível carregar este artigo.'
                showError(error)
            } finally {
                this.loading = false
            }
        },
        async downloadAttachment(attachment) {
            try {
                const response = await axios.get(
                    `${baseApiUrl}/articles/${this.article.id}/attachments/${attachment.id}`,
                    { responseType: 'blob' }
                )
                const url = URL.createObjectURL(response.data)
                const link = document.createElement('a')
                link.href = url
                link.download = attachment.originalName
                document.body.appendChild(link)
                link.click()
                link.remove()
                window.setTimeout(() => URL.revokeObjectURL(url), 1000)
            } catch (error) {
                showError(error)
            }
        },
        formatSize(size) {
            return size < 1024 * 1024
                ? `${Math.max(1, Math.round(size / 1024))} KB`
                : `${(size / (1024 * 1024)).toFixed(1)} MB`
        },
        async loadInlineImages() {
            const images = Array.from(
                this.$el.querySelectorAll('.article-content img[data-protected-src]')
            ).filter(image => !image.dataset.imageLoading && !image.dataset.imageError)
            await Promise.all(images.map(async image => {
                image.dataset.imageLoading = 'true'
                try {
                    const { data } = await axios.get(
                        image.dataset.protectedSrc,
                        { responseType: 'blob' }
                    )
                    const objectUrl = URL.createObjectURL(data)
                    if (image.isConnected) {
                        this.imageObjectUrls.push(objectUrl)
                        image.src = objectUrl
                        image.removeAttribute('data-protected-src')
                    } else {
                        URL.revokeObjectURL(objectUrl)
                    }
                } catch (error) {
                    image.dataset.imageError = 'true'
                    image.removeAttribute('data-protected-src')
                    showError(error)
                } finally {
                    delete image.dataset.imageLoading
                }
            }))
        },
        releaseImageUrls() {
            this.imageObjectUrls.forEach(objectUrl => URL.revokeObjectURL(objectUrl))
            this.imageObjectUrls = []
        }
    },
    watch: {
        '$route.params.id'(id) {
            this.loadArticle(id)
        }
    },
    mounted() {
        this.loadArticle(this.$route.params.id)
    },
    beforeUnmount() {
        this.releaseImageUrls()
    },
    updated() {
        nextTick(() => {
            this.loadInlineImages()
            document.querySelectorAll('.article-content .ql-code-block-container:not([data-highlighted])')
                .forEach(container => {
                    const pre = document.createElement('pre')
                    pre.textContent = Array.from(container.children)
                        .map(line => line.textContent)
                        .join('\n')
                    container.replaceWith(pre)
                    hljs.highlightElement(pre)
                })
            document.querySelectorAll('.article-content pre:not([data-highlighted])')
                .forEach(element => hljs.highlightElement(element))
        })
    }
}
</script>

<style>
    .article-content {
        overflow-wrap: anywhere;
        background: #fff;
        border: 1px solid var(--color-border);
        border-radius: 16px;
        padding: clamp(20px, 4vw, 36px);
        box-shadow: 0 4px 14px rgba(16, 24, 40, 0.04);
        line-height: 1.75;
    }

    .article-content pre {
        overflow-x: auto;
        padding: 18px;
        border-radius: 12px;
        font-size: 0.9rem;
        background-color: #090d14 !important;
        color: #f8fafc;
        border: 1px solid #263244;
    }

    .article-content pre code {
        display: block;
        overflow-x: auto;
        padding: 0;
        color: inherit;
        background: transparent;
        font-size: inherit;
        line-height: 1.6;
    }

    .article-content img {
        max-width: 100%;
    }

    .article-content ol,
    .article-content ul { padding-left: 1.7rem; }
    .article-content li { padding-left: .25rem; }
    .article-content h1,
    .article-content h2,
    .article-content h3,
    .article-content h4,
    .article-content h5,
    .article-content h6 { line-height: 1.3; margin: 1.25em 0 .55em; }

    .article-content :last-child {
        margin-bottom: 0;
    }

    .article-state {
        padding: 24px;
        color: var(--color-muted);
        background: #fff;
        border: 1px solid var(--color-border);
        border-radius: 14px;
    }

    .article-attachments {
        margin-top: 20px;
        padding: 20px;
        background: #fff;
        border: 1px solid var(--color-border);
        border-radius: 16px;
    }

    .article-attachments h2 {
        display: flex;
        align-items: center;
        gap: 9px;
        margin: 0 0 14px;
        font-size: 1rem;
        font-weight: 700;
    }

    .article-attachments ul {
        display: grid;
        gap: 8px;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .article-attachments li {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
        padding: 10px;
        background: #f8f9fc;
        border-radius: 10px;
    }

    .article-attachments li > span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .article-attachments li > small {
        margin-left: auto;
        color: var(--color-muted);
        white-space: nowrap;
    }

    .article-attachments .btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }
</style>
