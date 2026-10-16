<template>
    <div class="category-admin">
        <div v-if="pendingDelete" class="admin-confirm-backdrop" @click.self="pendingDelete = null">
            <section class="admin-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-category-title">
                <h3 id="delete-category-title">Excluir categoria?</h3>
                <p>“{{ pendingDelete.path || pendingDelete.name }}” será removida permanentemente.</p>
                <div><button class="btn btn-light" type="button" @click="pendingDelete = null">Cancelar</button>
                    <button class="btn btn-danger" type="button" @click="remove(pendingDelete)">Excluir categoria</button></div>
            </section>
        </div>
        <form @submit.prevent="save">
            <div class="admin-form-heading">
                <div>
                    <h3>{{ mode === 'remove' ? 'Excluir categoria' : category.id ? 'Editar categoria' : 'Nova categoria' }}</h3>
                    <p>Organize artigos em uma hierarquia simples de categorias.</p>
                </div>
                <span class="admin-mode-badge">{{ category.id ? `#${category.id}` : 'Nova categoria' }}</span>
            </div>
            <input id="category-id" type="hidden" v-model="category.id" />
            <div class="mb-3">
                <label class="form-label" for="category-name">Nome:</label>
                <input id="category-name" class="form-control" type="text"
                    v-model="category.name" required
                    :readonly="mode === 'remove'"
                    placeholder="Informe o Nome da Categoria..." />
            </div>
            <div class="mb-3">
                <label class="form-label" for="category-parentId">Categoria Pai:</label>
                <select v-if="mode === 'save'"
                    id="category-parentId"
                    class="form-select" v-model="category.parentId">
                    <option :value="null">Sem categoria pai</option>
                    <option v-for="option in categories" :key="option.id"
                        :value="option.id">{{ option.path }}</option>
                </select>
                <input v-else
                    id="category-parentId" class="form-control" type="text"
                    v-model="category.path"
                    readonly />
            </div>
            <button class="btn btn-primary" type="submit" v-if="mode === 'save'">
                Salvar
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
                    <tr><th>Código</th><th>Nome</th><th>Caminho</th><th>Ações</th></tr>
                </thead>
                <tbody>
                    <tr v-for="item in categories" :key="item.id">
                        <td>{{ item.id }}</td>
                        <td>{{ item.name }}</td>
                        <td>{{ item.path }}</td>
                        <td class="text-nowrap">
                            <button class="btn btn-light btn-sm me-2" type="button"
                                aria-label="Editar categoria"
                                @click="loadCategory(item)">
                                <Pencil :size="16" />
                            </button>
                            <button class="btn btn-light btn-sm text-danger" type="button"
                                aria-label="Excluir categoria"
                                @click="pendingDelete = item">
                                <Trash2 :size="16" />
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script>
import { baseApiUrl, showError } from '@/global'
import axios from 'axios'
import { Pencil, Trash2 } from '@lucide/vue'
import { useAppStore } from '@/config/store'

export default {
    name: 'CategoryAdmin',
    components: { Pencil, Trash2 },
    data: function() {
        return {
            mode: 'save',
            category: {},
            pendingDelete: null,
            categories: [],
            fields: [
                { key: 'id', label: 'Código', sortable: true },
                { key: 'name', label: 'Nome', sortable: true },
                { key: 'path', label: 'Caminho', sortable: true },
                { key: 'actions', label: 'Ações' }
            ]
        }
    },
    methods: {
        loadCategories() {
            const url = `${baseApiUrl}/categories`
            axios.get(url).then(res => {
                this.categories = res.data.map(category => {
                    return { ...category, value: category.id, text: category.path }
                })
            }).catch(showError)
        },
        reset() {
            this.mode = 'save'
            this.category = {}
            this.loadCategories()
        },
        save() {
            const method = this.category.id ? 'put' : 'post'
            const id = this.category.id ? `/${this.category.id}` : ''
            axios[method](`${baseApiUrl}/categories${id}`, this.category)
                .then(async () => {
                    await useAppStore().loadCategoryTree()
                    this.$toasted.global.defaultSuccess()
                    this.reset()
                })
                .catch(showError)
        },
        remove(category) {
            const id = category.id
            axios.delete(`${baseApiUrl}/categories/${id}`)
                .then(async () => {
                    await useAppStore().loadCategoryTree()
                    this.pendingDelete = null
                    this.$toasted.global.defaultSuccess()
                    this.reset()
                })
                .catch(showError)
        },
        loadCategory(category, mode = 'save') {
            this.mode = mode
            this.category = { ...category }
        }
    },
    mounted() {
        this.loadCategories()
    }
}
</script>

<style>
.admin-form-heading { display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:20px; padding:18px 20px; border:1px solid var(--color-border); border-radius:14px; background:linear-gradient(120deg,#f5f7ff,#fff); }
.admin-form-heading h3 { margin:0; color:#202b45; font-size:1.08rem; font-weight:700; }
.admin-form-heading p { margin:5px 0 0; color:var(--color-muted); font-size:.87rem; }
.admin-mode-badge { padding:6px 10px; border-radius:999px; color:var(--color-primary-dark); background:#e9edff; font-size:.78rem; font-weight:700; white-space:nowrap; }
.admin-confirm-backdrop { position:fixed; inset:0; z-index:1200; display:grid; place-items:center; padding:20px; background:rgba(16,24,40,.52); }
.admin-confirm-dialog { width:min(100%,440px); padding:24px; border:1px solid var(--color-border); border-radius:16px; background:#fff; box-shadow:0 24px 64px rgba(16,24,40,.24); }
.admin-confirm-dialog h3 { margin:0 0 8px; font-size:1.12rem; font-weight:700; }
.admin-confirm-dialog p { color:var(--color-muted); }
.admin-confirm-dialog > div { display:flex; justify-content:flex-end; gap:10px; }
</style>
