const queries = require('./queries')

module.exports = app => {
    const { existsOrError } = app.api.validation

    const save = async (req, res) => {
        const article = {
            name: req.body.name,
            description: req.body.description || null,
            imageUrl: req.body.imageUrl || null,
            content: req.body.content || null,
            userId: req.body.userId || null,
            categoryId: req.body.categoryId || null
        }
        if(req.params.id) article.id = req.params.id

        try {
            existsOrError(article.name, 'Nome não informado')
            existsOrError(article.categoryId, 'Categoria não informada')
            existsOrError(article.userId, 'Autor não informado')
            existsOrError(article.content, 'Conteúdo não informado')
        } catch(msg) {
            return res.status(400).send(msg)
        }

        try {
            if(article.id) {
                await app.db('articles')
                .update(article)
                .where({ id: article.id })
                return res.status(204).send()
            }

            const [created] = await app.db('articles')
                .insert(article)
                .returning('id')
            return res.status(201).json({ id: created.id })
        } catch(error) {
            console.error('Falha ao salvar artigo:', error)
            return res.status(500).send('Não foi possível salvar o artigo.')
        }
    }

    const remove = async (req, res) => {
        try {
            const attachments = await app.db('article_attachments')
                .select('storedName')
                .where({ articleId: req.params.id })
            const rowsDeleted = await app.db('articles')
                .where({ id: req.params.id }).del()
            existsOrError(rowsDeleted, 'Artigo não foi encontrado.')
            await app.api.attachments.removeStoredFiles(attachments)

            res.status(204).send()
        } catch(error) {
            if (typeof error === 'string') return res.status(400).send(error)
            console.error('Falha ao excluir artigo e anexos:', error)
            res.status(500).send('Não foi possível excluir o artigo e seus anexos.')
        }
    }

    const limit = 10 // usado para paginação
    const get = async (req, res) => {
        const page = req.query.page || 1

        const result = await app.db('articles').count('id').first()
        const count = parseInt(result.count)

        app.db('articles')
            .select('id', 'name', 'description')
            .limit(limit).offset(page * limit - limit)
            .then(articles => res.json({ data: articles, count, limit }))
            .catch(err => res.status(500).send(err))
    }

    const getById = async (req, res) => {
        try {
            const article = await app.db('articles')
            .where({ id: req.params.id })
            .first()
            if (!article) return res.status(404).send('Artigo não encontrado.')
            article.content = article.content?.toString() || ''
            article.attachments = await app.db('article_attachments')
                .select('id', 'originalName', 'mimeType', 'size', 'createdAt')
                .where({ articleId: req.params.id })
                .orderBy('id')
            return res.json(article)
        } catch(error) {
            console.error('Falha ao carregar artigo:', error)
            return res.status(500).send('Não foi possível carregar o artigo.')
        }
    }

    const getByCategory = async (req, res) => {
        const categoryId = req.params.id
        const page = req.query.page || 1
        const categories = await app.db.raw(queries.categoryWithChildren, categoryId)
        const ids = categories.rows.map(c => c.id)

        app.db({a: 'articles'})
            .leftJoin({ u: 'users' }, 'u.id', 'a.userId')
            .select('a.id', 'a.name', 'a.description', 'a.imageUrl', { author: 'u.name' })
            .limit(limit).offset(page * limit - limit)
            .whereIn('categoryId', ids)
            .orderBy('a.id', 'desc')
            .then(articles => res.json(articles))
            .catch(err => res.status(500).send(err))
    }

    return { save, remove, get, getById, getByCategory }
}
