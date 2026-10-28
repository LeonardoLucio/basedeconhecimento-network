import axios from 'axios'
import { userKey } from '@/global'

const success = res => res
const error = err => {
    // Só encerra a sessão quando o TOKEN foi recusado. Um 401 de "senha incorreta"
    // (login ou troca de senha) não pode recarregar a página nem apagar a sessão.
    const sessionExpired = err.response?.status === 401 &&
        err.response?.data === 'Token inválido.'
    if (sessionExpired) {
        localStorage.removeItem(userKey)
        delete axios.defaults.headers.common.Authorization
        window.location.assign('/auth')
    }
    return Promise.reject(err)
}

axios.interceptors.response.use(success, error)
