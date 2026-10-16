<template>
    <div class="auth-content">
        <div class="auth-card">
            <div class="auth-brand"><img src="/favicon.svg" alt="" /> Base de Conhecimento</div>
            <div class="auth-intro">
                <span>BEM-VINDO DE VOLTA</span>
                <h1>Acesse sua conta</h1>
                <p>Entre para acessar sua biblioteca de conhecimento.</p>
            </div>
            <form class="auth-form" @submit.prevent="signin">
                <label for="auth-email">E-mail</label>
                <input id="auth-email" v-model.trim="user.email" name="email"
                    type="email" autocomplete="email" placeholder="voce@exemplo.com" required>
                <label for="auth-password">Senha</label>
                <input id="auth-password" v-model="user.password" name="password"
                    type="password" autocomplete="current-password"
                    placeholder="Sua senha" required>
                <button class="auth-submit" type="submit" :disabled="submitting">
                    {{ submitting ? 'Aguarde...' : 'Entrar' }}
                </button>
            </form>
        </div>
    </div>
</template>

<script>
import { baseApiUrl, showError, userKey } from '@/global'
import axios from 'axios'
import { useAppStore } from '@/config/store'

export default {
    name: 'Auth',
    components: {},
    data: function() {
        return {
            user: {},
            submitting: false
        }
    },
    methods: {
        async signin() {
            this.submitting = true
            try {
                const res = await axios.post(`${baseApiUrl}/signin`, this.user)
                    useAppStore().setUser(res.data)
                    localStorage.setItem(userKey, JSON.stringify(res.data))
                    this.$router.push({
                        name: res.data.mustChangePassword ? 'changePassword' : 'home'
                    })
            } catch (error) {
                showError(error)
            } finally {
                this.submitting = false
            }
        },
    }
}
</script>

<style>
    .auth-content {
        min-height: min(720px, calc(100vh - 180px));
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .auth-card {
        width: min(100%, 440px);
        padding: clamp(26px, 6vw, 42px);
        background: #fff;
        border: 1px solid var(--color-border);
        border-radius: 22px;
        box-shadow: 0 18px 48px rgba(16, 24, 40, 0.08);
    }

    .auth-brand {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 36px;
        color: var(--color-primary);
        font-size: 0.9rem;
        font-weight: 700;
    }

    .auth-brand img { width:28px; height:28px; }

    .auth-intro > span {
        color: var(--color-primary);
        font-size: 0.69rem;
        font-weight: 700;
        letter-spacing: 0.12em;
    }

    .auth-intro h1 {
        margin: 8px 0;
        font-size: 1.75rem;
        font-weight: 700;
        letter-spacing: -0.04em;
    }

    .auth-intro p,
    .auth-switch {
        color: var(--color-muted);
        font-size: 0.9rem;
    }

    .auth-form {
        display: grid;
        gap: 9px;
        margin-top: 26px;
    }

    .auth-form label {
        margin-top: 8px;
        color: #344054;
        font-size: 0.83rem;
        font-weight: 600;
    }

    .auth-form input {
        width: 100%;
        min-height: 46px;
        padding: 10px 13px;
        color: #172033;
        background: #fff;
        border: 1px solid #d0d5dd;
        border-radius: 10px;
    }

    .auth-form input::placeholder {
        color: #98a2b3;
    }

    .auth-submit {
        min-height: 48px;
        margin-top: 14px;
        color: white;
        background: var(--color-primary);
        border: 0;
        border-radius: 10px;
        font-weight: 600;
    }

    .auth-submit:hover:not(:disabled) {
        background: var(--color-primary-dark);
    }

    .auth-submit:disabled {
        opacity: 0.65;
    }

    .auth-switch {
        margin: 22px 0 0;
        text-align: center;
    }

    .auth-switch button {
        padding: 0;
        color: var(--color-primary);
        background: transparent;
        border: 0;
        font-weight: 600;
    }
</style>
