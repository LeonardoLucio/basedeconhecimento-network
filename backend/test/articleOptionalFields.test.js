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

const pfSenseCommands = [
    'pfSense-upgrade -c && \\',
    'pkg upgrade -y && \\',
    'pkg upgrade -fy pfSense-pkg-WireGuard && \\',
    '/etc/rc.php-fpm_restart && \\',
    '/etc/rc.restart_webgui'
]

const toCodeBlockHtml = lines =>
    '<div class="ql-code-block-container" spellcheck="false">' +
    lines.map(line => `<div class="ql-code-block">${line.replace(/&/g, '&amp;')}</div>`).join('') +
    '</div>'

const createApp = ({ onInsert } = {}) => ({
    api: { validation: createValidation({}) },
    db() {
        const query = {
            where: () => query,
            whereNull: () => query,
            first: async () => ({ id: 1 }),
            insert(article) {
                onInsert?.(article)
                return { async returning() { return [{ id: 17 }] } }
            }
        }
        return query
    }
})

test('salva comandos com barra invertida e && como texto, sem alterá-los', async () => {
    let insertedArticle
    const app = createApp({ onInsert: article => { insertedArticle = article } })
    const response = createResponse()

    await createArticleApi(app).save({
        body: { name: 'Upgrade pfSense', categoryId: 1, userId: 1, content: toCodeBlockHtml(pfSenseCommands) },
        params: {},
        user: { id: 1 }
    }, response)

    assert.equal(response.statusCode, 201)
    assert.equal(typeof insertedArticle.content, 'string')
    for (const line of pfSenseCommands) {
        assert.ok(
            insertedArticle.content.includes(line.replace(/&/g, '&amp;')),
            `a linha deveria ser preservada: ${line}`
        )
    }
})

test('remove scripts, eventos e links javascript: do conteúdo', () => {
    const { sanitizeArticleContent } = require('../api/article')
    const html = sanitizeArticleContent(
        '<p onclick="x()">oi</p><script>alert(1)</script><img src="x" onerror="alert(1)">' +
        '<a href="javascript:alert(1)">link</a><iframe src="https://evil"></iframe>'
    )
    assert.ok(!/script|onclick|onerror|javascript:|iframe/i.test(html), html)
})

test('adiciona rel noopener em links externos', () => {
    const { sanitizeArticleContent } = require('../api/article')
    const html = sanitizeArticleContent('<a href="https://exemplo.com">x</a>')
    assert.match(html, /rel="noopener noreferrer"/)
})

test('rejeita artigo sem nome', async () => {
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

test('rejeita URL de imagem com esquema perigoso', async () => {
    const response = createResponse()
    await createArticleApi(createApp()).save({
        body: { name: 'x', categoryId: 1, userId: 1, content: '<p>a</p>', imageUrl: 'javascript:alert(1)' },
        params: {},
        user: { id: 1 }
    }, response)
    assert.equal(response.statusCode, 400)
})

test('usa o usuário autenticado como autor, ignorando userId enviado pelo cliente', async () => {
    let insertedArticle
    const response = createResponse()
    await createArticleApi(createApp({
        onInsert: article => { insertedArticle = article }
    })).save({
        body: {
            name: 'Artigo',
            categoryId: 1,
            userId: 1,
            content: '<p>Conteúdo</p>'
        },
        params: {},
        user: { id: 7 }
    }, response)

    assert.equal(response.statusCode, 201)
    assert.equal(insertedArticle.userId, 7)
})

test('aceita imagem PNG em base64 e descarta SVG em data URI', () => {
    const { sanitizeArticleContent } = require('../api/article')
    const png = sanitizeArticleContent('<img src="data:image/png;base64,iVBORw0KGgo=">')
    assert.match(png, /src="data:image\/png;base64,iVBORw0KGgo="/)
    const svg = sanitizeArticleContent('<img src="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=">')
    assert.ok(!/svg/i.test(svg), svg)
})
