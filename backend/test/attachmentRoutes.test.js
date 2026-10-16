const assert = require('node:assert/strict')
const { test } = require('node:test')
const createAttachmentsApi = require('../api/attachments')
const configureRoutes = require('../config/routes')

test('registra a rota autenticada para servir imagens extraídas', () => {
    const registeredRoutes = []
    const noop = () => {}
    const app = {
        api: {
            attachments: createAttachmentsApi({ db: noop }),
            article: {
                get: noop,
                save: noop,
                getById: noop,
                remove: noop,
                getByCategory: noop
            },
            user: { save: noop, get: noop, getById: noop, remove: noop },
            auth: { signin: noop, validateToken: noop },
            category: { get: noop, save: noop, getTree: noop, getById: noop, remove: noop },
            stat: { get: noop }
        },
        config: { passport: { authenticate: () => noop } },
        route(path) {
            const route = { path, handlers: {} }
            for (const method of ['all', 'get', 'post', 'put', 'delete']) {
                route[method] = (...handlers) => {
                    assert.ok(handlers.every(handler => typeof handler === 'function'))
                    route.handlers[method] = handlers
                    return route
                }
            }
            registeredRoutes.push(route)
            return route
        },
        post: noop
    }

    configureRoutes(app)

    const imageRoute = registeredRoutes.find(route =>
        route.path === '/articles/:id/attachments/:attachmentId/images/:imageId'
    )
    assert.ok(imageRoute)
    assert.equal(imageRoute.handlers.get[0], app.api.attachments.downloadImage)
    assert.equal(typeof imageRoute.handlers.get[0], 'function')
})
