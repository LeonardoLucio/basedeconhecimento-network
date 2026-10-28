<template>
    <div class="user-admin">
        <div v-if="pendingDelete" class="admin-confirm-backdrop" @click.self="pendingDelete = null">
            <section class="admin-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-user-title">
                <h3 id="delete-user-title">Excluir usuário?</h3>
                <p>O acesso de {{ pendingDelete.name }} será removido.</p>
                <div><button class="btn btn-light" type="button" @click="pendingDelete = null">Cancelar</button>
                    <button class="btn btn-danger" type="button" @click="remove(pendingDelete)">Excluir usuário</button></div>
            </section>
        </div>
        <form @submit.prevent="save">
            <div class="admin-form-heading"><div><h3>{{ user.id ? 'Editar usuário' : 'Novo usuário' }}</h3><p>Gerencie acesso e permissões da equipe.</p></div><span class="admin-mode-badge">{{ user.id ? `#${user.id}` : 'Novo cadastro' }}</span></div>
            <input id="user-id" type="hidden" v-model="user.id" />
            <div class="row">
                <div class="col-12 col-md-6">
                    <div class="mb-3">
                        <label class="form-label" for="user-name">Nome:</label>
                        <input id="user-name" class="form-control" type="text"
                            v-model="user.name" required
                            :readonly="mode === 'remove'"
                            placeholder="Informe o Nome do Usuário..." />
                    </div>
                </div>
                <div class="col-12 col-md-6">
                    <div class="mb-3">
                        <label class="form-label" for="user-email">E-mail:</label>
                        <input id="user-email" class="form-control" type="email"
                            v-model="user.email" required
                            :readonly="mode === 'remove'"
                            placeholder="Informe o E-mail do Usuário..." />
                    </div>
                </div>
            </div>
            <div class="form-check mt-3 mb-3" v-show="mode === 'save'">
                <input id="user-admin" v-model="user.admin"
                    class="form-check-input" type="checkbox">
                <label class="form-check-label" for="user-admin">Administrador?</label>
            </div>
            <section v-if="mode === 'save' && !user.admin" class="category-access-panel">
                <div class="category-access-heading">
                    <div>
                        <h4>Categorias disponíveis</h4>
                        <p>O usuário verá as categorias selecionadas e suas subcategorias.</p>
                    </div>
                    <div class="category-access-actions">
                        <button class="btn btn-sm btn-outline-primary" type="button"
                            @click="selectAllCategories">Selecionar todas</button>
                        <button class="btn btn-sm btn-outline-secondary" type="button"
                            @click="user.categoryIds = []">Limpar</button>
                    </div>
                </div>
                <div v-if="categories.length" class="category-access-list">
                    <label v-for="category in categories" :key="category.id"
                        class="category-access-option">
                        <input class="form-check-input" type="checkbox"
                            :checked="user.categoryIds?.includes(Number(category.id))"
                            @change="setCategoryAccess(category.id, $event.target.checked)">
                        <span>{{ category.path }}</span>
                    </label>
                </div>
                <p v-else class="category-access-empty">Nenhuma categoria cadastrada.</p>
                <small v-if="!user.categoryIds?.length" class="category-access-warning">
                    Sem categorias selecionadas, o usuário não verá artigos.
                </small>
            </section>
            <div class="row" v-show="mode === 'save'">
                <div class="col-12 col-md-6">
                    <div class="mb-3">
                        <label class="form-label" for="user-password">Senha:</label>
                        <input id="user-password" class="form-control" type="password"
                            v-model="user.password" :required="!user.id"
                            placeholder="Informe a Senha do Usuário..." />
                        <small v-if="!user.id" class="form-text text-muted">
                            Senha temporária: o usuário deverá criar uma senha pessoal no primeiro acesso.
                        </small>
                    </div>
                </div>
                <div class="col-12 col-md-6">
                    <div class="mb-3">
                        <label class="form-label" for="user-confirm-password">
                            Confirmação de Senha:
                        </label>
                        <input id="user-confirm-password" class="form-control" type="password"
                            v-model="user.confirmPassword" :required="!user.id"
                            placeholder="Confirme a Senha do Usuário..." />
                    </div>
                </div>
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
                    <tr><th>Código</th><th>Nome</th><th>E-mail</th><th>Administrador</th><th>Ações</th></tr>
                </thead>
                <tbody>
                    <tr v-for="item in users" :key="item.id">
                        <td>{{ item.id }}</td>
                        <td>{{ item.name }}</td>
                        <td>{{ item.email }}</td>
                        <td>{{ item.admin ? 'Sim' : 'Não' }}</td>
                        <td class="text-nowrap">
                            <button class="btn btn-light btn-sm me-2" type="button"
                                aria-label="Editar usuário" @click="loadUser(item)">
                                <Pencil :size="16" />
                            </button>
                            <button class="btn btn-light btn-sm text-danger" type="button"
                                aria-label="Excluir usuário"
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

export default {
    name: 'UserAdmin',
    components: { Pencil, Trash2 },
    data: function() {
        return {
            mode: 'save',
            user: {},
            pendingDelete: null,
            users: [],
            categories: [],
            fields: [
                { key: 'id', label: 'Código', sortable: true },
                { key: 'name', label: 'Nome', sortable: true },
                { key: 'email', label: 'E-mail', sortable: true },
                { key: 'admin', label: 'Administrador', sortable: true }
            ]
        }
    },
    methods: {
        loadUsers() {
            const url = `${baseApiUrl}/users`
            axios.get(url).then(res => {
                this.users = res.data
            }).catch(showError)
        },
        reset() {
            this.mode = 'save'
            this.user = { admin: false, categoryIds: [] }
            this.loadUsers()
        },
        save() {
            const method = this.user.id ? 'put' : 'post'
            const id = this.user.id ? `/${this.user.id}` : ''
            axios[method](`${baseApiUrl}/users${id}`, this.user)
                .then(() => {
                    this.$toasted.global.defaultSuccess()
                    this.reset()
                })
                .catch(showError)
        },
        remove(user) {
            const id = user.id
            axios.delete(`${baseApiUrl}/users/${id}`)
                .then(() => {
                    this.pendingDelete = null
                    this.$toasted.global.defaultSuccess()
                    this.reset()
                })
                .catch(showError)
        },
        async loadUser(user, mode = 'save') {
            this.mode = mode
            if (mode === 'remove') {
                this.user = { ...user }
                return
            }
            try {
                const response = await axios.get(`${baseApiUrl}/users/${user.id}`)
                this.user = {
                    ...response.data,
                    categoryIds: (response.data.categoryIds || []).map(Number)
                }
            } catch (error) {
                showError(error)
            }
        },
        loadCategories() {
            axios.get(`${baseApiUrl}/categories`)
                .then(response => { this.categories = response.data })
                .catch(showError)
        },
        selectAllCategories() {
            this.user.categoryIds = this.categories.map(category => Number(category.id))
        },
        setCategoryAccess(categoryId, enabled) {
            const selected = new Set((this.user.categoryIds || []).map(Number))
            if (enabled) selected.add(Number(categoryId))
            else selected.delete(Number(categoryId))
            this.user.categoryIds = [...selected]
        }
    },
    mounted() {
        this.user = { admin: false, categoryIds: [] }
        this.loadUsers()
        this.loadCategories()
    }
}
</script>

<style>
.category-access-panel{margin:18px 0 22px;padding:18px;border:1px solid var(--color-border);border-radius:12px;background:#f8f9fc}.category-access-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:12px}.category-access-heading h4{margin:0;color:#202b45;font-size:.96rem;font-weight:700}.category-access-heading p{margin:4px 0 0;color:var(--color-muted);font-size:.82rem}.category-access-actions{display:flex;gap:8px;flex-wrap:wrap}.category-access-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:6px;max-height:250px;overflow:auto;padding:4px}.category-access-option{display:flex;align-items:flex-start;gap:9px;padding:8px 10px;border:1px solid transparent;border-radius:8px;background:#fff;font-size:.84rem;cursor:pointer}.category-access-option:hover{border-color:#c7cffb;background:#f5f6ff}.category-access-option .form-check-input{flex:none;margin-top:3px}.category-access-empty,.category-access-warning{display:block;margin:10px 0 0;color:#8a4b12;font-size:.8rem}
@media(max-width:575.98px){.category-access-heading{flex-direction:column}}
</style>
