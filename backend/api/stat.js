module.exports = app => {
    const get = async (_req, res) => {
        try {
            const stat = await app.db('stats')
                .select('users', 'categories', 'articles', 'createdAt')
                .orderBy('createdAt', 'desc')
                .first()

            return res.json(stat || { users: 0, categories: 0, articles: 0 })
        } catch (error) {
            console.error('[Stats] Failed to load statistics:', error)
            return res.status(500).send('Could not load statistics.')
        }
    }

    return { get }
}
