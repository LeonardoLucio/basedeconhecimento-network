const admin = require('./admin')

module.exports = app => {
    app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }))
    app.post('/signin', app.api.auth.signin)
    app.post('/validateToken', app.api.auth.validateToken)

    app.route('/account/change-password')
        .all(app.config.passport.authenticate({ allowPasswordChange: true }))
        .post(app.api.auth.changePassword)

    app.route('/users')
        .all(app.config.passport.authenticate())
        .post(admin(app.api.user.save))
        .get(admin(app.api.user.get))

    app.route('/users/:id')
        .all(app.config.passport.authenticate())
        .put(admin(app.api.user.save))
        .get(admin(app.api.user.getById))
        .delete(admin(app.api.user.remove))

    app.route('/categories')
        .all(app.config.passport.authenticate())
        .get(admin(app.api.category.get))
        .post(admin(app.api.category.save))

    // Cuidado com ordem! Tem que vir antes de /categories/:id
    app.route('/categories/tree')
        .all(app.config.passport.authenticate())
        .get(app.api.category.getTree)

    app.route('/categories/:id')
        .all(
            app.config.passport.authenticate(),
            app.api.categoryAccess.authorizeCategory
        )
        .get(app.api.category.getById)
        .put(admin(app.api.category.save))
        .delete(admin(app.api.category.remove))

    app.route('/articles')
        .all(app.config.passport.authenticate())
        .get(admin(app.api.article.get))
        .post(admin(app.api.article.save))

    app.post('/articles/attachments/preview',
        app.config.passport.authenticate(),
        admin(app.api.attachments.handlePreview))

    app.route('/articles/:id/attachments')
        .all(app.config.passport.authenticate())
        .post(admin(app.api.attachments.handleUpload))

    app.route('/articles/:id/attachments/:attachmentId')
        .all(
            app.config.passport.authenticate(),
            app.api.categoryAccess.authorizeArticle
        )
        .get(app.api.attachments.download)

    app.route('/articles/:id/attachments/:attachmentId/images/:imageId')
        .all(
            app.config.passport.authenticate(),
            app.api.categoryAccess.authorizeArticle
        )
        .get(app.api.attachments.downloadImage)

    app.route('/articles/:id')
        .all(
            app.config.passport.authenticate(),
            app.api.categoryAccess.authorizeArticle
        )
        .get(app.api.article.getById)
        .put(admin(app.api.article.save))
        .delete(admin(app.api.article.remove))

    app.route('/categories/:id/articles')
        .all(
            app.config.passport.authenticate(),
            app.api.categoryAccess.authorizeCategory
        )
        .get(app.api.article.getByCategory)

    app.route('/stats')
        .all(app.config.passport.authenticate())
        .get(app.api.stat.get)
}
