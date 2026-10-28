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
import 'highlight.js/styles/github-dark.css'
import hljs from 'highlight.js/lib/common'
import DOMPurify from 'dompurify'
import { nextTick, markRaw } from 'vue'
import axios from 'axios'
import PageTitle from '../template/PageTitle.vue'
import { Download, FileText, Paperclip } from '@lucide/vue'
import { baseApiUrl, showError } from '@/global'
import { getProtectedArticleImageUrl } from '@/utils/articleImages'

// Links do conteúdo sempre abrem em nova aba sem acesso à janela original.
DOMPurify.addHook('afterSanitizeAttributes', node => {
    if (node.tagName === 'A' && node.getAttribute('href')) {
        node.setAttribute('target', '_blank')
        node.setAttribute('rel', 'noopener noreferrer')
    }
})

const COMMAND_LANGUAGES = ['bash', 'shell', 'ini', 'yaml', 'json', 'python', 'javascript',
    'sql', 'xml', 'php', 'perl', 'ruby', 'go', 'java', 'css', 'diff', 'plaintext']
const LANGUAGE_LABELS = {
    bash: 'Shell', shell: 'Shell', ini: 'Config', yaml: 'YAML', json: 'JSON', python: 'Python',
    javascript: 'JavaScript', sql: 'SQL', xml: 'XML/HTML', php: 'PHP', perl: 'Perl', ruby: 'Ruby',
    go: 'Go', java: 'Java', css: 'CSS', diff: 'Diff', plaintext: 'Texto'
}

// Comandos de rede/servidores são o uso mais comum: só troca de "shell" quando
// o detector tem forte confiança em outra linguagem.
const detectLanguage = code => {
    const auto = hljs.highlightAuto(code, COMMAND_LANGUAGES)
    const language = auto.language && auto.relevance >= 10 ? auto.language : 'bash'
    const { value } = hljs.highlight(code, { language, ignoreIllegals: true })
    return { language, html: value }
}

const copyText = async text => {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        return
    }
    // Fallback para acesso via HTTP (IP:porta), onde a API de área de transferência não existe.
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
    document.body.appendChild(textarea)
    textarea.select()
    try { document.execCommand('copy') } finally { textarea.remove() }
}

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
        buildCodeBlock(code) {
            const { language, html } = detectLanguage(code)
            const figure = document.createElement('figure')
            figure.className = 'code-block'

            const header = document.createElement('figcaption')
            header.className = 'code-block-header'
            const label = document.createElement('span')
            label.textContent = LANGUAGE_LABELS[language] || language
            const button = document.createElement('button')
            button.type = 'button'
            button.className = 'code-block-copy'
            button.textContent = 'Copiar'
            button.addEventListener('click', async () => {
                try {
                    await copyText(code)
                    button.textContent = 'Copiado!'
                    button.classList.add('is-copied')
                } catch {
                    button.textContent = 'Falhou'
                }
                window.setTimeout(() => {
                    button.textContent = 'Copiar'
                    button.classList.remove('is-copied')
                }, 1800)
            })
            header.append(label, button)

            const pre = document.createElement('pre')
            pre.className = 'code-block-pre'
            const codeElement = document.createElement('code')
            codeElement.className = `hljs language-${language}`
            codeElement.innerHTML = html // saída do highlight.js: já escapada
            pre.appendChild(codeElement)

            figure.append(header, pre)
            return figure
        },
        enhanceCodeBlocks() {
            const root = this.$el?.querySelector?.('.article-content')
            if (!root) return
            root.querySelectorAll('.ql-code-block-container').forEach(container => {
                const code = Array.from(container.children).map(line => line.textContent).join('\n')
                container.replaceWith(this.buildCodeBlock(code))
            })
            root.querySelectorAll('pre:not(.code-block-pre)').forEach(pre => {
                pre.replaceWith(this.buildCodeBlock(pre.textContent))
            })
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
            this.enhanceCodeBlocks()
        })
    }
}
</script>

<style>
    .article-content {
        overflow-wrap: anywhere;
        color: #232b3f;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: clamp(22px, 4vw, 44px);
        box-shadow: var(--shadow-sm);
        font-size: 1.02rem;
        line-height: 1.8;
    }

    .article-content > :first-child { margin-top: 0; }
    .article-content > :last-child { margin-bottom: 0; }

    .article-content p { margin: 0 0 1em; }

    .article-content h1,
    .article-content h2,
    .article-content h3,
    .article-content h4,
    .article-content h5,
    .article-content h6 {
        margin: 1.6em 0 .55em;
        color: var(--color-ink);
        font-weight: 750;
        letter-spacing: -0.025em;
        line-height: 1.3;
    }

    .article-content h1 { font-size: 1.85rem; }
    .article-content h2 { padding-bottom: .35em; font-size: 1.45rem; border-bottom: 1px solid var(--color-border); }
    .article-content h3 { font-size: 1.2rem; }

    .article-content a { color: var(--color-primary-dark); text-underline-offset: 3px; }

    .article-content ol,
    .article-content ul { padding-left: 1.7rem; margin-bottom: 1em; }
    .article-content li { padding-left: .25rem; margin-bottom: .25em; }

    .article-content blockquote {
        margin: 1.2em 0;
        padding: 10px 18px;
        color: #475467;
        background: var(--color-surface-alt);
        border-left: 4px solid #b4b4f0;
        border-radius: 0 10px 10px 0;
    }

    .article-content img { max-width: 100%; height: auto; border-radius: 12px; }

    .article-content :not(pre) > code {
        padding: .15em .45em;
        color: var(--color-primary-dark);
        background: var(--color-primary-soft);
        border-radius: 6px;
        font-size: .88em;
    }

    .article-content table { width: 100%; margin: 1em 0; border-collapse: collapse; }
    .article-content th,
    .article-content td { padding: 10px 12px; border: 1px solid var(--color-border); }
    .article-content th { background: var(--color-surface-alt); }

    /* Formatação gerada pelo editor (Quill) */
    .article-content .ql-align-center { text-align: center; }
    .article-content .ql-align-right { text-align: right; }
    .article-content .ql-align-justify { text-align: justify; }
    .article-content .ql-size-small { font-size: .8em; }
    .article-content .ql-size-large { font-size: 1.4em; }
    .article-content .ql-size-huge { font-size: 2em; }
    .article-content .ql-indent-1 { padding-left: 3em; }
    .article-content .ql-indent-2 { padding-left: 6em; }
    .article-content .ql-indent-3 { padding-left: 9em; }
    .article-content li.ql-indent-1 { padding-left: 3.25em; }
    .article-content li.ql-indent-2 { padding-left: 6.25em; }

    /* Blocos de comando / código */
    .article-content .code-block {
        margin: 1.3em 0;
        overflow: hidden;
        color: #e6e9f5;
        background: #0d1222;
        border: 1px solid #252d47;
        border-radius: 12px;
        box-shadow: 0 8px 22px rgba(13, 18, 34, 0.18);
    }

    .article-content .code-block-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 10px 8px 16px;
        color: #8d97b3;
        background: #151c33;
        border-bottom: 1px solid #252d47;
        font-size: .72rem;
        font-weight: 700;
        letter-spacing: .08em;
        text-transform: uppercase;
    }

    .article-content .code-block-copy {
        padding: 5px 12px;
        color: #d5daf0;
        background: rgba(255, 255, 255, .08);
        border: 1px solid rgba(255, 255, 255, .12);
        border-radius: 8px;
        font-size: .74rem;
        font-weight: 600;
        letter-spacing: 0;
        text-transform: none;
        cursor: pointer;
        transition: background-color 140ms ease, color 140ms ease;
    }

    .article-content .code-block-copy:hover { background: rgba(255, 255, 255, .16); color: #fff; }
    .article-content .code-block-copy.is-copied { color: #6ee7a8; border-color: rgba(110, 231, 168, .4); }

    .article-content .code-block-pre {
        margin: 0;
        padding: 16px 18px;
        overflow-x: auto;
        color: inherit;
        background: transparent !important;
        border: 0;
        border-radius: 0;
        font-family: 'JetBrains Mono', 'Cascadia Code', Consolas, 'Liberation Mono', monospace;
        font-size: .88rem;
        line-height: 1.7;
        tab-size: 4;
    }

    .article-content .code-block-pre code {
        display: block;
        padding: 0;
        color: inherit;
        background: transparent;
        font-size: inherit;
        white-space: pre;
    }

    .article-content .code-block-pre .hljs { background: transparent; padding: 0; }

    .article-state {
        padding: 28px;
        color: var(--color-muted);
        background: var(--color-surface);
        border: 1px dashed #cfd3e2;
        border-radius: var(--radius-md);
    }

    .article-attachments {
        margin-top: 20px;
        padding: 22px;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
    }

    .article-attachments h2 {
        display: flex;
        align-items: center;
        gap: 9px;
        margin: 0 0 14px;
        font-size: 1rem;
        font-weight: 700;
    }

    .article-attachments ul { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }

    .article-attachments li {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
        padding: 11px 12px;
        background: var(--color-surface-alt);
        border: 1px solid var(--color-border);
        border-radius: 12px;
    }

    .article-attachments li > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .article-attachments li > small { margin-left: auto; color: var(--color-muted); white-space: nowrap; }

    .article-attachments .btn { display: inline-flex; align-items: center; gap: 6px; }
</style>
