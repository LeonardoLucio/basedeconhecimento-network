import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

export const notifications = {
    global: {
        defaultSuccess(payload = {}) {
            return toast.success(payload.msg || 'Operação realizada com sucesso!', {
                autoClose: 3000
            })
        },
        defaultError(payload = {}) {
            return toast.error(payload.msg || 'Oops.. Erro inesperado.', {
                autoClose: 3000
            })
        }
    }
}

export function install(app) {
    app.config.globalProperties.$toasted = notifications
}