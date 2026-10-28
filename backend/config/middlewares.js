const express = require('express')
const cors = require('cors')
const helmet = require('helmet')

module.exports = app => {
    app.disable('x-powered-by')
    // O backend recebe as requisições do Nginx do frontend (1 proxy). Se houver
    // outro proxy reverso na frente (Caddy, Nginx Proxy Manager...), defina
    // TRUST_PROXY_HOPS=2 para o limitador de tentativas ver o IP real do cliente.
    app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS || 1))

    app.use(helmet({
        // A API só devolve JSON/arquivos; nada deve ser executado a partir dela.
        contentSecurityPolicy: {
            directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] }
        },
        crossOriginResourcePolicy: { policy: 'same-site' }
    }))

    // Em produção o navegador acessa a API pelo mesmo domínio (/api), então
    // CORS fica desativado. Para liberar origens específicas em desenvolvimento
    // defina CORS_ORIGINS="http://localhost:5173,https://meu.dominio".
    const allowedOrigins = (process.env.CORS_ORIGINS || '')
        .split(',').map(origin => origin.trim()).filter(Boolean)
    if (allowedOrigins.length) {
        app.use(cors({ origin: allowedOrigins, credentials: false }))
    }

    app.use(express.json({ limit: '12mb' }))
}
