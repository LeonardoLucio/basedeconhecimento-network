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
            this.user = {}
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
        loadUser(user, mode = 'save') {
            this.mode = mode
            this.user = { ...user }
        }
    },
    mounted() {
        this.loadUsers()
    }
}
</script>

<style>.admin-form-heading{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:20px;padding:18px 20px;border:1px solid var(--color-border);border-radius:14px;background:linear-gradient(120deg,#f5f7ff,#fff)}.admin-form-heading h3{margin:0;color:#202b45;font-size:1.08rem;font-weight:700}.admin-form-heading p{margin:5px 0 0;color:var(--color-muted);font-size:.87rem}.admin-mode-badge{padding:6px 10px;border-radius:999px;color:var(--color-primary-dark);background:#e9edff;font-size:.78rem;font-weight:700;white-space:nowrap}.admin-confirm-backdrop{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:20px;background:rgba(16,24,40,.52)}.admin-confirm-dialog{width:min(100%,440px);padding:24px;border:1px solid var(--color-border);border-radius:16px;background:#fff;box-shadow:0 24px 64px rgba(16,24,40,.24)}.admin-confirm-dialog h3{margin:0 0 8px;font-size:1.12rem;font-weight:700}.admin-confirm-dialog p{color:var(--color-muted)}.admin-confirm-dialog>div{display:flex;justify-content:flex-end;gap:10px}</style>
