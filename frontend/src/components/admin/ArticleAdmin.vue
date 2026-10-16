<template>
    <div class="article-admin">
        <div v-if="pendingDelete" class="admin-confirm-backdrop" @click.self="pendingDelete = null">
            <section class="admin-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-article-title">
                <h3 id="delete-article-title">Excluir artigo?</h3>
                <p>“{{ pendingDelete.name }}” será removido permanentemente.</p>
                <div><button class="btn btn-light" type="button" @click="pendingDelete = null">Cancelar</button>
                    <button class="btn btn-danger" type="button" @click="remove(pendingDelete)">Excluir artigo</button></div>
            </section>
        </div>
        <form @submit.prevent="save">
            <div class="admin-form-heading">
                <div>
                    <h3>{{ article.id ? 'Editar artigo' : 'Novo artigo' }}</h3>
                    <p>Estruture o conteúdo, associe uma categoria e identifique a autoria.</p>
                </div>
                <span class="admin-mode-badge">{{ article.id ? `#${article.id}` : 'Rascunho' }}</span>
            </div>
            <p class="article-required-note">Preencha os quatro campos obrigatórios para salvar o artigo.</p>
            <input id="article-id" type="hidden" v-model="article.id" />
            <div class="mb-3">
                <label class="form-label" for="article-name">Nome <span class="required-mark">*</span></label>
                <input id="article-name" class="form-control" type="text"
                    v-model="article.name" required
                    :readonly="mode === 'remove'"
                    placeholder="Informe o Nome do Artigo..." />
            </div>
            <div class="mb-3">
                <label class="form-label" for="article-description">Descrição:</label>
                <input id="article-description" class="form-control" type="text"
                    v-model="article.description"
                    :readonly="mode === 'remove'"
                    placeholder="Opcional" />
            </div>
            <div v-if="mode === 'save'" class="mb-3">
                <label class="form-label" for="article-imageUrl">Imagem (URL):</label>
                <input id="article-imageUrl" class="form-control" type="text"
                    v-model="article.imageUrl"
                    :readonly="mode === 'remove'"
                    placeholder="Opcional" />
            </div>
            <div v-if="mode === 'save'" class="mb-3">
                <label class="form-label" for="article-categoryId">Categoria <span class="required-mark">*</span></label>
                <select id="article-categoryId" class="form-select" required
                    v-model="article.categoryId">
                    <option :value="null" disabled>Selecione uma categoria</option>
                    <option v-for="category in categories" :key="category.value"
                        :value="category.value">{{ category.text }}</option>
                </select>
            </div>
            <div v-if="mode === 'save'" class="mb-3">
                <label class="form-label" for="article-userId">Autor <span class="required-mark">*</span></label>
                <select id="article-userId" class="form-select" required v-model="article.userId">
                    <option :value="null" disabled>Selecione um autor</option>
                    <option v-for="user in users" :key="user.value"
                        :value="user.value">{{ user.text }}</option>
                </select>
            </div>
            <div v-if="mode === 'save'" class="mb-3">
                <label class="form-label">Conteúdo <span class="required-mark">*</span></label>
                <QuillEditor v-model:content="article.content"
                    content-type="html"
                    :toolbar="editorToolbar"
                    placeholder="Informe o Conteúdo do Artigo..."
                    @ready="setEditor"
                    @selection-change="rememberSelection" />
            </div>
            <div v-if="mode === 'save'" class="attachment-panel">
                <div>
                    <strong>Importar documento</strong>
                    <p>O documento será importado para o conteúdo antes de salvar. O original ficará anexado para download.</p>
                </div>
                <label class="btn btn-outline-primary file-picker"
                    :class="{ 'is-disabled': !editor || uploading || (!article.id && pendingFile) }">
                    <input
                        class="file-picker-input"
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        :disabled="!editor || uploading || (!article.id && pendingFile)"
                        @change="uploadAttachment"
                    >
                    <FileUp :size="16" />
                    {{ uploading ? 'Importando...' : pendingFile ? 'Documento carregado' : 'Selecionar arquivo' }}
                </label>
                <small v-if="pendingFile">Documento pronto. Salve o artigo para anexar o original.</small>
                <ul v-if="article.attachments?.length" class="attachment-list">
                    <li v-for="attachment in article.attachments" :key="attachment.id">
                        <FileText :size="16" />
                        <span>{{ attachment.originalName }}</span>
                        <small>{{ formatSize(attachment.size) }}</small>
                    </li>
                </ul>
            </div>
            <button class="btn btn-primary" type="submit" v-if="mode === 'save'" :disabled="uploading">
                {{ article.id ? 'Salvar alterações' : 'Salvar artigo' }}
            </button>
            <button class="btn btn-danger" type="button" v-if="mode === 'remove'"
                @click="remove">Excluir</button>
            <button class="btn btn-secondary ms-2" type="button"
                @click="reset">Cancelar</button>
        </form>
        <hr>
        <div class="table-responsive">
            <table class="table table-hover table-striped">
                <thead>
                    <tr><th>Código</th><th>Nome</th><th>Descrição</th><th>Ações</th></tr>
                </thead>
                <tbody>
                    <tr v-for="item in articles" :key="item.id">
                        <td>{{ item.id }}</td>
                        <td>{{ item.name }}</td>
                        <td>{{ item.description }}</td>
                        <td class="text-nowrap">
                            <button class="btn btn-light btn-sm me-2" type="button"
                                aria-label="Editar artigo" @click="loadArticle(item)">
                                <Pencil :size="16" />
                            </button>
                            <button class="btn btn-light btn-sm text-danger" type="button"
                                aria-label="Excluir artigo"
                                @click="pendingDelete = item">
                                <Trash2 :size="16" />
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="d-flex align-items-center justify-content-center gap-3">
            <button class="btn btn-outline-primary" :disabled="page <= 1"
                @click="page--">Anterior</button>
            <span>Página {{ page }} de {{ totalPages }}</span>
            <button class="btn btn-outline-primary" :disabled="page >= totalPages"
                @click="page++">Próxima</button>
        </div>
    </div>
</template>

<script>
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import { baseApiUrl, showError } from '@/global'
import axios from 'axios'
import { FileText, FileUp, Pencil, Trash2 } from '@lucide/vue'
import { markRaw } from 'vue'
import { getProtectedArticleImageUrl } from '@/utils/articleImages'

export default {
    name: 'ArticleAdmin',
    components: { QuillEditor, FileText, FileUp, Pencil, Trash2 },
    data: function() {
        return {
            mode: 'save',
            article: {},
            articles: [],
            categories: [],
            users: [],
            page: 1,
            limit: 0,
            count: 0,
            editor: null,
            uploading: false,
            pendingFile: null,
            lastSelection: null,
            imagePreviews: [],
            pendingDelete: null,
            pendingFileImported: false,
            editorToolbar: [
                ['bold', 'italic', 'underline', 'strike'],
                [{ header: [1, 2, 3, false] }],
                [{ size: ['small', false, 'large', 'huge'] }],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['blockquote', 'code-block'], ['link', 'image'], ['clean']
            ]
        }
    },
    computed: {
        totalPages() {
            return Math.max(1, Math.ceil(this.count / (this.limit || 1)))
        }
    },
    methods: {
        loadArticles() {
            const url = `${baseApiUrl}/articles?page=${this.page}`
            axios.get(url).then(res => {
                this.articles = res.data.data
                this.count = res.data.count
                this.limit = res.data.limit
            }).catch(showError)
        },
        reset() {
            this.mode = 'save'
            this.article = {}
            this.pendingFile = null
            this.pendingFileImported = false
            this.releaseImagePreviews()
            this.loadArticles()
        },
        async save() {
            const contentRoot = this.editor?.root
            const hasContent = Boolean(contentRoot?.textContent?.trim() || contentRoot?.querySelector('img'))
            if (!this.article.name?.trim() || !this.article.categoryId || !this.article.userId || !hasContent) {
                this.$toasted.global.defaultError({
                    msg: 'Preencha nome, categoria, autor e conteúdo antes de salvar.'
                })
                return
            }
            const isNew = !this.article.id
            const method = isNew ? 'post' : 'put'
            const id = isNew ? '' : `/${this.article.id}`
            const articleToSave = {
                ...this.article,
                content: this.restoreImageUrls(
                    this.editor?.root?.innerHTML || this.article.content || ''
                )
            }
            try {
                const res = await axios[method](`${baseApiUrl}/articles${id}`, articleToSave)
                if (isNew) {
                    this.article.id = res.data.id
                    this.article.attachments = []
                }
                this.loadArticles()
                if (this.pendingFile) {
                    const file = this.pendingFile
                    await this.uploadFile(file, this.pendingFileImported)
                    this.pendingFile = null
                    this.pendingFileImported = false
                    return
                }
                this.$toasted.global.defaultSuccess({
                    msg: isNew
                        ? 'Artigo salvo. Agora você pode importar documentos.'
                        : 'Artigo atualizado com sucesso!'
                })
            } catch (error) {
                showError(error)
            }
        },
        setEditor(editor) {
            this.editor = markRaw(editor)
        },
        rememberSelection(range) {
            if (range) this.lastSelection = { index: range.index, length: range.length }
        },
        async uploadAttachment(event) {
            const [file] = event.target.files
            event.target.value = ''
            if (!file) return

            if (!this.article.id) {
                if (this.pendingFile) {
                    this.$toasted.global.defaultError({ msg: 'Importe um documento por vez antes de salvar o artigo.' })
                    return
                }
                await this.previewAttachment(file)
                return
            }
            await this.uploadFile(file)
        },
        async previewAttachment(file) {
            this.uploading = true
            const formData = new FormData()
            formData.append('file', file)
            try {
                const { data } = await axios.post(`${baseApiUrl}/articles/attachments/preview`, formData)
                await this.appendExtractedContent(data, null, true)
                this.pendingFile = file
                this.pendingFileImported = true
                this.$toasted.global.defaultSuccess({ msg: 'Conteúdo importado. Revise o artigo e salve para anexar o documento original.' })
            } catch (error) {
                showError(error)
            } finally {
                this.uploading = false
            }
        },
        async uploadFile(file, alreadyImported = false) {
            this.uploading = true
            const formData = new FormData()
            formData.append('file', file)
            try {
                const { data } = await axios.post(
                    `${baseApiUrl}/articles/${this.article.id}/attachments`,
                    formData
                )
                this.article.attachments = [
                    ...(this.article.attachments || []),
                    data.attachment
                ]
                if (alreadyImported) {
                    for (const image of data.images || []) {
                        const preview = this.imagePreviews.find(item =>
                            item.source === `@@STAGED_IMAGE_${image.index}@@`
                        )
                        if (preview) {
                            preview.source = `${baseApiUrl}/articles/${this.article.id}/attachments/${data.attachment.id}/images/${image.index}.${image.extension}`
                        }
                    }
                } else {
                    await this.appendExtractedContent(data, data.attachment)
                }
                const articleToSave = {
                    ...this.article,
                    content: this.restoreImageUrls(this.editor.root.innerHTML)
                }
                await axios.put(`${baseApiUrl}/articles/${this.article.id}`, articleToSave)
                this.$toasted.global.defaultSuccess({
                    msg: data.images?.length && data.text
                        ? `Texto e ${data.images.length} imagem(ns) importados no Conteúdo.`
                        : data.images?.length
                            ? `${data.images.length} imagem(ns) importada(s) no Conteúdo.`
                            : 'Texto importado no Conteúdo e artigo salvo.'
                })
            } catch (error) {
                showError(error)
                if (this.article.attachments?.some(attachment => attachment.originalName === file.name)) {
                    this.$toasted.global.defaultError({
                        msg: 'O arquivo foi anexado, mas o conteúdo extraído não pôde ser salvo. Salve o artigo novamente.'
                    })
                }
            } finally {
                this.uploading = false
            }
        },
        async appendExtractedContent(extracted, attachment, isPreview = false) {
            if (!this.editor) throw new Error('O editor de conteúdo ainda não está pronto.')
            const images = extracted.images || []
            const index = Math.max(0, this.editor.getLength() - 1)
            if (extracted.html) {
                let html = extracted.html
                for (const image of images) {
                    const url = isPreview
                        ? `@@STAGED_IMAGE_${image.index}@@`
                        : `${baseApiUrl}/articles/${this.article.id}/attachments/${attachment.id}/images/${image.index}.${image.extension}`
                    const preview = isPreview
                        ? image.dataUrl
                        : await this.loadImagePreview(url)
                    if (isPreview) this.imagePreviews.push({ source: url, dataUrl: preview })
                    html = html.replaceAll(`@@KNOWLEDGE_IMAGE_${image.index}@@`, `<img src="${preview}" alt="Imagem importada" />`)
                }
                html = html.replace(/@@KNOWLEDGE_IMAGE_\d+@@/g, '')
                this.editor.clipboard.dangerouslyPasteHTML(index, `${index ? '<p><br></p>' : ''}${html}`, 'user')
                return
            }
            const normalizedText = (extracted.text || '').trim()
            if (normalizedText) this.editor.insertText(index, `${index ? '\n\n' : ''}${normalizedText}\n`, 'user')
            let imageIndex = index + (normalizedText ? normalizedText.length + (index ? 3 : 1) : 0)
            for (const image of images) {
                const url = isPreview
                    ? `@@STAGED_IMAGE_${image.index}@@`
                    : `${baseApiUrl}/articles/${this.article.id}/attachments/${attachment.id}/images/${image.index}.${image.extension}`
                const preview = isPreview ? image.dataUrl : await this.loadImagePreview(url)
                if (isPreview) this.imagePreviews.push({ source: url, dataUrl: preview })
                this.editor.insertEmbed(imageIndex++, 'image', preview, 'user')
                this.editor.insertText(imageIndex++, '\n', 'user')
            }
        },
        async loadImagePreview(imageUrl, sourceUrl = imageUrl) {
            const existingPreview = this.imagePreviews.find(preview =>
                preview.source === sourceUrl
            )
            if (existingPreview) return existingPreview.dataUrl

            const { data } = await axios.get(imageUrl, { responseType: 'blob' })
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result)
                reader.onerror = () => reject(reader.error)
                reader.readAsDataURL(data)
            })
            const preview = { source: sourceUrl, dataUrl }
            this.imagePreviews.push(preview)
            return preview.dataUrl
        },
        async prepareContentImages(content) {
            if (!content) return content
            const parsed = new DOMParser().parseFromString(content, 'text/html')
            for (const image of parsed.images) {
                if (image.src.startsWith('http://localhost:4000/')) {
                    image.src = image.src.replace('http://localhost:4000', baseApiUrl)
                }
            }
            const images = Array.from(parsed.images).filter(image =>
                getProtectedArticleImageUrl(image.getAttribute('src'))
            )
            await Promise.all(images.map(async image => {
                const sourceUrl = image.getAttribute('src')
                image.src = await this.loadImagePreview(
                    getProtectedArticleImageUrl(sourceUrl),
                    sourceUrl
                )
            }))
            return parsed.body.innerHTML
        },
        restoreImageUrls(content) {
            return this.imagePreviews.reduce(
                (html, preview) => html.split(preview.dataUrl).join(preview.source),
                content
            )
        },
        releaseImagePreviews() {
            this.imagePreviews = []
        },
        formatSize(size) {
            return size < 1024 * 1024
                ? `${Math.max(1, Math.round(size / 1024))} KB`
                : `${(size / (1024 * 1024)).toFixed(1)} MB`
        },
        remove(article) {
            const id = article.id
            axios.delete(`${baseApiUrl}/articles/${id}`)
                .then(() => {
                    this.pendingDelete = null
                    this.$toasted.global.defaultSuccess()
                    this.reset()
                })
                .catch(showError)
        },
        loadArticle(article, mode = 'save') {
            this.mode = mode
            if (mode === 'remove') {
                this.article = { ...article }
                return
            }
            axios.get(`${baseApiUrl}/articles/${article.id}`)
                .then(async res => {
                    this.releaseImagePreviews()
                    const loadedArticle = { ...res.data }
                    loadedArticle.content = await this.prepareContentImages(loadedArticle.content)
                    this.article = loadedArticle
                })
                .catch(showError)
        },
        loadCategories() {
            const url = `${baseApiUrl}/categories`
            axios.get(url).then(res => {
                this.categories = res.data.map(category => {
                    return { value: category.id, text: category.path }
                })
            }).catch(showError)
        },
        loadUsers() {
            const url = `${baseApiUrl}/users`
            axios.get(url).then(res => {
                this.users = res.data.map(user => {
                    return { value: user.id, text: `${user.name} - ${user.email}` }
                })
            }).catch(showError)
        }
    },
    watch: {
        page() {
            this.loadArticles()
        }
    },
    mounted() {
        this.loadUsers()
        this.loadCategories()
        this.loadArticles()
    },
    beforeUnmount() {
        this.releaseImagePreviews()
    }
}
</script>

<style>
    .editor-actions {
        margin-bottom: 8px;
    }

    .ql-editor pre.ql-syntax {
        color: #f8fafc;
        background: #090d14;
        border: 1px solid #263244;
        border-radius: 8px;
        padding: 14px 16px;
        font-family: 'Cascadia Code', Consolas, monospace;
        line-height: 1.6;
    }

    .article-required-note {
        margin-bottom: 18px;
        color: var(--color-muted);
        font-size: 0.86rem;
    }

    .required-mark { color:#c43232; font-weight:800; }

    .admin-form-heading { display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:20px; padding:18px 20px; border:1px solid var(--color-border); border-radius:14px; background:linear-gradient(120deg,#f5f7ff,#fff); }
    .admin-form-heading h3 { margin:0; color:#202b45; font-size:1.08rem; font-weight:700; }
    .admin-form-heading p { margin:5px 0 0; color:var(--color-muted); font-size:.87rem; }
    .admin-mode-badge { padding:6px 10px; border-radius:999px; color:var(--color-primary-dark); background:#e9edff; font-size:.78rem; font-weight:700; white-space:nowrap; }

    .admin-confirm-backdrop { position:fixed; inset:0; z-index:1200; display:grid; place-items:center; padding:20px; background:rgba(16,24,40,.52); }
    .admin-confirm-dialog { width:min(100%,440px); padding:24px; border:1px solid var(--color-border); border-radius:16px; background:#fff; box-shadow:0 24px 64px rgba(16,24,40,.24); }
    .admin-confirm-dialog h3 { margin:0 0 8px; font-size:1.12rem; font-weight:700; }
    .admin-confirm-dialog p { color:var(--color-muted); }
    .admin-confirm-dialog > div { display:flex; justify-content:flex-end; gap:10px; }

    .ql-editor .ql-code-block-container,
    .ql-editor .ql-code-block { color:#f8fafc; background:#090d14; font-family:'Cascadia Code',Consolas,monospace; }
    .ql-editor .ql-code-block-container { margin:8px 0; padding:12px 14px; border:1px solid #263244; border-radius:8px; }

    .editor-actions small {
        margin-left: 10px;
        color: var(--color-muted);
        font-size: 0.8rem;
    }

    .editor-actions .btn,
    .attachment-panel .btn,
    .file-picker {
        display: inline-flex;
        align-items: center;
        gap: 7px;
    }

    .file-picker {
        position: relative;
        overflow: hidden;
        margin: 0;
        cursor: pointer;
    }

    .file-picker.is-disabled {
        opacity: 0.65;
        cursor: not-allowed;
    }

    .file-picker-input {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: inherit;
    }

    .attachment-panel {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px 18px;
        margin: 20px 0;
        padding: 16px;
        background: #f8f9fc;
        border: 1px solid var(--color-border);
        border-radius: 12px;
    }

    .attachment-panel p {
        margin: 4px 0 0;
        color: var(--color-muted);
        font-size: 0.84rem;
    }

    .attachment-panel > small {
        grid-column: 1 / -1;
        color: var(--color-muted);
    }

    .attachment-list {
        grid-column: 1 / -1;
        display: grid;
        gap: 8px;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .attachment-list li {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        color: #344054;
        font-size: 0.86rem;
    }

    .attachment-list li span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .attachment-list li small {
        margin-left: auto;
        color: var(--color-muted);
    }

    @media (max-width: 575.98px) {
        .attachment-panel {
            grid-template-columns: 1fr;
        }
    }
</style>
