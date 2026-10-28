const queries = require('./queries')
const sanitizeHtml = require('sanitize-html')

const limit = 10 // usado para paginação
const nameMaxLength = 255
const descriptionMaxLength = 1000
const imageUrlMaxLength = 1000
const contentMaxLength = 8_000_000

/*
 * O conteúdo é HTML gerado pelo editor (Quill). Ele é sanitizado no servidor
 * (lista de permissão) e novamente no navegador (DOMPurify) antes de exibir.
 * Texto como `&&`, `<`, `>` e `\` é preservado como TEXTO: o conteúdo nunca é
 * interpretado como comando nem concatenado em SQL (sempre parametrizado).
 */
const sanitizeArticleContent = content => sanitizeHtml(content.replace(/\u0000/g, ''), {
    allowedTags: [
        'a', 'blockquote', 'br', 'code', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'hr', 'img', 'li', 'ol', 'p', 'pre', 's', 'span', 'strong', 'sub', 'sup', 'table',
        'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul'
    ],
    allowedAttributes: {
        a: ['href', 'name', 'target', 'rel'],
        img: ['src', 'alt', 'title', 'width', 'height'],
        pre: ['spellcheck'],
        div: ['spellcheck'],
        '*': ['class', 'style']
    },
    allowedClasses: {
        '*': [/^ql-[\w-]+$/, /^hljs[\w-]*$/, /^language-[\w+#-]+$/]
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    allowProtocolRelative: false,
    transformTags: {
        // Imagens coladas no editor chegam como data URI. Só aceita formatos
        // raster seguros (nunca SVG) em base64.
        img: (tagName, attribs) => {
            const { src = '' } = attribs
            if (/^data:/i.test(src) &&
                !/^data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(src)) {
                const { src: _removed, ...rest } = attribs
                return { tagName, attribs: rest }
            }
            return { tagName, attribs }
        },
        a: (tagName, attribs) => ({
            tagName,
            attribs: attribs.href
                ? { ...attribs, target: '_blank', rel: 'noopener noreferrer' }
                : attribs
        })
    },
    allowedStyles: {
        '*': {
            'color': [/^#[0-9a-f]{3,8}$/i, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i],
            'background-color': [/^#[0-9a-f]{3,8}$/i, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i],
            'font-size': [/^\d+(\.\d+)?(px|pt|em|rem|%)$/i],
            'font-family': [/^[\w\s,"'-]+$/],
            'text-align': [/^(left|right|center|justify)$/],
            'text-decoration': [/^(underline|line-through)$/]
        }
    }
})

const toPositiveInteger = value => {
    const number = Number(value)
    return Number.isInteger(number) && number > 0 ? number : null
}

const isSafeImageUrl = value =>
    /^https?:\/\/[^\s]+$/i.test(value) || /^\/[^\s/][^\s]*$/.test(value)

module.exports = app => {
    const { existsOrError } = app.api.validation

    const save = async (req, res) => {
        const article = {
            name: typeof req.body.name === 'string' ? req.body.name.trim() : req.body.name,
            description: req.body.description || null,
            imageUrl: req.body.imageUrl || null,
            content: typeof req.body.content === 'string'
                ? sanitizeArticleContent(req.body.content)
                : null,
            userId: req.user?.id || null,
            categoryId: req.body.categoryId || null
        }
        if (req.params.id) article.id = req.params.id

        try {
            existsOrError(article.name, 'Nome não informado')
            if (typeof article.name !== 'string' || article.name.length > nameMaxLength) {
                throw `O nome deve ter no máximo ${nameMaxLength} caracteres.`
            }
            if (article.description !== null &&
                (typeof article.description !== 'string' || article.description.length > descriptionMaxLength)) {
                throw `A descrição deve ter no máximo ${descriptionMaxLength} caracteres.`
            }
            if (article.imageUrl !== null) {
                article.imageUrl = typeof article.imageUrl === 'string' ? article.imageUrl.trim() : article.imageUrl
                if (typeof article.imageUrl !== 'string' ||
                    article.imageUrl.length > imageUrlMaxLength ||
                    !isSafeImageUrl(article.imageUrl)) {
                    throw 'A URL da imagem deve começar com http://, https:// ou /.'
                }
            }
            existsOrError(article.categoryId, 'Categoria não informada')
            existsOrError(article.userId, 'Autor não informado')
            existsOrError(article.content, 'Conteúdo não informado')
            if (article.content.length > contentMaxLength) {
                throw 'O conteúdo é grande demais.'
            }

            article.categoryId = toPositiveInteger(article.categoryId)
            article.userId = toPositiveInteger(article.userId)
            if (req.params.id) article.id = toPositiveInteger(req.params.id)
            if (!article.categoryId) throw 'Categoria inválida.'
            if (!article.userId) throw 'Autor inválido.'
            if (req.params.id && !article.id) throw 'Artigo inválido.'

            const category = await app.db('categories').where({ id: article.categoryId }).first('id')
            if (!category) throw 'Categoria não encontrada.'
            const author = await app.db('users')
                .where({ id: article.userId })
                .whereNull('deletedAt')
                .first('id')
            if (!author) throw 'Autor não encontrado.'
        } catch(msg) {
            if (typeof msg !== 'string') {
                console.error('Falha ao validar artigo:', msg)
                return res.status(500).send('Não foi possível salvar o artigo.')
            }
            return res.status(400).send(msg)
        }

        try {
            if(article.id) {
                const updated = await app.db('articles')
                    .update(article)
                    .where({ id: article.id })
                if (!updated) return res.status(404).send('Artigo não encontrado.')
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
            const id = toPositiveInteger(req.params.id)
            existsOrError(id, 'Artigo inválido.')
            const attachments = await app.db('article_attachments')
                .select('storedName')
                .where({ articleId: id })
            const rowsDeleted = await app.db('articles')
                .where({ id }).del()
            existsOrError(rowsDeleted, 'Artigo não foi encontrado.')
            await app.api.attachments.removeStoredFiles(attachments)

            res.status(204).send()
        } catch(error) {
            if (typeof error === 'string') return res.status(400).send(error)
            console.error('Falha ao excluir artigo e anexos:', error)
            res.status(500).send('Não foi possível excluir o artigo e seus anexos.')
        }
    }

    const getPage = query => Math.min(Math.max(parseInt(query.page, 10) || 1, 1), 100000)

    const get = async (req, res) => {
        try {
            const page = getPage(req.query)
            const result = await app.db('articles').count('id').first()
            const count = parseInt(result.count)
            const articles = await app.db('articles')
                .select('id', 'name', 'description')
                .orderBy('id', 'desc')
                .limit(limit).offset(page * limit - limit)
            return res.json({ data: articles, count, limit })
        } catch (error) {
            console.error('Falha ao listar artigos:', error)
            return res.status(500).send('Não foi possível listar os artigos.')
        }
    }

    const getById = async (req, res) => {
        try {
            const id = toPositiveInteger(req.params.id)
            if (!id) return res.status(404).send('Artigo não encontrado.')
            const article = await app.db('articles')
            .where({ id })
            .first()
            if (!article) return res.status(404).send('Artigo não encontrado.')
            article.content = article.content?.toString() || ''
            article.attachments = await app.db('article_attachments')
                .select('id', 'originalName', 'mimeType', 'size', 'createdAt')
                .where({ articleId: id })
                .orderBy('id')
            return res.json(article)
        } catch(error) {
            console.error('Falha ao carregar artigo:', error)
            return res.status(500).send('Não foi possível carregar o artigo.')
        }
    }

    const getByCategory = async (req, res) => {
        try {
            const categoryId = toPositiveInteger(req.params.id)
            if (!categoryId) return res.json([])
            const page = getPage(req.query)
            const categories = await app.db.raw(queries.categoryWithChildren, [categoryId])
            const ids = categories.rows.map(c => c.id)

            const articles = await app.db({a: 'articles'})
                .leftJoin({ u: 'users' }, 'u.id', 'a.userId')
                .select('a.id', 'a.name', 'a.description', 'a.imageUrl', { author: 'u.name' })
                .whereIn('a.categoryId', ids)
                .orderBy('a.id', 'desc')
                .limit(limit).offset(page * limit - limit)
            return res.json(articles)
        } catch (error) {
            console.error('Falha ao listar artigos da categoria:', error)
            return res.status(500).send('Não foi possível listar os artigos.')
        }
    }

    return { save, remove, get, getById, getByCategory }
}

module.exports.sanitizeArticleContent = sanitizeArticleContent
