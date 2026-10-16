const descendantCategoriesQuery = `
    WITH RECURSIVE accessible_categories (id) AS (
        SELECT categories.id
        FROM categories
        INNER JOIN user_category_access
            ON user_category_access."categoryId" = categories.id
        WHERE user_category_access."userId" = ?
        UNION
        SELECT child.id
        FROM categories child
        INNER JOIN accessible_categories parent
            ON child."parentId" = parent.id
    )
    SELECT id FROM accessible_categories
`

module.exports = app => {
    const getAccessibleCategoryIds = async user => {
        if (user.admin) {
            const allCategories = await app.db('categories').select('id')
            return allCategories.map(category => Number(category.id))
        }

        const result = await app.db.raw(descendantCategoriesQuery, [user.id])
        return result.rows.map(category => Number(category.id))
    }

    const canAccessCategory = async (user, categoryId) => {
        if (user.admin) return true
        const accessibleIds = await getAccessibleCategoryIds(user)
        return accessibleIds.includes(Number(categoryId))
    }

    const authorizeCategory = async (req, res, next) => {
        try {
            if (await canAccessCategory(req.user, req.params.id)) return next()
            return res.status(404).send('Categoria não encontrada.')
        } catch (error) {
            console.error('Falha ao validar acesso à categoria:', error)
            return res.status(500).send('Não foi possível validar o acesso à categoria.')
        }
    }

    const authorizeArticle = async (req, res, next) => {
        if (req.user.admin) return next()
        try {
            const article = await app.db('articles')
                .where({ id: req.params.id })
                .first('categoryId')
            if (!article || !await canAccessCategory(req.user, article.categoryId)) {
                return res.status(404).send('Artigo não encontrado.')
            }
            return next()
        } catch (error) {
            console.error('Falha ao validar acesso ao artigo:', error)
            return res.status(500).send('Não foi possível validar o acesso ao artigo.')
        }
    }

    const getTree = async user => {
        const categories = await app.db('categories').select('id', 'name', 'parentId')
        const accessibleIds = new Set(await getAccessibleCategoryIds(user))
        const categoriesById = new Map(categories.map(category => [Number(category.id), category]))
        const visibleIds = new Set(accessibleIds)

        for (const id of accessibleIds) {
            let category = categoriesById.get(id)
            const visitedAncestors = new Set([id])
            while (category?.parentId && !visitedAncestors.has(Number(category.parentId))) {
                const parentId = Number(category.parentId)
                visitedAncestors.add(parentId)
                visibleIds.add(parentId)
                category = categoriesById.get(parentId)
            }
        }

        const visibleCategories = categories
            .filter(category => visibleIds.has(Number(category.id)))
            .map(category => ({
                ...category,
                id: Number(category.id),
                parentId: category.parentId ? Number(category.parentId) : null,
                navigationOnly: !accessibleIds.has(Number(category.id)),
                children: []
            }))
        const nodesById = new Map(visibleCategories.map(category => [category.id, category]))
        const roots = []

        for (const category of visibleCategories) {
            const parent = nodesById.get(category.parentId)
            if (parent) parent.children.push(category)
            else roots.push(category)
        }

        return roots
    }

    return { getAccessibleCategoryIds, canAccessCategory, authorizeCategory, authorizeArticle, getTree }
}
