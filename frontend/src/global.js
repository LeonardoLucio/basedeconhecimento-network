import { notifications } from './config/msgs'

export const userKey = '__knowledge_user'
export const baseApiUrl = import.meta.env.VITE_API_URL || '/api'

export function showError(e) {
    if(e && e.response && e.response.data) {
        notifications.global.defaultError({ msg : e.response.data })
    } else if(typeof e === 'string') {
        notifications.global.defaultError({ msg : e })
    } else {
        notifications.global.defaultError()
    }
}

export default { baseApiUrl, showError, userKey }
