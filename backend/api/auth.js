const { authSecret } = require('../config/environment')
const jwt = require('jwt-simple')
const bcrypt = require('bcryptjs')
const rateLimit = require('express-rate-limit')

const TOKEN_ALGORITHM = 'HS256'
const TOKEN_LIFETIME_SECONDS = 60 * 60 * 24
const MIN_PASSWORD_LENGTH = 12
const MAX_PASSWORD_LENGTH = 128

// Hash usado para gastar o mesmo tempo quando o e-mail não existe
// (evita descobrir e-mails válidos medindo o tempo de resposta).
const dummyHash = bcrypt.hashSync('senha-inexistente-para-tempo-constante', 12)

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: 'Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.'
})

const passwordChangeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
})

module.exports = app => {
    const signin = async (req, res) => {
        const { email, password } = req.body || {}
        if (typeof email !== 'string' || typeof password !== 'string' || !email || !password ||
            email.length > 255 || password.length > MAX_PASSWORD_LENGTH) {
            return res.status(400).send('Informe e-mail e senha!')
        }

        try {
            const user = await app.db('users')
                .where({ email: email.trim() })
                .whereNull('deletedAt')
                .first()

            const isMatch = await bcrypt.compare(password, user ? user.password : dummyHash)
            if (!user || !isMatch) return res.status(401).send('E-mail ou senha inválidos!')

            const now = Math.floor(Date.now() / 1000)
            const payload = {
                id: user.id,
                name: user.name,
                email: user.email,
                admin: user.admin,
                mustChangePassword: Boolean(user.mustChangePassword),
                iat: now,
                exp: now + TOKEN_LIFETIME_SECONDS
            }

            return res.json({
                ...payload,
                token: jwt.encode(payload, authSecret, TOKEN_ALGORITHM)
            })
        } catch (error) {
            console.error('Falha ao autenticar:', error)
            return res.status(500).send('Não foi possível entrar agora.')
        }
    }

    const validateToken = async (req, res) => {
        const userData = req.body || null
        try {
            if (typeof userData?.token === 'string') {
                const token = jwt.decode(userData.token, authSecret, false, TOKEN_ALGORITHM)
                if (token.exp * 1000 > Date.now()) {
                    const user = await app.db('users')
                        .where({ id: token.id })
                        .whereNull('deletedAt')
                        .first('id', 'name', 'email', 'admin', 'mustChangePassword')
                    if (user) return res.json({ valid: true, user })
                }
            }
        } catch(e) {
            // token inválido ou expirado
        }

        res.json({ valid: false })
    }

    const changePassword = async (req, res) => {
        const { password, confirmPassword, currentPassword } = req.body || {}
        if (typeof password !== 'string' || Array.from(password).length < MIN_PASSWORD_LENGTH) {
            return res.status(400).send(`A nova senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`)
        }
        if (password.length > MAX_PASSWORD_LENGTH) {
            return res.status(400).send(`A senha deve ter no máximo ${MAX_PASSWORD_LENGTH} caracteres.`)
        }
        if (password !== confirmPassword) {
            return res.status(400).send('As senhas não conferem.')
        }

        try {
            const user = await app.db('users').where({ id: req.user.id }).first()
            if (!user) return res.status(401).send('Usuário não encontrado.')
            if (!user.mustChangePassword) {
                if (typeof currentPassword !== 'string' ||
                    !await bcrypt.compare(currentPassword, user.password)) {
                    return res.status(401).send('A senha atual está incorreta.')
                }
            }
            if (await bcrypt.compare(password, user.password)) {
                return res.status(400).send('Escolha uma senha diferente da atual.')
            }
            await app.db('users').where({ id: req.user.id }).update({
                password: await bcrypt.hash(password, 12),
                mustChangePassword: false
            })
            return res.status(204).send()
        } catch (error) {
            console.error('Falha ao alterar senha:', error)
            return res.status(500).send('Não foi possível alterar a senha.')
        }
    }

    return { signin, validateToken, changePassword, loginLimiter, passwordChangeLimiter }
}
