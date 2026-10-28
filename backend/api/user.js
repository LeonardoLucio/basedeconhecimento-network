const bcrypt = require('bcryptjs')

module.exports = app => {
    const { existsOrError, notExistsOrError, equalsOrError } = app.api.validation

    const MIN_PASSWORD_LENGTH = 12
    const MAX_PASSWORD_LENGTH = 128
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    const encryptPassword = password => bcrypt.hashSync(password, bcrypt.genSaltSync(12))

    const save = async (req, res) => {
        const user = {
            name: typeof req.body.name === 'string' ? req.body.name.trim() : req.body.name,
            email: typeof req.body.email === 'string' ? req.body.email.trim() : req.body.email,
            admin: Boolean(req.user?.admin && req.body.admin === true)
        }
        if (req.params.id) user.id = Number(req.params.id)
        const categoryIds = Array.isArray(req.body.categoryIds)
            ? [...new Set(req.body.categoryIds.map(Number))]
            : []

        try {
            if (req.params.id && (!Number.isInteger(user.id) || user.id <= 0)) {
                throw 'Usuário inválido.'
            }
            existsOrError(user.name, 'Nome não informado')
            existsOrError(user.email, 'E-mail não informado')
            if (typeof user.name !== 'string' || user.name.length > 255) {
                throw 'O nome deve ter no máximo 255 caracteres.'
            }
            if (typeof user.email !== 'string' || user.email.length > 255 || !emailPattern.test(user.email)) {
                throw 'E-mail inválido.'
            }
            if (!user.id || req.body.password) {
                const password = req.body.password
                existsOrError(password, 'Senha não informada')
                if (typeof password !== 'string' ||
                    Array.from(password).length < MIN_PASSWORD_LENGTH ||
                    password.length > MAX_PASSWORD_LENGTH) {
                    throw `A senha deve ter entre ${MIN_PASSWORD_LENGTH} e ${MAX_PASSWORD_LENGTH} caracteres.`
                }
                existsOrError(req.body.confirmPassword, 'Confirmação de Senha inválida')
                equalsOrError(password, req.body.confirmPassword, 'Senhas não conferem')
                user.password = encryptPassword(password)
                // Senha definida por um administrador é temporária.
                user.mustChangePassword = true
            }

            if (user.id && String(user.id) === String(req.user.id) && !user.admin) {
                throw 'Você não pode remover o seu próprio acesso de administrador.'
            }

            const duplicateEmail = await app.db('users')
                .where({ email: user.email })
                .modify(query => user.id && query.whereNot('id', user.id))
                .first('id')
            notExistsOrError(duplicateEmail, 'E-mail já cadastrado')

            if (!user.admin && categoryIds.length) {
                if (categoryIds.some(id => !Number.isInteger(id) || id <= 0)) {
                    throw 'Seleção de categorias inválida.'
                }
                const validCategories = await app.db('categories')
                    .whereIn('id', categoryIds)
                    .count('id as count')
                    .first()
                existsOrError(
                    Number(validCategories.count) === categoryIds.length,
                    'Uma ou mais categorias não foram encontradas.'
                )
            }
        } catch(msg) {
            if (typeof msg !== 'string') {
                console.error('Falha ao validar usuário:', msg)
                return res.status(500).send('Não foi possível salvar o usuário.')
            }
            return res.status(400).send(msg)
        }

        try {
            await app.db.transaction(async transaction => {
                let userId = user.id
                if (userId) {
                    const updatedRows = await transaction('users')
                        .where({ id: userId })
                        .whereNull('deletedAt')
                        .update(user)
                    existsOrError(updatedRows, 'Usuário não foi encontrado.')
                } else {
                    const [created] = await transaction('users')
                        .insert({ ...user, mustChangePassword: true })
                        .returning('id')
                    userId = created.id
                }

                await transaction('user_category_access').where({ userId }).del()
                if (!user.admin && categoryIds.length) {
                    await transaction('user_category_access').insert(
                        categoryIds.map(categoryId => ({ userId, categoryId }))
                    )
                }
            })
            return res.status(user.id ? 204 : 201).send()
        } catch (error) {
            if (typeof error === 'string') return res.status(400).send(error)
            console.error('Falha ao salvar usuário e permissões:', error)
            return res.status(500).send('Não foi possível salvar o usuário.')
        }
    }

    const get = async (req, res) => {
        try {
            const users = await app.db('users')
                .select('id', 'name', 'email', 'admin')
                .whereNull('deletedAt')
                .orderBy('name')
            res.json(users)
        } catch (error) {
            console.error('Falha ao listar usuários:', error)
            res.status(500).send('Não foi possível listar os usuários.')
        }
    }

    const getById = async (req, res) => {
        try {
            if (!/^\d+$/.test(req.params.id)) return res.status(404).send('Usuário não encontrado.')
            const user = await app.db('users')
            .select('id', 'name', 'email', 'admin')
            .where({ id: req.params.id })
            .whereNull('deletedAt')
            .first()
            if (!user) return res.status(404).send('Usuário não encontrado.')
            user.categoryIds = user.admin
                ? []
                : await app.db('user_category_access')
                    .where({ userId: user.id })
                    .pluck('categoryId')
            return res.json(user)
        } catch (error) {
            console.error('Falha ao carregar permissões do usuário:', error)
            return res.status(500).send('Não foi possível carregar o usuário.')
        }
    }

    const remove = async (req, res) => {
        try {
            if (!/^\d+$/.test(req.params.id)) throw 'Usuário inválido.'
            if (String(req.params.id) === String(req.user.id)) {
                throw 'Você não pode excluir a própria conta.'
            }
            const articles = await app.db('articles')
                .where({ userId: req.params.id })
            notExistsOrError(articles, 'Usuário possui artigos.')

            const rowsUpdated = await app.db('users')
                .update({deletedAt: new Date()})
                .where({ id: req.params.id })
            existsOrError(rowsUpdated, 'Usuário não foi encontrado.')
            await app.db('user_category_access').where({ userId: req.params.id }).del()

            res.status(204).send()
        } catch(msg) {
            if (typeof msg !== 'string') {
                console.error('Falha ao excluir usuário:', msg)
                return res.status(500).send('Não foi possível excluir o usuário.')
            }
            res.status(400).send(msg)
        }
    }

    return { save, get, getById, remove }
}
