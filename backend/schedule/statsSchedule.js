const { Cron } = require('croner')

const updateStats = async app => {
    try {
        const usersCount = await app.db('users').count('id').first()
        const categoriesCount = await app.db('categories').count('id').first()
        const articlesCount = await app.db('articles').count('id').first()

        const { Stat } = app.api.stat

        const lastStat = await Stat.findOne({}, {},
            { sort: { 'createdAt' : -1 } })

        const stat = new Stat({
            users: usersCount.count,
            categories: categoriesCount.count,
            articles: articlesCount.count,
            createdAt: new Date()
        })

        const changeUsers = !lastStat || stat.users !== lastStat.users
        const changeCategories = !lastStat || stat.categories !== lastStat.categories
        const changeArticles = !lastStat || stat.articles !== lastStat.articles

        if(changeUsers || changeCategories || changeArticles) {
            await stat.save()
            console.log('[Stats] Estatísticas atualizadas!')
        }
    } catch(error) {
        console.error('[Stats] Não foi possível atualizar as estatísticas:', error)
    }
}

module.exports = app => new Cron('*/1 * * * *', () => updateStats(app))
module.exports.updateStats = updateStats