const assert = require('node:assert/strict')
const { test } = require('node:test')
const createArticleApi = require('../api/article')
const createValidation = require('../api/validation')

const createResponse = () => ({
    statusCode: 200,
    body: undefined,
    status(code) {
        this.statusCode = code
        return this
    },
    send(body) {
        this.body = body
        return this
    },
    json(body) {
        this.body = body
        return this
    }
})

test('creates an article with only its required name', async () => {
    let insertedArticle
    const app = {
        api: { validation: createValidation({}) },
        db() {
            return {
                insert(article) {
                    insertedArticle = article
                    return {
                        async returning() {
                            return [{ id: 17 }]
                        }
                    }
                }
            }
        }
    }
    const response = createResponse()

    await createArticleApi(app).save({ body: { name: 'Quick note' }, params: {} }, response)

    assert.equal(response.statusCode, 201)
    assert.deepEqual(response.body, { id: 17 })
    assert.deepEqual(insertedArticle, {
        name: 'Quick note',
        description: null,
        imageUrl: null,
        content: null,
        userId: null,
        categoryId: null
    })
})

test('rejects an article without a name', async () => {
    const app = {
        api: { validation: createValidation({}) },
        db() {
            assert.fail('database must not be called for invalid articles')
        }
    }
    const response = createResponse()

    await createArticleApi(app).save({ body: {}, params: {} }, response)

    assert.equal(response.statusCode, 400)
    assert.equal(response.body, 'Nome não informado')
})
