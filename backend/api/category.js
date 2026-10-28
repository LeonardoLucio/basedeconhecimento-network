module.exports = app => {
    const { existsOrError, notExistsOrError } = app.api.validation

    const toPositiveInteger = value => {
        const number = Number(value)
        return Number.isInteger(number) && number > 0 ? number : null
    }

    // Sobe a cadeia de pais; se encontrar a própria categoria, haveria um ciclo.
    const createsCycle = async (categoryId, parentId) => {
        let currentId = parentId
        const visited = new Set()
        while (currentId) {
            if (currentId === categoryId) return true
            if (visited.has(currentId)) return true
            visited.add(currentId)
            const parent = await app.db('categories').where({ id: currentId }).first('parentId')
            currentId = parent?.parentId ? Number(parent.parentId) : null
        }
        return false
    }

    const save = async (req, res) => {
        const category = {
            name: typeof req.body.name === 'string' ? req.body.name.trim() : req.body.name,
            parentId: req.body.parentId || null
        }
        const id = req.params.id ? toPositiveInteger(req.params.id) : null

        try {
            existsOrError(category.name, 'Nome não informado')
            if (typeof category.name !== 'string' || category.name.length > 255) {
                throw 'O nome deve ter no máximo 255 caracteres.'
            }
            if (req.params.id && !id) throw 'Categoria inválida.'

            if (category.parentId !== null) {
                category.parentId = toPositiveInteger(category.parentId)
                if (!category.parentId) throw 'Categoria pai inválida.'
                const parent = await app.db('categories').where({ id: category.parentId }).first('id')
                if (!parent) throw 'Categoria pai não encontrada.'
                if (id && await createsCycle(id, category.parentId)) {
                    throw 'A categoria pai não pode ser a própria categoria nem uma de suas subcategorias.'
                }
            }
        } catch(msg) {
            if (typeof msg !== 'string') {
                console.error('Falha ao validar categoria:', msg)
                return res.status(500).send('Não foi possível salvar a categoria.')
            }
            return res.status(400).send(msg)
        }

        try {
            if (id) {
                const updated = await app.db('categories').update(category).where({ id })
                if (!updated) return res.status(404).send('Categoria não encontrada.')
            } else {
                await app.db('categories').insert(category)
            }
            return res.status(204).send()
        } catch (error) {
            console.error('Falha ao salvar categoria:', error)
            return res.status(500).send('Não foi possível salvar a categoria.')
        }
    }

    const remove = async (req, res) => {
        try {
            const id = toPositiveInteger(req.params.id)
            existsOrError(id, 'Código da Categoria não informado.')

            const subcategory = await app.db('categories')
                .where({ parentId: id })
            notExistsOrError(subcategory, 'Categoria possui subcategorias.')

            const articles = await app.db('articles')
                .where({ categoryId: id })
            notExistsOrError(articles, 'Categoria possui artigos.')

            const rowsDeleted = await app.db('categories')
                .where({ id }).del()
            existsOrError(rowsDeleted, 'Categoria não foi encontrada.')

            res.status(204).send()
        } catch(error) {
            if (typeof error === 'string') return res.status(400).send(error)
            console.error('Falha ao excluir categoria:', error)
            res.status(500).send('Não foi possível excluir a categoria.')
        }
    }

    const withPath = categories => {
        const byId = new Map(categories.map(category => [category.id, category]))

        const categoriesWithPath = categories.map(category => {
            let path = category.name
            let parent = byId.get(category.parentId)
            const visited = new Set([category.id])

            while(parent && !visited.has(parent.id)) {
                visited.add(parent.id)
                path = `${parent.name} > ${path}`
                parent = byId.get(parent.parentId)
            }

            return { ...category, path }
        })

        categoriesWithPath.sort((a, b) => a.path.localeCompare(b.path, 'pt-BR'))

        return categoriesWithPath
    }

    const get = async (req, res) => {
        try {
            const categories = await app.db('categories')
            res.json(withPath(categories))
        } catch (error) {
            console.error('Falha ao listar categorias:', error)
            res.status(500).send('Não foi possível listar as categorias.')
        }
    }

    const getById = async (req, res) => {
        try {
            const id = toPositiveInteger(req.params.id)
            const category = id && await app.db('categories').where({ id }).first()
            if (!category) return res.status(404).send('Categoria não encontrada.')
            res.json(category)
        } catch (error) {
            console.error('Falha ao carregar categoria:', error)
            res.status(500).send('Não foi possível carregar a categoria.')
        }
    }

    const toTree = (categories, tree, depth = 0) => {
        if(!tree) tree = categories.filter(c => !c.parentId)
        if (depth > 50) return []
        tree = tree.map(parentNode => {
            const isChild = node => node.parentId == parentNode.id
            parentNode.children = toTree(categories, categories.filter(isChild), depth + 1)
            return parentNode
        })
        return tree
    }

    const getTree = async (req, res) => {
        try {
            const tree = req.user.admin
                ? toTree(await app.db('categories'))
                : await app.api.categoryAccess.getTree(req.user)
            return res.json(tree)
        } catch (error) {
            console.error('Falha ao carregar árvore de categorias:', error)
            return res.status(500).send('Não foi possível carregar as categorias.')
        }
    }

    return { save, remove, get, getById, getTree }
}
