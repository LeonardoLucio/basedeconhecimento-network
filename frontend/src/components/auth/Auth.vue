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
        min-height: min(760px, calc(100vh - 180px));
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .auth-card {
        position: relative;
        width: min(100%, 450px);
        padding: clamp(28px, 6vw, 46px);
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid var(--color-border);
        border-radius: 24px;
        box-shadow: var(--shadow-lg);
        backdrop-filter: blur(10px);
    }

    .auth-card::before {
        content: "";
        position: absolute;
        inset: 0 0 auto;
        height: 5px;
        border-radius: 24px 24px 0 0;
        background: linear-gradient(90deg, #7272ec, #4747c2, #33a1ff);
    }

    .auth-brand {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 34px;
        color: var(--color-primary-dark);
        font-size: 0.92rem;
        font-weight: 700;
    }

    .auth-brand img { width: 30px; height: 30px; border-radius: 9px; }

    .auth-intro > span {
        color: var(--color-primary);
        font-size: 0.69rem;
        font-weight: 700;
        letter-spacing: 0.14em;
    }

    .auth-intro h1 {
        margin: 8px 0;
        color: var(--color-ink);
        font-size: 1.85rem;
        font-weight: 750;
        letter-spacing: -0.04em;
    }

    .auth-intro p { color: var(--color-muted); font-size: 0.92rem; margin: 0; }

    .auth-form { display: grid; gap: 9px; margin-top: 26px; }

    .auth-form label { margin-top: 8px; color: #344054; font-size: 0.83rem; font-weight: 600; }

    .auth-form input {
        width: 100%;
        min-height: 48px;
        padding: 10px 14px;
        color: var(--color-text);
        background: var(--color-surface);
        border: 1px solid #d5d9e5;
        border-radius: 11px;
        transition: border-color 140ms ease, box-shadow 140ms ease;
    }

    .auth-form input:focus {
        outline: 0;
        border-color: #8f8fe8;
        box-shadow: 0 0 0 4px rgba(91, 91, 214, 0.14);
    }

    .auth-form input::placeholder { color: #98a2b3; }

    .auth-submit {
        min-height: 50px;
        margin-top: 16px;
        color: #fff;
        background: linear-gradient(135deg, #6a6ae3, #4747c2);
        border: 0;
        border-radius: 11px;
        box-shadow: 0 8px 18px rgba(91, 91, 214, 0.32);
        font-weight: 650;
        transition: transform 120ms ease, box-shadow 160ms ease, opacity 160ms ease;
    }

    .auth-submit:hover:not(:disabled) { box-shadow: 0 10px 24px rgba(91, 91, 214, 0.4); transform: translateY(-1px); }
    .auth-submit:disabled { opacity: 0.65; }
</style>
