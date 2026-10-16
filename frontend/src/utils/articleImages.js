import { baseApiUrl } from '@/global'

export function getProtectedArticleImageUrl(value) {
    if (!value) return null

    try {
        const apiBase = new URL(baseApiUrl, window.location.origin)
        const imageUrl = new URL(value, window.location.href)
        const basePath = apiBase.pathname.replace(/\/+$/, '')

        if (imageUrl.origin !== apiBase.origin) return null

        const route = imageUrl.pathname.slice(basePath.length)
        if (!route.startsWith('/') ||
            !/^\/articles\/[^/]+\/attachments\/\d+\/images\/\d+\.(png|jpg|gif|webp)$/i.test(route)) {
            return null
        }

        return imageUrl.href
    } catch {
        return null
    }
}
