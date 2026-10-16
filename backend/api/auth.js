const { authSecret } = require('../config/environment')
const jwt = require('jwt-simple')
const bcrypt = require('bcryptjs')

module.exports = app => {
    const signin = async (req, res) => {
        if (!req.body.email || !req.body.password) {
            return res.status(400).send('Informe usuário e senha!')
        }

        const user = await app.db('users')
            .where({ email: req.body.email })
            .first()

        if (!user) return res.status(400).send('Usuário não encontrado!')

        const isMatch = bcrypt.compareSync(req.body.password, user.password)
        if (!isMatch) return res.status(401).send('Email/Senha inválidos!')

        const now = Math.floor(Date.now() / 1000)

        const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
            admin: user.admin,
            mustChangePassword: Boolean(user.mustChangePassword),
            iat: now,
            exp: now + (60 * 60 * 24 * 3)
        }

        res.json({
            ...payload,
            token: jwt.encode(payload, authSecret)
        })
    }

    const validateToken = async (req, res) => {
        const userData = req.body || null
        try {
            if(userData) {
                const token = jwt.decode(userData.token, authSecret)
                if(new Date(token.exp * 1000) > new Date()) {
                    return res.send(true)
                }
            }
        } catch(e) {
            // problema com o token
        }

        res.send(false)
    }

    const changePassword = async (req, res) => {
        const { password, confirmPassword, currentPassword } = req.body
        if (typeof password !== 'string' || Array.from(password).length < 12) {
            return res.status(400).send('A nova senha deve ter pelo menos 12 caracteres.')
        }
        if (password !== confirmPassword) {
            return res.status(400).send('As senhas não conferem.')
        }

        try {
            const user = await app.db('users').where({ id: req.user.id }).first()
            if (!user) return res.status(401).send('Usuário não encontrado.')
            if (!user.mustChangePassword) {
                if (!currentPassword || !bcrypt.compareSync(currentPassword, user.password)) {
                    return res.status(401).send('A senha atual está incorreta.')
                }
            }
            await app.db('users').where({ id: req.user.id }).update({
                password: bcrypt.hashSync(password, bcrypt.genSaltSync(12)),
                mustChangePassword: false
            })
            return res.status(204).send()
        } catch (error) {
            console.error('Falha ao alterar senha:', error)
            return res.status(500).send('Não foi possível alterar a senha.')
        }
    }

    return { signin, validateToken, changePassword }
}
