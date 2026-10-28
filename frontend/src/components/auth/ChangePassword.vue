<template>
    <div class="auth-content">
        <section class="auth-card">
            <div class="auth-brand"><img src="/favicon.svg" alt="" /> Base de Conhecimento</div>
            <div class="auth-intro">
                <span>PRIMEIRO ACESSO</span>
                <h1>Crie sua senha pessoal</h1>
                <p>Por segurança, troque a senha temporária antes de continuar.</p>
            </div>
            <form class="auth-form" @submit.prevent="changePassword">
                <label for="new-password">Nova senha</label>
                <input id="new-password" v-model="password" type="password"
                    autocomplete="new-password" minlength="12" required>
                <label for="confirm-password">Confirme a nova senha</label>
                <input id="confirm-password" v-model="confirmPassword" type="password"
                    autocomplete="new-password" minlength="12" required>
                <button class="auth-submit" type="submit" :disabled="submitting">
                    {{ submitting ? 'Salvando...' : 'Trocar senha e continuar' }}
                </button>
            </form>
        </section>
    </div>
</template>

<script>
import axios from 'axios'
import { baseApiUrl, showError, userKey } from '@/global'
import { useAppStore } from '@/config/store'

export default {
    name: 'ChangePassword',
    data: () => ({ password: '', confirmPassword: '', submitting: false }),
    methods: {
        async changePassword() {
            if (this.password.length < 12) {
                this.$toasted.global.defaultError({ msg: 'Use pelo menos 12 caracteres.' })
                return
            }
            if (this.password !== this.confirmPassword) {
                this.$toasted.global.defaultError({ msg: 'As senhas não conferem.' })
                return
            }
            this.submitting = true
            try {
                await axios.post(`${baseApiUrl}/account/change-password`, {
                    password: this.password,
                    confirmPassword: this.confirmPassword
                })
                localStorage.removeItem(userKey)
                useAppStore().setUser(null)
                this.$toasted.global.defaultSuccess({ msg: 'Senha alterada. Entre novamente com sua nova senha.' })
                this.$router.push({ name: 'auth' })
            } catch (error) {
                showError(error)
            } finally {
                this.submitting = false
            }
        }
    }
}
</script>

<style>
.auth-card { min-width: min(100%, 440px); }
</style>
